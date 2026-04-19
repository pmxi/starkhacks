import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Ed25519Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
// tweetnacl has no bundled types; pull default export via require interop
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nacl = require("tweetnacl");
import { Solfit } from "../target/types/solfit";
import { assert } from "chai";

describe("contest", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Solfit as Program<Solfit>;

  // Single shared judge keypair (off-chain Ed25519 signer) for all tests.
  const judge = nacl.sign.keyPair();
  const judgePubkey = new PublicKey(judge.publicKey);

  function buildScoresMessage(contestPda: PublicKey, scores: number[]): Uint8Array {
    const buf = new Uint8Array(32 + 4 + scores.length * 4);
    buf.set(contestPda.toBytes(), 0);
    const view = new DataView(buf.buffer);
    view.setUint32(32, scores.length, true);
    scores.forEach((s, i) => view.setUint32(36 + i * 4, s, true));
    return buf;
  }

  function signAsJudge(msg: Uint8Array): Uint8Array {
    return nacl.sign.detached(msg, judge.secretKey);
  }

  function buildEd25519Ix(pubkey: Uint8Array, msg: Uint8Array, sig: Uint8Array) {
    return Ed25519Program.createInstructionWithPublicKey({
      publicKey: pubkey,
      message: msg,
      signature: sig,
    });
  }

  async function fund(kp: Keypair, sol = 2) {
    const sig = await provider.connection.requestAirdrop(
      kp.publicKey,
      sol * LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig);
  }

  async function setupContest(opts: {
    duration: number;
    maxPlayers: number;
    wagerSol: number;
  }) {
    const { duration, maxPlayers, wagerSol } = opts;
    const creator = Keypair.generate();
    await fund(creator);

    const contestId = new BN(Date.now() + Math.floor(Math.random() * 1000));
    const [contestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("contest"),
        creator.publicKey.toBuffer(),
        contestId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    );

    await program.methods
      .createContest(
        contestId,
        new BN(Math.round(wagerSol * LAMPORTS_PER_SOL)),
        maxPlayers,
        duration,
        judgePubkey,
      )
      .accounts({
        contest: contestPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const players: Keypair[] = [];
    for (let i = 0; i < maxPlayers; i++) {
      const p = Keypair.generate();
      await fund(p);
      await program.methods
        .joinContest()
        .accounts({
          contest: contestPda,
          player: p.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([p])
        .rpc();
      players.push(p);
    }

    return { creator, contestPda, contestId, players };
  }

  async function waitForDeadline(durationSecs: number) {
    // Give solana-test-validator a buffer past the stamped deadline.
    await new Promise((r) => setTimeout(r, (durationSecs + 1) * 1000));
  }

  it("happy path: create → join → settle → claim", async () => {
    const { contestPda, players } = await setupContest({
      duration: 2,
      maxPlayers: 2,
      wagerSol: 0.1,
    });

    await waitForDeadline(2);

    const scores = [5, 3]; // player 0 wins
    const msg = buildScoresMessage(contestPda, scores);
    const sig = signAsJudge(msg);
    const edIx = buildEd25519Ix(judge.publicKey, msg, sig);

    await program.methods
      .settle(scores)
      .accounts({
        contest: contestPda,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();

    const c = await program.account.contest.fetch(contestPda);
    assert.deepEqual(c.finalScores, scores);
    assert.equal(c.status, 2); // Settled
    assert.equal(
      c.winner.toBase58(),
      players[0].publicKey.toBase58(),
      "player 0 should win with 5 vs 3",
    );

    const balBefore = await provider.connection.getBalance(players[0].publicKey);
    await program.methods
      .claimPot()
      .accounts({ contest: contestPda, winner: players[0].publicKey })
      .signers([players[0]])
      .rpc();
    const balAfter = await provider.connection.getBalance(players[0].publicKey);
    assert.isAbove(
      balAfter - balBefore,
      0.15 * LAMPORTS_PER_SOL,
      "winner should net roughly 2x wager minus fees",
    );
  });

  it("settle before deadline fails", async () => {
    const { contestPda } = await setupContest({
      duration: 60, // 1 min — will still be Active
      maxPlayers: 2,
      wagerSol: 0.01,
    });

    const scores = [1, 1];
    const msg = buildScoresMessage(contestPda, scores);
    const edIx = buildEd25519Ix(judge.publicKey, msg, signAsJudge(msg));

    try {
      await program.methods
        .settle(scores)
        .accounts({
          contest: contestPda,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();
      assert.fail("expected DeadlineNotPassed");
    } catch (e: any) {
      assert.include(e.toString(), "DeadlineNotPassed");
    }
  });

  it("settle with wrong-judge signature fails", async () => {
    const { contestPda } = await setupContest({
      duration: 2,
      maxPlayers: 2,
      wagerSol: 0.01,
    });
    await waitForDeadline(2);

    const scores = [3, 4];
    const msg = buildScoresMessage(contestPda, scores);

    const attacker = nacl.sign.keyPair();
    const sig = nacl.sign.detached(msg, attacker.secretKey);
    const edIx = buildEd25519Ix(attacker.publicKey, msg, sig);

    try {
      await program.methods
        .settle(scores)
        .accounts({
          contest: contestPda,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();
      assert.fail("expected BadJudgeSignature");
    } catch (e: any) {
      assert.include(e.toString(), "BadJudgeSignature");
    }
  });

  it("ties resolve to the lowest-index player", async () => {
    const { contestPda, players } = await setupContest({
      duration: 2,
      maxPlayers: 3,
      wagerSol: 0.01,
    });
    await waitForDeadline(2);

    const scores = [7, 7, 7]; // 3-way tie
    const msg = buildScoresMessage(contestPda, scores);
    const edIx = buildEd25519Ix(judge.publicKey, msg, signAsJudge(msg));

    await program.methods
      .settle(scores)
      .accounts({
        contest: contestPda,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();

    const c = await program.account.contest.fetch(contestPda);
    assert.equal(
      c.winner.toBase58(),
      players[0].publicKey.toBase58(),
      "lowest index should win the tie",
    );
  });

  it("double-settle fails", async () => {
    const { contestPda } = await setupContest({
      duration: 2,
      maxPlayers: 2,
      wagerSol: 0.01,
    });
    await waitForDeadline(2);

    const scores = [9, 1];
    const msg = buildScoresMessage(contestPda, scores);
    const edIx = buildEd25519Ix(judge.publicKey, msg, signAsJudge(msg));

    await program.methods
      .settle(scores)
      .accounts({
        contest: contestPda,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();

    try {
      await program.methods
        .settle(scores)
        .accounts({
          contest: contestPda,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();
      assert.fail("expected NotActive");
    } catch (e: any) {
      assert.include(e.toString(), "NotActive");
    }
  });

  // Refund path: REFUND_GRACE_SECS = 3600 on the program side, so this can't be
  // exercised under plain solana-test-validator without clock warping. Covered
  // by manual devnet test; revisit with solana-bankrun for automated coverage.
});

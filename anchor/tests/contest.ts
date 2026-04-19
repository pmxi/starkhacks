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

  it("happy path: settle pays winner and closes PDA atomically", async () => {
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

    const balBefore = await provider.connection.getBalance(players[0].publicKey);
    await program.methods
      .settle(scores)
      .accounts({
        contest: contestPda,
        winner: players[0].publicKey,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();

    const balAfter = await provider.connection.getBalance(players[0].publicKey);
    assert.isAbove(
      balAfter - balBefore,
      0.15 * LAMPORTS_PER_SOL,
      "winner should net ~2x wager after settle (no separate claim)",
    );

    const pdaInfo = await provider.connection.getAccountInfo(contestPda);
    assert.isNull(pdaInfo, "PDA should be closed after settle");
  });

  it("settle before deadline fails", async () => {
    const { contestPda, players } = await setupContest({
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
          winner: players[0].publicKey,
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
    const { contestPda, players } = await setupContest({
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
          winner: players[1].publicKey,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();
      assert.fail("expected BadJudgeSignature");
    } catch (e: any) {
      assert.include(e.toString(), "BadJudgeSignature");
    }
  });

  it("wrong winner account is rejected", async () => {
    const { contestPda, players } = await setupContest({
      duration: 2,
      maxPlayers: 2,
      wagerSol: 0.01,
    });
    await waitForDeadline(2);

    const scores = [8, 2]; // player 0 wins
    const msg = buildScoresMessage(contestPda, scores);
    const edIx = buildEd25519Ix(judge.publicKey, msg, signAsJudge(msg));

    try {
      await program.methods
        .settle(scores)
        .accounts({
          contest: contestPda,
          winner: players[1].publicKey, // lying — player 0 should win
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();
      assert.fail("expected NotWinner");
    } catch (e: any) {
      assert.include(e.toString(), "NotWinner");
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

    const balBefore = await provider.connection.getBalance(players[0].publicKey);
    await program.methods
      .settle(scores)
      .accounts({
        contest: contestPda,
        winner: players[0].publicKey,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();
    const balAfter = await provider.connection.getBalance(players[0].publicKey);
    assert.isAbove(
      balAfter - balBefore,
      0.02 * LAMPORTS_PER_SOL,
      "lowest-index player should receive the 3x wager pot on tie",
    );
    const pdaInfo = await provider.connection.getAccountInfo(contestPda);
    assert.isNull(pdaInfo, "PDA should be closed after settle");
  });

  it("double-settle fails (PDA closed by first settle)", async () => {
    const { contestPda, players } = await setupContest({
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
        winner: players[0].publicKey,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();

    try {
      await program.methods
        .settle(scores)
        .accounts({
          contest: contestPda,
          winner: players[0].publicKey,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .preInstructions([edIx])
        .rpc();
      assert.fail("expected second settle to fail (account closed)");
    } catch (e: any) {
      const msg = e.toString();
      assert.ok(
        msg.includes("does not exist") ||
          msg.includes("AccountDiscriminatorMismatch") ||
          msg.includes("AccountNotInitialized") ||
          msg.includes("owned by the wrong program"),
        `expected account-closed error, got: ${msg}`,
      );
    }
  });

  // Refund path: REFUND_GRACE_SECS = 3600 on the program side, so this can't be
  // exercised under plain solana-test-validator without clock warping. Covered
  // by manual devnet test; revisit with solana-bankrun for automated coverage.
});

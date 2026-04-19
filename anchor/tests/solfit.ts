import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solfit } from "../target/types/solfit";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { assert } from "chai";

describe("solfit", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Solfit as Program<Solfit>;

  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const aliceSession = Keypair.generate();
  const bobSession = Keypair.generate();

  const matchId = new anchor.BN(Date.now());
  const target = 3;
  const wager = new anchor.BN(LAMPORTS_PER_SOL / 10);
  const maxPlayers = 2;

  let matchPda: PublicKey;

  const airdrop = async (pk: PublicKey, lamports: number) => {
    const sig = await provider.connection.requestAirdrop(pk, lamports);
    await provider.connection.confirmTransaction(sig);
  };

  before(async () => {
    await airdrop(alice.publicKey, 2 * LAMPORTS_PER_SOL);
    await airdrop(bob.publicKey, 2 * LAMPORTS_PER_SOL);
    await airdrop(aliceSession.publicKey, LAMPORTS_PER_SOL / 100);
    await airdrop(bobSession.publicKey, LAMPORTS_PER_SOL / 100);

    [matchPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("match"),
        alice.publicKey.toBuffer(),
        matchId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
  });

  it("runs the full lifecycle: create → join → start → increment → claim", async () => {
    await program.methods
      .createMatch(matchId, target, wager, maxPlayers)
      .accounts({
        matchAccount: matchPda,
        creator: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    await program.methods
      .joinMatch(aliceSession.publicKey)
      .accounts({
        matchAccount: matchPda,
        player: alice.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    await program.methods
      .joinMatch(bobSession.publicKey)
      .accounts({
        matchAccount: matchPda,
        player: bob.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bob])
      .rpc();

    await program.methods
      .startMatch()
      .accounts({
        matchAccount: matchPda,
        caller: alice.publicKey,
      })
      .signers([alice])
      .rpc();

    for (let i = 0; i < target; i++) {
      await program.methods
        .incrementPushup()
        .accounts({
          matchAccount: matchPda,
          signer: aliceSession.publicKey,
        })
        .signers([aliceSession])
        .rpc();
    }

    const matchData = await program.account.match.fetch(matchPda);
    assert.equal(matchData.status, 2, "status should be Finished");
    assert.ok(matchData.winner.equals(alice.publicKey), "winner should be alice");
    assert.equal(matchData.counts[0], target);

    const aliceBefore = await provider.connection.getBalance(alice.publicKey);
    await program.methods
      .claimPot()
      .accounts({
        matchAccount: matchPda,
        winner: alice.publicKey,
      })
      .signers([alice])
      .rpc();
    const aliceAfter = await provider.connection.getBalance(alice.publicKey);
    assert.ok(
      aliceAfter > aliceBefore + wager.toNumber(),
      "winner should receive at least the opponent's wager"
    );

    const closed = await provider.connection.getAccountInfo(matchPda);
    assert.isNull(closed, "match account should be closed");
  });

  it("rejects a non-winner claiming the pot", async () => {
    const id = new anchor.BN(Date.now() + 1);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), alice.publicKey.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createMatch(id, target, wager, maxPlayers)
      .accounts({ matchAccount: pda, creator: alice.publicKey, systemProgram: SystemProgram.programId })
      .signers([alice])
      .rpc();
    await program.methods
      .joinMatch(aliceSession.publicKey)
      .accounts({ matchAccount: pda, player: alice.publicKey, systemProgram: SystemProgram.programId })
      .signers([alice])
      .rpc();
    await program.methods
      .joinMatch(bobSession.publicKey)
      .accounts({ matchAccount: pda, player: bob.publicKey, systemProgram: SystemProgram.programId })
      .signers([bob])
      .rpc();
    await program.methods
      .startMatch()
      .accounts({ matchAccount: pda, caller: alice.publicKey })
      .signers([alice])
      .rpc();
    for (let i = 0; i < target; i++) {
      await program.methods
        .incrementPushup()
        .accounts({ matchAccount: pda, signer: aliceSession.publicKey })
        .signers([aliceSession])
        .rpc();
    }

    try {
      await program.methods
        .claimPot()
        .accounts({ matchAccount: pda, winner: bob.publicKey })
        .signers([bob])
        .rpc();
      assert.fail("bob should not be able to claim");
    } catch (e: any) {
      assert.include(String(e), "NotWinner");
    }
  });

  it("rejects incrementing from an unauthorized signer", async () => {
    const id = new anchor.BN(Date.now() + 2);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), alice.publicKey.toBuffer(), id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const stranger = Keypair.generate();
    await airdrop(stranger.publicKey, LAMPORTS_PER_SOL / 100);

    await program.methods
      .createMatch(id, target, wager, maxPlayers)
      .accounts({ matchAccount: pda, creator: alice.publicKey, systemProgram: SystemProgram.programId })
      .signers([alice])
      .rpc();
    await program.methods
      .joinMatch(aliceSession.publicKey)
      .accounts({ matchAccount: pda, player: alice.publicKey, systemProgram: SystemProgram.programId })
      .signers([alice])
      .rpc();
    await program.methods
      .joinMatch(bobSession.publicKey)
      .accounts({ matchAccount: pda, player: bob.publicKey, systemProgram: SystemProgram.programId })
      .signers([bob])
      .rpc();
    await program.methods
      .startMatch()
      .accounts({ matchAccount: pda, caller: alice.publicKey })
      .signers([alice])
      .rpc();

    try {
      await program.methods
        .incrementPushup()
        .accounts({ matchAccount: pda, signer: stranger.publicKey })
        .signers([stranger])
        .rpc();
      assert.fail("stranger should not be able to increment");
    } catch (e: any) {
      assert.include(String(e), "NotAuthorized");
    }
  });
});

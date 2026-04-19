import { BN, Program } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import type { Solfit } from "../../idl/solfit";
import { contestPda } from "./pda";
import { serializeScoresMessage } from "./message";
import { getDevJudge } from "./devJudge";
import { requestJudgeSignature } from "./judge";

/**
 * Create a new contest. The `judge` param is the Ed25519 pubkey that will sign
 * final scores at settlement time. In dev mode, pass `getDevJudge().publicKey`.
 */
export async function createContest(
  program: Program<Solfit>,
  opts: {
    contestId: BN;
    wagerLamports: BN;
    maxPlayers: number;
    durationSecs: number;
    judge: PublicKey;
  },
): Promise<{ signature: string; contestPda: PublicKey }> {
  const creator = program.provider.publicKey!;
  const pda = contestPda(creator, opts.contestId);
  const signature = await program.methods
    .createContest(
      opts.contestId,
      opts.wagerLamports,
      opts.maxPlayers,
      opts.durationSecs,
      opts.judge,
    )
    .accounts({
      contest: pda,
      creator,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return { signature, contestPda: pda };
}

export async function joinContest(
  program: Program<Solfit>,
  contest: PublicKey,
): Promise<string> {
  return program.methods
    .joinContest()
    .accounts({
      contest,
      player: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

/**
 * Settle a contest. Signs the (pda, scores) message with the dev judge, builds
 * the Ed25519 precompile instruction, and submits it paired with `settle`.
 *
 * In production, the `signature` and judge pubkey come from the real judge
 * server; only the precompile-ix assembly and settle call stay on the client.
 */
export async function settleWithDevJudge(
  program: Program<Solfit>,
  contest: PublicKey,
  scores: number[],
  winner: PublicKey,
): Promise<string> {
  const judge = getDevJudge();
  const msg = serializeScoresMessage(contest, scores);
  const sig = judge.sign(msg);

  const edIx = Ed25519Program.createInstructionWithPublicKey({
    publicKey: judge.publicKey.toBytes(),
    message: msg,
    signature: sig,
  });

  return program.methods
    .settle(scores)
    .accounts({
      contest,
      winner,
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .preInstructions([edIx])
    .rpc();
}

/**
 * Settle a contest by fetching a signature from the judge server.
 * The server must be the one whose pubkey was baked into the contest at
 * create_contest time — otherwise the on-chain check fails.
 *
 * Caller must also pass the expected `winner` pubkey (argmax of `scores`
 * on `contest.players`). The program re-computes argmax and rejects if
 * the caller lied.
 *
 * On success, the pot is transferred to `winner` and the contest PDA is
 * closed in the same tx — no separate claim step.
 */
export async function settleWithJudgeServer(
  program: Program<Solfit>,
  contest: PublicKey,
  scores: number[],
  winner: PublicKey,
): Promise<string> {
  const msg = serializeScoresMessage(contest, scores);
  const { publicKey, signature } = await requestJudgeSignature(msg);

  const edIx = Ed25519Program.createInstructionWithPublicKey({
    publicKey: publicKey.toBytes(),
    message: msg,
    signature,
  });

  return program.methods
    .settle(scores)
    .accounts({
      contest,
      winner,
      instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    })
    .preInstructions([edIx])
    .rpc();
}

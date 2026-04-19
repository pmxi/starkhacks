import { PublicKey } from "@solana/web3.js";

/**
 * Exact byte layout the on-chain program expects in the Ed25519 precompile message.
 * Must match anchor/programs/solfit/src/lib.rs `settle`:
 *   [32 bytes contest_pda] || [4 bytes scores.len() u32 LE] || [4 * N bytes scores u32 LE]
 */
export function serializeScoresMessage(
  contestPda: PublicKey,
  scores: number[],
): Uint8Array {
  const buf = new Uint8Array(32 + 4 + scores.length * 4);
  buf.set(contestPda.toBytes(), 0);
  const view = new DataView(buf.buffer);
  view.setUint32(32, scores.length, true);
  scores.forEach((s, i) => view.setUint32(36 + i * 4, s, true));
  return buf;
}

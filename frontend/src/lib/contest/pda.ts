import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const PROGRAM_ID = new PublicKey(
  "Bhxa6QHF3mJL36ak12mr9kzHLnZXjBv1q8MQHkz54VHe",
);

export function contestPda(creator: PublicKey, contestId: BN): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("contest"),
      creator.toBuffer(),
      contestId.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID,
  );
  return pda;
}

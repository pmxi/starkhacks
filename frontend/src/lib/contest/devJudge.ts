import { PublicKey } from "@solana/web3.js";
// tweetnacl ships no bundled types; loose import to avoid a devDep on @types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import nacl from "tweetnacl";

/**
 * Stub judge for dev mode. Replace with a real WebSocket judge once it exists.
 * The keypair is generated once per browser and persisted in localStorage so the
 * same judge pubkey is used across contest create/settle within a session.
 *
 * DO NOT use on mainnet. The "judge" is the player's own browser.
 */
const STORAGE_KEY = "solfit.devJudge.secretKey";

export interface DevJudge {
  publicKey: PublicKey;
  secretKey: Uint8Array;
  sign(message: Uint8Array): Uint8Array;
}

export function getDevJudge(): DevJudge {
  let secretKey: Uint8Array;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    secretKey = Uint8Array.from(JSON.parse(stored));
  } else {
    const kp = nacl.sign.keyPair();
    secretKey = kp.secretKey;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(secretKey)));
  }
  const publicKey = new PublicKey(secretKey.slice(32));
  return {
    publicKey,
    secretKey,
    sign: (message) => nacl.sign.detached(message, secretKey),
  };
}

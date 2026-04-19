import { PublicKey } from '@solana/web3.js';

const JUDGE_API_BASE = (import.meta.env.VITE_JUDGE_URL as string) || 'http://localhost:3001';

export interface JudgeSignature {
  publicKey: PublicKey;
  signature: Uint8Array;
}

/** Fetches the judge server's Ed25519 pubkey. Cache across calls. */
let cachedPubkey: PublicKey | null = null;
export async function getJudgePubkey(): Promise<PublicKey> {
  if (cachedPubkey) return cachedPubkey;
  const res = await fetch(`${JUDGE_API_BASE}/api/judge-pubkey`);
  if (!res.ok) throw new Error(`judge-pubkey ${res.status}`);
  const { publicKey } = (await res.json()) as { publicKey: string };
  cachedPubkey = new PublicKey(publicKey);
  return cachedPubkey;
}

/** Asks the judge server to sign a message. Returns the signature + the judge's pubkey. */
export async function requestJudgeSignature(message: Uint8Array): Promise<JudgeSignature> {
  const messageBase64 = btoa(String.fromCharCode(...message));
  const res = await fetch(`${JUDGE_API_BASE}/api/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageBase64 }),
  });
  if (!res.ok) throw new Error(`judge sign ${res.status}`);
  const { signatureBase64, publicKey } = (await res.json()) as {
    signatureBase64: string;
    publicKey: string;
  };
  const signature = Uint8Array.from(atob(signatureBase64), (c) => c.charCodeAt(0));
  return { publicKey: new PublicKey(publicKey), signature };
}

import { PublicKey, Transaction } from "@solana/web3.js";

/**
 * Minimal Phantom wallet adapter matching @coral-xyz/anchor's Wallet interface.
 * No ceremony from @solana/wallet-adapter — we only support Phantom, for now.
 */
export interface PhantomWallet {
  publicKey: PublicKey;
  signTransaction<T extends Transaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction>(txs: T[]): Promise<T[]>;
}

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: { toBytes(): Uint8Array };
  connect(): Promise<{ publicKey: { toBytes(): Uint8Array } }>;
  disconnect(): Promise<void>;
  signTransaction<T>(tx: T): Promise<T>;
  signAllTransactions<T>(txs: T[]): Promise<T[]>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export async function connectPhantom(): Promise<PhantomWallet> {
  if (!window.solana?.isPhantom) {
    throw new Error("Phantom wallet not found. Install from phantom.app.");
  }
  const resp = await window.solana.connect();
  const publicKey = new PublicKey(resp.publicKey.toBytes());
  return {
    publicKey,
    signTransaction: (tx) => window.solana!.signTransaction(tx),
    signAllTransactions: (txs) => window.solana!.signAllTransactions(txs),
  };
}

export async function disconnectPhantom(): Promise<void> {
  await window.solana?.disconnect();
}

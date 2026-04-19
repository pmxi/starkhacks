import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "../../idl/solfit.json";
import type { Solfit } from "../../idl/solfit";
import type { PhantomWallet } from "./wallet";

export const DEVNET_RPC = "https://api.devnet.solana.com";

export function getProgram(wallet: PhantomWallet, rpcUrl = DEVNET_RPC): Program<Solfit> {
  const connection = new Connection(rpcUrl, "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<Solfit>(idl as Solfit, provider);
}

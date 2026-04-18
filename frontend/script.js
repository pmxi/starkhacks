import { Buffer } from "https://esm.sh/buffer@6.0.3";
globalThis.Buffer = Buffer;

import {
  Connection, Keypair, PublicKey, SystemProgram,
  LAMPORTS_PER_SOL, Transaction,
} from "https://esm.sh/@solana/web3.js@1.95.4";
import * as anchor from "https://esm.sh/@coral-xyz/anchor@0.32.1?bundle";

const { Program, AnchorProvider, BN } = anchor;

const CLUSTER_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("Bhxa6QHF3mJL36ak12mr9kzHLnZXjBv1q8MQHkz54VHe");

const STATUS = ["Waiting", "Active", "Finished"];

const state = {
  program: null,
  provider: null,
  wallet: null,
  matchPda: null,
  matchData: null,
  sessionKey: null,
  pollTimer: null,
};

const $ = (id) => document.getElementById(id);

const log = (...args) => {
  const el = $("log");
  const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  el.textContent += line + "\n";
  el.scrollTop = el.scrollHeight;
  console.log(...args);
};

async function connectWallet() {
  if (!window.solana) { log("No wallet. Install Phantom."); return; }
  const resp = await window.solana.connect();
  state.wallet = {
    publicKey: resp.publicKey,
    signTransaction: (tx) => window.solana.signTransaction(tx),
    signAllTransactions: (txs) => window.solana.signAllTransactions(txs),
  };
  $("wallet-addr").textContent = resp.publicKey.toBase58();
  await initProgram();
  await refreshBalance();
  log("Connected:", resp.publicKey.toBase58());
}

async function initProgram() {
  const connection = new Connection(CLUSTER_URL, "confirmed");
  state.provider = new AnchorProvider(connection, state.wallet, { commitment: "confirmed" });
  const idl = await fetch("./solfit.json").then((r) => r.json());
  state.program = new Program(idl, state.provider);
}

async function refreshBalance() {
  const bal = await state.provider.connection.getBalance(state.wallet.publicKey);
  $("wallet-bal").textContent = (bal / LAMPORTS_PER_SOL).toFixed(3) + " SOL";
}

function matchPdaFor(creator, matchId) {
  const idBuf = Buffer.from(new BN(matchId).toArray("le", 8));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("match"), creator.toBuffer(), idBuf],
    PROGRAM_ID,
  );
  return pda;
}

async function createMatch() {
  if (!state.program) { log("Connect first."); return; }
  const target = parseInt($("in-target").value);
  const wager = new BN(Math.round(parseFloat($("in-wager").value) * LAMPORTS_PER_SOL));
  const maxPlayers = parseInt($("in-max").value);
  const matchId = new BN(Date.now());
  const pda = matchPdaFor(state.wallet.publicKey, matchId);
  log("Creating match at", pda.toBase58(), "...");
  const sig = await state.program.methods
    .createMatch(matchId, target, wager, maxPlayers)
    .accounts({
      matchAccount: pda,
      creator: state.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  log("Created, sig:", sig);
  $("in-match").value = pda.toBase58();
  await loadMatch();
}

async function loadMatch() {
  const addr = $("in-match").value.trim();
  if (!addr) return;
  const pda = new PublicKey(addr);
  const data = await state.program.account.match.fetch(pda);
  state.matchPda = pda;
  state.matchData = data;
  $("sec-match").classList.remove("hidden");
  renderMatch();
  startPolling();
}

function renderMatch() {
  const d = state.matchData;
  $("m-addr").textContent = state.matchPda.toBase58();
  $("m-status").textContent = STATUS[d.status] ?? d.status;
  $("m-target").textContent = d.target;
  $("m-wager").textContent = (d.wager.toNumber() / LAMPORTS_PER_SOL).toFixed(3) + " SOL";
  const winnerStr = d.winner.toBase58();
  $("m-winner").textContent = winnerStr === "11111111111111111111111111111111" ? "—" : winnerStr;

  const tbody = document.querySelector("#m-players tbody");
  tbody.innerHTML = "";
  d.players.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td class="mono">${p.toBase58()}</td><td>${d.counts[i]}</td>`;
    tbody.appendChild(tr);
  });

  const me = state.wallet.publicKey.toBase58();
  const iAmPlayer = d.players.some((p) => p.toBase58() === me);
  const iAmWinner = winnerStr === me;
  $("btn-start").disabled = d.status !== 0 || !iAmPlayer || d.players.length < d.maxPlayers;
  $("btn-pushup").disabled = d.status !== 1 || !iAmPlayer;
  $("btn-claim").disabled = d.status !== 2 || !iAmWinner;
}

function startPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    if (!state.matchPda) return;
    try {
      state.matchData = await state.program.account.match.fetch(state.matchPda);
      renderMatch();
    } catch (_) { /* closed after claim */ }
  }, 1000);
}

function sessionKeyFor(matchAddr) {
  const key = `solfit_session_${matchAddr}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(existing)));
  const kp = Keypair.generate();
  sessionStorage.setItem(key, JSON.stringify(Array.from(kp.secretKey)));
  return kp;
}

async function joinMatch() {
  if (!state.matchPda) { log("Load a match first."); return; }
  const sessionKey = sessionKeyFor(state.matchPda.toBase58());
  state.sessionKey = sessionKey;
  log("Session key:", sessionKey.publicKey.toBase58());

  const fundIx = SystemProgram.transfer({
    fromPubkey: state.wallet.publicKey,
    toPubkey: sessionKey.publicKey,
    lamports: Math.round(0.005 * LAMPORTS_PER_SOL),
  });
  const sig = await state.program.methods
    .joinMatch(sessionKey.publicKey)
    .accounts({
      matchAccount: state.matchPda,
      player: state.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions([fundIx])
    .rpc();
  log("Joined, sig:", sig);
  await loadMatch();
  await refreshBalance();
}

async function startMatch() {
  const sig = await state.program.methods
    .startMatch()
    .accounts({ matchAccount: state.matchPda, caller: state.wallet.publicKey })
    .rpc();
  log("Started, sig:", sig);
  await loadMatch();
}

async function doPushup() {
  if (!state.sessionKey) state.sessionKey = sessionKeyFor(state.matchPda.toBase58());
  const conn = state.provider.connection;
  const ix = await state.program.methods
    .incrementPushup()
    .accounts({ matchAccount: state.matchPda, signer: state.sessionKey.publicKey })
    .instruction();
  const tx = new Transaction().add(ix);
  tx.feePayer = state.sessionKey.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
  tx.sign(state.sessionKey);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction(sig, "confirmed");
  log("Pushup:", sig);
}

async function claimPot() {
  const sig = await state.program.methods
    .claimPot()
    .accounts({ matchAccount: state.matchPda, winner: state.wallet.publicKey })
    .rpc();
  log("Claimed, sig:", sig);
  if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
  $("sec-match").classList.add("hidden");
  await refreshBalance();
}

function wrap(fn) {
  return async () => {
    try { await fn(); } catch (e) { log("Error:", e?.message || String(e)); }
  };
}

$("btn-connect").addEventListener("click", wrap(connectWallet));
$("btn-create").addEventListener("click", wrap(createMatch));
$("btn-load").addEventListener("click", wrap(loadMatch));
$("btn-join").addEventListener("click", wrap(joinMatch));
$("btn-start").addEventListener("click", wrap(startMatch));
$("btn-pushup").addEventListener("click", wrap(doPushup));
$("btn-claim").addEventListener("click", wrap(claimPot));

log("solfit frontend ready.");
log("Cluster:", CLUSTER_URL);
log("Program:", PROGRAM_ID.toBase58());

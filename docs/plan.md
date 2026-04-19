# solfit

A multiplayer pushup contest with on-chain SOL wagers. Players join a match on the web app, do pushups in front of their webcam (MediaPipe pose detection, client-side), and whoever reports the most reps before the timer runs out wins the pot.

Built on Solana devnet. Hackathon scope.

## What shipped (coalesce branch)

- **On-chain settlement program** (`anchor/programs/solfit/src/lib.rs`), deployed to devnet at `Bhxa6QHF3mJL36ak12mr9kzHLnZXjBv1q8MQHkz54VHe`.
- **Ed25519-signed settlement**: an off-chain judge server signs final scores; the program verifies the signature via the instructions-sysvar precompile before picking the winner.
- **Time-boxed "most pushups in X seconds"** — no per-rep transactions; the chain only sees the end-of-match result.
- **Single-judge server** with a persistent Ed25519 keypair, exposed via REST (`/api/judge-pubkey`, `/api/sign`).
- **Frontend** (React + Vite) wired end-to-end: Phantom connect, create/join contest, auto-join on room entry, auto-settle at game end, winner claim.
- **Dev harness** at `/solana-test` for isolated testing of the contract flow.

## Architecture

One Anchor program. One judge server. One web client. Devnet.

### On-chain state

`Contest` PDA keyed by `[b"contest", creator, contest_id]`.

Fields:
- `creator: Pubkey`
- `contest_id: u64`
- `wager: u64` (lamports)
- `max_players: u8` (2–8)
- `duration: u32` (seconds)
- `judge: Pubkey` — off-chain Ed25519 signer
- `players: Vec<Pubkey>` (wallets, in join order)
- `start_time: i64`, `deadline: i64` (stamped by last joiner)
- `status: u8` — Open | Active | Settled | Refunding
- `winner: Pubkey`
- `final_scores: Vec<u32>` (populated at settle)
- `withdrawn: Vec<bool>` (refund path bookkeeping)

The PDA's lamport balance is the escrow. No separate vault.

### Instructions

1. `create_contest(contest_id, wager, max_players, duration, judge)` — init, status = Open.
2. `join_contest()` — CPI transfer wager into PDA. On the last joiner, stamps `start_time` / `deadline`, flips to Active.
3. `settle(scores)` — permissionless. Requires `now >= deadline` and status = Active. Scans the instructions sysvar for an Ed25519 precompile ix whose signer pubkey matches `contest.judge` and whose signed message matches `serialize(contest_pda, scores)`. Picks winner = `players[argmax(scores)]` (lowest index on tie), stores scores, flips to Settled.
4. `claim_pot()` — status = Settled + signer = winner. Anchor `close = winner` drains escrow.
5. `refund_timeout()` — `now >= deadline + 1h` and still Active → flips to Refunding.
6. `withdraw_refund()` — during Refunding, each player drains their wager; the last caller closes the PDA.

Errors are named; see `SolfitError` in `lib.rs`.

### Judge server (`server/index.js`)

- Loads or generates an Ed25519 keypair at `server/judge.key` on startup.
- Exposes pubkey at `GET /api/judge-pubkey`.
- Signs arbitrary messages at `POST /api/sign` (input base64, output base64 + pubkey).
- Intentionally dumb: the server doesn't know about pose detection or pushups. It just signs whatever scores the client sends. The trust contract is: "you play fair, the server stamps it."
- Also runs the existing socket.io game room (lobby, live rep broadcast, game-end coordination).

### Client

- React + Vite. Phantom via `window.solana` (no wallet-adapter).
- On `CreateTeam`, host specifies wager + max_players + duration, which create both a socket room and an on-chain contest; the PDA is broadcast via socket `set-contest-pda`.
- On `JoinTeam`, a joiner enters a 6-char code; socket join + auto `join_contest` (fired by an effect watching `room.contestPda`).
- Gameplay still uses socket.io for live counters; MediaPipe runs client-side and counts reps.
- `GameResults` auto-calls `settle` as the host (with server-signed judge signature), then the on-chain winner sees a Claim button.

### Addresses

See `docs/addresses.md`.

## Known limitations

- Devnet only; wagers are play money.
- Self-reported rep counts. Trust is: "players play fair." The judge server stamps what it's given; it does not verify reps. Client-side pose detection is trivially cheatable.
- Contest timer and socket game timer are independent. If the host delays pressing "start" after roster fills, the on-chain deadline passes during lobby-wait. Settlement still works (requires only `now >= deadline`), but consider tightening the lobby-to-start flow.
- No rematch / rejoin / timeout inside a match. If a player disconnects mid-game, their count freezes at whatever the server last saw.
- `REFUND_GRACE_SECS = 3600` on the program side. Not covered by the current anchor tests (requires clock warping via `solana-bankrun`). Covered only by manual devnet test.
- Single judge = centralized. Path to decentralize: m-of-n signature committee over the same Ed25519 precompile check. Program changes would be minimal (iterate multiple Ed25519 ixs and require n matches).

## Build order shipped

1. Anchor program rewrite (`da9e5e8`).
2. Anchor tests — 5 passing (`da9e5e8`).
3. Devnet deploy + Ed25519 index-0-assumption fix (`ea751e6`, `d219e0e`).
4. Frontend contest lib + `/solana-test` harness (`48c385b`, `450dbc5`, `03e6566`, `95eb1be`).
5. Wallet integration into game flow (`8fd6a4a`, `fdf6f4a`, `99247a5`).
6. Real judge server (`c9ef74c`).

## Running it

```
npm install
cd server && node index.js              # in one terminal — prints the judge pubkey
cd ../frontend && npm run dev           # in another — visit http://localhost:5173
```

Phantom on Devnet. Airdrop SOL to each test wallet: `solana airdrop 2 <addr> -u d`.

Two-player demo:
1. Browser A: log in (Auth0), click Connect Phantom in the sidebar, create a team (wager 0.01, max 2, duration 60s), share the 6-char code.
2. Browser B (separate profile/Phantom): log in, connect Phantom, join team with the code.
3. Host starts the game from the lobby.
4. Both play; MediaPipe counts reps; socket broadcasts live.
5. On game end, host auto-settles; winner clicks Claim Pot.

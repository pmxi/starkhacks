# solfit

A multiplayer pushup race with on-chain SOL wagers. Players join a match, do pushups in front of their webcam, and the first to hit the target count wins the pot.

Built on Solana devnet. Hackathon scope.

## Product

- Creator opens a match with a target count (e.g. 30) and a wager amount (e.g. 0.1 devnet SOL).
- Other players join; each joiner escrows the wager.
- When the roster is full, the match starts. Each player's webcam feed runs a pose detector that counts pushups.
- Every completed pushup submits a transaction that increments that player's on-chain count.
- The first player whose count reaches the target is recorded as the winner.
- Winner claims the pot.

## Non-goals

- Mainnet / real money.
- Anti-cheat. The pose detector runs client-side and can be bypassed. Wagers are devnet SOL; we call this out in the demo.
- Timeouts, refunds, rage-quit recovery. If a player disconnects mid-match, the escrow is stuck. Acceptable for a demo.
- Ephemeral Rollups, session-key expiration / instruction scoping, ties, rematches, lobby browser.

## Architecture

One Anchor program on Solana devnet. One RPC endpoint. One web client.

### On-chain state

One account type: `Match` PDA, keyed by `[b"match", creator, match_id]`.

Fields:
- `creator: Pubkey`
- `match_id: u64`
- `target: u32`
- `wager: u64` (lamports)
- `max_players: u8`
- `players: Vec<Pubkey>` (main wallet pubkeys)
- `session_keys: Vec<Pubkey>` (one per player, parallel to `players`)
- `counts: Vec<u32>` (parallel to `players`)
- `status: MatchStatus` (`Waiting | Active | Finished`)
- `winner: Option<Pubkey>`

The Match PDA's own lamport balance is the escrow. No separate vault.

### Instructions

1. `create_match(match_id, target, wager, max_players)` — init Match PDA, `status = Waiting`.
2. `join_match(session_key)` — push caller into `players`, push `session_key` into `session_keys`, push `0` into `counts`, transfer `wager` lamports from caller to Match PDA.
3. `start_match()` — require `players.len() == max_players`, flip status to `Active`.
4. `increment_pushup()` — signer must be either a player or their registered session key. Bump that player's count. If it reaches `target`, set `winner` and `status = Finished`.
5. `claim_pot()` — require `status == Finished` and `signer == winner`. Drain Match lamports to winner.

No separate `finalize_match`; the winner check lives inside `increment_pushup`.

### Session keys (hackathon version)

At `join_match` time, the client generates a fresh in-memory `Keypair`, registers its pubkey via `session_keys`, and transfers ~0.01 SOL to it from the main wallet to cover fees. During the match, `increment_pushup` is signed silently by the session key — no Phantom popup per rep.

No expiration, no instruction scoping beyond "this session key maps to this player." Good enough for the demo.

### Client

- Next.js + TypeScript + `@coral-xyz/anchor` + `@solana/web3.js`.
- Phantom (or any wallet-adapter wallet) for `create_match`, `join_match`, `start_match`, `claim_pot`.
- In-memory session `Keypair` for `increment_pushup`.
- MediaPipe Tasks Vision for pose detection. Elbow angle + shoulder Y position, small state machine: `top → down → bottom → up → top`. Fire `increment_pushup` on the `up → top` transition.
- Poll or subscribe to the Match account to render live counts for all players.

## Build order

1. Anchor program with all 5 instructions. Unit tests with `anchor test` using two local wallets, including the win/claim path.
2. Deploy to devnet.
3. Minimal client: create → join → start → a debug button that fires `increment_pushup` → claim. Phantom throughout, no session keys yet.
4. Add session-key generation + funding at `join_match`. Swap the debug button's signer to the session key.
5. Replace the debug button with MediaPipe pose detection driving the same call.

Each step is demoable on its own. If step 5 doesn't land, the button demo still works. If step 4 doesn't land, every pushup prompts Phantom — ugly but functional.

## Known limitations (state these in the demo)

- Devnet only. Wagers are not real money.
- Client-side pose detection is trivially cheatable.
- No recovery path for abandoned matches; escrow locks if a player disconnects before the winner is set.
- No session-key expiration or scoping — the session key can sign any `increment_pushup` for that player indefinitely, until the match ends.

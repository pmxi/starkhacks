# todo

- [x] Rename `Match` account → `Contest` throughout — done in the settlement-only rewrite.
- [ ] Tighten lobby → start-game synchronization so the on-chain deadline begins at start-game, not at roster fill.
- [ ] Bankrun-based test for `refund_timeout` / `withdraw_refund` path.
- [ ] Decentralize the judge: m-of-n Ed25519 committee; the program's precompile scan only needs to require n matching verifications.
- [ ] Replace dev-judge stub on `/solana-test` with a toggle that can point at the server instead.
- [ ] Consolidate `VITE_JUDGE_URL` + `SERVER_URL` — same process today, two env vars is silly.
- [ ] Re-enable `@react-three/fiber@9` once the React 19 upgrade lands elsewhere.

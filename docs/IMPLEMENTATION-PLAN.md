# Golden Ace Royale — source audit & implementation plan

## Inspected source
The entire 1,114-line HTML supplied in the request is preserved in `reference/original.html`, including all CSS, event listeners, game logic, keyboard handling and initialization. No existing workspace files were present.

## Confirmed defects / weaknesses
1. **Initialization / DOM:** missing `$()` calls in wheel creation, Blackjack values/table clearing, Roulette locking, reset bindings and result selectors; first wheel initialization throws in strict mode.
2. **Interpolation:** card corners contain literal `c.r` / `{c.s}`; wheel gradient/rotation, winning cells and several result messages also contain uninterpolated placeholders.
3. **Blackjack:** stake deducted at deal but only net profit credited at settlement; pushes receive no refund. Shoe/value/dealer logic is otherwise retained. Reset controls and bet racks need phase locking.
4. **Roulette:** missing selectors and incorrect template strings; fixed label radius not responsive; ball/pocket geometry not reliably tied to chosen result. Bets deducted on placement, not spin, with no persisted reservation recovery. Rounds not counted.
5. **Slots:** responsive symbol height changes from 90 to 80 but animation uses fixed pixel distances; changing the bet during a spin changes the payout. Existing symbol weighting and paytable retained.
6. **Video Poker:** no resolution lock; bet mutable after first deal; ace-low straight flush incorrectly pays a royal; paytable selectors affect other games. Existing hand evaluation / hold-and-draw flow retained and repaired.
7. **Plinko:** deterministic coin-flip path is already separate from animation; retain this model, multiple balls and 13-bucket paytable. Repair result interpolation and add per-ball ledger settlement, reduced-motion and an explicit simultaneous-ball limit.
8. **Wallet:** saves rounded whole chips but awards fractions; invalid/negative inputs accepted; round/win statistics not persisted; no idempotent settlement; premature broke modal on all-in stakes; reset and unconditional refill handlers can alter active stakes; localStorage exceptions unhandled.
9. **UX:** emoji placeholders instead of designed graphics; small Roulette board on touchscreens; generic hero; unverified RTP claim; no accessible modal focus handling, keyboard card holds or reduced-motion support.

## Execution sequence
- [x] Preserve and read full original source.
- [x] Repair shared wallet using integer hundredths, safe limits, per-round IDs, immutable bet/config snapshots, exactly-once settlement, persistence migration and unfinished-round recovery.
- [x] Retain/refactor original five game functions and markup; repair listed bugs.
- [x] Refine black/charcoal, champagne and emerald visual language; self-host Cinzel/Outfit; draw original SVG art, wheel, chips, cards and icons.
- [x] Add Baccarat, Crash, Hi-Lo, Dice, Mines and Lucky Wheel as complete modules sharing the ledger/outcome layer.
- [x] Add code redemption and a hidden local-demo admin view; connect scoped luck, payout settings, confirmations, statistics and reset controls.
- [x] Run pure rule/ledger tests and actual Chromium interaction tests, including mobile layouts and local/static hosting.
- [x] Package maintainable static project and a generated self-contained HTML; document exact checks and limitations.

## Architecture decisions
Plain deferred scripts with one `GAR` namespace and no runtime dependencies. Original section IDs, Blackjack/roulette/slot/poker/Plinko controller structure, chip racks, synthesized sound, confetti, reset confirmation and play-money identity are kept. The old balance functions are intentionally replaced by one ledger (not left competing with it). Rule calculations are DOM-independent. Animations display outcomes selected before resolution and never decide payouts. SVGs are original code, not external images.

New files improve maintainability for eleven games without introducing a build requirement. `index.html` works on GitHub Pages directly. A separate self-contained HTML export is generated from exactly the same tested files for single-file use.

## Explicit policies
- All returns include the stake; profit is separately labeled. Pushes refund the stake and ignore developer reward boosts.
- Statistics define a win as a positive net result and biggest win as greatest net gain in one resolved round.
- Queued Roulette chips are plans, not deducted until Spin. No hidden refunds on Undo.
- Reload refunds persisted unfinished stakes; no unfinished win is granted.
- Wallet/reset/developer configuration changes and free refills are blocked while any round is active.
- Local demo admin access is not authentication. The requested public demo code is JAYDEN123; source inspection can read or bypass it. Trusted privileges would require server-side authorization.
- Modified luck uses explicit favorable-outcome selection, never multiplication of a random draw. Normal is the default. Mines layouts are committed before the first reveal and never moved to avoid a click.

## Completion
All execution steps are complete. See `CHANGELOG.md` for implemented changes and `TEST-REPORT.md` for the actual checks, evidence files and explicit limits. The original plan was written before implementation; the additional array-coordinate, payout-floor and narrow-screen record-access defects found during testing are recorded separately in those documents.

## Focused polish inspection / completion
The current runtime structure, all ten scripts, stylesheet, game markup, rules, wallet, both wheel geometries, vector assets, code-entry/admin handlers and existing test/packaging tools were inspected before editing. The pre-polish release was archived. Identified gaps: placeholder access code with trimming, unsynchronized wheel ticks, no segment selection hook, abrupt modal close, mobile-sidebar inert restoration, a non-matching catalogue-arrow selector and an idle Plinko frame loop. Targeted fixes reuse the existing files and interfaces; no second wallet, outcome generator, game controller or runtime dependency was introduced. The test report records actual verification and the reload-visibility regression found and corrected during the pass.

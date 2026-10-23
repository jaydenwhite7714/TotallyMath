# Golden Ace Royale — executed verification

**Verification date:** 2026-10-23  
**Environment:** Linux; Node v20.20.2; Python 3.13.16; Playwright Chromium 156.0.8078.4.  
**Runtime:** native static HTML/CSS/JavaScript with local fonts; tested over a plain Python HTTP server, not a framework development server.

## Final result

| Suite | Actual result |
|---|---|
| Production rules + wallet, including exhaustive poker mode | **8,125 assertions passed** |
| Modular `index.html`, served at `/golden-ace-royale/` | **26 / 26 groups passed** |
| Self-contained `Golden-Ace-Royale.html`, same actual Chromium interactions | **26 / 26 groups passed** |
| Supplementary audio / normal motion / offline / opaque-sandbox checks | **7 / 7 checks passed** |
| Native JavaScript syntax | All ten scripts passed `node --check` |

The exhaustive poker check actually evaluates **all 2,598,960 distinct five-card hands** and compares category totals, including Jacks-or-Better distinctions. Those millions of evaluations are aggregated into distribution assertions, not misrepresented as millions of separate assertions.

The browser tests open the application, operate its real controls, inspect actual displayed cards/results, check the shared ledger and wait for real production transitions. Deterministic outcomes and a virtual clock are injected by the test runner only. They do not enable a test mode or a seeded RNG in the shipped app.

## 1. Rules and ledger

Command:

```sh
node tests/rules-wallet.test.cjs --exhaustive
```

| Production area | Assertions |
|---|---:|
| Blackjack values, soft aces, six-deck shoe | 61 |
| Every Roulette pocket and supported bet type | 1,704 |
| Slots weights, matching rules and paytable | 15 |
| Poker evaluation regressions | 11 |
| Baccarat third-card/natural logic: 1,000 combinations | 6,005 |
| Hi-Lo rank/tie pricing and exact Dice 36-outcome probabilities | 51 |
| Mines layouts/combinatorial pricing; enumeration of all 4,096 Plinko paths | 73 |
| Exactly-once ledger, doubles, pushes and net statistics | 23 |
| Invalid/huge values, fractional persistence, finite results | 23 |
| Refills, reward codes, active-round locks, reload refunds | 17 |
| Developer probability, per-game scope, snapshots, reward caps, unchanged refunds | 118 |
| Corrupt/outdated data and unavailable storage | 13 |
| Exhaustive five-card poker distribution checks | 11 |
| **Total** | **8,125** |

Saved evidence: `tests/rules-wallet-results.json` and `tests/rules-wallet-latest.txt`.

## 2. Actual browser interactions — both editions

Commands for the executed final runs: port 8080 serves the project root; port 8081 temporarily served its **parent** directory so the modular app was tested at a repository-style subdirectory. A normal root run also works with `python tests/browser_checks.py`.

```sh
GAR_BASE_URL=http://127.0.0.1:8081/golden-ace-royale/ \
  GAR_RESULT_FILE=browser-results.json python tests/browser_checks.py
GAR_BASE_URL=http://127.0.0.1:8080/Golden-Ace-Royale.html \
  GAR_RESULT_FILE=standalone-browser-results.json python tests/browser_checks.py
```

The following **26 groups passed independently against both editions**. The first nineteen are the retained full-game regressions; the final seven are focused polish coverage:

1. Lobby art, genuine loaded local fonts, search/filter and navigation into all eleven games.
2. Blackjack natural, push, dealer soft 17, hit/bust, double and full returned-stake accounting.
3. Roulette chip planning, Undo/Clear, losing/outside/straight returns and selected-pocket geometry.
4. Slots spam-click guard, locked chip selection, independent stopping and exact final center payline.
5. Slots resize during a normal-motion spin, with final symbols still centered.
6. Video Poker keyboard holds, correct royal return, preserved held cards and unique replacement cards.
7. Normal-motion Plinko animation: visible valid peg paths and three concurrent independent credits.
8. Plinko admission ceiling of eight funded balls, then exactly-once settlement of every admitted ball.
9. Baccarat Player/Banker/Tie, commission, naturals, representative third-card deals and tie refunds.
10. Hi-Lo ties, success, impossible rank-direction disablement, collect and loss.
11. Dice displayed chance/multiplier, actual dice sum, exact returned chips, equality loss and invalid input.
12. Mines committed layout, overlap lock, safe collect, mine loss and automatic all-safe collect.
13. Lucky Wheel zero/half/top returns, accurate segment at the pointer and modified reward labels/credit.
14. Crash timely manual cash-out, rejected late cash-out, auto collection and equal auto/crash threshold loss, using a virtual browser clock.
15. Real invalid/valid code entry, hidden admin routing, scoped luck, reward changes and return to standard outcomes/paytables.
16. Developer add/remove/set/reset/grants, required confirmations, huge balances, bonus lock, statistics and effects.
17. Modal focus trap/Escape/restore, one-use redemption, eligible refill, active-round protections, mute persistence and interrupted-round refunds on reload.
18. Layout of lobby and all eleven game views at **320, 375, 390, 768, 1024 and 1440 CSS pixels**; touch-emulated mobile menu and game selection, closed-menu inertness and Escape focus restoration. Roulette's intentional internal board scroll is distinguished from page overflow.
19. Maximum custom rewards, million-chip stakes and **1,000,000,000,000-chip actual returns**; intermediate/maximum wallet formatting; mobile My play access; huge history rows without overflow; 320px admin layout with 10¹⁶ luck.


20. Exact **Made by Jayden** credit at 320–1440px with no header-control overlap; wallet text updates immediately to the real ledger value and its reveal cleans up; panel/button feedback; idle Plinko frame loop stops.
21. Real normal-motion modal exits, keyboard protection while closing, rapid close/reopen/switch, cancelled close animation, reduced-motion immediate close and mobile-sidebar inertness restoration.
22. Literal **JAYDEN123** access, lowercase/short/leading/trailing/internal-space/empty rejection, repeated submit guard, one panel, cleared entry, invalid wallet edit rejection and close-to-previous-game behavior without resetting money.
23. **All twelve** Lucky Wheel indices: exact underlying transform and computed visual matrix, fixed pointer position, correct SVG selected segment, exact zero/half/other returns, spam-click guard and one resolved ledger record per spin.
24. **Real-time, normal-motion 4.2-second spins** for Lucky Wheel and Roulette: sampled native progress demonstrates acceleration and deceleration; actual boundary ticks occur; only one outcome is selected, a fixed pointer lands on the selected segment, the counter-rotating ball finishes correctly, and each result settles once.
25. Native wheel-animation cancellation; a second real spin crossing the old completion deadline; resize to mobile and leave/return during that spin; throwing animation API fallback; invalid preselection refunds the stake even with large developer reward overrides; complete unlock and cleanup.
26. Settings reduced-motion change during a real spin, reload of an unfinished spin with exactly one original-policy refund across two reloads, emulated system reduced motion and a **controlled document-visibility event** finishing the already-selected result without duplicate credit. The visibility test is not claimed as physical-device/background-tab coverage.

Each group records unexpected page exceptions, console errors and external HTTP requests. **None were captured in the successful final runs.** The runtime requests only local assets in the modular edition and no supporting assets in the standalone edition.

Saved evidence: `tests/browser-results.json`, `tests/standalone-browser-results.json`; representative actual screenshots in `tests/screenshots/`, including `wheel-polished-desktop.png` and `wheel-polished-mobile.png`.

## 3. Offline, preview and audio checks

Command:

```sh
python tests/offline_checks.py
```

Passed:
- AudioContext is not created/forced before user interaction.
- A genuine click initializes the synth; muting through Settings drives the master gain to silence while an already-playing tone is still active.
- Runtime element IDs and reusable SVG definition IDs are unique.
- Normal-motion Crash graph climbs under real elapsed time, then manual cash-out settles once.
- Triple sevens render the signature jackpot receipt, exact return and celebration.
- Downloaded `file://` standalone HTML runs a Dice round, with embedded fonts loaded and every HTTP(S) request blocked. **No network requests were attempted.**
- Standalone HTML runs inside an opaque-origin `sandbox="allow-scripts"` iframe without `allow-same-origin`. Storage access is denied as expected; the app falls back to memory and completes a Lucky Wheel round. **No page exceptions or network requests.**

Saved evidence: `tests/offline-audio-results.json`, `tests/environment.json`.

## Focused polish fixes and source integrity

A complete pre-edit ZIP backup was created. The existing source and all ten runtime scripts were inspected before the targeted changes. **`js/rules.js`, `js/wallet.js`, `js/table-games.js`, original reference and local font assets are byte-for-byte unchanged from that backup.** Storage remains `gar_state_v3`; no balance migration/reset was added.

The focused tests found and verified a fix for a real page-lifecycle regression: treating reload's `visibilitychange` like ordinary tab hiding could complete the selected prize before pending-stake recovery. A `pagehide` guard now distinguishes navigation, retaining the existing reload-refund policy. A fixed-delay test assertion for a tiny balance reveal was also changed to await its actual finished state under concurrent browser load; the authoritative numeric-value assertion is still immediate.

Both editions share the same runtime source. The export is checked for embedded scripts/fonts and no external runtime asset references; the final project ZIP is CRC-checked and compared byte-for-byte with the source files during packaging. The separate pre-polish ZIP remains untouched.

No new runtime module, second game controller, balance manager, RNG, framework, API or backend was introduced. `tools/upgrade_source.py` was **not** rerun.

## Earlier full-upgrade defects found and corrected

- Plinko accessed array points as object properties, producing non-finite canvas gradients. Repaired and verified with actual animated paths and concurrent balls.
- Dice's floating-point flooring could understate a four-decimal payout unit. Replaced it with integer-based pricing; reran all rule tests.
- Extreme preview input/headroom handling could fail or overstate available capacity. Invalid previews now return zero and the committed stake is included in cap-headroom calculation.
- Modified settled Hi-Lo/Mines multipliers, very large prize labels and final wheel/Plinko multiplier descriptions now agree with actual credited returns; losing rounds display zero.
- Mobile My play needed an entry outside the hidden narrow-screen top navigation. It is now present in the mobile menu and browser-verified, including trillion-chip history.

All final successful runtime runs were performed after the corresponding source fixes and after generating the delivered standalone edition.

## Honest limits / not claimed
- **No Safari, Firefox, actual iPhone/Android hardware, manual screen-reader audit or WCAG certification.** Responsive and touch checks use Chromium emulation; they are not physical-device testing.
- **No actual GitHub Pages deployment.** Static HTTP serving **at a repository-style subdirectory**, relative paths, standalone local-file use and an opaque preview iframe were tested. Exact manual hosting instructions are in `README.md`. No publishing, pushes or repository-setting changes were authorized or performed.
- Audio initialization/mute and a live synth signal were tested programmatically. No claim of human listening review or device-specific audio quality is made.
- Tests do not certify real-money fairness, cryptographic provable fairness, gambling regulation or server security. This is explicitly a play-money simulator.
- The deliberately public code **JAYDEN123** is concealment only, not private administrator authentication. Anyone can inspect or bypass client-side checks. Genuinely protected/shared balances, outcome controls and rewards require authenticated authorization and validation on a trusted server. Wallet/configuration can be modified in the local browser. One active tab per saved wallet is recommended; cross-tab distributed balance synchronization is not implemented.
- Reloads deliberately refund unfinished stakes rather than resuming partial game state. Developer luck/reward settings deliberately reset on reload; ordinary wallet data/preferences persist when storage is available.
- There are no intentionally unfinished games among the eleven listed. Blackjack does not add split/insurance/surrender beyond its original feature set; Plinko deliberately uses preselected paths, not payout-deciding physics.

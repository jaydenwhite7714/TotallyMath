# Golden Ace Royale — executed verification

**Verification date:** 2026-10-23  
**Environment:** Linux; Node v22.22.3; Python 3.11 (sandbox virtualenv); Playwright Chromium 153.0.8010.0 (headless).  
**Runtime:** native static HTML/CSS/JavaScript with local fonts; tested over a plain Python HTTP server, not a framework development server.

> **Recovery pass.** The repository had been uploaded with every file flattened into the root, which left the modular game (`Acegame.html`) loading `js/*.js` and `assets/**` from paths that did not exist. The structure has been restored, the source and the published page reconciled, and the checks below were re-run against the restored project. Section 0 records exactly what was broken and how it was proven.

## Final result

| Suite | Actual result |
|---|---|
| Production rules + wallet, including exhaustive poker mode | **8,125 assertions passed** |
| Modular `index.html`, served at the repository root | **26 / 26 groups passed** |
| Modular `index.html`, served at a repository-style subdirectory `/TotallyMath/` | **26 / 26 groups passed** |
| Self-contained `Golden-Ace-Royale.html`, same actual Chromium interactions | **26 / 26 groups passed** |
| Supplementary audio / normal motion / offline / opaque-sandbox checks | **7 / 7 checks passed** |
| Native JavaScript syntax | All ten scripts passed `node --check` |
| Repository-structure audit | Export from the restored source reproduced the previously deployed `index.html` **byte-for-byte** (md5 `d29ab72f7ca5147dda78c60ac640b750`) |

The exhaustive poker check actually evaluates **all 2,598,960 distinct five-card hands** and compares category totals, including Jacks-or-Better distinctions. Those millions of evaluations are aggregated into distribution assertions, not misrepresented as millions of separate assertions.

The browser tests open the application, operate its real controls, inspect actual displayed cards/results, check the shared ledger and wait for real production transitions. Deterministic outcomes and a virtual clock are injected by the test runner only. They do not enable a test mode or a seeded RNG in the shipped app.

## 0. Repository-structure recovery (what was actually broken)

| Finding | Evidence |
|---|---|
| The published `index.html` was the **generated** single-file export, so the editable source (`styles.css`, `js/`) had no effect on the live site. | `tools/export_single_file.py` reads `index.html` + `styles.css` + `js/` + `assets/` and writes `Golden-Ace-Royale.html`; the deployed file carried the export's own "Self-contained … edition" header. |
| The real, modular entry point was stored as `Acegame.html` and loaded `js/config.js … js/app.js`, `assets/fonts/*.woff2` and `assets/favicon.svg`. None of those directories existed. | Live HTTP check against the served `Acegame.html`: **12 × HTTP 404** (10 scripts + 2 fonts), `window.GAR` undefined, `GAR.ready` never set, **0 of 11 lobby game cards rendered**, wallet frozen at the static "10,000" markup. |
| The restore is lossless, not a rewrite. | After moving `Acegame.html` → `index.html` and the flat files into `js/`, `assets/`, `docs/`, `tools/`, `tests/`, `reference/`, re-running `tools/export_single_file.py` reproduced the **previously deployed `index.html` byte-for-byte** (same md5, same 392,363 bytes) — at that point before any of this pass's own edits. |
| The documented directory layout was already implied by the project's own tooling. | `tests/rules-wallet.test.cjs` loads `path.join(root,'js',file)`; `tools/export_single_file.py` reads `assets/fonts/`; `tests/browser_checks.py` writes `ROOT/'tests'/…` and `ROOT/'tests/screenshots/'`; `docs/TEST-REPORT.md` already documented `js/`, `assets/`, `docs/`, `tools/`, `tests/`, `reference/`. |
| `CHANGELOG 6. Golden Ace.html` does not exist in this repository. | The changelog is `docs/CHANGELOG.md` (Markdown). The HTML files present are `index.html`, `Golden-Ace-Royale.html` and `reference/original.html`. No file was renamed to or from that name, and no changelog-named HTML was used as the entry point. |

### Changes made in the recovery pass

| Area | Change |
|---|---|
| Structure | `js/`, `assets/` (+`assets/fonts/`), `reference/`, `docs/`, `tools/`, `tests/` (+`tests/screenshots/`) restored; `Acegame.html` became `index.html`; the generated single-file edition was regenerated as `Golden-Ace-Royale.html`; dev screenshots/evidence moved out of the published root. |
| Runtime | **No game logic, paytable, wallet rule, outcome rule or animation was rewritten.** The ten scripts are unchanged except that `js/admin.js` is now loaded from its real path. |
| Creator credit | The header credit now reads the full **"Made by Jayden White"** (`index.html`), and the footer reads "Made by Jayden White." The `aria-label` on the brand button was updated to match. |
| Lobby hero | The decorative "THE ROYALE COLLECTION / EST. FOR THE LOVE OF PLAY" mark was absolutely positioned over the chip artwork and **struck through the "100" chip** at ≥961px, and touched the playing-card artwork at 1024/1280px. It is now a flow element in a new `.hero-foot` row beside the chip note, inside the copy column, and is hidden below 961px where the copy column is too narrow. Hero geometry, headline position and artwork placement are otherwise unchanged. |
| Test suite | `tests/browser_checks.py` creator-credit assertion updated to `Made by Jayden White`. |

### Additional checks run during this pass (beyond the retained suite)

| Check | Result |
|---|---|
| Live HTTP audit of the previously published `Acegame.html` | 12 × 404, `GAR` undefined, 0/11 game cards — **defect reproduced and confirmed** |
| 26 browser groups against the **restored root** `/` | 26/26 passed |
| 26 browser groups against the **repository subdirectory** `/TotallyMath/` | 26/26 passed |
| 26 browser groups against the **single-file edition** | 26/26 passed |
| Element-overlap sweep — 12 game views × 15 viewport widths (360→1920) using `document.elementsFromPoint` hit-testing against every button, heading, paragraph, label and result message | **0 overlaps**, **0 horizontal page overflow** |
| Hero art collision check at 390/820/960/1024/1100/1280/1440 | 0 collisions after the fix (the pre-fix build *did* collide, measured and reproduced) |
| Admin flow driven through the real UI: Settings → Redeem a code → `JAYDEN123` | 8 invalid codes rejected (`jayden123`, `JAYDEN 123`, ` JAYDEN123`, `JAYDEN123 `, `JAYDEN12`, `JAYDEN1234`, `123456`, empty) with inline error "That code is not valid. Please try again."; admin view unreachable by `GAR.showView('admin')` or URL before unlock; correct code unlocks; **the code is never displayed in page text** |
| Admin controls actually mutate state | Add chips (10,000 → 12,500), Set balance (7,777), Remove chips (7,000), Developer bonus (+50,000), scoped luck applied to Roulette only (other games unaffected), Restore normal casino, Close panel returns to the previous view with the wallet intact |
| Lucky Wheel result integrity — 10 real spins | The segment geometrically under the fixed pointer equalled the paid segment on **every** spin; the paid multiplier equalled that segment's value; the wallet moved by exactly `stake × (multiplier − 1)` (total-return convention); the visible result text matched; exactly one ledger settlement per spin |
| Creator credit fit | "Made by Jayden White" renders inside the top bar at 360/390/430/600/820/1024/1440 px with no overlap of the wallet and no horizontal page overflow |

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
# repository root
python tests/browser_checks.py
# repository-style subdirectory (how GitHub Pages actually serves a project site)
GAR_BASE_URL=http://127.0.0.1:8081/TotallyMath/ \
  GAR_RESULT_FILE=browser-results.json python tests/browser_checks.py
# self-contained edition
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


20. Exact **Made by Jayden White** credit at 320–1440px with no header-control overlap; wallet text updates immediately to the real ledger value and its reveal cleans up; panel/button feedback; idle Plinko frame loop stops.
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

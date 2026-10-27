# Golden Ace Royale — upgrade record

## Phase 2: All-In High-Roller Staking, Player Accounts & Executive Control Deck — October 2026

- **Single bottom-corner creator credit:** Removed the prominent header creator badge so attribution appears solely as one subtle `Made by Jayden White` credit in the bottom-right corner of the footer across all viewport widths (`320px`–`1680px+`).
- **1-click All-In & High-Roller Staking across all 11 games:**
  - Raised `maxStake` and `maxReturn` to `9,000,000,000,000` (`9e12` chips = `9e14` cents `< Number.MAX_SAFE_INTEGER`), allowing players to wager 100% of their wallet in one click at any balance without hitting the old 1M stake ceiling.
  - Added `1K` and `10K` chips plus custom stake inputs, `½`, `2×`, `50%`, and brushed-gold `ALL IN` controls to Blackjack, Slots, Video Poker, and Plinko; added `Rebet` to Blackjack; added an `ALL` chip, `2× Bets`, and `Rebet` to Roulette; added `Burst ×5` to Plinko; added inline `MAX`, `50%`, and `ALL IN` buttons with wallet-capped `2×` to Baccarat, Hi-Lo, Dice, Mines, Crash, and Lucky Wheel.
  - Added synthesized `S.allIn()` audio flourish, `ALL IN` round-history and receipt badges, and celebration confetti on All-In wins.
- **Local Player Accounts & Vault (`GAR.Accounts`):**
  - Added `username` + `password` account registration, login, logout, and password changes using pure-JS salted SHA-256 (`GAR.Crypto`) so authentication works identically across HTTPS, `file://`, sandboxed previews, and Node `vm`.
  - Per-account vaults persist balance, statistics, round history, VIP tier, 8 achievements, daily house streak, redeemed codes, and sound/motion/effects preferences, while Guest sessions stay cleanly isolated in `gar_guest_v4`.
  - Added portable Base64url save-key export & import (`GAR1.*`) to move an account across browsers or devices.
- **VIP Ranks, Achievements, Daily Royale Gift & Keyboard Ergonomics:**
  - Added 6 VIP tiers (`Club Member` → `Royale Sovereign`), 8 unlockable achievements with live toasts, a 24-hour 7-day Daily Royale Gift streak (`+2,500` to `+25,000` chips), 3 additional promo codes (`ROYALFLUSH`, `HIGHROLLER`, `JACKPOT777`), and table shortcuts (`H`/`S`/`D` in Blackjack, `C` to collect in Crash/Mines/Hi-Lo, `↑`/`↓` in Hi-Lo).
- **Admin Code `TIMMY123` & Executive Control Deck:**
  - Updated the exact case-sensitive admin code to **`TIMMY123`** (never rendered in DOM text or error messages).
  - Upgraded `#view-admin` into the **Executive Control Deck** featuring 5 1-click global macros (`10× Luck`, `100× Hot Streak`, `God Mode`, `Hyper Jackpot`, `Restore Fair`), an **All-11-Games Live Luck Lock Matrix** (`Fair` / `10× Lock` / `MAX` + `Play ↗` per game), `Lock across reload` persistence, instant treasury mints (`+10K` to `+1B`, `2× Wallet`, `Fill 9T max vault`), a live probability bar, a Local Player Account Registry with direct chip gifting, and a Custom Promo Code Forge.
- **Rebuilt single-file edition & verified full test suites:** Regenerated `Golden-Ace-Royale.html` via `tools/export_single_file.py`; passed **8,169** Node rules/wallet/exhaustive-poker assertions, **29/29** Chromium browser integration groups across `/`, `/TotallyMath/`, and `Golden-Ace-Royale.html`, and **7/7** offline/audio/sandbox checks.

## Repository recovery & deployment repair — October 2026

The uploaded repository had every file flattened into the root. That broke the live site and the working copy at the same time. Diagnosed, repaired and re-verified — no game logic was rewritten.

- **Confirmed the actual defect.** The modular game entry point was stored as `Acegame.html` and loaded `js/config.js … js/app.js`, `assets/fonts/outfit.woff2`, `assets/fonts/cinzel.woff2` and `assets/favicon.svg`. Those directories did not exist in the repository, so the served page returned **12 × HTTP 404**, `window.GAR` was never defined, the lobby rendered **0 of 11** game cards and the wallet stayed frozen on the static "10,000" markup.
- **Confirmed the second defect.** The published `index.html` was the *generated* single-file export, not the editable source, so `styles.css` and `js/*.js` had no effect on the live site and source and page could silently drift.
- **Restored the documented layout** — `js/`, `assets/` (+`assets/fonts/`), `reference/`, `docs/`, `tools/`, `tests/` (+`tests/screenshots/`) — and made `index.html` the real, modular entry point. `Acegame.html` became `index.html`; the single-file edition is regenerated as `Golden-Ace-Royale.html`.
- **Proved the restore is lossless.** Immediately after the move, `tools/export_single_file.py` reproduced the previously deployed `index.html` **byte-for-byte** (md5 `d29ab72f7ca5147dda78c60ac640b750`, 392,363 bytes).
- **`CHANGELOG 6. Golden Ace.html` does not exist in this repository** and was never used as an entry point. The changelog is `docs/CHANGELOG.md`; the HTML files are `index.html`, `Golden-Ace-Royale.html` and `reference/original.html`.
- **Fixed a real lobby defect.** The decorative "THE ROYALE COLLECTION / EST. FOR THE LOVE OF PLAY" mark was absolutely positioned over the chip artwork and struck through the "100" chip at ≥961px, and touched the playing cards at 1024/1280px. It is now a flow element in a new `.hero-foot` row inside the copy column, hidden below 961px where that column is too narrow. Hero geometry and artwork placement are otherwise unchanged.
- **Creator credit completed.** The header now reads the full **"Made by Jayden White"** and the footer reads "Made by Jayden White."
- **Kept the project honest.** No game, wallet rule, paytable, outcome rule, animation or admin capability was removed or replaced. The Python files remain what they were: `tools/` holds the packaging and one-time migration utilities, `tests/` holds the real Chromium and rule/ledger suites. None of them is a runtime dependency — GitHub Pages serves this project statically.
- **Published and verified.** PR #1 merged into `main` as `3db2020`; the Pages build and deployment both reported `success` for that commit; the deployed commit was checked out clean, served under a repository-style subdirectory and re-run against the full suite (26/26 browser groups, plus the admin flow and the prize-wheel integrity check).

## Final polish & animation pass — Made by Jayden

Focused changes to the existing app, not a rebuild. A complete `Golden-Ace-Royale-Before-Polish.zip` snapshot was created before any source edit.

- Retained the palette, typography, artwork, game markup, all eleven game modes, paytables and persistent ledger. `js/rules.js`, `js/wallet.js`, `js/table-games.js`, fonts and original reference are unchanged.
- Added a small responsive **Made by Jayden** credit inside the existing header lockup.
- Upgraded both real wheels through one presentation-only native animation helper: accelerate from rest, five-plus turns, long deceleration, actual segment-boundary ticks, fixed pointer with slight deflection, accurate final transforms and selected-segment outlines. Lucky Wheel now celebrates quietly without adding wheel confetti.
- Kept the original chosen outcomes and exactly-once wallet API. Cancellation, unavailable animation APIs, backgrounding, navigation/resize and reduced-motion changes cannot reroll a result or double-pay. Failed selection returns the actual stake.
- Added coherent timing/easing, gentler panel entrances, natural pressed states, corrected the catalogue-arrow hover selector, and smooth actual-value balance/result reveals.
- Added animated modal exits, cancellation/fallback cleanup, stale-exit protection on rapid reopen, a closing-modal keyboard guard and correct mobile-sidebar inert restoration.
- Set the exact, case-sensitive demo code to **JAYDEN123**. Whitespace variants are rejected; stale/repeated submissions are ignored. The existing controls are retained; Close panel returns to the previous game.
- Clarified in the control room that private access, trusted balances, outcomes and rewards require server-side authentication/authorization; no backend is introduced for this demo.
- Stopped Plinko's unnecessary idle frame loop; preserved real ball/settlement behavior.
- A regression test caught navigation visibility events completing a spin before reload recovery. A page-lifecycle guard now preserves the original unfinished-stake refund-once policy.
- Expanded the existing browser script with seven targeted polish groups. See `TEST-REPORT.md` for the final executed results and platform limits.

## Earlier full upgrade record


## Preservation and structure
- Inspected all supplied source, including the final initialization and keyboard handlers; preserved it verbatim in `reference/original.html`.
- Kept original five sections/IDs, chip-rack controls, Blackjack flow, Roulette number order and betting-board structure, slot weighting/paytable, poker evaluation/holds, Plinko path model, synthesized sound and confetti.
- Split the expanded application into native deferred scripts and one stylesheet. No framework, backend, API key or required build. Added a self-contained HTML export from the same source.
- Intentionally replaced the flawed shared balance functions with one ledger rather than keeping two competing wallet systems.

## Critical original fixes
- Repaired missing `$()` calls, string/element confusion and broken template interpolation throughout initialization, card corners, Blackjack, Roulette and result messages.
- Blackjack now credits the full 2× / 2.5× return and correctly refunds pushes. Double adds one matching stake to the same round. Dealer soft-17 behavior is tested. A new hand has an adequate remaining shoe (reshuffle threshold increased to 52).
- Roulette's selected result, SVG pocket order, final wheel angle, fixed top pointer and ball agree. Bets are planned until Spin, so Undo/Clear no longer perform ad-hoc wallet refunds. Roulette is counted in statistics.
- Slots lock the stake and prevent duplicate spins. Symbol height drives exact reel positions at every breakpoint and on resize. Final payline symbols agree with the paid result.
- Video Poker locks the stake between Deal/Draw, prevents overlapping resolution, scopes paytable highlights to its view, preserves holds and correctly distinguishes A-2-3-4-5 straight flush from a royal.
- Plinko fixes an additional original array/object mismatch (`points` are arrays, not `.x`/`.y` objects) that produced non-finite canvas coordinates. Every ball has an independent funded round, timed fallback settlement and exactly-once guard; paths line up with pegs and the selected bucket.
- Refills recheck eligibility on every event, reset operations confirm and respect active stakes, and all-in stakes do not trigger a premature broke modal.
- Invalid, negative, non-finite, overflow and outdated persistence values are handled. Fractional chips and statistics are saved instead of rounding away cents.
- Dice payout pricing uses integer-based four-decimal flooring to avoid floating-point boundary underpayments discovered during testing.

## Visual and interaction upgrade
- Editorial lobby hero, custom casino still-life, honest local play record, filter/search catalogue, desktop game navigation and mobile touch menu, including access to My play on small screens.
- Consistent panels, button hierarchy, table frames, bet controls, inputs, focus rings, disabled/resolving states and payout receipts.
- Original scalable vector wheels, numbered Roulette pockets, geometric Golden Ace card backs, chip stacks/inlays, faceted slot symbols, dice, Mines gems, navigation icons and game-selection illustrations. No stock imagery or giant-emoji placeholders.
- Independently stopping slot reels, dealing/flips, wheel motion, visible Plinko peg interactions, Crash graph, dice animation and a stronger signature jackpot receipt/celebration.
- Optional synthesized audio with a master mute gain. Audio is initialized on user interaction rather than forcing autoplay.
- Focus-trapped modals with Escape/backdrop handling and focus restoration; closed mobile navigation is inert and restores focus on Escape; keyboard poker holds, search shortcut and safe main-action shortcuts.
- Device and user reduced-motion preferences are respected. Large values use appropriate compact labels and exact receipts.
- Removed the unsupported 99.5% RTP marketing claim and fake-sounding casino metrics; all history/statistics are generated by this local player's actions.

## Added games
Baccarat, Crash, Hi-Lo, Dice, Mines and Lucky Wheel are complete playable controllers, not placeholder cards. Each has configured stakes, lifecycle locks, rules/help, shared wallet settlement, original graphics, outcomes and actual result feedback.

## Hidden developer playground
- Subtle code entry in Settings with editable public rewards, one-use redemption tracking, invalid feedback and a configurable local-demo access code.
- Dedicated hidden control room with wallet tools, confirmations, statistics, effects, scoped luck, reward factors, custom positive-return overrides and restore controls.
- Modified luck actually changes valid outcome selection; normal sampling is the default. Huge luck never multiplies an RNG number.
- Every round snapshots settings. Config changes and wallet grants are blocked during active rounds. Modified tables are visibly labeled; normal outcomes and rewards return on reload.
- Explicitly documented that static client-side codes are not secure authentication and may never govern real-money activity.

## Completion / boundaries
All eleven listed games and requested local-demo administration features are implemented. There is no intentionally unfinished game or decorative dead primary action. The original Blackjack feature set still does not include splits or insurance. Plinko intentionally remains a deterministic-path visual simulation rather than a payout-determining physics engine. Browser/device and deployment verification limits are stated in the test report.

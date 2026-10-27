# Golden Ace Royale
## Eleven playable play-money casino games

**High-Roller, Accounts & Executive Deck edition (October 2026):** retains all eleven handcrafted games while adding **1-click All-In / MAX / 50% / Custom Staking** up to **9 trillion chips** across every table, **Local Player Accounts** (`username` + salted SHA-256 `password`, VIP tiers, 8 achievements, Daily Royale Gift streaks, portable save keys), and the **Executive Control Deck (`TIMMY123`)** with 1-click global luck macros, an 11-game Live Luck Lock Matrix, instant treasury mints, reload persistence lock, and a custom promo code forge. Creator branding is kept to a single subtle bottom-right footer credit. Zero runtime dependencies.

An upgrade of the complete HTML supplied in the request, not a replacement starter template. The untouched 1,114-line source is retained in `reference/original.html`. Existing game section IDs, chip racks, table flows, Blackjack state machine, European wheel order/betting layout, weighted slot reels, poker hold/draw flow, synthesized audio and preselected Plinko paths are preserved and repaired.

**No real money. Local browser accounts only (no server accounts). No deposits, withdrawals or financial rewards.** Chips have zero cash value.

## Recovery note (October 2026)

The repository had been uploaded with every file flattened into the root. That broke the live site in one specific way:

* The modular game entry point was stored as **`Acegame.html`**, which loads `js/*.js`, `assets/fonts/*.woff2` and `assets/favicon.svg`. None of those directories existed in the repository, so every script and font request returned **404** and the game never booted: no lobby cards, no wallet, no admin, no games.
* The root **`index.html`** was the *generated* single-file export, not the editable source. Editing `js/` or `styles.css` had no effect on the published site, so the deployed page and the source could drift apart.

The project structure has been restored to the layout the code always expected, with no game logic, feature or asset rewritten:

```
index.html              ← site entry point (the real, modular game)
Golden-Ace-Royale.html  ← generated single-file edition (optional, offline)
styles.css              ← one stylesheet
js/                     ← the ten runtime scripts, in load order
assets/                 ← favicon.svg, fonts/*.woff2, font licences
reference/original.html ← untouched 1,114-line original source
docs/                   ← CHANGELOG, IMPLEMENTATION-PLAN, TEST-REPORT
tools/                  ← export_single_file.py, upgrade_source.py
tests/                  ← browser_checks.py, offline_checks.py, rules-wallet.test.cjs
```

`tools/export_single_file.py` regenerates `Golden-Ace-Royale.html` from `index.html` + `styles.css` + `js/` + `assets/`. Immediately after the restore it reproduced the previously deployed `index.html` **byte-for-byte**, which proves the restore is lossless rather than a rewrite.

Also repaired in the recovery pass: the hero's "The Royale Collection" edition mark was moved out of the chip artwork, and creator attribution was subseqently refined to a single subtle footer-corner credit ("Made by Jayden White"). See `docs/CHANGELOG.md` and `docs/TEST-REPORT.md`.

## Play / deploy

### The published site
The homepage is **`index.html`** at the repository root. It is the real, modular game and it is what GitHub Pages serves.

Live site: **https://jaydenwhite7714.github.io/TotallyMath/**

Pages configuration: **Settings → Pages → Deploy from a branch → `main` / `/(root)`**, with `.nojekyll` present so the directories are served verbatim. Every path in the page is relative, so the repository subpath works.

The recovery was published through **PR #1** (merged as `3db2020`). The Pages build and deployment both reported `success`, and that exact deployed commit was re-checked-out clean, served under a repository-style subdirectory and re-run against the full browser suite — 26/26 groups passed, along with the admin flow and the prize-wheel integrity check. See `docs/TEST-REPORT.md` for the exact API responses.

### One file
`Golden-Ace-Royale.html` is the **self-contained edition**: its CSS, JavaScript, original SVG artwork, Cinzel/Outfit fonts, favicon and font licenses are embedded, so it needs no network requests or supporting assets. Open it in a modern browser, or serve it as a fallback. It is generated output — do not hand-edit it; edit the source and re-run the exporter.

### Maintainable project
Serve **`index.html`** with the accompanying `styles.css`, `js/` and `assets/` directories. There is **no runtime build step** and no package installation:

```sh
python -m http.server 8080
```

Open `http://localhost:8080`. `tools/export_single_file.py` is an **optional packaging utility**, not a build requirement. Run it after editing the maintainable source to refresh the self-contained edition:

```sh
python tools/export_single_file.py
```

## Exact GitHub Pages publishing steps

The site is already published. To republish after a change:

1. Commit the changed source to the publishing branch (`main`).
2. Confirm **Settings → Pages → Build and deployment** still reads **Deploy from a branch**, `main`, `/(root)`. `.nojekyll` must stay at the repository root.
3. Push. GitHub Pages rebuilds automatically; watch the progress in **Actions → pages-build-deployment**.
4. Open **https://jaydenwhite7714.github.io/TotallyMath/** and check a spin, All-In staking, account sign-in, and **Settings → Redeem a code → TIMMY123**.

Runtime essentials that must be present in the published root: `index.html`, `styles.css`, `js/`, `assets/` and `.nojekyll`. Filenames are case-sensitive.

## The floor

| Original games — retained and repaired | New fully playable games |
|---|---|
| Blackjack: six-deck shoe, natural 3:2, soft-17 stand, hit/stand/double | Baccarat: Player/Banker/Tie, naturals, complete third-card chart, Banker commission |
| European Roulette: straight-up, dozens, outside bets, undo/clear, history | Crash: predetermined crash point, wall-clock cash-out protection, optional auto collect, genuine personal-round history |
| Golden 777: weighted reels, correct center line, independently stopping reels, paytable, jackpot celebration | Hi-Lo: Ace low, higher/lower calls, ties push, streaks, collect and automatic collection at limits |
| Video Poker: Jacks or Better, keyboard-accessible holds, one replacement draw, correct ace-low evaluation | Dice: two real six-sided outcomes, target/range, exact 36-outcome chances, corresponding simulated return |
| Plinko: twelve decisions, thirteen buckets, visible peg paths, up to eight independently funded balls | Mines: 4×4 / 5×5 / 6×6, configurable mine count, committed layouts, collect and loss handling |
| | Lucky Wheel: twelve vector prize segments, pointer-aligned result and exactly-once return |

Every game includes **How to play**. These rules specify which numbers are total returns and which are profit ratios. All × awards include the stake; the receipt separately reports the actual returned chips and net result.

### Everyday controls, All-In staking & Player Accounts
- **All-In & High-Roller Staking (all 11 games):** Every game supports 1-click **ALL IN** / **MAX**, **50%**, **½**, **2×**, custom numeric stake entry, and `1K` / `10K` chips (plus Roulette's **ALL** chip, **2× Bets** & **Rebet**, Blackjack **Rebet**, and Plinko **Burst ×5**). Stakes scale all the way to your full wallet balance up to **9 trillion chips**.
- **Player Accounts & Persistent Vaults (`Sign in` button):** Create a local account with a **username and password** (salted pure-JS SHA-256) to save your chip balance, statistics, round history, VIP tier, achievements, daily streak, redeemed codes, and preferences per account. Signing out switches cleanly to an isolated Guest wallet; signing back in restores your exact profile. Includes portable Base64url save-key export/import. *(Note: accounts are stored locally in this browser's `localStorage` — static client-side storage, not a remote server database.)*
- Lobby cards, sidebar and the mobile menu all open the same game views.
- **Settings** controls sound, reduced motion, celebrations, account access, code entry and the reset-balance confirmation.
- **My play** displays your VIP rank progress, 8 Royale achievements, win rate, streaks, and round history (including `ALL IN` tags). On small screens it is also in the hamburger game menu.
- **On the house** / wallet **+** offers a **Daily Royale Gift** (7-day streak from `+2,500` to `+25,000` chips every 24h) plus a complimentary `5,000`-chip refill whenever your balance drops below 100 chips with no active rounds.
- Built-in promo codes: `WELCOMEACE` (+2,500), `GOLDENHOUR` (+5,000), `ROYALFLUSH` (+10,000), `HIGHROLLER` (+25,000), and `JACKPOT777` (+77,700). Each is redeemable once per profile.
- **Keyboard shortcuts:** **Space** starts/deals idle games; **H** / **S** / **D** for Blackjack Hit / Stand / Double; **C** collects in Crash, Mines, and Hi-Lo; **↑** / **↓** predicts Higher / Lower in Hi-Lo; **/** focuses lobby search; **Escape** closes modals or returns to the lobby.
- Leaving a game does not discard or pause its round. An in-play notice returns to unfinished hands. Reloading refunds committed unfinished stakes exactly once and counts those rounds as reload-refunded, not resolved wins.

## Hidden Executive Control Deck (`TIMMY123`)

The normal interface has no advertised admin tab. Open **Settings → Redeem a code** (or **On the house → Redeem here**), enter **`TIMMY123`** and submit. This demo code is **case-sensitive and exact**: no leading/trailing spaces. Incorrect codes show an inline error. Entry is masked and cleared on success; repeat submissions cannot create a second panel. **Close panel** returns to the game screen from which you entered.

The configured value is in `js/config.js` and embedded in the standalone edition. It is deliberately never rendered in DOM text, error feedback, logs or player history.

This is **concealment, NOT secure authentication**. All client-side code and stored data can be inspected or changed in browser DevTools. Private administrator access, authoritative shared balances, protected outcome configuration and trusted rewards require authenticated, authorized validation on a **trusted server**; none of those security guarantees are provided here. Publishing this local play-money demo does not require a backend. Never connect these controls to real money.

The Executive Control Deck provides:
- **1-Click Global Macros:** `Lock 10× Luck — All Games`, `100× Hot Streak — All Games`, `God Mode · 100% Favor`, `Hyper Jackpot · God + 10× Pay`, and `Restore 100% Fair Casino`.
- **All-11-Games Live Luck Lock Matrix:** Individual per-table cards for all 11 games with instant `Fair`, `10× Lock`, and `MAX` switches plus 1-click `Play ↗` table launchers.
- **Reload Persistence Lock (`Lock across reload`):** Optional toggle in the deck header to keep modified luck and payout settings active across browser reloads until turned off.
- **Executive Treasury & Mint:** Instant `+10K`, `+100K`, `+1M`, `+100M`, `+1B`, `2× Wallet`, `Grant 1 trillion`, `Fill 9T max vault`, plus custom add/remove/set/reset.
- **Precision Outcome Lab:** Live probability bar, presets (`1×` through `10¹⁶×`), custom luck, reward factor (`0.1–100`), and win return override (`0.1–10,000`).
- **Local Player Account Registry & Promo Code Forge:** Inspect registered local accounts, gift `+100K` / `+10M` chips directly to any saved account, unlock all 8 achievements, and mint/delete custom redeemable promo codes.

Settings apply to **new rounds** and cannot be changed while any round is active. A round snapshots its configuration. By default, luck/payout modifications apply to the current page session unless **Lock across reload** is enabled.

### How luck actually works
Eligible rounds select a valid favorable outcome with probability `1 − 1 / sqrt(luck)`; otherwise normal sampling is used. Favorable selection is guaranteed at 10⁸ and above where legal game outcomes allow it. This does **not** multiply a random draw by a huge number.

- Roulette chooses the best paying covered pocket; Slots choose valid sevens.
- Blackjack constructs a natural from cards available in its shoe; Poker deals a valid royal opening without duplicate cards. Throwing away the royal is still the player's decision.
- Baccarat favors the selected side while obeying dealing rules; Dice selects a valid winning roll.
- Hi-Lo favors a legal prediction. Impossible directions stay disabled; ties are handled independently in normal sampling.
- Plinko selects a valid edge path; Lucky Wheel selects a top-return segment.
- Crash selects a 1,000× crash limit; cash-out timing still matters.
- Mines precommits a lower-right mine cluster. It **never moves mines after a click**, and arbitrary clicks can still lose.

A global banner and per-game note clearly identify modifications. Relevant paytables, wheel labels, potential returns and actual receipts update with reward settings. Pushes always refund exactly the stake without developer reward boosts.

## Animation integrity / interruption handling

- Outcome selection still happens **once before** each spin. The existing target is the negative selected-segment angle at the fixed top pointer, plus at least five full turns. Roulette retains its 37-pocket order and counter-rotating ball; Lucky Wheel retains its twelve equal segments.
- A shared **presentation-only** native Web Animations helper in `js/ui.js` accelerates from rest, decelerates smoothly and ticks when an actual segment boundary passes the pointer. It never samples an outcome or changes money.
- A finished, cancelled or unavailable animation snaps to that same final transform. A bounded timeout is the fallback; completion is guarded, and the existing wallet independently rejects duplicate settlements.
- Hiding a tab skips the remaining cosmetic spin and settles the already-selected result. Navigation/reload is distinguished from ordinary hiding, so an unfinished reload keeps the original **stake-refund-once** policy.
- System and Settings reduced-motion preferences skip decorative spinning; changing the preference mid-spin finishes the selected result without a second payout.
- A selection failure returns the stake without developer reward amplification. Closing modals restores background interactivity and the correct mobile-navigation inertness; rapid reopen cannot leave a stale blocking overlay.
- Wallet numbers update to the actual ledger value immediately. A brief native reveal animates the change; no invented intermediate balance is shown. No wallet schema or storage key changed.
- Idle Plinko stops its frame loop; pointer/wheel effects clean up after completion. No extra particles or third-party animation libraries were added.

## Wallet / persistence guarantees

One ledger in `js/wallet.js` owns all money changes:
- Integer hundredths of a chip, per-round IDs, immutable settings and an exactly-once settlement lock.
- Stake deducted once on start; Blackjack double extends that same round; Roulette planned chips are deducted only on Spin.
- Wins return the **whole** calculated amount, not just the profit.
- Finite-number validation, safe caps and BigInt fixed-point payout calculation.
- Maximum wallet **9 trillion**; maximum stake **9 trillion** (full All-In support); maximum return **9 trillion per round**, further limited by remaining wallet capacity. Receipts state when a return was capped and report what was actually credited.
- Resetting a table does not reset the wallet. Wallet changes/refills/developer edits cannot interfere with active rounds.
- Versioned save migration from `gar_bal` / `gar_snd`; corrupt saves fall back safely; storage exceptions do not stop play.
- Wins mean **positive net results**; biggest win means the largest one-round net gain. A returned stake is a push, not a win. Grants/codes do not count as plays.

This is a local simulator, not a tamper-resistant financial ledger. Use one active browser tab per saved wallet; simultaneous tabs are not a distributed/atomic account system.

## Source map

- `index.html`: the published entry point — retained original game markup plus the new shared shell and added views.
- `Golden-Ace-Royale.html`: generated single-file edition (output of `tools/export_single_file.py`, not hand-edited).
- `styles.css`: unified responsive black/charcoal, champagne and emerald design, keeping Cinzel and Outfit.
- `js/config.js`: limits, game library, editable codes.
- `js/rules.js`: presentation-independent game rules and payout math.
- `js/wallet.js`: ledger, persistence, scoped developer settings and outcome selection.
- `js/art.js`: original inline SVG icons, detailed wheels, cards, chips, symbols and game illustrations.
- `js/ui.js`: accessible modals, focus, routing, sound, preference handling, receipts and shared controls.
- `js/original-games.js`: repaired original five controllers.
- `js/table-games.js`: Baccarat, Hi-Lo and Dice.
- `js/arcade-games.js`: Crash, Mines and Lucky Wheel.
- `js/admin.js`: code redemption and local developer controls.
- `js/app.js`: composition and catalogue filtering.
- `reference/original.html`: untouched supplied source.
- `docs/IMPLEMENTATION-PLAN.md`, `docs/CHANGELOG.md`, `docs/TEST-REPORT.md`: audit, decisions, results and limitations.
- `tools/upgrade_source.py`: one-time source migration record. **Do not rerun to make ordinary edits**; edit the runtime files directly.
- `tests/`: reproducible rule/ledger and actual Chromium integration checks.

Fonts are self-hosted under the SIL Open Font License; licenses are in `assets/fonts/` and embedded in the single-file edition. No external images, analytics, fonts, APIs, paid services or runtime libraries are loaded.

## Verification

See **`docs/TEST-REPORT.md`** for exact checks. Test dependencies are optional developer tools only:

```sh
node tests/rules-wallet.test.cjs --exhaustive
# Optional browser tooling, not needed to play:
python -m pip install playwright
python -m playwright install --with-deps chromium
python tests/browser_checks.py
python tests/offline_checks.py
# Optional: run only the focused polish groups
GAR_TEST_FILTER=Polish: python tests/browser_checks.py
```

The tests exercise real production rules and browser event handlers. Deterministic outcomes used in tests are injected through browser automation; no hidden test seed is enabled in normal play.

## Backup

The pre-recovery state of the repository — the commit that was live before this recovery pass — is preserved in history as **`a608193`** ("Rename Golden-Ace-Royale.html to index.html"). Nothing was deleted without first confirming that no runtime file depended on it; the restore only re-homed files into the directories the project's own tooling already referenced. The older originally supplied source remains unmodified in `reference/original.html`.

To compare against it:

```sh
git diff a608193 --stat
```

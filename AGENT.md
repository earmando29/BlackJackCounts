# AGENT.md — AI Onboarding Guide for CountMaster (BlackJackCounts)

> **Purpose:** This file is the single source of truth for any AI agent picking up
> this codebase. Read this FIRST before touching anything.

---

## 🎯 What Is This?

A **6-deck blackjack simulator with Hi-Lo card counting**, built to teach players:
- Basic strategy (hard, soft, pair lookup tables)
- Hi-Lo card counting (RC → TC conversion)
- EV-based decision making (Illustrious 18 deviations)
- Bankroll management & variance awareness

**It's a training tool, not a casino.** The goal is education.

---

## 🏗️ Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | React 18 + Vite 5 | No TypeScript, no router |
| State | React Context + hooks | Single `GameContext` provider |
| Styling | Inline styles + index.css | No Tailwind/CSS modules |
| Logic | Pure JS utils | `gameLogic.js`, `strategy.js` |
| Persistence | localStorage | Auto-save + manual save slots |
| Build | `vite build` → `dist/` | Static SPA, no backend |
| Deploy | Docker (nginx) | Multi-stage, ~25MB image |

**No backend. No API. No database.** Everything runs client-side.

---

## 📁 Project Structure

```
BlackJackCounts/
├── index.html                 # Vite entry point
├── package.json               # Dependencies (react, vite only)
├── vite.config.js             # Vite config (react plugin)
├── Dockerfile                 # Multi-stage build
├── docker-compose.yml         # One-command deploy
├── nginx.conf                 # SPA routing
├── docs/
│   └── DESIGN_DOC.md          # Original TDD (Oct 2023)
├── src/
│   ├── main.jsx               # React root mount
│   ├── index.css              # Global styles + animations
│   ├── App.jsx                # Root layout: Bankroll → Table → Controls → History
│   ├── context/
│   │   └── GameContext.jsx     # ★ THE BIG FILE — all game state & actions
│   ├── components/
│   │   ├── BankrollDisplay.jsx # Bankroll, P/L, EV tracker, count toggle
│   │   ├── GameTable.jsx       # Dealer area, shoe/discard stacks, player spots
│   │   ├── HandSpot.jsx        # Single hand slot (betting + in-play)
│   │   ├── Card.jsx            # Card component with flip/deal animations
│   │   ├── ControlPanel.jsx    # Spots/speed/save + chip betting + action buttons
│   │   ├── ChipBetting.jsx     # Chip selector ($1–$100)
│   │   ├── EvAdvisor.jsx       # EV recommendation display (toggled)
│   │   └── HandHistory.jsx     # Expandable round history list
│   ├── hooks/
│   │   └── useDeck.js          # Fisher-Yates shuffle, Hi-Lo map, card creation
│   └── utils/
│       ├── gameLogic.js        # calculateHandValue, dealerPlayOut, countDelta
│       ├── persistence.js      # localStorage save/load/export
│       └── strategy.js         # ★ EV engine: basic strategy + deviations + EV tables
```

---

## 🧠 Key Architecture Decisions

### GameContext.jsx (~490 lines)
This is the **brain** of the app. All game state lives here:
- Shoe management (6-deck, auto-reshuffle at <60 cards)
- Betting (chip-based, multi-spot, bet-all)
- Dealing (animated, staggered card delivery)
- Player actions (hit/stand/double/split with full rules)
- Dealer AI (S17 — stands on soft 17)
- Round resolution (win/lose/push/blackjack payouts)
- Session EV tracking (cumulative expected value)
- History recording (per-round with EV + real P/L)
- Save/load (auto-save on bet screen, manual save slots)

**State flow:** `betting → dealing → playing → finished → betting`

### strategy.js (~190 lines)
Pure functions. No React. Fully testable.
- `getRecommendation(cards, dealerUpcard, trueCount, opts)`
- Returns: `{ action, basicAction, deviation, ev, hand }`
- EV tables: hard 5-20, soft 13-20 vs all 10 dealer upcards
- TC adjustment: +0.5% per true count point
- Deviations: Illustrious 18 + defensive indices

### Card counting flow:
1. Cards dealt → `addToCount()` updates `runningCount`
2. `trueCount = runningCount / decksRemaining`
3. `decksRemaining = Math.ceil(cards.length / 52)`
4. Deviations check TC thresholds to override basic strategy

---

## 🎮 Game Rules (Hardcoded)

| Rule | Value |
|---|---|
| Decks | 6 |
| Dealer | Stands on soft 17 (S17) |
| Blackjack pays | 3:2 |
| Double | Any 2 cards, after split |
| Split | Up to 4 times (5 hands) |
| Split aces | One card each, auto-stand |
| Reshuffle | When shoe < 60 cards |
| Starting bankroll | $1,000 |
| Rebuy | $1,000 (appears when < $100) |

---

## 🔌 Features & Toggles

| Feature | Default | Toggle |
|---|---|---|
| Hi-Lo count display | OFF | 👁 Show Counts button |
| EV Advisor + button highlights | OFF | 🧠 EV On/Off button |
| Hand history | Collapsed | 📋 expand button |
| Multi-spot (1-3 hands) | 1 spot | Spots pills (betting only) |
| Deal speed (1-5) | 3 | Speed pills |
| Bet all spots | N/A | Button appears when 2+ spots |

---

## 📊 EV Tracking System

The EV tracker answers: **"Am I playing correctly even if I'm losing?"**

- **sessionEV**: Sum of per-hand expected values (initial 2 cards × bet)
- **realPL**: Actual bankroll change from buy-in
- **variance**: `realPL - sessionEV`
- Displayed in BankrollDisplay after first hand
- Each history entry stores `roundEV` for drill-down

**Variance indicators:**
- ⚖️ On track (|variance| < $5)
- 🍀 Running hot (real > EV)
- 🌧️ Variance dip (real < EV)

---

## 🛠️ Development

```bash
# Install
npm install

# Dev server (hot reload)
npm run dev         # → http://localhost:5173

# Production build
npm run build       # → dist/

# Preview production build
npm run preview
```

### Docker
```bash
# Build the app first (Docker serves pre-built assets)
npm run build

# Then build + run the container
docker compose up -d          # Build + run on port 3000
docker compose down           # Stop

# Rebuild after code changes
npm run build && docker compose up -d --build
```

> **Port note:** Default is 3000. Change in `docker-compose.yml` if needed.
> Port 8080 is often used by Teams — avoid it.

---

## ⚠️ Known Quirks / Gotchas

1. **No TypeScript** — All `.jsx` and `.js`. Type safety is via careful naming.
2. **Inline styles everywhere** — No CSS modules or Tailwind. Keep it consistent.
3. **GameContext is big** — ~490 lines. It's the single state store. Splitting it
   would add complexity without real benefit at this scale.
4. **Card IDs** — Generated by a module-level counter (`_cardId`). Not UUID.
   Works fine for single-session but IDs aren't unique across reloads.
5. **EV tables are approximate** — Sourced from standard combinatorial analysis
   but simplified. Good enough for training, not for real-money decisions.
6. **localStorage only** — No cloud sync. Save data lives in the browser.
7. **No tests yet** — `strategy.js` and `gameLogic.js` are pure functions
   and ready for unit tests. Priority if adding tests.

---

## 🚀 What to Build Next (Roadmap)

Per the original design doc + owner preferences:

1. **Surrender** — Half bet returned; add to strategy tables
2. **H17 toggle** — Dealer hits soft 17 variant
3. **Configurable decks** — 1/2/4/6/8 deck shoes
4. **Session stats chart** — Bankroll over time (Chart.js or Recharts)
5. **Basic strategy trainer mode** — Flash wrong plays, track accuracy %
6. **Sound effects** — Card deal, chip clink, win/lose
7. **Mobile responsive** — Works now but could be tighter on small screens
8. **Unit tests** — Jest/Vitest for strategy.js and gameLogic.js
9. **PWA** — Offline play with service worker

---

## 🧩 Conventions for AI Agents

- **Keep files under 600 lines.** GameContext is the exception (at 490).
- **Pure functions in `utils/`** — No React imports, no side effects.
- **Components are functional** — No class components. Use hooks.
- **State changes via context** — Never mutate state directly.
- **Commit often** — Descriptive messages. We use git to roll forward/back.
- **Build before committing** — `npx vite build` must pass clean.
- **No TypeScript** — Don't convert. Keep it JS.
- **Inline styles** — Match the existing pattern. No CSS-in-JS libs.

---

## 📞 Owner Notes

- **Owner:** Armando (earmando29 on GitHub)
- **Repo:** https://github.com/earmando29/BlackJackCounts
- **Original design doc:** `docs/DESIGN_DOC.md` (Oct 2023)
- **This doc:** `AGENT.md` — update it when you make architectural changes

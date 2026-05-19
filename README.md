# 🃏 CountMaster — Blackjack Card Counting Trainer

A fully interactive 6-deck blackjack simulator with Hi-Lo card counting,
EV-based strategy advice, and variance tracking. Built to teach you to
play +EV blackjack.

![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![License](https://img.shields.io/badge/License-ISC-green)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🃏 Full game engine | Hit, stand, double, split (up to 4x) |
| 🔢 Hi-Lo counting | Running count + true count display |
| 🧠 EV Advisor | Basic strategy + Illustrious 18 deviations |
| 📊 EV Tracker | Session EV vs real P/L with variance indicator |
| 🎰 Multi-hand | Play 1-3 spots with bet-all shortcut |
| 💾 Save/Load | Auto-save, manual save slots, file export |
| 📋 Hand History | Per-round results with EV breakdown |
| 🎨 Card animations | Staggered dealing, flip, peel reveal |

## 🚀 Quick Start

### Local Development
```bash
git clone https://github.com/earmando29/BlackJackCounts.git
cd BlackJackCounts
npm install
npm run dev
# → http://localhost:5173
```

### Docker (Production)
```bash
# Build the app first
npm install && npm run build

# Build + run the container
docker compose up -d
# → http://localhost:3000
```

### NAS / Linux Server
```bash
# Clone to your server
git clone https://github.com/earmando29/BlackJackCounts.git
cd BlackJackCounts

# Install, build, and run (port 3000, auto-restarts)
npm install && npm run build
docker compose up -d

# Stop
docker compose down

# Rebuild after pulling changes
git pull && npm run build && docker compose up -d --build
```

> **Port:** Default is 3000. Edit `docker-compose.yml` to change.

## 🏗️ Architecture

```
App
├── BankrollDisplay    ← Bankroll, P/L, EV tracker, counts
├── GameTable          ← Dealer, shoe, discard, player spots
│   └── HandSpot[]     ← Individual hands with cards
├── ControlPanel       ← Settings, betting, action buttons
│   ├── ChipBetting    ← Chip selector
│   └── EvAdvisor      ← Strategy recommendation
└── HandHistory        ← Round-by-round results
```

All state managed via `GameContext` (React Context API).
Strategy engine in `src/utils/strategy.js` — pure functions, no React.

## 🤖 AI Agents

**Read `AGENT.md`** before working on this codebase. It contains:
- Complete architecture map
- State flow documentation
- File-by-file guide
- Conventions and gotchas
- Roadmap for future features

## 📖 Design Doc

Original technical design document: [`docs/DESIGN_DOC.md`](docs/DESIGN_DOC.md)

## 📄 License

ISC

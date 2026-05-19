# Technical Design Document (TDD): CountMaster

**Version:** 1.0
**Date:** October 26, 2023
**Status:** Draft
**Role:** Senior Frontend Engineer & Game Designer

---

## 1. Technology Stack & Architecture Recommendation

For an interactive simulation application requiring real-time state updates, complex deck
management, and responsive UI components, **React** is the superior choice over Vanilla JS.
Vanilla JS would require significant manual DOM manipulation code to manage the card animations
and state updates, which increases technical debt and bugs.

### Recommended Stack
*   **Framework:** React 18+ (Vite for build tooling).
*   **State Management:** React Context API + Custom Hooks (`useDeck`, `useGameLoop`). *Note:
Redux is overkill for this scope; Context is sufficient and cleaner.*
*   **Styling:** Tailwind CSS (Rapid UI development, easy theming for Dark/Light modes).
*   **Icons:** Lucide React (Lightweight SVG icons for actions).
*   **Charts:** Recharts (Lightweight stats visualization for win/loss graph).
*   **Logic:** Plain JavaScript (no heavy frameworks for backend logic to keep it lightweight).

### Architectural Plan (Monorepo Structure)
```text
/src
  /components
    /Cards      (Card component, Suit, FaceUp/Back logic)
    /Table      (Green felt, dealer hole, player hand)
    /Controls   (Hit, Stand, Bet, Split buttons)
    /Stats      (EV Counter, Bankroll, Running Count display)
    /Settings   (Deck size, Theme toggle)
  /hooks
    useDeck.js  (Shuffle, Deal, Count logic)
    useBankroll.js (Money management)
  /context
    GameContext.js
  /utils
    cardLogic.js (Hi-Lo mapping, EV Lookup)
```

---

## 2. Game Logic & Mechanics

### 2.1 Card Counting System (Hi-Lo)
*   **Mapping:**
    *   **+1:** 2, 3, 4, 5, 6
    *   **0:** 7, 8, 9
    *   **-1:** 10, J, Q, K, A
    *   *Logic Note:* All 10-value cards (Tens, Jacks, Queens, Kings, Aces) are assigned **-1**.
*   **Running Count (RC):** Sum of values of all cards dealt/seen (Player + Dealer + Discard).
*   **True Count (TC):** `Running Count / Decks Remaining`.
    *   *Edge Case:* When the shoe is full, `TC = 0`.
    *   *Calculation:* `Decks Remaining = (Initial Cards - Current Cards) / 52`. Use `Math.ceil`
for conservative counting or `Math.floor` for betting thresholds. We will implement `Math.ceil`
for True Count to simulate conservative bet sizing.

### 2.2 Deck Configuration
*   **Shoe Logic:**
    *   Array of 1, 2, 4, 6, or 8 sets of standard 52 cards.
    *   **Shuffle:** Fisher-Yates algorithm.
    *   **Dealing:** Remove card from `deck` array on every deal action.
    *   **Discard Pile:** Cards are visually tracked. For training purposes, the discard pile
shows the card face-up immediately after it leaves the active play area to reinforce memory of
what was seen.

### 2.3 Dealer Rules
*   **Stand on Soft 17 (S17):** Default. Dealer stands on A-6, 7-7.
*   **Hit on Soft 17 (H17):** Toggle option. Dealer hits on A-6.
*   **Blackjack Payout:** 3:2.
*   **Bust:** Lose immediately.

### 2.4 Betting & Bankroll
*   **Buy-In:** Settable starting bankroll (e.g., $1,000).
*   **Min Bet:** $10 (configurable).
*   **Max Bet:** $200 (configurable).
*   **Bet Sizing:** Player inputs bet amount. App updates `bankroll` and `balance`.
*   **EV Logic:** Track `totalPayouts` and `totalBets` to calculate actual EV.

### 2.5 Player Actions
*   **Hit/Stand:** Standard.
*   **Double Down:** Valid only if bet allows doubling (e.g., max bet = 2 * current bet) or if
rules permit.
*   **Split:** (Advanced) Allowed on pairs, creates new hands.
*   **Surrender:** (Phase 2) Half bet returned based on EV table lookup.

---

## 3. Visuals & UI/UX

### 3.1 Card Rendering
*   **Unicode Characters:**
    *   **Hearts/Diamonds:** `♥` (Red), `♦` (Red).
    *   **Spades/Clubs:** `♠` (Black), `♣` (Black).
    *   **Values:** `A`, `2`-`10`, `J`, `Q`, `K`.
*   **Card Back:** CSS pattern (e.g., geometric diamond pattern) with a unique ID to
differentiate decks if multiple decks are active.
*   **Animations:** CSS `transform: rotateX` for dealing and flipping.
*   **Themes:**
    *   **Casino Dark:** `bg-green-900` (Felt), text `text-white`.
    *   **Casino Light:** `bg-white`, text `text-gray-800`.
    *   **High Contrast:** `bg-black`, `text-yellow-400`.

### 3.2 The Discard Pile
*   **Toggle:** "Show Discard" button.
*   **Default:** Face-up (Crucial for learning: You must know what left the deck to calculate the
true count accurately).
*   **Visual:** Cards stack vertically. Only the top discarded card is visible.

### 3.3 EV Integration
*   **Future Phase:** `http://www.hundredpercentgambling.com/ev-table-six-deck-hard-17.htm`
*   **Implementation:** Fetch API to load JSON table. Client-side lookup based on `(Running
Count, Player Hand, Dealer Up)`.

---

## 4. Component Architecture

### 4.1 Component Hierarchy
1.  **`<CountMasterApp>`** (Root)
    *   Manages `GameContext`.
    *   Holds global settings (Theme, Deck Count).
2.  **`<GameTable>`**
    *   Renders the felt surface.
    *   Coordinates Player Hand vs. Dealer Hand.
    *   Displays Running Count overlay.
3.  **`<DeckManager>`**
    *   Generates the shoe (React component with logic).
    *   Handles `shuffle` and `resplit` logic.
4.  **`<ControlPanel>`**
    *   Bet inputs (Slider/Input).
    *   Hit/Stand/Double buttons.
    *   Settings (S17/H17 toggle, Deck Count).
5.  **`<BankrollDisplay>`**
    *   Shows Buy-in, Current Balance, and Net Win/Loss.

### 4.2 State Management Strategy
We utilize **React Context** to broadcast game state changes to all components without
prop-drilling.

**`GameContext` State Structure:**
```json
{
  "deck": [ "2♠", "3♥", ... ], // Array of string cards
  "playerHand": [ "K♦", "2♠", ... ],
  "dealerHand": [ "5♥", "A♣", ... ], // Hole card hidden if needed
  "discardPile": [], // Array of dealt cards
  "runningCount": 2,
  "trueCount": 1.5,
  "bankroll": 1000,
  "currentBet": 100,
  "isDealing": false
}
```

---

## 5. UI Layout Proposal (Wireframe Logic)

```
+-------------------------------------------------------+
|  [Logo]  Current Run: +2  |  TC: 1.5  |  Win: 50%     |
+-------------------------------------------------------+
|                                                       |
|  +-----------------------------------------------+    |
|  |  DEALER:  [ 5♥ ] [ A♣(Hole) ]                |    |
|  +-------------------------------------------------+  |
|                                                       |
|  +-----------------------------------------------+    |
|  |  PLAYER:  [ K♦ ] [ 2♠ ]                      |    |
|  |  | Hit | Stand | Double | Split | Surrender  |  |    |
|  +-----------------------------------------------+    |
|                                                       |
+-------------------------------------------------------+
|  [ Bet $10 ] [ Max Bet ] [ Bet Up ] [ Bet Down ]      |
+-------------------------------------------------------+
|  Bankroll: $1000   |   EV: +$50 (Est)                 |
+-------------------------------------------------------+
```

---

## 6. Technical Constraints & Edge Cases
1.  **Deck Exhaustion:** When the shoe has approximately one deck remaining (random amount between 20-40 cards), the game pauses to display player stats. The shoe then reshuffles automatically. The remaining cards are randomly distributed (not always exactly 1 deck).
2.  **Blackjack:** If Player gets Blackjack, dealer hole card is revealed (if A) or dealt immediately if not.
3.  **Consecutive Aces:** If `A, A` appears, `True Count` spikes. Ensure UI handles this visually (e.g., highlight the running count). **Split Aces receive only one card each (standard rules).**
4.  **Double Down Logic:** Double Down cannot occur after a split hand unless allowed by house rules. Logic must check if `currentBet * 2 <= bankroll`.
5.  **Surrender:** Not implemented at this time. Can be incorporated in future phases.

---

## 7. Implementation Roadmap

### Phase 1: Core Deck Logic
*   Implement Fisher-Yates shuffle.
*   Create `Card` component with Unicode rendering.
*   Manage `RunningCount` state updates on every card reveal.

### Phase 2: Player Interaction
*   Build `GameTable` component (Player vs Dealer).
*   Implement `Hit`, `Stand`, `Double`.
*   Implement `Bust` and `Blackjack` win conditions.

### Phase 3: Bankroll & Betting
*   Implement `Bankroll` state.
*   Add Bet sizing controls.
*   Add "Resplit" logic for empty shoes.

### Phase 4: Visuals & Polish
*   Add Theme toggle (Dark/Light).
*   Implement card flip animations.
*   Display `True Count` and `Running Count` in overlay.

### Phase 5: Strategy Integration (Future)
*   Add `getEVStrategy` function.
*   Fetch external EV data (or hardcoded lookup table).
*   Implement basic "Bet the count" logic for simulation.

---

## 8. Code Outline Example (React Logic)

```javascript
// useDeck.js (Abstracted Logic)
export function calculateRunningCount(hand, discard) {
  const map = { '2':'+1', '3':'+1', '4':'+1', '5':'+1', '6':'+1', '7':'0', '8':'0', '9':'0',
'10':'-1', 'J':'-1', 'Q':'-1', 'K':'-1', 'A':'-1' };
  let rc = 0;
  hand.forEach(card => { rc += map[card.value]; });
  discard.forEach(card => { rc += map[card.value]; });
  return rc;
}

export function calculateTrueCount(rc, remainingCards) {
  if (remainingCards === 52) return 0;
  const decksRemaining = remainingCards / 52;
  return Math.ceil(rc / decksRemaining); // Conservative counting
}
```
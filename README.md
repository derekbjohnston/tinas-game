# Tina's Game

A multiplayer party word-guessing game built with React, TypeScript, and Firebase.

Players submit words to a shared bowl, split into teams, then take turns giving clues across three rounds:

1. **Catch-Phrase** — describe the word using any words
2. **Charades** — act it out, no talking
3. **One-Word Clue** — say only one word

## Setup

```bash
npm install
cp .env.example .env
# Fill in your Firebase config values in .env
npm run dev
```

Open `http://localhost:5174` in your browser. For mobile access on the same network, use your machine's local IP.

## Testing

```bash
npm test              # Unit tests (Vitest)
npm run test:watch    # Unit tests in watch mode
npm run test:e2e      # End-to-end tests (Playwright)
```

## Tech Stack

- React 18 + TypeScript + Vite
- Firebase Realtime Database for multiplayer sync
- Vitest + Testing Library for unit tests
- Playwright for e2e tests

## Future Ideas

- **Host the app** — Deploy to Firebase Hosting, Vercel, or Netlify
- **Lock down Firebase rules** — Replace wide-open read/write rules with per-room validation
- **Timer configuration** — Let the host choose turn duration (30s, 45s, 60s)
- **Handle disconnects gracefully** — Skip disconnected players, show offline indicators
- **Sound effects** — Buzzer on time-out, ding on correct guess
- **Mobile polish** — Larger tap targets, prevent zoom on double-tap, fullscreen mode
- **Spectator improvements** — Show which team is guessing, animate score changes
- **Room expiry** — Auto-delete rooms older than 24h via Firebase Cloud Function
- **Custom word count** — Let host configure words per player (3–7)
- **Rematch with same teams** — "Play Again" option that keeps team assignments

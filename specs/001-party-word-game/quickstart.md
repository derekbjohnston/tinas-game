# Quickstart: Tina's Stupid Game

## Prerequisites

- Node.js 18+ installed
- A Firebase project (free Spark plan) with Realtime Database enabled

## Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd speckit-tinas-game
   npm install
   ```

2. Create a Firebase project at https://console.firebase.google.com:
   - Create a new project (disable Google Analytics — not needed)
   - Go to Build → Realtime Database → Create Database
   - Choose a region close to your players
   - Start in **test mode** (open rules for development)

3. Get your Firebase config:
   - Go to Project Settings → General → Your Apps → Add Web App
   - Copy the `firebaseConfig` object

4. Create a `.env` file in the project root:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open on your phone (same Wi-Fi): navigate to `http://<your-local-ip>:5173`

## Playing the Game

1. **Create a game**: One player taps "Create Game," enters their name, and gets a 4-letter room code
2. **Join**: Other players open the app, enter the room code and their name
3. **Submit words**: Each player enters 3–5 words or sayings (max 50 characters each)
4. **Pick teams**: Everyone selects Team 1 or Team 2
5. **Play Round 1 (Catch-Phrase)**: Active player gives verbal clues. Tap "Got it" or "Skip" (1 skip allowed). 30 seconds per turn.
6. **Play Round 2 (Charades)**: Act it out, no talking. No skipping.
7. **Play Round 3 (One Word)**: Say only ONE word as a clue. No skipping.
8. **Winner**: Team with the most points wins!
9. **Play Again**: Resets the game with reshuffled teams.

## Deploying

Deploy the React app to Vercel:
```bash
npm install -g vercel
vercel
```

Set the same environment variables in Vercel's project settings.

## Firebase Security Rules (Production)

Before going live, replace the test-mode rules with:
```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    },
    ".read": false,
    ".write": false
  }
}
```

This restricts read/write to only room paths. For stricter rules, validate player identity and data shapes.

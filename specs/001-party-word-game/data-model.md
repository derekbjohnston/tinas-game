# Data Model: Tina's Stupid Game — Party Word Game

**Date**: 2026-03-05
**Branch**: `001-party-word-game`

## Firebase Realtime Database Structure

The entire game state lives under `/rooms/{roomCode}`. Each room is an independent game session.

## Entities

### Room (top-level node)

```
/rooms/{roomCode}/
  createdAt: number (server timestamp)
  hostId: string (player ID of the creator)
  phase: "lobby" | "teams" | "playing" | "finished"
  round: 1 | 2 | 3
  roundType: "catchphrase" | "charades" | "oneword"
```

**State transitions**:
- `lobby` → `teams` (when host advances after all players submit words)
- `teams` → `playing` (when host starts the game, both teams have players)
- `playing` → `playing` (round transitions: bowl empties, refill, increment round)
- `playing` → `finished` (bowl empties in round 3)
- `finished` → `lobby` (host taps "Play Again"; teams reshuffled)

### Player

```
/rooms/{roomCode}/players/{playerId}/
  name: string
  team: null | 1 | 2
  connected: boolean
  submittedWords: boolean
  skipsUsedRound1: number (0 or 1)
```

- `playerId` is a client-generated UUID stored in localStorage for reconnection
- `team` is `null` during lobby/word submission, set during team phase
- `connected` managed via Firebase `onDisconnect()` handlers

### Bowl

```
/rooms/{roomCode}/bowl/
  {wordId}: {
    text: string
    submittedBy: string (playerId)
    inBowl: boolean
  }
```

- `wordId` is a push-key or client-generated ID
- `inBowl: true` means available to draw; `false` means already guessed this round
- Between rounds: all words reset to `inBowl: true`
- Words are never deleted, only toggled — this enables the refill mechanic

### Scores

```
/rooms/{roomCode}/scores/
  team1: number
  team2: number
```

- Cumulative across all rounds
- Reset to 0 on "Play Again"

### Turn

```
/rooms/{roomCode}/turn/
  activePlayerId: string
  activeTeam: 1 | 2
  currentWordId: string | null
  turnStartedAt: number (server timestamp) | null
  wordsGuessedThisTurn: number
  turnActive: boolean
```

- `turnStartedAt` is the authoritative timestamp all clients use for timer calculation
- `currentWordId` is only read by the active player's device to display the word
- `turnActive: false` between turns (waiting for next player to tap "Start")
- `wordsGuessedThisTurn` tracks the count displayed to spectators

### Turn Order

```
/rooms/{roomCode}/turnOrder/
  currentIndex: number
  order: string[] (array of playerIds, alternating teams)
  playersGoneThisCycle: {
    team1: string[] (playerIds)
    team2: string[] (playerIds)
  }
```

- `order` is pre-generated when the game starts: randomly interleave players from each team
- When all players on a team have gone, reset that team's `playersGoneThisCycle` and re-randomize
- `currentIndex` advances after each turn

### Recently Guessed (for spectator word reveal)

```
/rooms/{roomCode}/recentGuess/
  wordText: string
  guessedAt: number (server timestamp)
  team: 1 | 2
```

- Overwritten each time a word is guessed correctly
- Spectator screens display this briefly (e.g., 2-second flash)

## Validation Rules

- **Word text**: 1–50 characters, trimmed, non-empty after trim
- **Words per player**: minimum 3, maximum 5
- **Room code**: exactly 4 uppercase alphabetic characters (A-Z)
- **Player name**: 1–20 characters, trimmed, non-empty after trim
- **Team assignment**: must be 1 or 2
- **Skip limit**: maximum 1 skip per player in round 1; 0 in rounds 2 and 3

## Indexes / Query Patterns

Firebase RTDB queries needed:
- Get all words where `inBowl: true` → draw a random word
- Get all players on a given team → build turn order
- Check if room code exists → room code uniqueness on creation

## Data Lifecycle

1. **Room creation**: Host generates room code, writes initial room node with `phase: "lobby"`
2. **Player join**: Player writes to `/players/{id}` with their name
3. **Word submission**: Player writes 3-5 words to `/bowl/{wordId}`
4. **Team selection**: Player updates their `team` field
5. **Game start**: Host writes `phase: "playing"`, `round: 1`, generates turn order
6. **Turn flow**: Active player writes `turnActive: true` + `turnStartedAt`; taps Got it/Skip to update bowl and scores
7. **Round end**: When no words have `inBowl: true`, reset all to `inBowl: true`, increment round
8. **Game end**: After round 3 bowl empty, write `phase: "finished"`
9. **Play Again**: Reset scores, bowl `inBowl` flags, `phase: "lobby"`, randomize new teams
10. **Cleanup**: Rooms older than 24 hours can be pruned (optional Firebase scheduled function or client-side check)

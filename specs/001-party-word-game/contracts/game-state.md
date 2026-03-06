# Game State Contract

**Date**: 2026-03-05

This document defines the contract between the React client and Firebase Realtime Database — the shape of data read and written at each game phase.

## Room Lifecycle Events

### Create Room
**Writer**: Host client
**Path**: `/rooms/{roomCode}`
**Payload**:
```json
{
  "createdAt": "<SERVER_TIMESTAMP>",
  "hostId": "player-uuid",
  "phase": "lobby",
  "round": 0,
  "scores": { "team1": 0, "team2": 0 }
}
```

### Join Room
**Writer**: Joining player client
**Path**: `/rooms/{roomCode}/players/{playerId}`
**Payload**:
```json
{
  "name": "PlayerName",
  "team": null,
  "connected": true,
  "submittedWords": false,
  "skipsUsedRound1": 0
}
```
**Side effect**: Set `onDisconnect()` to write `connected: false`

### Submit Words
**Writer**: Player client
**Path**: `/rooms/{roomCode}/bowl/{wordId}` (one write per word, 3-5 words)
**Payload**:
```json
{
  "text": "the word or saying",
  "submittedBy": "player-uuid",
  "inBowl": true
}
```
**Post-write**: Update `/rooms/{roomCode}/players/{playerId}/submittedWords` to `true`

### Select Team
**Writer**: Player client
**Path**: `/rooms/{roomCode}/players/{playerId}/team`
**Payload**: `1` or `2`

### Start Game
**Writer**: Host client
**Path**: `/rooms/{roomCode}`
**Updates**:
```json
{
  "phase": "playing",
  "round": 1,
  "roundType": "catchphrase",
  "turnOrder": {
    "currentIndex": 0,
    "order": ["playerId-a", "playerId-c", "playerId-b", "playerId-d"],
    "playersGoneThisCycle": { "team1": [], "team2": [] }
  },
  "turn": {
    "activePlayerId": "playerId-a",
    "activeTeam": 1,
    "currentWordId": null,
    "turnStartedAt": null,
    "wordsGuessedThisTurn": 0,
    "turnActive": false
  }
}
```

### Start Turn
**Writer**: Active player client
**Path**: `/rooms/{roomCode}/turn`
**Updates**:
```json
{
  "turnActive": true,
  "turnStartedAt": "<SERVER_TIMESTAMP>",
  "currentWordId": "word-id-drawn",
  "wordsGuessedThisTurn": 0
}
```
**Logic**: Client randomly selects a word where `inBowl: true`

### Got It (Correct Guess)
**Writer**: Active player client
**Paths**: Multi-path update (atomic)
```json
{
  "/rooms/{roomCode}/bowl/{wordId}/inBowl": false,
  "/rooms/{roomCode}/scores/team{N}": "<INCREMENT>",
  "/rooms/{roomCode}/turn/currentWordId": "next-word-id-or-null",
  "/rooms/{roomCode}/turn/wordsGuessedThisTurn": "<INCREMENT>",
  "/rooms/{roomCode}/recentGuess": {
    "wordText": "the guessed word",
    "guessedAt": "<SERVER_TIMESTAMP>",
    "team": 1
  }
}
```
**Logic**: If no more words with `inBowl: true`, set `currentWordId: null` (triggers round end check)

### Skip (Round 1 only)
**Writer**: Active player client
**Paths**: Multi-path update (atomic)
```json
{
  "/rooms/{roomCode}/turn/currentWordId": "new-word-id",
  "/rooms/{roomCode}/players/{playerId}/skipsUsedRound1": 1
}
```
**Logic**: Current word stays `inBowl: true`, draw a different word

### Turn End (Timer Expired)
**Writer**: Active player client (or any client detecting timer expiry)
**Path**: `/rooms/{roomCode}/turn`
**Updates**:
```json
{
  "turnActive": false,
  "currentWordId": null,
  "turnStartedAt": null,
  "wordsGuessedThisTurn": 0
}
```
**Post-write**: Advance turn order to next player

### Round End
**Trigger**: No words with `inBowl: true` remain
**Writer**: Active player client
**Updates**:
- Reset all `/rooms/{roomCode}/bowl/{wordId}/inBowl` to `true`
- Increment `/rooms/{roomCode}/round`
- Update `/rooms/{roomCode}/roundType` to next type
- Reset turn order cycle tracking
- If round was 3, set `phase: "finished"` instead

### Play Again
**Writer**: Host client
**Updates**:
- Set `phase: "lobby"`
- Reset `scores` to `{ team1: 0, team2: 0 }`
- Reset all bowl words to `inBowl: true`
- Clear all player `team` assignments (will be randomized)
- Reset `round` to 0
- Clear `turn` and `turnOrder`
- Reset all player `skipsUsedRound1` to 0
- Clear `submittedWords` for all players

## Listeners (Client Subscriptions)

| Path | Who listens | Purpose |
|------|-------------|---------|
| `/rooms/{code}` | All clients | Phase changes, round changes |
| `/rooms/{code}/players` | All clients | Lobby roster, team assignments, connection status |
| `/rooms/{code}/scores` | All clients | Live score display |
| `/rooms/{code}/turn` | All clients | Timer start, active player, words guessed count |
| `/rooms/{code}/turn/currentWordId` | Active player only | Which word to display (read word text from bowl) |
| `/rooms/{code}/recentGuess` | Non-active players | Flash the guessed word on screen |
| `/rooms/{code}/bowl` | Active player | Draw random word, check if bowl is empty |

## Timer Calculation (Client-Side)

```
serverTimeOffset = value from firebase.database().ref('.info/serverTimeOffset')
serverNow = Date.now() + serverTimeOffset
elapsed = (serverNow - turnStartedAt) / 1000
remaining = max(0, 30 - elapsed)
```

Display updates via `setInterval(100)` or `requestAnimationFrame`.

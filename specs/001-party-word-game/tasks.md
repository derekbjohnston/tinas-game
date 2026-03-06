# Tasks: Tina's Stupid Game — Party Word Game

**Input**: Design documents from `/specs/001-party-word-game/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Project initialization and tooling

- [x] T001 Initialize Vite project with React + TypeScript template in project root
- [x] T002 Install dependencies: firebase, react-router-dom (or simple phase-based router)
- [x] T003 [P] Create Firebase config and initialization in src/lib/firebase.ts
- [x] T004 [P] Create TypeScript interfaces for all game entities in src/types/game.ts (Room, Player, Bowl, Team, Round, Turn, GameSession per data-model.md)
- [x] T005 [P] Create global mobile-first styles in src/index.css (viewport meta, touch-friendly sizing, 320px min-width support)
- [x] T006 [P] Set up environment variables (.env.example with VITE_FIREBASE_* keys) and add .env to .gitignore

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T007 Implement useFirebase hook in src/hooks/useFirebase.ts (Firebase app instance, server time offset listener via .info/serverTimeOffset)
- [x] T008 Implement room code generation and validation in src/lib/roomCode.ts (4-char uppercase alpha, uniqueness check against Firebase)
- [x] T009 Implement useRoom hook in src/hooks/useRoom.ts (create room, join room by code, listen to room state, player presence via onDisconnect)
- [x] T010 Implement useGameState hook in src/hooks/useGameState.ts (listen to phase, round, turn, scores; derive current screen from game phase)
- [x] T011 Implement App.tsx as screen router that switches between screens based on game phase (lobby, teams, playing, finished) and local state (no room yet → HomeScreen)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Word Submission Phase (Priority: P1)

**Goal**: Players join via room code, enter 3–5 words/sayings (max 50 chars) into the shared bowl

**Independent Test**: One player creates a game, another joins via room code, both submit words, both see the word count in the lobby

### Implementation for User Story 1

- [x] T012 [P] [US1] Create HomeScreen component in src/components/screens/HomeScreen.tsx (create game button, join game form with room code input, player name input)
- [x] T013 [P] [US1] Create WordInput component in src/components/shared/WordInput.tsx (single text field with 50-char limit, add/remove word UI)
- [x] T014 [US1] Create LobbyScreen component in src/components/screens/LobbyScreen.tsx (word entry form with 3–5 WordInput slots, submit button, player list showing who has submitted, total word count in bowl)
- [x] T015 [US1] Implement word submission logic in useRoom hook: write 3–5 words to /rooms/{code}/bowl/{wordId} and set player submittedWords flag (per contracts/game-state.md Submit Words contract)
- [x] T016 [US1] Add validation: enforce 3–5 words per player, 1–50 chars per word, prevent duplicate submissions, trim whitespace
- [x] T017 [US1] Add "Proceed to Teams" button on LobbyScreen for host (visible when all players have submitted), write phase: "teams" to Firebase to advance game phase

**Checkpoint**: Players can create/join a game, submit words, and host can advance to team selection.

---

## Phase 4: User Story 2 — Team Setup (Priority: P1)

**Goal**: Players self-assign to Team 1 or Team 2, host starts the game

**Independent Test**: After word submission, players pick teams, see rosters update live, host can start when both teams have players

### Implementation for User Story 2

- [x] T018 [US2] Create TeamsScreen component in src/components/screens/TeamsScreen.tsx (Team 1 / Team 2 selection buttons, live roster for each team, "Start Game" button visible to host)
- [x] T019 [US2] Implement team selection in useRoom hook: write player team assignment to /rooms/{code}/players/{id}/team
- [x] T020 [US2] Add start-game validation: both teams must have at least one player; host writes phase: "playing", round: 1, generates turn order
- [x] T021 [US2] Implement turn order generation in src/lib/turnOrder.ts (randomly interleave players from each team, track who has gone per cycle, per data-model.md Turn Order entity)

**Checkpoint**: Teams are formed, turn order is generated, game transitions to Round 1.

---

## Phase 5: User Story 3 — Round 1: Catch-Phrase (Priority: P1) 🎯 MVP

**Goal**: Active player sees words, gives verbal clues, team guesses. 30-second timer, skip (1x), "Got it" scoring. Turns alternate between teams until bowl is empty.

**Independent Test**: Full Round 1 playable — active player sees word and controls, spectators see timer and scores, turn alternation works, bowl empties and round ends

### Implementation for User Story 3

- [x] T022 [P] [US3] Implement useTimer hook in src/hooks/useTimer.ts (compute remaining seconds from turnStartedAt + serverTimeOffset, update via setInterval(100), expose remaining and isExpired)
- [x] T023 [P] [US3] Create Timer component in src/components/shared/Timer.tsx (circular or bar countdown display, uses useTimer hook)
- [x] T024 [P] [US3] Create ScoreBoard component in src/components/shared/ScoreBoard.tsx (Team 1 score vs Team 2 score, highlight active team)
- [x] T025 [US3] Create GameplayScreen component in src/components/screens/GameplayScreen.tsx (active player view: current word display, "Got it" button, "Skip" button, timer, words guessed this turn count)
- [x] T026 [US3] Create SpectatorScreen component in src/components/screens/SpectatorScreen.tsx (timer, active player name, round type indicator, words guessed this turn, team scores, recently guessed word flash)
- [x] T027 [US3] Implement "Start Turn" logic: active player taps start, write turnActive: true + turnStartedAt: SERVER_TIMESTAMP + draw random word from bowl where inBowl: true
- [x] T028 [US3] Implement "Got it" logic: mark word inBowl: false, increment team score, increment wordsGuessedThisTurn, write recentGuess for spectators, draw next word (per contracts/game-state.md Got It contract)
- [x] T029 [US3] Implement "Skip" logic (Round 1 only): leave word inBowl, draw different word, increment player skipsUsedRound1, disable skip button when skipsUsedRound1 >= 1
- [x] T030 [US3] Implement turn-end logic: when timer expires or bowl empties mid-turn, write turnActive: false, clear currentWordId (word was never removed from bowl), advance to next player in turn order
- [x] T031 [US3] Implement round-end logic: when no words have inBowl: true, reset all words to inBowl: true, increment round, update roundType, reset turn cycle tracking
- [x] T032 [US3] Wire screen routing in App.tsx: if turnActive and current player is active → GameplayScreen, else → SpectatorScreen; show "Start Turn" prompt for next player between turns

**Checkpoint**: Full Round 1 is playable end-to-end. This is the MVP — the core game works.

---

## Phase 6: User Story 4 — Round 2: Charades (Priority: P2)

**Goal**: Same gameplay flow as Round 1 but with charades rules (act it out, no talking, no skipping)

**Independent Test**: After Round 1 empties the bowl, Round 2 starts with refilled bowl, UI shows "Charades" instructions, skip button is gone

### Implementation for User Story 4

- [x] T033 [US4] Update GameplayScreen to show round-specific instructions ("Charades — act it out, no talking!" for round 2) based on roundType from game state
- [x] T034 [US4] Update GameplayScreen to conditionally hide/disable skip button when round > 1 (Rounds 2 and 3: no skipping)
- [x] T035 [US4] Verify round transition from Round 1 → Round 2 correctly resets bowl and updates roundType to "charades"

**Checkpoint**: Round 2 is playable with charades rules. Skip is disabled. Bowl refills correctly.

---

## Phase 7: User Story 5 — Round 3: One-Word Clue (Priority: P2)

**Goal**: Same flow with one-word clue rules (say only ONE word, no skipping)

**Independent Test**: After Round 2, Round 3 starts with "One-Word Clue" instructions, game ends when bowl empties

### Implementation for User Story 5

- [x] T036 [US5] Update GameplayScreen to show "One-Word Clue — say only ONE word!" instruction when roundType is "oneword"
- [x] T037 [US5] Implement game-end detection: when bowl empties in round 3, write phase: "finished" instead of advancing to round 4

**Checkpoint**: All 3 rounds work. Game reaches "finished" state after Round 3.

---

## Phase 8: User Story 6 — End Game and Rematch (Priority: P2)

**Goal**: Show final scores, declare winner, enable "Play Again" with team reshuffle

**Independent Test**: After Round 3, results screen shows both scores, winner highlighted, "Play Again" resets game with reshuffled teams

### Implementation for User Story 6

- [x] T038 [P] [US6] Create ResultsScreen component in src/components/screens/ResultsScreen.tsx (Team 1 vs Team 2 final scores, winner announcement or tie, "Play Again" button for host)
- [x] T039 [US6] Implement "Play Again" logic: reset scores to 0, reset all bowl words to inBowl: true, clear player team assignments, reset player submittedWords and skipsUsedRound1, set phase: "lobby", clear turn and turnOrder (per contracts/game-state.md Play Again contract)
- [x] T040 [US6] Wire ResultsScreen in App.tsx: show when phase is "finished"

**Checkpoint**: Complete game loop — play, finish, rematch. All user stories functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T041 [P] Add loading states for all Firebase listeners (show spinner or skeleton while initial data loads)
- [x] T042 [P] Add error handling for Firebase operations (network errors, permission denied) with user-friendly toast/banner messages
- [x] T043 [P] Add reconnection handling: detect player disconnect/reconnect, restore game state from localStorage playerId + room code
- [x] T044 [P] Mobile UX polish: ensure all tap targets are at least 44px, test on 320px width, add viewport meta tag, prevent zoom on input focus
- [ ] T045 [P] Add visual feedback for "Got it" and "Skip" actions (brief animation or color flash)
- [ ] T046 [P] Add round transition screens (brief interstitial: "Round 2: Charades!" for 3 seconds before play resumes)
- [ ] T047 Run quickstart.md validation: follow setup steps on a clean environment, verify full game flow works end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on User Story 1 (needs players in lobby)
- **User Story 3 (Phase 5)**: Depends on User Story 2 (needs teams and turn order) — **MVP complete after this phase**
- **User Story 4 (Phase 6)**: Depends on User Story 3 (extends gameplay screen)
- **User Story 5 (Phase 7)**: Depends on User Story 4 (extends round logic)
- **User Story 6 (Phase 8)**: Depends on User Story 5 (game must reach "finished")
- **Polish (Phase 9)**: Can begin after Phase 5 (MVP) for early stories; full polish after Phase 8

### Within Each User Story

- Models/types before hooks
- Hooks before components
- Shared components before screen components
- Firebase write logic before UI that triggers it
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004, T005, T006 can all run in parallel (Setup phase)
- T012, T013 can run in parallel (US1: independent components)
- T022, T023, T024 can run in parallel (US3: independent components)
- T038 can run in parallel with other US6 tasks (independent component)
- All T041–T046 can run in parallel (Polish: independent concerns)

---

## Parallel Example: User Story 3 (Core Gameplay)

```bash
# Launch independent components together (T022, T023, T024):
Task: "Implement useTimer hook in src/hooks/useTimer.ts"
Task: "Create Timer component in src/components/shared/Timer.tsx"
Task: "Create ScoreBoard component in src/components/shared/ScoreBoard.tsx"

# Then build screens (depend on shared components) (T025, T026):
Task: "Create GameplayScreen in src/components/screens/GameplayScreen.tsx"
Task: "Create SpectatorScreen in src/components/screens/SpectatorScreen.tsx"

# Then wire up game logic (depends on screens) (T027-T032):
Task: "Implement Start Turn logic"
Task: "Implement Got it logic"
Task: "Implement Skip logic"
Task: "Implement turn-end logic"
Task: "Implement round-end logic"
Task: "Wire screen routing"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: Word Submission (US1)
4. Complete Phase 4: Team Setup (US2)
5. Complete Phase 5: Round 1 Catch-Phrase (US3)
6. **STOP and VALIDATE**: Play a full Round 1 game with real phones
7. Deploy to Vercel for remote playtesting

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 + US3 → Test full Round 1 → Deploy (MVP!)
3. Add US4 (Charades) → Test Round 1+2 → Deploy
4. Add US5 (One-Word) → Test all 3 rounds → Deploy
5. Add US6 (Results + Rematch) → Test full game loop → Deploy
6. Polish phase → Final testing → Ship

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

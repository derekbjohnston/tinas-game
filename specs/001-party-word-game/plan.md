# Implementation Plan: Tina's Stupid Game — Party Word Game

**Branch**: `001-party-word-game` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-party-word-game/spec.md`

## Summary

Build a mobile-first multiplayer party word-guessing game ("Tina's Stupid Game") where players submit words into a shared bowl, form two teams, then play three rounds — catch-phrase, charades, and one-word clue — with 30-second timed turns. Players connect via room codes on their phones. Real-time state synchronization powered by Firebase Realtime Database with no backend server.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Firebase Realtime Database SDK, Vite
**Storage**: Firebase Realtime Database (JSON tree at `/rooms/{roomCode}`)
**Testing**: Vitest + React Testing Library
**Target Platform**: Mobile web browsers (Chrome, Firefox, Safari, Edge) — responsive, phone-first
**Project Type**: Single-page web application (client-side only)
**Performance Goals**: 60 fps UI, <300ms interaction response, <1s timer sync drift
**Constraints**: No backend server; free-tier Firebase (100 concurrent connections); <50KB JS bundle for core game
**Scale/Scope**: 6–10 players per room, 30–50 words per bowl, ~6 screens (home, lobby, teams, gameplay, spectator, results)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Fun First | PASS | All tech decisions serve gameplay. Firebase chosen for instant sync (feels snappy), not for technical elegance. Timer sync ensures fair play. |
| II. Simplicity | PASS | No backend server. React state + Firebase listeners — no Redux/Zustand. Vite for fast builds. 4-char room codes. Minimal dependencies. |
| III. Player Experience | PASS | <300ms interaction response. Synchronized timer across devices. Word reveal on guess keeps spectators engaged. Mobile-first responsive design. |
| IV. Iterative Playtest | PASS | Vite HMR enables instant iteration. Game is playable after US1+US2+US3 (P1 stories). Each story produces a testable increment. |
| **Backend exception** | JUSTIFIED | Constitution says "no backend unless feature demands it." Multi-device real-time sync demands a shared data layer. Firebase RTDB is serverless (no backend code) — only a hosted database. No server to write, deploy, or maintain. |

**Post-Phase 1 re-check**: All gates still pass. Data model is a flat JSON tree (simple). Contracts use Firebase multi-path updates (atomic, no complex transactions). No unnecessary abstractions introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-party-word-game/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: Firebase data structure
├── quickstart.md        # Phase 1: setup and play guide
├── contracts/
│   └── game-state.md    # Phase 1: Firebase read/write contract
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Create/join game
│   │   ├── LobbyScreen.tsx         # Word submission + waiting
│   │   ├── TeamsScreen.tsx         # Team selection
│   │   ├── GameplayScreen.tsx      # Active player view (word + controls)
│   │   ├── SpectatorScreen.tsx     # Non-active player view (timer + scores)
│   │   └── ResultsScreen.tsx       # Final scores + play again
│   └── shared/
│       ├── Timer.tsx               # Countdown display
│       ├── ScoreBoard.tsx          # Team scores
│       └── WordInput.tsx           # Word/saying entry field
├── hooks/
│   ├── useFirebase.ts              # Firebase init + context
│   ├── useRoom.ts                  # Room CRUD + listeners
│   ├── useGameState.ts             # Game phase, round, turn state
│   └── useTimer.ts                 # Server-synced countdown logic
├── lib/
│   ├── firebase.ts                 # Firebase app initialization
│   ├── roomCode.ts                 # Room code generation + validation
│   └── turnOrder.ts                # Random turn order logic
├── types/
│   └── game.ts                     # TypeScript interfaces for all entities
├── App.tsx                         # Router / screen switcher based on game phase
├── main.tsx                        # Entry point
└── index.css                       # Global styles (mobile-first)

public/
└── index.html
```

**Structure Decision**: Single project (Option 1 adapted for React). No backend directory — Firebase is the entire data layer. Component structure follows screens (one per game phase) with shared UI components extracted only when reused across 2+ screens.

## Complexity Tracking

No constitution violations requiring justification. All choices align with principles.

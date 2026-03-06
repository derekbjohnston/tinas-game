# Research: Tina's Stupid Game — Party Word Game

**Date**: 2026-03-05
**Branch**: `001-party-word-game`

## Decision 1: Real-Time Synchronization Technology

**Decision**: Firebase Realtime Database (client-side SDK only, no backend server)

**Rationale**:
- Zero server code or server deployment — aligns with the constitution's simplicity principle
- Built-in `.info/serverTimeOffset` provides sub-100ms client-server clock sync, solving timer synchronization without custom NTP logic
- JSON tree data model maps directly to game state (`/rooms/{code}/bowl`, `/rooms/{code}/scores`, etc.)
- `onDisconnect()` handlers provide automatic cleanup for disconnected players
- Free tier supports 100 simultaneous connections — far more than needed for a party game (6-10 players)
- Mature React + TypeScript ecosystem with proper types and community hooks

**Alternatives considered**:
- **PartyKit (Cloudflare)**: Best-in-class room model and authoritative server timer, but requires writing and deploying server code. Would be the choice if we need server-side game logic validation later.
- **Supabase Realtime**: Good product but Postgres-centric model adds conceptual weight. No built-in clock offset mechanism for timer sync.
- **Socket.io + Node.js**: Full control but highest operational burden. Cold starts on free hosting tiers ruin UX for a party game.
- **Liveblocks**: Clean room/presence API with CRDT sync, but no built-in server clock mechanism for timer sync. Free tier MAU limits could be hit if game is shared.
- **Firestore**: Same Firebase ecosystem but higher latency (200-500ms vs 50-200ms for RTDB), no built-in time offset, and document-level granularity is worse for frequent small updates.

## Decision 2: Build Tooling

**Decision**: Vite with React + TypeScript template

**Rationale**:
- Fast dev server with HMR — supports the iterative playtest principle (instant feedback)
- First-class TypeScript support out of the box
- Lightweight output for mobile (smaller bundles than CRA)
- Constitution lists "Vite or Create React App" — Vite is the modern standard

**Alternatives considered**:
- **Create React App**: Still works but slower dev server, larger bundles, and effectively in maintenance mode.

## Decision 3: Hosting / Deployment

**Decision**: Vercel (free tier) for the React app, Firebase project for the database

**Rationale**:
- Vercel deploys from git push with zero config for Vite/React apps
- Free tier is generous (100 GB bandwidth/month)
- Two services but both are zero-ops: no servers to manage, no containers to build
- Firebase project is created once via console; no ongoing maintenance

**Alternatives considered**:
- **Firebase Hosting**: Would consolidate to one platform but Vercel's DX and preview deployments are better for iterative development.
- **Netlify**: Equivalent to Vercel; either works fine.

## Decision 4: State Management

**Decision**: React Context + Firebase listeners (no additional state library)

**Rationale**:
- Game state lives in Firebase — it IS the state management layer
- React Context provides the Firebase instance and auth state to components
- Local UI state (animations, modals) uses `useState`/`useReducer`
- Adding Redux/Zustand/Jotai would violate the simplicity principle — Firebase already handles shared state sync

**Alternatives considered**:
- **Zustand**: Clean API but redundant when Firebase is the source of truth.
- **Redux Toolkit**: Overkill for a party game with Firebase handling the shared state.

## Decision 5: Room Code Generation

**Decision**: 4-character uppercase alphabetic code generated client-side, checked for uniqueness against Firebase

**Rationale**:
- 26^4 = 456,976 possible codes — more than enough for concurrent party games
- Alphabetic only (no 0/O/1/I confusion) — easy to read aloud in a noisy room
- Client generates a candidate, checks `/rooms/{code}` exists in Firebase, retries if taken
- Simple, no server-side code needed

## Decision 6: Timer Architecture

**Decision**: Server-timestamp-based calculation, not countdown broadcasting

**Rationale**:
- When a turn starts, write `turnStartedAt: ServerValue.TIMESTAMP` to Firebase
- Each client computes `remaining = 30 - ((Date.now() + serverTimeOffset) - turnStartedAt) / 1000`
- Local `requestAnimationFrame` or `setInterval(100ms)` drives the display
- No need to broadcast tick events — each client independently calculates from the same authoritative timestamp
- Firebase's `.info/serverTimeOffset` ensures sub-100ms accuracy across devices
- When `remaining <= 0`, any client (typically the active player's) writes the turn-end event

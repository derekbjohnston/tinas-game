import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const MOCK_PLAYER_ID = 'test-player-123';
vi.mock('./useRoom', () => ({
  playerId: 'test-player-123',
}));

import { useGameState } from './useGameState';
import type { Room, Turn } from '../types/game';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    createdAt: Date.now(),
    hostId: MOCK_PLAYER_ID,
    phase: 'lobby',
    round: 1,
    roundType: 'catchphrase',
    players: {},
    bowl: {},
    scores: { team1: 0, team2: 0 },
    turn: {
      activePlayerId: MOCK_PLAYER_ID,
      activeTeam: 1,
      currentWordId: null,
      turnStartedAt: null,
      wordsGuessedThisTurn: 0,
      turnActive: false,
    },
    turnOrder: {
      currentIndex: 0,
      order: [MOCK_PLAYER_ID],
      playersGoneThisCycle: { team1: [], team2: [] },
    },
    recentGuess: null,
    ...overrides,
  };
}

describe('useGameState', () => {
  it('returns home when no roomCode', () => {
    const { result } = renderHook(() => useGameState(null, null));
    expect(result.current.screen).toBe('home');
  });

  it('returns home when no room', () => {
    const { result } = renderHook(() => useGameState(null, 'ABCD'));
    expect(result.current.screen).toBe('home');
  });

  it('returns lobby for lobby phase', () => {
    const room = makeRoom({ phase: 'lobby' });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('lobby');
  });

  it('returns teams for teams phase', () => {
    const room = makeRoom({ phase: 'teams' });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('teams');
  });

  it('returns results for finished phase', () => {
    const room = makeRoom({ phase: 'finished' });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('results');
  });

  it('returns start-turn when active player and turn not started', () => {
    const room = makeRoom({
      phase: 'playing',
      turn: {
        activePlayerId: MOCK_PLAYER_ID,
        activeTeam: 1,
        currentWordId: null,
        turnStartedAt: null,
        wordsGuessedThisTurn: 0,
        turnActive: false,
      },
    });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('start-turn');
  });

  it('returns gameplay when active player and turn is active', () => {
    const room = makeRoom({
      phase: 'playing',
      turn: {
        activePlayerId: MOCK_PLAYER_ID,
        activeTeam: 1,
        currentWordId: 'word1',
        turnStartedAt: Date.now(),
        wordsGuessedThisTurn: 0,
        turnActive: true,
      },
    });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('gameplay');
  });

  it('returns waiting-for-turn when not active player and turn not started', () => {
    const room = makeRoom({
      phase: 'playing',
      turn: {
        activePlayerId: 'other-player',
        activeTeam: 2,
        currentWordId: null,
        turnStartedAt: null,
        wordsGuessedThisTurn: 0,
        turnActive: false,
      },
    });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('waiting-for-turn');
  });

  it('returns spectator when not active player and turn is active', () => {
    const room = makeRoom({
      phase: 'playing',
      turn: {
        activePlayerId: 'other-player',
        activeTeam: 2,
        currentWordId: 'word1',
        turnStartedAt: Date.now(),
        wordsGuessedThisTurn: 0,
        turnActive: true,
      },
    });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('spectator');
  });

  it('correctly identifies host', () => {
    const room = makeRoom({ hostId: MOCK_PLAYER_ID });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.isHost).toBe(true);
  });

  it('correctly identifies non-host', () => {
    const room = makeRoom({ hostId: 'someone-else' });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.isHost).toBe(false);
  });

  it('returns currentPlayer when player exists', () => {
    const room = makeRoom({
      players: {
        [MOCK_PLAYER_ID]: {
          name: 'Tina',
          team: 1,
          connected: true,
          submittedWords: true,
          skipsUsedRound1: 0,
        },
      },
    });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.currentPlayer?.name).toBe('Tina');
  });

  it('returns null currentPlayer when player not in room', () => {
    const room = makeRoom({ players: {} });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.currentPlayer).toBeNull();
  });

  it('falls back to lobby for playing phase without turn', () => {
    const room = makeRoom({ phase: 'playing', turn: undefined as unknown as Turn });
    const { result } = renderHook(() => useGameState(room, 'ABCD'));
    expect(result.current.screen).toBe('lobby');
  });
});

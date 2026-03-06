import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock hooks
vi.mock('../../hooks/useTimer', () => ({
  useTimer: () => ({ remaining: 20, fraction: 0.67, isExpired: false }),
}));
vi.mock('../../hooks/useFirebase', () => ({
  useServerTimeOffset: () => 0,
  getServerTime: (offset: number) => Date.now() + offset,
}));

import { SpectatorScreen } from './SpectatorScreen';
import type { Room } from '../../types/game';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    createdAt: Date.now(),
    hostId: 'host1',
    phase: 'playing',
    round: 1,
    roundType: 'catchphrase',
    players: {
      p1: { name: 'Alice', team: 1, connected: true, submittedWords: true, skipsUsedRound1: 0 },
      p2: { name: 'Bob', team: 2, connected: true, submittedWords: true, skipsUsedRound1: 0 },
    },
    bowl: {},
    scores: { team1: 10, team2: 8 },
    turn: {
      activePlayerId: 'p1',
      activeTeam: 1,
      currentWordId: 'w1',
      turnStartedAt: Date.now(),
      wordsGuessedThisTurn: 5,
      turnActive: true,
    },
    turnOrder: {
      currentIndex: 0,
      order: ['p1', 'p2'],
      playersGoneThisCycle: { team1: [], team2: [] },
    },
    recentGuess: null,
    ...overrides,
  };
}

describe('SpectatorScreen', () => {
  it('shows recently guessed word prominently when a word was just guessed', () => {
    const room = makeRoom({
      recentGuess: {
        wordText: 'elephant',
        guessedAt: Date.now(),
        team: 1,
      },
    });

    render(<SpectatorScreen room={room} roomCode="ABCD" />);

    const wordElement = screen.getByText('elephant');
    expect(wordElement).toBeVisible();
  });

  it('shows word count when no recent guess', () => {
    const room = makeRoom({ recentGuess: null });

    render(<SpectatorScreen room={room} roomCode="ABCD" />);

    expect(screen.getByText('words guessed this turn')).toBeVisible();
  });

  it('shows the guessed word as the primary large element instead of just a flash', () => {
    const room = makeRoom({
      recentGuess: {
        wordText: 'banana',
        guessedAt: Date.now(),
        team: 1,
      },
    });

    const { container } = render(<SpectatorScreen room={room} roomCode="ABCD" />);

    // The guessed word should be in a large-font element (the primary display)
    const bananaEl = screen.getByText('banana');
    expect(bananaEl).toBeVisible();

    // It should have large styling (2.5rem or bigger) — the main display area
    const largeEl = container.querySelector('[style*="font-size: 2.5rem"]') ||
                    container.querySelector('[style*="font-size: 2rem"]');
    expect(largeEl).not.toBeNull();
    expect(largeEl!.textContent).toContain('banana');
  });
});

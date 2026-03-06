import { describe, it, expect } from 'vitest';
import { deduplicateWords, drawRandomWord, buildMarkGotItUpdates, buildBowlEmptyUpdates, buildPlayAgainUpdates } from './gameLogic';
import type { Room, BowlWord, Turn } from '../types/game';

function makeBowl(words: Record<string, { text: string; inBowl: boolean }>): Record<string, BowlWord> {
  const bowl: Record<string, BowlWord> = {};
  for (const [id, { text, inBowl }] of Object.entries(words)) {
    bowl[id] = { text, submittedBy: 'player1', inBowl };
  }
  return bowl;
}

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
    bowl: makeBowl({
      w1: { text: 'cat', inBowl: true },
      w2: { text: 'dog', inBowl: true },
      w3: { text: 'fish', inBowl: false },
    }),
    scores: { team1: 3, team2: 2 },
    turn: {
      activePlayerId: 'p1',
      activeTeam: 1,
      currentWordId: 'w1',
      turnStartedAt: Date.now(),
      wordsGuessedThisTurn: 1,
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

describe('deduplicateWords', () => {
  it('removes duplicates within the submission (case-insensitive)', () => {
    const result = deduplicateWords(['Cat', 'cat', 'DOG', 'dog'], null);
    expect(result).toEqual(['Cat', 'DOG']);
  });

  it('removes words that already exist in the bowl (case-insensitive)', () => {
    const bowl = makeBowl({
      w1: { text: 'elephant', inBowl: true },
      w2: { text: 'Tiger', inBowl: true },
    });
    const result = deduplicateWords(['Elephant', 'banana', 'tiger'], bowl);
    expect(result).toEqual(['banana']);
  });

  it('returns all words when there are no duplicates', () => {
    const result = deduplicateWords(['cat', 'dog', 'fish'], null);
    expect(result).toEqual(['cat', 'dog', 'fish']);
  });

  it('handles empty input', () => {
    expect(deduplicateWords([], null)).toEqual([]);
  });

  it('handles empty bowl', () => {
    const result = deduplicateWords(['cat'], {});
    expect(result).toEqual(['cat']);
  });

  it('trims whitespace before comparing', () => {
    const result = deduplicateWords(['  cat  ', 'cat'], null);
    expect(result).toEqual(['cat']);
  });

  it('filters out empty/whitespace-only entries', () => {
    const result = deduplicateWords(['cat', '', '  ', 'dog'], null);
    expect(result).toEqual(['cat', 'dog']);
  });
});

describe('drawRandomWord', () => {
  it('returns a word id that is in the bowl', () => {
    const bowl = makeBowl({
      w1: { text: 'cat', inBowl: true },
      w2: { text: 'dog', inBowl: false },
    });
    const result = drawRandomWord(bowl);
    expect(result).toBe('w1');
  });

  it('returns null when no words are in the bowl', () => {
    const bowl = makeBowl({
      w1: { text: 'cat', inBowl: false },
    });
    expect(drawRandomWord(bowl)).toBeNull();
  });

  it('returns null for empty bowl', () => {
    expect(drawRandomWord({})).toBeNull();
  });

  it('excludes the specified word id', () => {
    const bowl = makeBowl({
      w1: { text: 'cat', inBowl: true },
      w2: { text: 'dog', inBowl: true },
    });
    // Run multiple times to ensure w1 is never returned
    for (let i = 0; i < 20; i++) {
      expect(drawRandomWord(bowl, 'w1')).toBe('w2');
    }
  });

  it('returns null when excluded word is the only one in bowl', () => {
    const bowl = makeBowl({
      w1: { text: 'cat', inBowl: true },
    });
    expect(drawRandomWord(bowl, 'w1')).toBeNull();
  });

  it('picks from multiple available words', () => {
    const bowl = makeBowl({
      w1: { text: 'cat', inBowl: true },
      w2: { text: 'dog', inBowl: true },
      w3: { text: 'fish', inBowl: true },
    });
    const result = drawRandomWord(bowl);
    expect(['w1', 'w2', 'w3']).toContain(result);
  });
});

describe('buildMarkGotItUpdates', () => {
  it('returns null when currentWordId is null', () => {
    const room = makeRoom();
    const turn = { ...room.turn, currentWordId: null };
    expect(buildMarkGotItUpdates('ABCD', turn, room.bowl, room.scores)).toBeNull();
  });

  it('marks the current word as not in bowl', () => {
    const room = makeRoom();
    const result = buildMarkGotItUpdates('ABCD', room.turn, room.bowl, room.scores);
    expect(result).not.toBeNull();
    expect(result!.updates['rooms/ABCD/bowl/w1/inBowl']).toBe(false);
  });

  it('increments the correct team score', () => {
    const room = makeRoom();
    const result = buildMarkGotItUpdates('ABCD', room.turn, room.bowl, room.scores)!;
    // Team 1 had 3, should become 4
    expect(result.updates['rooms/ABCD/scores/team1']).toBe(4);
  });

  it('increments team2 score when team2 is active', () => {
    const room = makeRoom({
      turn: {
        activePlayerId: 'p2',
        activeTeam: 2,
        currentWordId: 'w1',
        turnStartedAt: Date.now(),
        wordsGuessedThisTurn: 0,
        turnActive: true,
      },
    });
    const result = buildMarkGotItUpdates('ABCD', room.turn, room.bowl, room.scores)!;
    expect(result.updates['rooms/ABCD/scores/team2']).toBe(3);
  });

  it('increments wordsGuessedThisTurn', () => {
    const room = makeRoom();
    const result = buildMarkGotItUpdates('ABCD', room.turn, room.bowl, room.scores)!;
    expect(result.updates['rooms/ABCD/turn/wordsGuessedThisTurn']).toBe(2);
  });

  it('sets nextWordId to another available word', () => {
    const room = makeRoom();
    const result = buildMarkGotItUpdates('ABCD', room.turn, room.bowl, room.scores)!;
    // w2 is the only other inBowl word
    expect(result.nextWordId).toBe('w2');
  });

  it('sets nextWordId to null when bowl will be empty', () => {
    const room = makeRoom({
      bowl: makeBowl({
        w1: { text: 'cat', inBowl: true },
        w2: { text: 'dog', inBowl: false },
      }),
    });
    const result = buildMarkGotItUpdates('ABCD', room.turn, room.bowl, room.scores)!;
    expect(result.nextWordId).toBeNull();
  });
});

describe('buildBowlEmptyUpdates', () => {
  it('returns game over when round >= 3', () => {
    const room = makeRoom({ round: 3 });
    const result = buildBowlEmptyUpdates('ABCD', room);
    expect(result.isGameOver).toBe(true);
    expect(result.updates['rooms/ABCD/phase']).toBe('finished');
  });

  it('resets bowl words for next round', () => {
    const room = makeRoom({ round: 1 });
    const result = buildBowlEmptyUpdates('ABCD', room);
    expect(result.isGameOver).toBe(false);
    expect(result.updates['rooms/ABCD/bowl/w1/inBowl']).toBe(true);
    expect(result.updates['rooms/ABCD/bowl/w2/inBowl']).toBe(true);
    expect(result.updates['rooms/ABCD/bowl/w3/inBowl']).toBe(true);
  });

  it('advances to round 2 (charades) from round 1', () => {
    const room = makeRoom({ round: 1 });
    const result = buildBowlEmptyUpdates('ABCD', room);
    expect(result.updates['rooms/ABCD/round']).toBe(2);
    expect(result.updates['rooms/ABCD/roundType']).toBe('charades');
  });

  it('advances to round 3 (oneword) from round 2', () => {
    const room = makeRoom({ round: 2, roundType: 'charades' });
    const result = buildBowlEmptyUpdates('ABCD', room);
    expect(result.isGameOver).toBe(false);
    expect(result.updates['rooms/ABCD/round']).toBe(3);
    expect(result.updates['rooms/ABCD/roundType']).toBe('oneword');
  });

  it('full round 2→3 transition: resets bowl and keeps game playing', () => {
    // Simulate end of round 2: all words guessed, bowl is empty
    const room = makeRoom({
      round: 2,
      roundType: 'charades',
      bowl: makeBowl({
        w1: { text: 'cat', inBowl: false },
        w2: { text: 'dog', inBowl: false },
        w3: { text: 'fish', inBowl: false },
      }),
      scores: { team1: 5, team2: 4 },
    });
    const result = buildBowlEmptyUpdates('ABCD', room);

    // Should NOT be game over
    expect(result.isGameOver).toBe(false);

    // Should advance to round 3 with oneword type
    expect(result.updates['rooms/ABCD/round']).toBe(3);
    expect(result.updates['rooms/ABCD/roundType']).toBe('oneword');

    // Should reset all bowl words back to inBowl
    expect(result.updates['rooms/ABCD/bowl/w1/inBowl']).toBe(true);
    expect(result.updates['rooms/ABCD/bowl/w2/inBowl']).toBe(true);
    expect(result.updates['rooms/ABCD/bowl/w3/inBowl']).toBe(true);

    // Should reset turn cycle
    expect(result.updates['rooms/ABCD/turnOrder/playersGoneThisCycle']).toEqual({
      team1: [],
      team2: [],
    });

    // Should NOT set phase to finished
    expect(result.updates['rooms/ABCD/phase']).toBeUndefined();
  });

  it('deactivates turn when bowl empties mid-turn (round transition)', () => {
    const room = makeRoom({
      round: 2,
      roundType: 'charades',
      turn: {
        activePlayerId: 'p1',
        activeTeam: 1,
        currentWordId: 'w1',
        turnStartedAt: Date.now(),
        wordsGuessedThisTurn: 3,
        turnActive: true,
      },
    });
    const result = buildBowlEmptyUpdates('ABCD', room);

    // Turn should be deactivated so next player gets a fresh start
    expect(result.updates['rooms/ABCD/turn/turnActive']).toBe(false);
    expect(result.updates['rooms/ABCD/turn/currentWordId']).toBeNull();
  });

  it('resets turn cycle tracking', () => {
    const room = makeRoom({ round: 1 });
    const result = buildBowlEmptyUpdates('ABCD', room);
    expect(result.updates['rooms/ABCD/turnOrder/playersGoneThisCycle']).toEqual({
      team1: [],
      team2: [],
    });
  });
});

describe('buildPlayAgainUpdates', () => {
  it('resets phase to lobby', () => {
    const room = makeRoom({ phase: 'finished' });
    const updates = buildPlayAgainUpdates('ABCD', room);
    expect(updates['rooms/ABCD/phase']).toBe('lobby');
  });

  it('resets round to 0', () => {
    const room = makeRoom({ round: 3 });
    const updates = buildPlayAgainUpdates('ABCD', room);
    expect(updates['rooms/ABCD/round']).toBe(0);
  });

  it('resets scores to zero', () => {
    const room = makeRoom();
    const updates = buildPlayAgainUpdates('ABCD', room);
    expect(updates['rooms/ABCD/scores']).toEqual({ team1: 0, team2: 0 });
  });

  it('clears turn, turnOrder, recentGuess', () => {
    const room = makeRoom();
    const updates = buildPlayAgainUpdates('ABCD', room);
    expect(updates['rooms/ABCD/turn']).toBeNull();
    expect(updates['rooms/ABCD/turnOrder']).toBeNull();
    expect(updates['rooms/ABCD/recentGuess']).toBeNull();
  });

  it('resets bowl words to inBowl', () => {
    const room = makeRoom();
    const updates = buildPlayAgainUpdates('ABCD', room);
    expect(updates['rooms/ABCD/bowl/w1/inBowl']).toBe(true);
    expect(updates['rooms/ABCD/bowl/w2/inBowl']).toBe(true);
    expect(updates['rooms/ABCD/bowl/w3/inBowl']).toBe(true);
  });

  it('resets player states', () => {
    const room = makeRoom();
    const updates = buildPlayAgainUpdates('ABCD', room);
    expect(updates['rooms/ABCD/players/p1/team']).toBeNull();
    expect(updates['rooms/ABCD/players/p1/submittedWords']).toBe(false);
    expect(updates['rooms/ABCD/players/p1/skipsUsedRound1']).toBe(0);
    expect(updates['rooms/ABCD/players/p2/team']).toBeNull();
  });

  it('handles room with no bowl', () => {
    const room = makeRoom({ bowl: undefined as unknown as Record<string, BowlWord> });
    const updates = buildPlayAgainUpdates('ABCD', room);
    // Should not throw, just skip bowl reset
    expect(updates['rooms/ABCD/phase']).toBe('lobby');
  });

  it('handles room with no players', () => {
    const room = makeRoom({ players: undefined as unknown as Record<string, any> });
    const updates = buildPlayAgainUpdates('ABCD', room);
    expect(updates['rooms/ABCD/phase']).toBe('lobby');
  });
});

import { describe, it, expect } from 'vitest';
import { generateTurnOrder, getNextPlayerIndex } from './turnOrder';
import type { Player, TurnOrder } from '../types/game';

function makePlayers(teams: Record<string, 1 | 2>): Record<string, Player> {
  const players: Record<string, Player> = {};
  for (const [id, team] of Object.entries(teams)) {
    players[id] = {
      name: `Player ${id}`,
      team,
      connected: true,
      submittedWords: true,
      skipsUsedRound1: 0,
    };
  }
  return players;
}

describe('generateTurnOrder', () => {
  it('includes all players in the order', () => {
    const players = makePlayers({ a: 1, b: 2, c: 1, d: 2 });
    const result = generateTurnOrder(players);
    expect(result.order).toHaveLength(4);
    expect(result.order.sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('interleaves teams (alternating team membership)', () => {
    const players = makePlayers({ a: 1, b: 2, c: 1, d: 2 });
    const result = generateTurnOrder(players);

    // Each consecutive pair should be from different teams
    for (let i = 0; i < result.order.length - 1; i++) {
      const team1 = players[result.order[i]].team;
      const team2 = players[result.order[i + 1]].team;
      expect(team1).not.toBe(team2);
    }
  });

  it('handles unequal team sizes', () => {
    const players = makePlayers({ a: 1, b: 2, c: 1, d: 1 });
    const result = generateTurnOrder(players);
    expect(result.order).toHaveLength(4);
    // All players should be present
    expect(result.order.sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('starts at index 0 with empty gone-this-cycle', () => {
    const players = makePlayers({ a: 1, b: 2 });
    const result = generateTurnOrder(players);
    expect(result.currentIndex).toBe(0);
    expect(result.playersGoneThisCycle).toEqual({ team1: [], team2: [] });
  });

  it('handles single player per team', () => {
    const players = makePlayers({ a: 1, b: 2 });
    const result = generateTurnOrder(players);
    expect(result.order).toHaveLength(2);
  });
});

describe('getNextPlayerIndex', () => {
  it('returns the next player who has not gone this cycle', () => {
    const players = makePlayers({ a: 1, b: 2, c: 1, d: 2 });
    const turnOrder: TurnOrder = {
      currentIndex: 0,
      order: ['a', 'b', 'c', 'd'],
      playersGoneThisCycle: { team1: ['a'], team2: [] },
    };

    const next = getNextPlayerIndex(turnOrder, players);
    // Should skip 'a' (gone) and find 'b' (index 1)
    expect(next).toBe(1);
  });

  it('skips players who have already gone', () => {
    const players = makePlayers({ a: 1, b: 2, c: 1, d: 2 });
    const turnOrder: TurnOrder = {
      currentIndex: 1,
      order: ['a', 'b', 'c', 'd'],
      playersGoneThisCycle: { team1: ['a'], team2: ['b'] },
    };

    const next = getNextPlayerIndex(turnOrder, players);
    // Should find 'c' at index 2
    expect(next).toBe(2);
  });

  it('wraps around the order array', () => {
    const players = makePlayers({ a: 1, b: 2, c: 1, d: 2 });
    const turnOrder: TurnOrder = {
      currentIndex: 3,
      order: ['a', 'b', 'c', 'd'],
      playersGoneThisCycle: { team1: [], team2: ['d'] },
    };

    const next = getNextPlayerIndex(turnOrder, players);
    // Should wrap to 'a' at index 0
    expect(next).toBe(0);
  });

  it('returns next in order when all have gone (cycle reset scenario)', () => {
    const players = makePlayers({ a: 1, b: 2 });
    const turnOrder: TurnOrder = {
      currentIndex: 0,
      order: ['a', 'b'],
      playersGoneThisCycle: { team1: ['a'], team2: ['b'] },
    };

    const next = getNextPlayerIndex(turnOrder, players);
    // All gone → returns next in order
    expect(next).toBe(1);
  });

  it('handles missing player gracefully', () => {
    const players = makePlayers({ a: 1, b: 2 });
    const turnOrder: TurnOrder = {
      currentIndex: 0,
      order: ['a', 'missing', 'b'],
      playersGoneThisCycle: { team1: ['a'], team2: [] },
    };

    const next = getNextPlayerIndex(turnOrder, players);
    // Should skip 'missing' and find 'b'
    expect(next).toBe(2);
  });
});

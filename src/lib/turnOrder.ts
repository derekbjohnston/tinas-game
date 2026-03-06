import type { Player, TurnOrder } from '../types/game';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateTurnOrder(
  players: Record<string, Player>
): TurnOrder {
  const team1 = shuffle(
    Object.entries(players)
      .filter(([, p]) => p.team === 1)
      .map(([id]) => id)
  );
  const team2 = shuffle(
    Object.entries(players)
      .filter(([, p]) => p.team === 2)
      .map(([id]) => id)
  );

  // Interleave: team1[0], team2[0], team1[1], team2[1], ...
  const order: string[] = [];
  const maxLen = Math.max(team1.length, team2.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < team1.length) order.push(team1[i]);
    if (i < team2.length) order.push(team2[i]);
  }

  return {
    currentIndex: 0,
    order,
    playersGoneThisCycle: {
      team1: [],
      team2: [],
    },
  };
}

export function getNextPlayerIndex(
  turnOrder: TurnOrder,
  players: Record<string, Player>
): number {
  const { order, playersGoneThisCycle } = turnOrder;

  // Find next player who hasn't gone yet in this cycle
  for (let i = 0; i < order.length; i++) {
    const idx = (turnOrder.currentIndex + 1 + i) % order.length;
    const pid = order[idx];
    const player = players[pid];
    if (!player) continue;

    const teamKey = player.team === 1 ? 'team1' : 'team2';
    const gone = playersGoneThisCycle[teamKey] ?? [];
    if (!gone.includes(pid)) {
      return idx;
    }
  }

  // All players have gone — just return next in order (cycle will be reset)
  return (turnOrder.currentIndex + 1) % order.length;
}

import { useMemo } from 'react';
import { playerId } from './useRoom';
import type { Room, GamePhase } from '../types/game';

export type Screen =
  | 'home'
  | 'lobby'
  | 'teams'
  | 'waiting-for-turn'
  | 'start-turn'
  | 'gameplay'
  | 'spectator'
  | 'results';

export function useGameState(room: Room | null, roomCode: string | null) {
  const screen: Screen = useMemo(() => {
    if (!roomCode || !room) return 'home';

    const phase: GamePhase = room.phase;

    if (phase === 'lobby') return 'lobby';
    if (phase === 'teams') return 'teams';
    if (phase === 'finished') return 'results';

    if (phase === 'playing' && room.turn) {
      const isActivePlayer = room.turn.activePlayerId === playerId;

      if (isActivePlayer) {
        if (room.turn.turnActive) return 'gameplay';
        return 'start-turn';
      }

      if (!room.turn.turnActive) return 'waiting-for-turn';
      return 'spectator';
    }

    return 'lobby';
  }, [room, roomCode]);

  const isHost = room?.hostId === playerId;
  const currentPlayer = room?.players?.[playerId] ?? null;

  return { screen, isHost, currentPlayer, playerId };
}

import type { BowlWord, Room, RoundType } from '../types/game';

export function drawRandomWord(bowl: Record<string, BowlWord>, excludeId?: string): string | null {
  const available = Object.entries(bowl).filter(
    ([id, w]) => w.inBowl && id !== excludeId
  );
  if (available.length === 0) return null;
  const [id] = available[Math.floor(Math.random() * available.length)];
  return id;
}

export function buildMarkGotItUpdates(
  roomCode: string,
  turn: Room['turn'],
  bowl: Room['bowl'],
  scores: Room['scores']
): { updates: Record<string, unknown>; nextWordId: string | null } | null {
  if (!turn.currentWordId || !bowl) return null;

  const teamKey = turn.activeTeam === 1 ? 'team1' : 'team2';
  const nextWordId = drawRandomWord(bowl, turn.currentWordId);
  const wordText = bowl[turn.currentWordId]?.text ?? '';

  const updates: Record<string, unknown> = {
    [`rooms/${roomCode}/bowl/${turn.currentWordId}/inBowl`]: false,
    [`rooms/${roomCode}/scores/${teamKey}`]: (scores[teamKey] ?? 0) + 1,
    [`rooms/${roomCode}/turn/wordsGuessedThisTurn`]: (turn.wordsGuessedThisTurn ?? 0) + 1,
    [`rooms/${roomCode}/turn/currentWordId`]: nextWordId,
  };

  return { updates, nextWordId };
}

export function buildBowlEmptyUpdates(
  roomCode: string,
  room: Room
): { updates: Record<string, unknown>; isGameOver: boolean } {
  const { round, bowl } = room;

  if (round >= 3) {
    return { updates: { [`rooms/${roomCode}/phase`]: 'finished' }, isGameOver: true };
  }

  const updates: Record<string, unknown> = {};
  if (bowl) {
    for (const wordId of Object.keys(bowl)) {
      updates[`rooms/${roomCode}/bowl/${wordId}/inBowl`] = true;
    }
  }

  const nextRound = round + 1;
  const roundTypes: Record<number, RoundType> = {
    2: 'charades',
    3: 'oneword',
  };

  updates[`rooms/${roomCode}/round`] = nextRound;
  updates[`rooms/${roomCode}/roundType`] = roundTypes[nextRound] ?? 'catchphrase';

  // Deactivate turn so the next player gets a fresh start-turn screen
  updates[`rooms/${roomCode}/turn/turnActive`] = false;
  updates[`rooms/${roomCode}/turn/currentWordId`] = null;

  if (room.turnOrder) {
    updates[`rooms/${roomCode}/turnOrder/playersGoneThisCycle`] = {
      team1: [],
      team2: [],
    };
  }

  return { updates, isGameOver: false };
}

export function buildPlayAgainUpdates(
  roomCode: string,
  room: Room
): Record<string, unknown> {
  const updates: Record<string, unknown> = {
    [`rooms/${roomCode}/phase`]: 'lobby',
    [`rooms/${roomCode}/round`]: 0,
    [`rooms/${roomCode}/scores`]: { team1: 0, team2: 0 },
    [`rooms/${roomCode}/turn`]: null,
    [`rooms/${roomCode}/turnOrder`]: null,
    [`rooms/${roomCode}/recentGuess`]: null,
  };

  if (room.bowl) {
    for (const wordId of Object.keys(room.bowl)) {
      updates[`rooms/${roomCode}/bowl/${wordId}/inBowl`] = true;
    }
  }

  if (room.players) {
    for (const pid of Object.keys(room.players)) {
      updates[`rooms/${roomCode}/players/${pid}/team`] = null;
      updates[`rooms/${roomCode}/players/${pid}/submittedWords`] = false;
      updates[`rooms/${roomCode}/players/${pid}/skipsUsedRound1`] = 0;
    }
  }

  return updates;
}

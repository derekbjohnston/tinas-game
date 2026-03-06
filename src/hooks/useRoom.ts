import { useEffect, useState } from 'react';
import {
  ref,
  set,
  update,
  push,
  onValue,
  onDisconnect,
  serverTimestamp,
  get,
} from 'firebase/database';
import { db } from '../lib/firebase';
import { createUniqueRoomCode } from '../lib/roomCode';
import { generateTurnOrder, getNextPlayerIndex } from '../lib/turnOrder';
import { drawRandomWord, deduplicateWords, buildBowlEmptyUpdates, buildPlayAgainUpdates } from '../lib/gameLogic';
import type { Room, Player, BowlWord } from '../types/game';

function getPlayerId(): string {
  let id = localStorage.getItem('playerId');
  if (!id) {
    id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b, i) => ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0'))
          .join('');
    localStorage.setItem('playerId', id);
  }
  return id;
}

export const playerId = getPlayerId();

export function useRoom(roomCode: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loadedCode, setLoadedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      setLoadedCode(null);
      return;
    }

    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snap) => {
      setRoom(snap.val() as Room | null);
      setLoadedCode(roomCode);
    });

    return unsub;
  }, [roomCode]);

  const loading = roomCode !== null && loadedCode !== roomCode;
  return { room, loading };
}

export async function createRoom(playerName: string): Promise<string> {
  const code = await createUniqueRoomCode();
  const roomRef = ref(db, `rooms/${code}`);

  await set(roomRef, {
    createdAt: serverTimestamp(),
    hostId: playerId,
    phase: 'lobby',
    round: 0,
    roundType: 'catchphrase',
    scores: { team1: 0, team2: 0 },
  });

  await joinRoom(code, playerName);
  return code;
}

export async function joinRoom(code: string, playerName: string): Promise<void> {
  const playerRef = ref(db, `rooms/${code}/players/${playerId}`);

  const snap = await get(ref(db, `rooms/${code}`));
  if (!snap.exists()) {
    throw new Error('Room not found');
  }

  const player: Player = {
    name: playerName,
    team: null,
    connected: true,
    submittedWords: false,
    skipsUsedRound1: 0,
  };

  await set(playerRef, player);

  const connRef = ref(db, `rooms/${code}/players/${playerId}/connected`);
  onDisconnect(connRef).set(false);
}

export async function submitWords(
  roomCode: string,
  words: string[]
): Promise<void> {
  const bowlSnap = await get(ref(db, `rooms/${roomCode}/bowl`));
  const existingBowl = bowlSnap.val() as Record<string, BowlWord> | null;
  const unique = deduplicateWords(words, existingBowl);

  const updates: Record<string, BowlWord | boolean> = {};

  for (const text of unique) {
    const wordId = push(ref(db, `rooms/${roomCode}/bowl`)).key!;
    updates[`rooms/${roomCode}/bowl/${wordId}`] = {
      text,
      submittedBy: playerId,
      inBowl: true,
    };
  }

  updates[`rooms/${roomCode}/players/${playerId}/submittedWords`] = true;
  await update(ref(db), updates);
}

export async function selectTeam(
  roomCode: string,
  team: 1 | 2
): Promise<void> {
  await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { team });
}

export async function advanceToTeams(roomCode: string): Promise<void> {
  await update(ref(db, `rooms/${roomCode}`), { phase: 'teams' });
}

export async function startGame(
  roomCode: string,
  players: Record<string, Player>
): Promise<void> {
  const turnOrder = generateTurnOrder(players);
  const firstPlayerId = turnOrder.order[0];
  const firstPlayerTeam = players[firstPlayerId]?.team ?? 1;

  await update(ref(db, `rooms/${roomCode}`), {
    phase: 'playing',
    round: 1,
    roundType: 'catchphrase',
    turnOrder,
    turn: {
      activePlayerId: firstPlayerId,
      activeTeam: firstPlayerTeam,
      currentWordId: null,
      turnStartedAt: null,
      wordsGuessedThisTurn: 0,
      turnActive: false,
    },
  });
}

// --- Gameplay functions ---

export async function startTurn(
  roomCode: string,
  bowl: Record<string, BowlWord>
): Promise<void> {
  const wordId = drawRandomWord(bowl);
  if (!wordId) return;

  await update(ref(db, `rooms/${roomCode}/turn`), {
    turnActive: true,
    turnStartedAt: serverTimestamp(),
    currentWordId: wordId,
    wordsGuessedThisTurn: 0,
  });
}

export async function markGotIt(
  roomCode: string,
  room: Room
): Promise<void> {
  const { turn, bowl, scores } = room;
  if (!turn.currentWordId || !bowl) return;

  const teamKey = turn.activeTeam === 1 ? 'team1' : 'team2';
  const nextWordId = drawRandomWord(bowl, turn.currentWordId);
  const wordText = bowl[turn.currentWordId]?.text ?? '';

  const updates: Record<string, unknown> = {
    [`rooms/${roomCode}/bowl/${turn.currentWordId}/inBowl`]: false,
    [`rooms/${roomCode}/scores/${teamKey}`]: (scores[teamKey] ?? 0) + 1,
    [`rooms/${roomCode}/turn/wordsGuessedThisTurn`]: (turn.wordsGuessedThisTurn ?? 0) + 1,
    [`rooms/${roomCode}/turn/currentWordId`]: nextWordId,
    [`rooms/${roomCode}/recentGuess`]: {
      wordText,
      guessedAt: serverTimestamp(),
      team: turn.activeTeam,
    },
  };

  await update(ref(db), updates);

  // Check if bowl is now empty
  if (!nextWordId) {
    await handleBowlEmpty(roomCode, room);
  }
}

export async function skipWord(
  roomCode: string,
  room: Room
): Promise<void> {
  const { turn, bowl } = room;
  if (!turn.currentWordId || !bowl) return;

  const nextWordId = drawRandomWord(bowl, turn.currentWordId);

  const updates: Record<string, unknown> = {
    [`rooms/${roomCode}/turn/currentWordId`]: nextWordId ?? turn.currentWordId,
    [`rooms/${roomCode}/players/${playerId}/skipsUsedRound1`]: 1,
  };

  await update(ref(db), updates);
}

export async function endTurn(
  roomCode: string,
  room: Room
): Promise<void> {
  const { turnOrder, players } = room;
  if (!turnOrder || !players) return;

  // Mark current player as gone
  const currentPid = turnOrder.order[turnOrder.currentIndex];
  const currentTeam = players[currentPid]?.team;
  const teamKey = currentTeam === 1 ? 'team1' : 'team2';
  const gone = turnOrder.playersGoneThisCycle?.[teamKey] ?? [];

  const updatedGone = { ...turnOrder.playersGoneThisCycle };
  updatedGone[teamKey] = [...gone, currentPid];

  // Check if all players on both teams have gone — if so, reset cycle
  const team1Players = Object.entries(players).filter(([, p]) => p.team === 1).map(([id]) => id);
  const team2Players = Object.entries(players).filter(([, p]) => p.team === 2).map(([id]) => id);

  if (
    updatedGone.team1.length >= team1Players.length &&
    updatedGone.team2.length >= team2Players.length
  ) {
    updatedGone.team1 = [];
    updatedGone.team2 = [];
  }

  const updatedTurnOrder = { ...turnOrder, playersGoneThisCycle: updatedGone };
  const nextIndex = getNextPlayerIndex(updatedTurnOrder, players);
  const nextPid = turnOrder.order[nextIndex];
  const nextTeam = players[nextPid]?.team ?? 1;

  await update(ref(db, `rooms/${roomCode}`), {
    turn: {
      activePlayerId: nextPid,
      activeTeam: nextTeam,
      currentWordId: null,
      turnStartedAt: null,
      wordsGuessedThisTurn: 0,
      turnActive: false,
    },
    turnOrder: {
      ...updatedTurnOrder,
      currentIndex: nextIndex,
    },
  });
}

async function handleBowlEmpty(roomCode: string, room: Room): Promise<void> {
  const { updates, isGameOver } = buildBowlEmptyUpdates(roomCode, room);
  if (isGameOver) {
    await update(ref(db, `rooms/${roomCode}`), { phase: 'finished' });
  } else {
    await update(ref(db), updates);
  }
}

export async function playAgain(
  roomCode: string,
  room: Room
): Promise<void> {
  const updates = buildPlayAgainUpdates(roomCode, room);
  await update(ref(db), updates);
}

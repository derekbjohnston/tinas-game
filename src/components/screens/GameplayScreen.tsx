import { useEffect, useRef } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { startTurn, markGotIt, skipWord, endTurn, playerId } from '../../hooks/useRoom';
import { Timer } from '../shared/Timer';
import { ScoreBoard } from '../shared/ScoreBoard';
import type { Room } from '../../types/game';

interface Props {
  room: Room;
  roomCode: string;
  playerId: string;
  screen: 'start-turn' | 'gameplay';
}

const ROUND_LABELS: Record<string, string> = {
  catchphrase: 'Catch-Phrase — describe it!',
  charades: 'Charades — act it out, no talking!',
  oneword: 'One-Word Clue — say only ONE word!',
};

export function GameplayScreen({ room, roomCode, screen }: Props) {
  const { turn, bowl, scores, round, roundType, players } = room;
  const timer = useTimer(turn?.turnStartedAt ?? null, turn?.turnActive ?? false);
  const endingRef = useRef(false);

  const currentWord = turn?.currentWordId && bowl?.[turn.currentWordId]
    ? bowl[turn.currentWordId].text
    : '';

  const canSkip = round === 1 && (players?.[playerId]?.skipsUsedRound1 ?? 0) < 1;

  // Auto-end turn when timer expires
  useEffect(() => {
    if (timer.isExpired && turn?.turnActive && !endingRef.current) {
      endingRef.current = true;
      endTurn(roomCode, room).finally(() => {
        endingRef.current = false;
      });
    }
  }, [timer.isExpired, turn?.turnActive]);

  if (screen === 'start-turn') {
    return (
      <div className="screen flex-col justify-center items-center gap-16">
        <ScoreBoard scores={scores} activeTeam={turn?.activeTeam} />
        <div className="card text-center" style={{ padding: '24px' }}>
          <p className="text-muted" style={{ margin: '0 0 8px' }}>Round {round}</p>
          <h2>{ROUND_LABELS[roundType] ?? roundType}</h2>
          <p style={{ margin: '16px 0 0', fontSize: '1.1rem' }}>It's your turn!</p>
        </div>
        <button
          className="success"
          style={{ fontSize: '1.25rem', padding: '16px 32px' }}
          onClick={() => startTurn(roomCode, bowl ?? {})}
        >
          Start Turn
        </button>
      </div>
    );
  }

  return (
    <div className="screen flex-col gap-16">
      <div className="flex-row justify-between items-center">
        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
          Round {round} — {ROUND_LABELS[roundType] ?? roundType}
        </span>
        <span className="text-muted" style={{ fontSize: '0.875rem' }}>
          {turn?.wordsGuessedThisTurn ?? 0} guessed
        </span>
      </div>

      <Timer remaining={timer.remaining} fraction={timer.fraction} />

      <ScoreBoard scores={scores} activeTeam={turn?.activeTeam} />

      <div
        className="card text-center"
        style={{
          padding: '32px 16px',
          fontSize: '1.5rem',
          fontWeight: 700,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {currentWord || 'No word available'}
      </div>

      <div className="flex-col gap-12">
        <button
          className="success"
          style={{ fontSize: '1.25rem', padding: '16px' }}
          onClick={() => markGotIt(roomCode, room)}
          disabled={!currentWord}
        >
          Got it!
        </button>

        {round === 1 && (
          <button
            className="secondary"
            onClick={() => skipWord(roomCode, room)}
            disabled={!canSkip || !currentWord}
          >
            {canSkip ? 'Skip' : 'Skip used'}
          </button>
        )}
      </div>
    </div>
  );
}

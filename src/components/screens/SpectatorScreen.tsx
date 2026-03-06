import { useState, useEffect } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { Timer } from '../shared/Timer';
import { ScoreBoard } from '../shared/ScoreBoard';
import type { Room } from '../../types/game';

interface Props {
  room: Room;
  roomCode: string;
}

const ROUND_LABELS: Record<string, string> = {
  catchphrase: 'Catch-Phrase',
  charades: 'Charades',
  oneword: 'One-Word Clue',
};

export function SpectatorScreen({ room }: Props) {
  const { turn, scores, round, roundType, players, recentGuess } = room;
  const timer = useTimer(turn?.turnStartedAt ?? null, turn?.turnActive ?? false);
  const [flashWord, setFlashWord] = useState<string | null>(null);

  const activePlayerName = turn?.activePlayerId && players?.[turn.activePlayerId]
    ? players[turn.activePlayerId].name
    : 'Unknown';

  // Flash recently guessed word
  useEffect(() => {
    if (recentGuess?.wordText) {
      setFlashWord(recentGuess.wordText);
      const timeout = setTimeout(() => setFlashWord(null), 2000);
      return () => clearTimeout(timeout);
    }
  }, [recentGuess?.guessedAt]);

  if (!turn?.turnActive) {
    return (
      <div className="screen flex-col justify-center items-center gap-16">
        <ScoreBoard scores={scores} />
        <div className="card text-center" style={{ padding: '24px' }}>
          <p className="text-muted" style={{ margin: '0 0 4px' }}>Round {round}</p>
          <h2>{ROUND_LABELS[roundType] ?? roundType}</h2>
          <p style={{ margin: '16px 0 0' }}>
            Waiting for <strong>{activePlayerName}</strong> to start their turn...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen flex-col gap-16">
      <div className="text-center">
        <p className="text-muted" style={{ margin: '0 0 4px', fontSize: '0.875rem' }}>
          Round {round} — {ROUND_LABELS[roundType] ?? roundType}
        </p>
        <h2>{activePlayerName} is giving clues!</h2>
      </div>

      <Timer remaining={timer.remaining} fraction={timer.fraction} />

      <ScoreBoard scores={scores} activeTeam={turn.activeTeam} />

      <div className="card text-center flex-col gap-8" style={{ flex: 1, justifyContent: 'center' }}>
        {flashWord ? (
          <>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--color-success)',
                animation: 'fadeIn 0.2s',
              }}
            >
              {flashWord}
            </div>
            <div className="text-muted">
              {turn.wordsGuessedThisTurn ?? 0} guessed this turn
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
              {turn.wordsGuessedThisTurn ?? 0}
            </div>
            <div className="text-muted">words guessed this turn</div>
          </>
        )}
      </div>
    </div>
  );
}

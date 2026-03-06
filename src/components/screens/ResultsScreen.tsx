import { useState } from 'react';
import { playAgain } from '../../hooks/useRoom';
import { ScoreBoard } from '../shared/ScoreBoard';
import type { Room } from '../../types/game';

interface Props {
  room: Room;
  roomCode: string;
  isHost: boolean;
}

export function ResultsScreen({ room, roomCode, isHost }: Props) {
  const [resetting, setResetting] = useState(false);
  const { scores } = room;

  const winner =
    scores.team1 > scores.team2
      ? 'Team 1'
      : scores.team2 > scores.team1
        ? 'Team 2'
        : null;

  async function handlePlayAgain() {
    setResetting(true);
    try {
      await playAgain(roomCode, room);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="screen flex-col justify-center items-center gap-16">
      <h1>Game Over!</h1>

      <ScoreBoard scores={scores} />

      <div
        className="card text-center"
        style={{
          padding: '24px',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: winner === 'Team 1'
            ? 'var(--color-team1)'
            : winner === 'Team 2'
              ? 'var(--color-team2)'
              : 'var(--color-warning)',
        }}
      >
        {winner ? `${winner} wins!` : "It's a tie!"}
      </div>

      {isHost && (
        <button
          className="success"
          onClick={handlePlayAgain}
          disabled={resetting}
          style={{ fontSize: '1.1rem' }}
        >
          {resetting ? 'Resetting...' : 'Play Again (Reshuffle Teams)'}
        </button>
      )}

      {!isHost && (
        <p className="text-muted text-center">
          Waiting for host to start a new game...
        </p>
      )}
    </div>
  );
}

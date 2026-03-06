import { useState } from 'react';
import { submitWords, advanceToTeams } from '../../hooks/useRoom';
import { WordInput } from '../shared/WordInput';
import type { Room } from '../../types/game';

interface Props {
  room: Room;
  roomCode: string;
  isHost: boolean;
  playerId: string;
  onLeave: () => void;
}

export function LobbyScreen({ room, roomCode, isHost, playerId, onLeave }: Props) {
  const [words, setWords] = useState<string[]>(['', '', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentPlayer = room.players?.[playerId];
  const hasSubmitted = currentPlayer?.submittedWords ?? false;

  const players = room.players ? Object.entries(room.players) : [];
  const bowlCount = room.bowl
    ? Object.values(room.bowl).length
    : 0;
  const allSubmitted = players.length > 0 && players.every(([, p]) => p.submittedWords);

  function handleWordChange(index: number, value: string) {
    setWords((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleRemoveWord(index: number) {
    setWords((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddWord() {
    if (words.length < 5) {
      setWords((prev) => [...prev, '']);
    }
  }

  async function handleSubmit() {
    const trimmed = words.map((w) => w.trim()).filter((w) => w.length > 0);

    if (trimmed.length < 3) {
      setError('Enter at least 3 words or sayings');
      return;
    }

    const tooLong = trimmed.find((w) => w.length > 50);
    if (tooLong) {
      setError(`"${tooLong.slice(0, 20)}..." is too long (max 50 characters)`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitWords(roomCode, trimmed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit words');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdvance() {
    try {
      await advanceToTeams(roomCode);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to advance');
    }
  }

  return (
    <div className="screen flex-col gap-16">
      <div>
        <div className="flex-row justify-between items-center">
          <h1 style={{ margin: 0 }}>Lobby</h1>
          <button
            className="secondary"
            onClick={onLeave}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            Leave
          </button>
        </div>
        <p className="text-center" style={{ margin: '4px 0 0' }}>
          Room: <strong style={{ letterSpacing: '0.15em' }}>{roomCode}</strong>
        </p>
      </div>

      {!hasSubmitted ? (
        <div className="flex-col gap-12">
          <h2>Add your words</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
            Enter 3–5 words or short sayings (max 50 chars each)
          </p>

          {words.map((word, i) => (
            <WordInput
              key={i}
              index={i}
              value={word}
              onChange={handleWordChange}
              onRemove={handleRemoveWord}
              removable={words.length > 3}
            />
          ))}

          {words.length < 5 && (
            <button className="secondary" onClick={handleAddWord}>
              + Add another word
            </button>
          )}

          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Words'}
          </button>
        </div>
      ) : (
        <div className="card text-center">
          <p style={{ margin: 0, fontSize: '1.1rem' }}>Your words are in the bowl!</p>
          <p className="text-muted" style={{ margin: '4px 0 0' }}>
            Waiting for everyone else...
          </p>
        </div>
      )}

      <div className="card flex-col gap-8">
        <h2>Players ({players.length})</h2>
        {players.map(([id, player]) => (
          <div key={id} className="flex-row justify-between">
            <span>
              {player.name}
              {id === room.hostId && (
                <span className="text-muted" style={{ fontSize: '0.75rem' }}> (host)</span>
              )}
            </span>
            <span style={{ fontSize: '0.875rem' }}>
              {player.submittedWords ? '✓' : '...'}
            </span>
          </div>
        ))}
        <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
          {bowlCount} word{bowlCount !== 1 ? 's' : ''} in the bowl
        </p>
      </div>

      {isHost && allSubmitted && (
        <button className="success" onClick={handleAdvance}>
          Everyone's in — Pick Teams!
        </button>
      )}

      {error && (
        <p style={{ color: 'var(--color-danger)', textAlign: 'center', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

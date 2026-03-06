import { useState } from 'react';
import { createRoom, joinRoom } from '../../hooks/useRoom';
import { isValidRoomCode } from '../../lib/roomCode';

interface Props {
  onJoined: (code: string) => void;
}

export function HomeScreen({ onJoined }: Props) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = await createRoom(name.trim());
      onJoined(code);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    const code = joinCode.toUpperCase().trim();
    if (!isValidRoomCode(code)) {
      setError('Room code must be 4 letters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await joinRoom(code, name.trim());
      onJoined(code);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen flex-col justify-center gap-16">
      <div className="text-center">
        <h1>Tina's Stupid Game</h1>
        <p className="text-muted">The party word game</p>
      </div>

      <div className="flex-col gap-12">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoComplete="off"
        />
      </div>

      <div className="flex-col gap-12">
        <button onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create Game'}
        </button>

        <div className="text-center text-muted" style={{ fontSize: '0.875rem' }}>
          — or join an existing game —
        </div>

        <div className="flex-row gap-8">
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={4}
            style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}
            autoComplete="off"
          />
          <button className="secondary" onClick={handleJoin} disabled={loading}>
            Join
          </button>
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--color-danger)', textAlign: 'center', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

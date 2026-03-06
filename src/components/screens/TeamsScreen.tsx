import { useState } from 'react';
import { selectTeam, playerId } from '../../hooks/useRoom';
import { startGame } from '../../hooks/useRoom';
import type { Room } from '../../types/game';

interface Props {
  room: Room;
  roomCode: string;
  isHost: boolean;
  playerId: string;
}

export function TeamsScreen({ room, roomCode, isHost }: Props) {
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const players = room.players ? Object.entries(room.players) : [];
  const team1 = players.filter(([, p]) => p.team === 1);
  const team2 = players.filter(([, p]) => p.team === 2);
  const unassigned = players.filter(([, p]) => p.team === null);
  const currentPlayer = room.players?.[playerId];
  const canStart = team1.length > 0 && team2.length > 0;

  async function handleSelectTeam(team: 1 | 2) {
    try {
      await selectTeam(roomCode, team);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to select team');
    }
  }

  async function handleStart() {
    if (!canStart) {
      setError('Both teams need at least one player');
      return;
    }
    setStarting(true);
    setError('');
    try {
      await startGame(roomCode, room.players);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start game');
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="screen flex-col gap-16">
      <h1>Pick Teams</h1>

      {(!currentPlayer?.team) && (
        <div className="flex-row gap-12" style={{ justifyContent: 'center' }}>
          <button
            style={{ flex: 1, backgroundColor: 'var(--color-team1)' }}
            onClick={() => handleSelectTeam(1)}
          >
            Team 1
          </button>
          <button
            style={{ flex: 1, backgroundColor: 'var(--color-team2)' }}
            onClick={() => handleSelectTeam(2)}
          >
            Team 2
          </button>
        </div>
      )}

      {currentPlayer?.team && (
        <p className="text-center text-muted">
          You're on <strong>Team {currentPlayer.team}</strong>
        </p>
      )}

      <div className="flex-row gap-12" style={{ alignItems: 'flex-start' }}>
        <div className="card flex-1 flex-col gap-8">
          <h2 style={{ color: 'var(--color-team1)' }}>
            Team 1 ({team1.length})
          </h2>
          {team1.map(([id, p]) => (
            <div key={id}>{p.name}</div>
          ))}
          {team1.length === 0 && (
            <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
              No players yet
            </p>
          )}
        </div>

        <div className="card flex-1 flex-col gap-8">
          <h2 style={{ color: 'var(--color-team2)' }}>
            Team 2 ({team2.length})
          </h2>
          {team2.map(([id, p]) => (
            <div key={id}>{p.name}</div>
          ))}
          {team2.length === 0 && (
            <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
              No players yet
            </p>
          )}
        </div>
      </div>

      {unassigned.length > 0 && (
        <p className="text-center text-muted" style={{ fontSize: '0.875rem' }}>
          {unassigned.length} player{unassigned.length !== 1 ? 's' : ''} still picking...
        </p>
      )}

      {isHost && (
        <button
          className="success"
          onClick={handleStart}
          disabled={!canStart || starting}
        >
          {starting ? 'Starting...' : 'Start Game!'}
        </button>
      )}

      {!isHost && (
        <p className="text-center text-muted">Waiting for host to start...</p>
      )}

      {error && (
        <p style={{ color: 'var(--color-danger)', textAlign: 'center', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

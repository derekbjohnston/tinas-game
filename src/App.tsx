import { useState } from 'react';
import { useRoom } from './hooks/useRoom';
import { useGameState } from './hooks/useGameState';
import { HomeScreen } from './components/screens/HomeScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { TeamsScreen } from './components/screens/TeamsScreen';
import { GameplayScreen } from './components/screens/GameplayScreen';
import { SpectatorScreen } from './components/screens/SpectatorScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';

export default function App() {
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    return localStorage.getItem('roomCode');
  });

  const { room, loading } = useRoom(roomCode);
  const { screen, isHost, currentPlayer, playerId } = useGameState(room, roomCode);

  function handleJoined(code: string) {
    localStorage.setItem('roomCode', code);
    setRoomCode(code);
  }

  function handleLeave() {
    localStorage.removeItem('roomCode');
    setRoomCode(null);
  }

  if (loading && roomCode) {
    return (
      <div className="screen flex-col items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (roomCode && !room) {
    // Room no longer exists
    handleLeave();
    return null;
  }

  switch (screen) {
    case 'home':
      return <HomeScreen onJoined={handleJoined} />;

    case 'lobby':
      return (
        <LobbyScreen
          room={room!}
          roomCode={roomCode!}
          isHost={isHost}
          playerId={playerId}
          onLeave={handleLeave}
        />
      );

    case 'teams':
      return (
        <TeamsScreen
          room={room!}
          roomCode={roomCode!}
          isHost={isHost}
          playerId={playerId}
        />
      );

    case 'start-turn':
    case 'gameplay':
      return (
        <GameplayScreen
          room={room!}
          roomCode={roomCode!}
          playerId={playerId}
          screen={screen}
        />
      );

    case 'waiting-for-turn':
    case 'spectator':
      return (
        <SpectatorScreen
          room={room!}
          roomCode={roomCode!}
        />
      );

    case 'results':
      return (
        <ResultsScreen
          room={room!}
          roomCode={roomCode!}
          isHost={isHost}
        />
      );

    default:
      return <HomeScreen onJoined={handleJoined} />;
  }
}

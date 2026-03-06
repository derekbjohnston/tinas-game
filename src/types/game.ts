export interface Player {
  name: string;
  team: 1 | 2 | null;
  connected: boolean;
  submittedWords: boolean;
  skipsUsedRound1: number;
}

export interface BowlWord {
  text: string;
  submittedBy: string;
  inBowl: boolean;
}

export interface Scores {
  team1: number;
  team2: number;
}

export interface Turn {
  activePlayerId: string;
  activeTeam: 1 | 2;
  currentWordId: string | null;
  turnStartedAt: number | null;
  wordsGuessedThisTurn: number;
  turnActive: boolean;
}

export interface TurnOrder {
  currentIndex: number;
  order: string[];
  playersGoneThisCycle: {
    team1: string[];
    team2: string[];
  };
}

export interface RecentGuess {
  wordText: string;
  guessedAt: number;
  team: 1 | 2;
}

export type GamePhase = 'lobby' | 'teams' | 'playing' | 'finished';
export type RoundType = 'catchphrase' | 'charades' | 'oneword';

export interface Room {
  createdAt: number;
  hostId: string;
  phase: GamePhase;
  round: number;
  roundType: RoundType;
  players: Record<string, Player>;
  bowl: Record<string, BowlWord>;
  scores: Scores;
  turn: Turn;
  turnOrder: TurnOrder;
  recentGuess: RecentGuess | null;
}

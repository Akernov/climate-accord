export type Role = "advocate" | "lobbyist";

export type Player = {
  userId: string;
  name: string;
  role?: Role;
  isAnonymous?: boolean;
};

export type LobbyPhase = 'Bill Voting' | 'Discussion' | 'Player Voting' | 'Grace Period' | null;
export type LobbyStatus = 'waiting' | 'started' | 'ended';

export type Lobby = {
  gameId?: string;
  code: string;
  host: string;
  players: Player[];
  maxPlayers: number;
  winnerFaction?: "advocate" | "lobbyist" | null;
  phase: LobbyPhase;
  status: LobbyStatus;
  bills: Bill[];
  phaseEndTime?: number;
  votes?: Record<string, number>;
  activistPoints?: Record<number, number>;
  lobbyistPoints?: Record<number, number>;
  lastPassedBill?: Bill | null;
  lastPassedBillVoters?: string[];
  callPlayerVoteIds?: string[];
  oustedPlayers?: string[];
  playerVotes?: Record<string, string>;
  lastOustedPlayer?: string | null;
};

export type Bill = {
  title?: string;
  lobbyistCategory: number;
  activistCategory: number;
  lobbyistScore: number;
  activistScore: number;
};


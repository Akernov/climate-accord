export type Role = "advocate" | "lobbyist";

export type Player = {
  userId: string;
  name: string;
  role?: Role;
};

export type LobbyPhase = 'Bill Voting' | 'Discussion' | 'Player Voting' | null;
export type LobbyStatus = 'waiting' | 'started' | 'ended';

export type Lobby = {
  code: string;
  host: string;
  players: Player[];
  maxPlayers: number;
  winnerFaction?: "advocate" | "lobbyist" | null;
  phase: LobbyPhase;
  status: LobbyStatus;
};

export type Bill = {
  title?: string;
  lobbyistCategory: string;
  activistCategory: string; 
  lobbyistScore: number;    
  activistScore: number;
};


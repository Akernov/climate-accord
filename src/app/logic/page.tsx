// Role type used to represent the possible roles a player can receive
export type Role = "advocate" | "lobbyist";

export type Player = {
  name: string;   // Player's display name
  role?: Role;    // Role assigned at the start of the game
};


// This helps balance gameplay so the lobbyist team is smaller than the advocates
export function getLobbyistCount(playerCount: number): number {

  // Small games have fewer lobbyists
  if (playerCount <= 6) return 2;

  // Medium sized games
  if (playerCount <= 8) return 3;

  // Maximum lobbyist count for very large games
  return 4;
}


// This ensures that role assignments are random and fair
export function shuffleArray<T>(array: T[]): T[] {

  // Create a copy of the array so the original is not modified
  const newArray = [...array];

  // Iterate from the end of the array toward the beginning
  for (let i = newArray.length - 1; i > 0; i--) {

    // Generate a random index within the remaining range
    const j = Math.floor(Math.random() * (i + 1));

    // Swap the elements at index i and j
    const temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }

  // Return the shuffled array
  return newArray;
}

// Assigns roles to all players in the lobby
// Roles are first generated based on player count, then shuffled randomly
export function assignRoles(players: Player[]): Player[] {

  // Determine how many lobbyists should exist
  const lobbyistCount = getLobbyistCount(players.length);

  // Create an array of roles with the appropriate distribution
  const roles: Role[] = [
    ...Array(lobbyistCount).fill("lobbyist"),
    ...Array(players.length - lobbyistCount).fill("advocate"),
  ];

  // Shuffle the roles so assignments are random
  const shuffledRoles = shuffleArray(roles);

  // Assign each player a role from the shuffled role list
  return players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
  }));
}

// Keeps this route valid for Next.js while exposing reusable helpers.
export default function LogicPage() {
  return null;
}

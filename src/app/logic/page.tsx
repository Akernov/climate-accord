export type Role = "advocate" | "lobbyist";

export type Player = {
  name: string;
  score: number;
  role?: Role;
};

export function getLobbyistCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 7) return 2;
  if (playerCount <= 9) return 3;
  return 4;
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }

  return newArray;
}

export function assignRoles(players: Player[]): Player[] {
  const lobbyistCount = getLobbyistCount(players.length);

  const roles: Role[] = [
    ...Array(lobbyistCount).fill("lobbyist"),
    ...Array(players.length - lobbyistCount).fill("advocate"),
  ];

  const shuffledRoles = shuffleArray(roles);

  return players.map((player, index) => ({
    ...player,
    role: shuffledRoles[index],
  }));
}
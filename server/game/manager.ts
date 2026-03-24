import { Lobby, Bill } from "../../src/types/game";

export class GameManager {
    // Key: Game Code (e.g. "ABCD")
    // Value: The entire active state memory of that specific lobby
    private activeGames: Map<string, Lobby>;

    // Key: User ID (e.g. from Supabase auth)
    // Value: Game Code (e.g. "ABCD") 
    // Purpose: O(1) instant lookup to see if a reconnecting user is already in a game
    private playerLobbies: Map<string, string>;

    constructor() {
        this.activeGames = new Map();
        this.playerLobbies = new Map();
    }

    // --- PLAYER PRESENCE PIPELINES --- //

    /**
     * Instantly looks up which lobby a user belongs to.
     * Perfect for Socket reconnection events.
     */
    public getPlayerLobby(userId: string): string | undefined {
        return this.playerLobbies.get(userId);
    }

    /**
     * Maps a player to a specific game code.
     */
    public assignPlayerToLobby(userId: string, gameCode: string): void {
        this.playerLobbies.set(userId, gameCode);
    }

    /**
     * Removes a player's pairing. Call this when they intentionally leave
     * a game or are kicked.
     */
    public removePlayerFromLobby(userId: string): void {
        this.playerLobbies.delete(userId);
    }

    // --- GAME MEMORY PIPELINES --- //

    /**
     * Allocates memory chunk for a new lobby when it starts.
     * Often pulled once from the Database at the moment the game launches.
     */
    public initializeGame(gameCode: string, initialState: Lobby): void {
        this.activeGames.set(gameCode, initialState);
    }

    /**
     * Retrieves the active game memory for a specific lobby.
     */
    public getGame(gameCode: string): Lobby | undefined {
        return this.activeGames.get(gameCode);
    }

    /**
     * Safely updates a chunk of memory for a specific lobby without overwriting 
     * the rest of the object.
     */
    public updateGame(gameCode: string, updates: Partial<Lobby>): Lobby | undefined {
        const game = this.activeGames.get(gameCode);
        if (!game) return undefined;

        const updatedGame = { ...game, ...updates };
        this.activeGames.set(gameCode, updatedGame);
        
        return updatedGame;
    }

    /**
     * Clears the memory allocation for a lobby, usually triggered when
     * the game ends or all players disconnect, allowing V8 garbage collection.
     */
    public endGame(gameCode: string): void {
        this.activeGames.delete(gameCode);
    }

    /**
     * Checks if a lobby is currently loaded into memory.
     */
    public hasGame(gameCode: string): boolean {
        return this.activeGames.has(gameCode);
    }
}

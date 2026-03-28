import { Lobby } from "../src/types/game";

export interface IServerState {
    // --- Socket Presence ---
    trackSocket(userId: string, socketId: string): void;
    untrackSocket(userId: string, socketId: string): void;
    isUserConnected(userId: string): boolean;
    getSocketId(userId: string): string | undefined;

    // --- Player to Lobby Mapping ---
    getPlayerLobby(userId: string): string | undefined;
    assignPlayerToLobby(userId: string, gameCode: string): void;
    removePlayerFromLobby(userId: string): void;

    // --- Game Memory Management ---
    initializeGame(gameCode: string, initialState: Lobby): void;
    getGame(gameCode: string): Lobby | undefined;
    updateGame(gameCode: string, updates: Partial<Lobby>): Lobby | undefined;
    endGame(gameCode: string): void;
    hasGame(gameCode: string): boolean;

    // --- Timer Encapsulation ---
    setPhaseTimer(gameCode: string, timeout: NodeJS.Timeout): void;
    clearPhaseTimer(gameCode: string): void;
}

export class ServerState implements IServerState {
    // Key: Game Code (e.g. "ABCD")
    // Value: The entire active state memory of that specific lobby
    private activeGames: Map<string, Lobby>;

    // Key: User ID (e.g. from Supabase auth)
    // Value: Game Code (e.g. "ABCD") 
    // Purpose: O(1) instant lookup to see if a reconnecting user is already in a game
    private playerLobbies: Map<string, string>;

    // Key: User ID
    // Value: Socket ID
    // Purpose: O(1) instant lookup to see if user is connected and where to send events
    /**
     * Note: This map is only altered whenever a user connects or disconnects.
     * It is not touched upon in any other context.
     */
    private userSockets: Map<string, string>;

    // Key: Game Code
    // Value: Active NodeJS Timeout orchestrating the next phase jump
    private phaseTimers: Map<string, NodeJS.Timeout>;

    constructor() {
        this.activeGames = new Map();
        this.playerLobbies = new Map();
        this.userSockets = new Map();
        this.phaseTimers = new Map();
    }

    // --- Socket Presence ---
    public trackSocket(userId: string, socketId: string): void {
        this.userSockets.set(userId, socketId);
    }

    public untrackSocket(userId: string, socketId: string): void {
        const current = this.userSockets.get(userId);
        if (current === socketId) {
            this.userSockets.delete(userId);
        }
    }

    public isUserConnected(userId: string): boolean {
        return this.userSockets.has(userId);
    }

    public getSocketId(userId: string): string | undefined {
        return this.userSockets.get(userId);
    }

    // --- Player Presence Pipelines ---
    public getPlayerLobby(userId: string): string | undefined {
        return this.playerLobbies.get(userId);
    }

    public assignPlayerToLobby(userId: string, gameCode: string): void {
        this.playerLobbies.set(userId, gameCode);
    }

    public removePlayerFromLobby(userId: string): void {
        this.playerLobbies.delete(userId);
    }

    // --- Game Memory Pipelines ---
    public initializeGame(gameCode: string, initialState: Lobby): void {
        this.activeGames.set(gameCode, initialState);
    }

    public getGame(gameCode: string): Lobby | undefined {
        return this.activeGames.get(gameCode);
    }

    public updateGame(gameCode: string, updates: Partial<Lobby>): Lobby | undefined {
        const game = this.activeGames.get(gameCode);
        if (!game) return undefined;

        const updatedGame = { ...game, ...updates };
        this.activeGames.set(gameCode, updatedGame);

        return updatedGame;
    }

    public endGame(gameCode: string): void {
        this.activeGames.delete(gameCode);
        this.clearPhaseTimer(gameCode); // Clean up memory leak
    }

    public hasGame(gameCode: string): boolean {
        return this.activeGames.has(gameCode);
    }

    // --- Timer Encapsulation ---
    public setPhaseTimer(gameCode: string, timeout: NodeJS.Timeout): void {
        this.clearPhaseTimer(gameCode); // Always securely clear any old timer first
        this.phaseTimers.set(gameCode, timeout);
    }

    public clearPhaseTimer(gameCode: string): void {
        const existing = this.phaseTimers.get(gameCode);
        if (existing) {
            clearTimeout(existing);
            this.phaseTimers.delete(gameCode);
        }
    }
}

import { z, ZodSchema, ZodFormattedError } from "zod";
import { Server, Socket } from "socket.io";
import type { User } from "@supabase/supabase-js";
import { IServerState } from "./state.js";
import type { Role, Player, Lobby, Bill } from "../src/types/game";

// --- SOCKET PRESENCE & SECURE BROADCASTING --- //

/**
 * Censors the lobby state based on the player's role and the game phase.
 * This ensures that players only receive data they are authorized to see.
 * @param lobby The lobby to censor
 * @param player The player to censor for
 * @returns The censored lobby
 * 
 * Used specifically for seperation of bill info.
 */
export const censorLobbyForPlayer = (lobby: Lobby, player: Player): Lobby => {
    // Create a deep copy to avoid modifying the original lobby object in memory
    const lobbyCopy: Lobby = JSON.parse(JSON.stringify(lobby));

    const playerRole = player.role;
    const currentPhase = lobby.phase;

    // Censor bills based on phase and role
    if (lobbyCopy.bills && lobbyCopy.bills.length > 0) {
        if (currentPhase === 'Grace Period') {
            // Grace Period is a transition screen — no one needs bill data
            lobbyCopy.bills = [];
        } else if (currentPhase === 'Discussion' && playerRole === 'advocate') {
            // Advocates see no bills during discussion
            lobbyCopy.bills = [];
        } else if (currentPhase === 'Bill Voting' && playerRole === 'advocate') {
            // Advocates see only the activist part of bills during voting
            lobbyCopy.bills = lobbyCopy.bills.map(bill => ({
                title: bill.title,
                activistCategory: bill.activistCategory,
                activistScore: bill.activistScore,
            } as Bill)); // Cast to Bill, acknowledging missing optional fields
        }
    }

    return lobbyCopy;
};
/**
 * Broadcasts the lobby state to all players in the lobby.
 * @param io The Socket.IO server instance
 * @param gameCode The code of the lobby to broadcast to
 * @param state The server state
 * 
 * Multi-purpose: 
 * 1. Used to update visual state of lobby, updating on joins/leavers
 * 2. Used to update visual state of game, updating on phase changes, etc.
 */
export async function broadcastLobbyState(io: Server, gameCode: string, state: IServerState) {
    const lobby = state.getGame(gameCode);
    if (!lobby) return;

    lobby.players.forEach(player => {
        const socketId = state.getSocketId(player.userId);
        if (socketId) {
            const censoredState = censorLobbyForPlayer(lobby, player);
            io.to(socketId).emit('lobby:updated', censoredState);
        }
    });
}

/**
 * Safely removes a player from any old lobby they might still be attached to 
 * (including Socket.IO rooms) before they join or create a new one.
 * @param io The Socket.IO server instance
 * @param socket The socket to remove
 * @param state The server state
 * @param userId The ID of the user to remove
 * 
 * Function is only called upon when attempting to join/create new lobby
 */
export async function abandonOldLobby(io: Server, socket: Socket, state: IServerState, userId: string) {
    const oldCode = state.getPlayerLobby(userId);
    if (!oldCode) return;

    socket.leave(oldCode);
    state.removePlayerFromLobby(userId);

    const oldGame = state.getGame(oldCode);
    if (oldGame) {
        const updatedPlayers = oldGame.players.filter(p => p.userId !== userId);
        state.updateGame(oldCode, { players: updatedPlayers });

        if (updatedPlayers.length === 0) {
            state.endGame(oldCode);
        } else {
            if (oldGame.host === userId) {
                state.updateGame(oldCode, { host: updatedPlayers[0].userId });
            }
            await broadcastLobbyState(io, oldCode, state);
        }
    }
}

// --- VALIDATION & ERROR HANDLING --- //
/**
 * Type for Socket.IO acknowledgment responses
 * @template T - The type of the data to send
 */
export type SocketAckResponse<T> =
    | { status: "SUCCESS"; data: T }
    | { status: "ERROR"; error: string; issues?: ZodFormattedError<unknown> };

/**
 * Wrapper function to handle validation and error handling for Socket.IO event handlers
 * @template T - The type of the schema to validate
 * @template R - The type of the result to return
 * @param schema - The Zod schema to validate against
 * @param handler - The handler function to execute if validation succeeds
 * @returns The handler function wrapped with validation and error handling
 */
export function withValidation<T extends ZodSchema, R>(
    schema: T,
    handler: (data: z.infer<T>) => Promise<R>
) {
    return async (payload: unknown, callback?: (res: SocketAckResponse<R>) => void) => {
        const parseResult = schema.safeParse(payload);
        if (!parseResult.success) {
            if (typeof callback === "function") callback({ status: "ERROR", error: "Validation failed" });
            return;
        }
        try {
            const resultData = await handler(parseResult.data);
            if (typeof callback === "function") callback({ status: "SUCCESS", data: resultData });
        } catch (e) {
            console.error("CRITICAL BACKEND ERROR:", e);

            let error = "An unknown error occurred.";
            if (e instanceof Error) error = e.message;
            if (typeof callback === "function") callback({ status: "ERROR", error });
        }
    };
}

// --- DOMAIN UTILS --- //
/**
 * Normalizes the lobby code by trimming whitespace and converting to uppercase
 * @param value - The lobby code to normalize
 * @returns The normalized lobby code
 */
export function normalizeCode(value: string): string {
    return value.trim().toUpperCase();
}

/**
 * Normalizes the player name by trimming whitespace
 * @param value - The player name to normalize
 * @returns The normalized player name
 */
export function normalizeName(value: string): string {
    return value.trim();
}

/**
 * Gets the user from the socket data
 * @param socket - The socket to get the user from
 * @returns The user from the socket data
 */
export function getSocketUser(socket: { data: { user?: User } }): User | null {
    return socket.data.user ?? null;
}

/**
 * Gets the display name from the user
 * @param user - The user to get the display name from
 * @returns The display name from the user
 */
export function getDisplayNameFromUser(user: User): string {
    const maybeName = user.user_metadata?.display_name ?? user.user_metadata?.name;
    if (typeof maybeName === "string" && maybeName.trim()) {
        return maybeName.trim();
    }

    return `user-${user.id.slice(0, 8)}`;
}

/**
 * Clamps the maximum number of players to a value between min and max
 * @param value - The value to clamp
 * @returns The clamped value
 */
export function clampMaxPlayers(value: unknown): number {
    const min = 2;
    const max = 10;
    const parsed = Number(value);
    return isNaN(parsed) ? min : Math.min(max, Math.max(min, Math.floor(parsed)));
}

/**
 * Gets the number of lobbyists based on the player count
 * @param playerCount - The number of players
 * @returns The number of lobbyists
 */
export function getLobbyistCount(playerCount: number): number {
    // 3,4 -> 1 | 5,6 -> 2 | 7,8 -> 3 | 9,10 -> 4
    return Math.max(1, Math.floor((playerCount - 1) / 2));
}

/** 
 * @template T - The type of the array elements
 * @param array - The array to shuffle
 * @returns The shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
    const cloned = [...array];
    for (let i = cloned.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = cloned[i];
        cloned[i] = cloned[j];
        cloned[j] = temp;
    }
    return cloned;
}

/**
 * Assigns roles to players
 * @param players - The players to assign roles to
 * @returns The players with roles assigned
 */
export function assignRoles<T extends { userId: string }>(players: T[]): (T & { role: Role })[] {
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

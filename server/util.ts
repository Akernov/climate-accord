import { z, ZodSchema, ZodFormattedError } from "zod";
import { Server } from "socket.io";
import { DB } from "./db.js";
import type { User } from "@supabase/supabase-js";
import { GameManager } from "./game/manager.js";
import type { Role, Player, Lobby, Bill } from "../src/types/game";

// --- SOCKET PRESENCE & SECURE BROADCASTING --- //

const userIdToSocketIdMap = new Map<string, string>();

export const trackSocket = (userId: string, socketId: string) => {
    userIdToSocketIdMap.set(userId, socketId);
};

export const untrackSocket = (userId: string) => {
    userIdToSocketIdMap.delete(userId);
};

/**
 * Censors the lobby state based on the player's role and the game phase.
 * This ensures that players only receive data they are authorized to see.
 */
export const censorLobbyForPlayer = (lobby: Lobby, player: Player): Lobby => {
    // Create a deep copy to avoid modifying the original lobby object in memory
    const lobbyCopy: Lobby = JSON.parse(JSON.stringify(lobby));
  
    const playerRole = player.role;
    const currentPhase = lobby.phase;
  
    // Censor bills based on phase and role
    if (lobbyCopy.bills && lobbyCopy.bills.length > 0) {
      if (currentPhase === 'Discussion' && playerRole === 'advocate') {
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

export async function broadcastLobbyState(io: Server, gameCode: string, manager: GameManager) {
    const lobby = manager.getGame(gameCode);
    if (!lobby) return;

    lobby.players.forEach(player => {
        const socketId = userIdToSocketIdMap.get(player.userId);
        if (socketId) {
            const censoredState = censorLobbyForPlayer(lobby, player);
            io.to(socketId).emit('lobby:updated', censoredState);
        }
    });
}

// --- VALIDATION & ERROR HANDLING --- //

export type SocketAckResponse<T> =
    | { status: "SUCCESS"; data: T }
    | { status: "ERROR"; error: string; issues?: ZodFormattedError<unknown> };  

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

export function normalizeCode(value: string): string {
    return value.trim().toUpperCase();
}

export function normalizeName(value: string): string {
    return value.trim();
}

export function getSocketUser(socket: { data: { user?: User } }): User | null {        
    return socket.data.user ?? null;
}

export function getDisplayNameFromUser(user: User): string {
    const maybeName = user.user_metadata?.display_name ?? user.user_metadata?.name;
    if (typeof maybeName === "string" && maybeName.trim()) {
        return maybeName.trim();
    }

    if (typeof user.email === "string" && user.email.trim()) {
        return user.email.split("@")[0];
    }

    return `user-${user.id.slice(0, 8)}`;
}

export function clampMaxPlayers(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) return 5;
    const floored = Math.floor(parsed);
    return Math.min(10, Math.max(2, floored));       
}

export function getLobbyistCount(playerCount: number): number {
    if (playerCount <= 5) return 1;
    if (playerCount <= 7) return 2;
    if (playerCount <= 9) return 3;
    return 4;
}

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

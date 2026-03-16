import { z, ZodSchema, ZodFormattedError } from "zod";
import { Server } from "socket.io";
import { DB } from "./db.js";
import type { User } from "@supabase/supabase-js";

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

export async function broadcastLobbyState(io: Server, gameCode: string, gameId: string, db: DB) {                                                                   
    const state = await db.getLobbyState({ code: gameCode });
    if (state) {
        io.to(gameCode).emit('lobby:updated', state);
    }
}

// Domain Utils
export type Role = "advocate" | "lobbyist";

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

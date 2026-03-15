import { Pool, PoolClient } from "pg";
import { z, ZodSchema, ZodFormattedError } from "zod";
import { Server } from "socket.io";
import { DB } from "./db.js";

/**
 * Wraps database queries in a sterile transaction.
 * Automatically rolls back if an error occurs.
 */
export async function doInTransaction<T>(
    pgPool: Pool, 
    query: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pgPool.connect();
  let output: T;

  try {
    await client.query("BEGIN");
    output = await query(client);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return output;
}

/**
 * Standardized response format for client-side socket acknowledgments.
 */
export type SocketAckResponse<T> = 
    | { status: "SUCCESS"; data: T }
    | { status: "ERROR"; error: string; issues?: ZodFormattedError<unknown> };

/**
 * A Socket.IO event handler wrapper that automatically parses incoming payload 
 * data via Zod, catches any thrown errors, and returns a standardized SocketAckResponse.
 * 
 * @param schema The Zod schema to validate the incoming payload
 * @param handler The asynchronous logic to execute if validation passes
 */
export function withValidation<T extends ZodSchema, R>(
    schema: T,
    handler: (data: z.infer<T>) => Promise<R>
) {
    return async (payload: unknown, callback: (res: SocketAckResponse<R>) => void) => {
        if (typeof callback !== "function") return;

        const parseResult = schema.safeParse(payload);
        
        if (!parseResult.success) {
            return callback({ 
                status: "ERROR", 
                error: "Validation failed", 
                issues: parseResult.error.format() 
            });
        }

        try {
            const resultData = await handler(parseResult.data);
            return callback({ status: "SUCCESS", data: resultData });
        } catch (e) {
            let error = "An unknown error occurred.";
            if (e instanceof Error) error = e.message;
            return callback({ status: "ERROR", error });
        }
    };
}

export async function broadcastLobbyState(io: Server, gameCode: string, gameId: number, db: DB) {
    const game = await db.getGameByCode({ code: gameCode });
    const players = await db.getPlayersInGame({ gameId });
    const host = await db.getHostUsername({ gameId });
    
    interface LobbyPlayer {
        name: string;
        role?: string;
    }

    interface LobbyUpdatedPayload {
        code: string;
        host: string;
        players: LobbyPlayer[];
        maxPlayers: number;
    }

    io.to(gameCode).emit('lobby_updated', {
        code: gameCode,
        host: host, 
        players: players.map((p): LobbyPlayer => ({
            name: p.username,
            role: p.role === "unassigned" ? undefined : p.role
        })),
        maxPlayers: game.max_players
    } as LobbyUpdatedPayload);
}
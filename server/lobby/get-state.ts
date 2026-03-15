import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js"; 
import { withValidation, broadcastLobbyState } from "../util.js";

const getStateSchema = z.object({ code: z.string() });

export function getLobbyState({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(getStateSchema, async ({ code }) => {
        const game = await db.getGameByCode({ code });
        if (!game) throw new Error("Lobby not found");

        // Use the existing utility to send the lobby_updated event to this specific socket!
        await broadcastLobbyState(io, code, game.game_id, db);

        return { success: true };
    });
}
import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { withValidation, getSocketUser, clampMaxPlayers, getDisplayNameFromUser, normalizeName } from "../util.js";

export const createLobbySchema = z.object({
  playerName: z.string().optional(),
  maxPlayers: z.number().optional(),
});

export function createLobby({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(createLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const requestedName = normalizeName(data.playerName ?? "");
        const fallbackName = getDisplayNameFromUser(user);
        const name = requestedName || fallbackName;

        const maxPlayers = clampMaxPlayers(data.maxPlayers);

        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        const newGame = await db.createLobby({ code: newCode, hostId: user.id, maxPlayers });
        await db.addPlayerToGame({ gameId: newGame.game_id, userId: user.id, displayName: name });
        
        socket.join(newCode);

        return { lobbyCode: newCode };
    });
}

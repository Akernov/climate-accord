import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js"; 
import { withValidation } from "../util.js"; 

export const createLobbySchema = z.object({
  playerName: z.string(),
  maxPlayers: z.number(),
});

export function createLobby({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(createLobbySchema, async (data) => {
        
        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        const hostId = await db.createTempPlayer({ username: data.playerName });
        const gameData = await db.createLobby({ code: newCode, hostId, maxPlayers: data.maxPlayers });
        
        socket.data.user_id = hostId;
        socket.join(newCode);

        return { lobbyCode: newCode };
    });
}
import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode } from "../util.js";

// 1. Accept targetID
export const kickPlayerSchema = z.object({
  code: z.string(),
  targetID: z.string()
});

export function kickPlayer({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(kickPlayerSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const targetID = data.targetID.trim();
        
        const game = await db.getGameByCode({ code });
        if (!game) throw new Error("Lobby not found");

        if (game.host_user_id !== user.id) {
            throw new Error("Only the host can kick players.");
        }

        const players = await db.getPlayersInGame({ gameId: game.game_id });
        
        const playerToKick = players.find(p => p.userId === targetID);
        
        if (!playerToKick) throw new Error("Player not found in lobby.");
        if (playerToKick.userId === user.id) throw new Error("Cannot kick yourself.");

        await db.removePlayerFromGame({ gameId: game.game_id, userId: playerToKick.userId });
        
        io.to(code).emit('lobby:kick_player', { targetID: playerToKick.userId });
        
        await broadcastLobbyState(io, code, game.game_id, db);

        return { success: true };
    });
}

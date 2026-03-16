import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode, normalizeName } from "../util.js";

export const kickPlayerSchema = z.object({
  code: z.string(),
  targetName: z.string()
});

export function kickPlayer({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(kickPlayerSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const targetName = normalizeName(data.targetName);
        
        const game = await db.getGameByCode({ code });
        if (!game) throw new Error("Lobby not found");

        if (game.host_user_id !== user.id) {
            throw new Error("Only the host can kick players.");
        }

        const players = await db.getPlayersInGame({ gameId: game.game_id });
        const playerToKick = players.find(p => p.name === targetName);
        
        if (!playerToKick) throw new Error("Player not found in lobby.");
        if (playerToKick.userId === user.id) throw new Error("Cannot kick yourself.");

        await db.removePlayerFromGame({ gameId: game.game_id, userId: playerToKick.userId });
        
        // Notify kicked player by socket room logic, maybe a dedicated private room or broadcast
        // For now, emit lobby state and rely on frontend catching disconnect if any
        io.to(code).emit('player_kicked', { name: targetName });
        
        await broadcastLobbyState(io, code, game.game_id, db);

        return { success: true };
    });
}

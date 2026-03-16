import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode } from "../util.js";

export const leaveLobbySchema = z.object({
  code: z.string(),
});

export function leaveLobby({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(leaveLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const game = await db.getGameByCode({ code });
        if (!game) return { success: false };

        const removedName = await db.removePlayerFromGame({ gameId: game.game_id, userId: user.id });
        if (!removedName) return { success: false };

        socket.leave(code);

        const remainingPlayers = await db.getPlayersInGame({ gameId: game.game_id });
        
        if (remainingPlayers.length === 0) {
            await db.deleteLobby({ gameId: game.game_id });
        } else if (game.host_user_id === user.id) {
            await db.updateLobbyHost({ gameId: game.game_id, newHostId: remainingPlayers[0].userId });
            await broadcastLobbyState(io, code, game.game_id, db);
        } else {
            await broadcastLobbyState(io, code, game.game_id, db);
        }

        return { success: true };
    });
}

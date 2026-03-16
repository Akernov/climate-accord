import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { withValidation, getSocketUser, normalizeCode, assignRoles } from "../util.js";

export const startGameSchema = z.object({
  code: z.string(),
});

export function startGame({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(startGameSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        
        const game = await db.getGameByCode({ code });
        if (!game) throw new Error("Lobby not found");

        if (game.host_user_id !== user.id) {
            throw new Error("Only the host can start the game.");
        }

        const players = await db.getPlayersInGame({ gameId: game.game_id });
        if (players.length < 2) {
            throw new Error("Need at least 2 players to start.");
        }

        const assignedRolesPlayers = assignRoles(players);
        const updates = assignedRolesPlayers.map(p => ({
            userId: p.userId,
            role: p.role
        }));

        await db.assignRoles({ gameId: game.game_id, updates });
        await db.startGame({ gameId: game.game_id });

        const newState = await db.getLobbyState({ code });

        console.log(`!!! Game Started in lobby: ${code} !!!`);
        io.to(code).emit('game_started', newState);
        io.to(code).emit('lobby_updated', newState);

        return { success: true };
    });
}

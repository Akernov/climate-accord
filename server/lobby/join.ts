import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js"; 
import { withValidation, broadcastLobbyState } from "../util.js";

export const joinLobbySchema = z.object({
  code: z.string(),
  playerName: z.string(),
});

export function joinLobby({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(joinLobbySchema, async ({ code, playerName }) => {
        const game = await db.getGameByCode({ code });
        if (!game) throw new Error("Lobby not found");

        const { playerId } = await db.resolvePlayerJoin({ 
            gameId: game.game_id, 
            username: playerName, 
            maxPlayers: game.max_players, 
            currentCount: game.player_count 
        });

        socket.data.user_id = playerId;
        socket.join(code);

        await broadcastLobbyState(io, code, game.game_id, db);

        return { lobbyCode: code };
    });
}
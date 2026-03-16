import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode, normalizeName, getDisplayNameFromUser } from "../util.js";

export const joinLobbySchema = z.object({
  code: z.string(),
  playerName: z.string().optional(),
});

export function joinLobby({ io, socket, db }: { io: Server, socket: Socket, db: DB }) {
    return withValidation(joinLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const requestedName = normalizeName(data.playerName ?? "");
        const fallbackName = getDisplayNameFromUser(user);
        const name = requestedName || fallbackName;

        const game = await db.getGameByCode({ code });
        if (!game) throw new Error("Lobby not found");

        if (game.status !== 'waiting') {
            throw new Error("Game already started.");
        }

        const players = await db.getPlayersInGame({ gameId: game.game_id });
        const playerExists = players.find(p => p.userId === user.id);

        if (!playerExists) {
            const nameAlreadyTaken = players.some((p) => p.name === name);
            if (nameAlreadyTaken) throw new Error("That display name is already in use in this lobby.");

            if (players.length >= game.max_players) {
                throw new Error("This lobby is full.");
            }

            await db.addPlayerToGame({ gameId: game.game_id, userId: user.id, displayName: name });
        }

        socket.join(code);
        await broadcastLobbyState(io, code, game.game_id, db);

        return { lobbyCode: code };
    });
}

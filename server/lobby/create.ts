import { z } from "zod";
import { Server, Socket } from "socket.io";
import { GameManager } from "../game/manager.js";
import { withValidation, getSocketUser, clampMaxPlayers, getDisplayNameFromUser, normalizeName } from "../util.js";

export const createLobbySchema = z.object({
    playerName: z.string().optional(),
    maxPlayers: z.number().optional(),
});

export function createLobby({ io, socket, manager }: { io: Server, socket: Socket, manager: GameManager }) {
    return withValidation(createLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const requestedName = normalizeName(data.playerName ?? "");
        const fallbackName = getDisplayNameFromUser(user);
        const name = requestedName || fallbackName;

        const maxPlayers = clampMaxPlayers(data.maxPlayers);

        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();

        // Initialize Memory Map
        manager.initializeGame(newCode, {
            code: newCode,
            host: user.id,
            players: [{ userId: user.id, name, isAnonymous: user.is_anonymous || false, isSpectator: false }],
            maxPlayers,
            phase: null,
            status: 'waiting',
            bills: [],
        });

        manager.assignPlayerToLobby(user.id, newCode);

        socket.join(newCode);

        return { lobbyCode: newCode };
    });
}

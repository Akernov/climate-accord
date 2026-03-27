import { z } from "zod";
import { Server, Socket } from "socket.io";
import { IServerState } from "../state.js";
import { withValidation, getSocketUser, clampMaxPlayers, getDisplayNameFromUser, normalizeName, abandonOldLobby } from "../util.js";

export const createLobbySchema = z.object({
    playerName: z.string().optional(),
    maxPlayers: z.number().optional(),
});

export function createLobby({ io, socket, state }: { io: Server, socket: Socket, state: IServerState }) {
    return withValidation(createLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const requestedName = normalizeName(data.playerName ?? "");
        const fallbackName = getDisplayNameFromUser(user);
        const name = requestedName || fallbackName;

        const maxPlayers = clampMaxPlayers(data.maxPlayers);

        const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();

        await abandonOldLobby(io, socket, state, user.id);

        // Initialize Memory Map
        state.initializeGame(newCode, {
            code: newCode,
            host: user.id,
            players: [{ userId: user.id, name, isAnonymous: user.is_anonymous || false }],
            maxPlayers,
            phase: null,
            status: 'waiting',
            bills: [],
            roundCount: 0,
        });

        state.assignPlayerToLobby(user.id, newCode);

        socket.join(newCode);

        return { lobbyCode: newCode };
    });
}

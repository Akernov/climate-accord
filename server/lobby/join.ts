import { z } from "zod";
import { Server, Socket } from "socket.io";
import { IServerState } from "../state.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode, normalizeName, getDisplayNameFromUser, abandonOldLobby } from "../util.js";

export const joinLobbySchema = z.object({
    code: z.string(),
    playerName: z.string().optional(),
});

export function joinLobby({ io, socket, state }: { io: Server, socket: Socket, state: IServerState }) {
    return withValidation(joinLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const requestedName = normalizeName(data.playerName ?? "");
        const fallbackName = getDisplayNameFromUser(user);
        const name = requestedName || fallbackName;

        const oldCode = state.getPlayerLobby(user.id);
        if (oldCode && oldCode !== code) {
            await abandonOldLobby(io, socket, state, user.id);
        }

        const game = state.getGame(code);
        if (!game) throw new Error("Lobby not found");

        if (game.status !== 'waiting') {
            throw new Error("Game already started.");
        }

        const playerExists = game.players.find(p => p.userId === user.id);

        if (!playerExists) {
            const nameAlreadyTaken = game.players.some((p) => p.name === name);
            if (nameAlreadyTaken) throw new Error("That display name is already in use in this lobby.");

            if (game.players.length >= game.maxPlayers) {
                throw new Error("This lobby is full.");
            }

            state.updateGame(code, {
                players: [...game.players, { userId: user.id, name, isAnonymous: user.is_anonymous || false, isSpectator: false }]
            });
            state.assignPlayerToLobby(user.id, code);
        }

        socket.join(code);
        await broadcastLobbyState(io, code, state);

        return { lobbyCode: code };
    });
}

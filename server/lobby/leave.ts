import { z } from "zod";
import { Server, Socket } from "socket.io";
import { IServerState } from "../state.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode } from "../util.js";

export const leaveLobbySchema = z.object({
  code: z.string(),
});

export function leaveLobby({ io, socket, state }: { io: Server, socket: Socket, state: IServerState }) {
    return withValidation(leaveLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const game = state.getGame(code);
        if (!game) return { success: false };

        const updatedPlayers = game.players.filter(p => p.userId !== user.id);
        
        state.updateGame(code, { players: updatedPlayers });
        state.removePlayerFromLobby(user.id);
        socket.leave(code);

        if (updatedPlayers.length === 0) {
            state.endGame(code);
        } else if (game.host === user.id) {
            state.updateGame(code, { host: updatedPlayers[0].userId });
            await broadcastLobbyState(io, code, state);
        } else {
            await broadcastLobbyState(io, code, state);
        }

        return { success: true };
    });
}

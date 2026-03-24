import { z } from "zod";
import { Server, Socket } from "socket.io";
import { GameManager } from "../game/manager.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode } from "../util.js";

export const leaveLobbySchema = z.object({
  code: z.string(),
});

export function leaveLobby({ io, socket, manager }: { io: Server, socket: Socket, manager: GameManager }) {
    return withValidation(leaveLobbySchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const game = manager.getGame(code);
        if (!game) return { success: false };

        const updatedPlayers = game.players.filter(p => p.userId !== user.id);
        
        manager.updateGame(code, { players: updatedPlayers });
        manager.removePlayerFromLobby(user.id);
        socket.leave(code);

        if (updatedPlayers.length === 0) {
            manager.endGame(code);
        } else if (game.host === user.id) {
            manager.updateGame(code, { host: updatedPlayers[0].userId });
            await broadcastLobbyState(io, code, manager);
        } else {
            await broadcastLobbyState(io, code, manager);
        }

        return { success: true };
    });
}

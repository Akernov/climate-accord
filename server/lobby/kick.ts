import { z } from "zod";
import { Server, Socket } from "socket.io";
import { GameManager } from "../game/manager.js";
import { withValidation, broadcastLobbyState, getSocketUser, normalizeCode } from "../util.js";

export const kickPlayerSchema = z.object({
    code: z.string(),
    targetID: z.string()
});

export function kickPlayer({ io, socket, manager }: { io: Server, socket: Socket, manager: GameManager }) {
    return withValidation(kickPlayerSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);
        const targetID = data.targetID.trim();

        const game = manager.getGame(code);
        if (!game) throw new Error("Lobby not found");

        if (game.host !== user.id) {
            throw new Error("Only the host can kick players.");
        }

        const playerToKick = game.players.find(p => p.userId === targetID);

        if (!playerToKick) throw new Error("Player not found in lobby.");
        if (playerToKick.userId === user.id) throw new Error("Cannot kick yourself.");

        manager.updateGame(code, {
            players: game.players.filter(p => p.userId !== targetID)
        });
        manager.removePlayerFromLobby(targetID);

        io.to(code).emit('lobby:kick_player', { targetID: playerToKick.userId });

        await broadcastLobbyState(io, code, manager);

        return { success: true };
    });
}

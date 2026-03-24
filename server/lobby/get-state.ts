import { z } from "zod";
import { Server, Socket } from "socket.io";
import { GameManager } from "../game/manager.js";
import { withValidation, getSocketUser, normalizeCode } from "../util.js";

export const getLobbyStateSchema = z.object({
    code: z.string(),
});

export function getLobbyState({ io, socket, manager }: { io: Server, socket: Socket, manager: GameManager }) {
    return withValidation(getLobbyStateSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);

        const state = manager.getGame(code);
        if (!state) throw new Error("Lobby not found");

        const playerExists = state.players.some(p => p.userId === user.id);
        if (playerExists) {
            socket.join(code);
        }

        return state;
    });
}

import { z } from "zod";
import { Server, Socket } from "socket.io";
import { IServerState } from "../state.js";
import { withValidation, getSocketUser, normalizeCode } from "../util.js";

export const getLobbyStateSchema = z.object({
    code: z.string(),
});

export function getLobbyState({ io, socket, state }: { io: Server, socket: Socket, state: IServerState }) {
    return withValidation(getLobbyStateSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);

        const game = state.getGame(code);
        if (!game) throw new Error("Lobby not found");

        const playerExists = game.players.some(p => p.userId === user.id);
        if (playerExists) {
            socket.join(code);
        }

        return game;
    });
}

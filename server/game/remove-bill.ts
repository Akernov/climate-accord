import { z } from "zod";
import { Server, Socket } from "socket.io";
import { IServerState } from "../state.js";
import { withValidation, getSocketUser, broadcastLobbyState } from "../util.js";

export const removeBillSchema = z.object({
    billIndex: z.number().min(0).max(10),
});

export function voteRemoveBill({ io, socket, state }: { io: Server, socket: Socket, state: IServerState }) {
    return withValidation(removeBillSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = state.getPlayerLobby(user.id);
        if (!code) throw new Error("Not in a lobby.");

        const game = state.getGame(code);
        if (!game) throw new Error("Game not found.");

        if (game.phase !== 'Discussion') {
            throw new Error("Bill removal is only available during the Discussion phase.");
        }

        if (!(game.activePowerups || []).includes('lobbyist_remove')) {
            throw new Error("No bill removal powerup is active.");
        }

        const player = game.players.find(p => p.userId === user.id);
        if (!player || player.role !== 'lobbyist') {
            throw new Error("Only lobbyists can vote to remove a bill.");
        }

        const updatedVotes = { ...(game.billRemovalVotes || {}), [user.id]: data.billIndex };

        state.updateGame(code, {
            billRemovalVotes: updatedVotes,
        });

        await broadcastLobbyState(io, code, state);

        return { success: true };
    });
}

import { z } from "zod";
import { Server, Socket } from "socket.io";
import { IServerState } from "../state.js";
import { withValidation, getSocketUser, broadcastLobbyState } from "../util.js";

export const voteBillSchema = z.object({
    billIndex: z.number().min(0).max(10), // Assuming max a few bills
});

export function voteBill({ io, socket, state }: { io: Server, socket: Socket, state: IServerState }) {
    return withValidation(voteBillSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        // Identify the lobby
        const code = state.getPlayerLobby(user.id);
        if (!code) throw new Error("You are not in a lobby.");

        const game = state.getGame(code);
        if (!game) throw new Error("Game not found.");

        if (game.oustedPlayers && game.oustedPlayers.includes(user.id)) {
            throw new Error("Spectators cannot vote.");
        }

        if (game.phase !== 'Bill Voting') {
            throw new Error("You can only vote during the Bill Voting phase.");
        }

        // Validate bill index exists
        if (data.billIndex < 0 || !game.bills || data.billIndex >= game.bills.length) {
            throw new Error("Invalid bill selected.");
        }

        const updatedVotes = { ...game.votes, [user.id]: data.billIndex };

        state.updateGame(code, {
            votes: updatedVotes
        });

        await broadcastLobbyState(io, code, state);

        return { success: true };
    });
}

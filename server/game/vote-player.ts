import { z } from "zod";
import { Server, Socket } from "socket.io";
import { GameManager } from "./manager.js";
import { withValidation, getSocketUser, broadcastLobbyState } from "../util.js";

export const votePlayerSchema = z.object({
  targetUserId: z.string().uuid().or(z.string()),
});

export function votePlayer({ io, socket, manager }: { io: Server, socket: Socket, manager: GameManager }) {
    return withValidation(votePlayerSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = manager.getPlayerLobby(user.id);
        if (!code) throw new Error("You are not in a lobby.");

        const game = manager.getGame(code);
        if (!game) throw new Error("Game not found.");
        
        if (game.phase !== 'Player Voting') throw new Error("You can only vote for players during the Player Voting phase.");
        if (game.oustedPlayers && game.oustedPlayers.includes(user.id)) throw new Error("Spectators cannot vote.");

        // Validate target is an active player
        const isValidTarget = game.players.some(p => p.userId === data.targetUserId) 
           && !(game.oustedPlayers && game.oustedPlayers.includes(data.targetUserId));
        
        if (!isValidTarget) throw new Error("Target player is invalid or already a spectator.");

        const updatedVotes = { ...game.playerVotes, [user.id]: data.targetUserId };
        
        manager.updateGame(code, {
            playerVotes: updatedVotes
        });

        await broadcastLobbyState(io, code, manager);
        return { success: true };
    });
}

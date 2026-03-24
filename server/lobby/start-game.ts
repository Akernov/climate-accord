import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { GameManager } from "../game/manager.js";
import { withValidation, getSocketUser, normalizeCode, assignRoles, broadcastLobbyState } from "../util.js";
import { generateBills } from "../game/generateBills.js";
import { transitionToNextPhase } from "../game/next-phase.js";

export const startGameSchema = z.object({
  code: z.string(),
});

const PHASE_DURATION_MS = 20 * 1000; // 20 seconds

export function startGame({ io, socket, db, manager }: { io: Server, socket: Socket, db: DB, manager: GameManager }) {
    return withValidation(startGameSchema, async (data) => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = normalizeCode(data.code);

        const game = manager.getGame(code);
        if (!game) throw new Error("Lobby not found");

        if (game.host !== user.id) {
            throw new Error("Only the host can start the game.");
        }

        if (game.players.length < 2) {
            throw new Error("Need at least 2 players to start.");
        }

        const assignedRolesPlayers = assignRoles(game.players);
        const bills = generateBills();

        // Database logic: purely creating the game record when actual game starts
        const { game_id } = await db.createGame();
        for (const player of assignedRolesPlayers) {
            if (!player.isAnonymous) {
                await db.addPlayerToGame({ gameId: game_id, userId: player.userId });
            }
        }

        manager.updateGame(code, {
            gameId: game_id,
            status: 'started',
            phase: 'Discussion',
            players: assignedRolesPlayers,
            bills: bills,
            phaseEndTime: Date.now() + PHASE_DURATION_MS,
            votes: {},
            activistPoints: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            lobbyistPoints: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            lastPassedBill: null,
            callPlayerVoteIds: [],
            oustedPlayers: [],
            playerVotes: {},
            lastOustedPlayer: null,
        });

        // Broadcast the initial "game started" state
        await broadcastLobbyState(io, code, manager);
        
        console.log(`Lobby ${code} started. First phase transition in ${PHASE_DURATION_MS / 1000}s.`);

        // Kick off the automatic phase transition loop
        setTimeout(() => {
            transitionToNextPhase({ io, manager, code, db });
        }, PHASE_DURATION_MS);

        return { success: true };
    });
}

import { z } from "zod";
import { Server, Socket } from "socket.io";
import { DB } from "../db.js";
import { IServerState } from "../state.js";
import { withValidation, getSocketUser, normalizeCode, assignRoles, broadcastLobbyState } from "../util.js";
import { generateBills } from "../game/generateBills.js";
import { transitionToNextPhase } from "../game/next-phase.js";
import { INITIAL_GRACE_PERIOD_DURATION } from "../game/phases.js";

export const startGameSchema = z.object({
    code: z.string(),
});

export function startGame({ io, socket, db, state: manager }: { io: Server, socket: Socket, db: DB, state: IServerState }) {
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

        // Start with Grace Period to give players time to connect before blind voting
        manager.updateGame(code, {
            gameId: game_id,
            status: 'started',
            phase: 'Grace Period',
            players: assignedRolesPlayers,
            bills: bills,
            phaseEndTime: Date.now() + INITIAL_GRACE_PERIOD_DURATION,
            votes: {},
            activistPoints: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            lobbyistPoints: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            lastPassedBill: null,
            callPlayerVoteIds: [],
            oustedPlayers: [],
            playerVotes: {},
            lastOustedPlayer: null,
            roundCount: 0,
            hiddenActivistPoints: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            hiddenLobbyistPoints: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            activePowerups: [],
            billRemovalVotes: {},
            removedBillIndex: null,
        });

        // Broadcast the initial "game started" state
        await broadcastLobbyState(io, code, manager);

        console.log(`Lobby ${code} started. Initial Grace Period: ${INITIAL_GRACE_PERIOD_DURATION}ms before blind rounds.`);

        // Kick off the automatic phase transition loop
        const timeout = setTimeout(() => {
            transitionToNextPhase({ io, state: manager, code, db });
        }, INITIAL_GRACE_PERIOD_DURATION);

        manager.setPhaseTimer(code, timeout);

        return { success: true };
    });
}

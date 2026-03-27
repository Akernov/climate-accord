import { z } from "zod";
import { Server, Socket } from "socket.io";
import { IServerState } from "../state.js";
import { DB } from "../db.js";
import { withValidation, getSocketUser, broadcastLobbyState } from "../util.js";
import { transitionToNextPhase } from "./next-phase.js";
import { PHASE_DURATIONS } from "./phases.js";

export const callPlayerVoteSchema = z.object({}); // Empty payload, just calling the action

export function callPlayerVote({ io, socket, state, db }: { io: Server, socket: Socket, state: IServerState, db: DB }) {
    return withValidation(callPlayerVoteSchema, async () => {
        const user = getSocketUser(socket);
        if (!user) throw new Error("Unauthorized.");

        const code = state.getPlayerLobby(user.id);
        if (!code) throw new Error("You are not in a lobby.");

        const game = state.getGame(code);
        if (!game) throw new Error("Game not found.");
        if (game.phase !== 'Discussion') throw new Error("You can only call for a vote during Discussion.");
        if (game.oustedPlayers && game.oustedPlayers.includes(user.id)) throw new Error("Spectators cannot call a vote.");

        let callIds = game.callPlayerVoteIds || [];
        if (!callIds.includes(user.id)) {
            callIds = [...callIds, user.id];
        }

        const activePlayerCount = game.players.length - (game.oustedPlayers?.length || 0);
        const majority = Math.floor(activePlayerCount / 2) + 1;

        if (callIds.length >= majority) {
            // Majority reached! Force jump to Player Voting immediately.
            const duration = PHASE_DURATIONS['Player Voting'] || 20 * 1000;
            state.updateGame(code, {
               callPlayerVoteIds: [], // Reset for next time
               phase: 'Player Voting',
               phaseEndTime: Date.now() + duration, 
            });
            await broadcastLobbyState(io, code, state);
            console.log(`Lobby ${code} forces jump to Player Voting via majority.`);

            // Reschedule transition logic to fire when the new phase ends
            const timeout = setTimeout(() => {
                transitionToNextPhase({ io, state, code, db });
            }, duration);
            
            state.setPhaseTimer(code, timeout);
        } else {
            state.updateGame(code, { callPlayerVoteIds: callIds });
            await broadcastLobbyState(io, code, state);
        }

        return { success: true };
    });
}

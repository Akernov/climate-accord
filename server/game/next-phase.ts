import { Server } from "socket.io";
import { IServerState } from "../state.js";
import { DB } from "../db.js";
import { broadcastLobbyState } from "../util.js";
import { LobbyPhase, Lobby } from "../../src/types/game.js";
import { PHASE_DURATIONS } from "./phases.js";
import { handlePlayerVotingResults, handleBillVotingResults, evaluateWinConditions } from "./resolvers.js";

// Defines the order of the phases in your game loop
const PHASE_ORDER: LobbyPhase[] = ['Discussion', 'Bill Voting', 'Player Voting'];

export async function transitionToNextPhase({ io, state, code, db }: { io: Server, state: IServerState, code: string, db: DB }, isForced = false) {
    const game = state.getGame(code);
    if (!game || game.status !== 'started') {
        console.log(`Halting phase transitions for lobby ${code}.`);
        return;
    }

    // Ignore obsolete timers if not forced
    if (!isForced && game.phaseEndTime && Date.now() < game.phaseEndTime - 2000) {
        return;
    }

    const currentPhase = game.phase;
    let newPhase: LobbyPhase = 'Discussion'; // Fallback
    const updates: Partial<Lobby> = {};

    let activistPoints = { ...(game.activistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 }) };
    let lobbyistPoints = { ...(game.lobbyistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 }) };
    let oustedSet = new Set(game.oustedPlayers || []);

    if (currentPhase === 'Discussion') {
        // Resolve lobbyist bill removal powerup before moving to Bill Voting
        if ((game.activePowerups || []).includes('lobbyist_remove') && game.bills && game.bills.length > 0) {
            const removalVotes = game.billRemovalVotes || {};
            const counts: Record<number, number> = {};
            for (const billIdx of Object.values(removalVotes)) {
                counts[billIdx] = (counts[billIdx] || 0) + 1;
            }

            // Find the bill with the most votes (majority wins, ties = no removal)
            let maxCount = 0;
            let removedIdx: number | null = null;
            let isTied = false;
            for (const [idxStr, count] of Object.entries(counts)) {
                if (count > maxCount) {
                    maxCount = count;
                    removedIdx = parseInt(idxStr);
                    isTied = false;
                } else if (count === maxCount) {
                    isTied = true;
                }
            }

            if (removedIdx !== null && !isTied && game.bills[removedIdx]) {
                const updatedBills = [...game.bills];
                updatedBills.splice(removedIdx, 1);
                updates.bills = updatedBills;
                updates.removedBillIndex = removedIdx;
            } else {
                updates.removedBillIndex = null;
            }

            // Remove lobbyist_remove from active powerups
            updates.activePowerups = (game.activePowerups || []).filter(p => p !== 'lobbyist_remove');
            updates.billRemovalVotes = {};
        }

        newPhase = 'Bill Voting';
        updates.callPlayerVoteIds = [];
    } else if (currentPhase === 'Player Voting') {
        handlePlayerVotingResults(game, updates, oustedSet);
        newPhase = 'Grace Period';
    } else if (currentPhase === 'Grace Period') {
        newPhase = 'Bill Voting';
    } else if (currentPhase === 'Bill Voting') {
        // Clear activist vision powerup after the Bill Voting round ends
        if ((game.activePowerups || []).includes('activist_vision')) {
            updates.activePowerups = (game.activePowerups || []).filter(p => p !== 'activist_vision');
        }
        handleBillVotingResults(game, updates, activistPoints, lobbyistPoints);
        updates.removedBillIndex = null;
        newPhase = 'Discussion';
    }

    evaluateWinConditions(game, updates, activistPoints, lobbyistPoints, oustedSet);

    // Apply next phase schedule
    const duration = PHASE_DURATIONS[newPhase] || 20000;
    updates.phase = newPhase;
    updates.phaseEndTime = Date.now() + duration;

    state.updateGame(code, updates);
    await broadcastLobbyState(io, code, state);

    console.log(`Lobby ${code} transitioned to ${newPhase}. Win Status: ${updates.status}`);

    if (updates.status === 'ended') {
         console.log(`Lobby ${code} GAME OVER. Winner: ${updates.winnerFaction}`);
         if (game.gameId && updates.winnerFaction) {
             try {
                 await db.setWinner({ gameId: game.gameId, winnerFaction: updates.winnerFaction as 'advocate' | 'lobbyist' });
             } catch (e) {
                 console.error("Failed to commit final game record to DB", e);
             }
         }
          return;
    }

    // Schedule the next phase jump using the authoritative ServerState timer encapsulation
    const timeout = setTimeout(() => {
        transitionToNextPhase({ io, state, code, db });
    }, duration);
    
    state.setPhaseTimer(code, timeout);
}

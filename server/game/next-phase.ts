import { Server } from "socket.io";
import { GameManager } from "./manager.js";
import { DB } from "../db.js";
import { broadcastLobbyState } from "../util.js";
import { LobbyPhase, Lobby } from "../../src/types/game.js";
import { generateBills } from "./generateBills.js";

// Defines the order of the phases in your game loop
const PHASE_ORDER: LobbyPhase[] = ['Discussion', 'Bill Voting', 'Player Voting'];
const PHASE_DURATION_MS = 20 * 1000; // 20 seconds

export async function transitionToNextPhase({ io, manager, code, db }: { io: Server, manager: GameManager, code: string, db: DB }, isForced = false) {
    const game = manager.getGame(code);
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
    let nextDurationMs = 20 * 1000;
    const updates: Partial<Lobby> = {};

    let activistPoints = { ...(game.activistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 }) };
    let lobbyistPoints = { ...(game.lobbyistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 }) };
    let oustedSet = new Set(game.oustedPlayers || []);

    if (currentPhase === 'Discussion') {
        // Naturally shifting out of Discussion
        newPhase = 'Bill Voting';
        updates.callPlayerVoteIds = []; // clear any pending calls
    } else if (currentPhase === 'Player Voting') {
        handlePlayerVotingResults(game, updates, oustedSet);
        newPhase = 'Grace Period';
        nextDurationMs = 8 * 1000; // 8 second Grace Period
    } else if (currentPhase === 'Grace Period') {
        newPhase = 'Bill Voting';
    } else if (currentPhase === 'Bill Voting') {
        handleBillVotingResults(game, updates, activistPoints, lobbyistPoints);
        newPhase = 'Discussion';
        nextDurationMs = 20 * 1000;
    }

    evaluateWinConditions(game, updates, activistPoints, lobbyistPoints, oustedSet);

    // Apply next phase schedule
    updates.phase = newPhase;
    updates.phaseEndTime = Date.now() + nextDurationMs;

    manager.updateGame(code, updates);
    await broadcastLobbyState(io, code, manager);

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

    setTimeout(() => {
        transitionToNextPhase({ io, manager, code, db });
    }, nextDurationMs);
}

// --- HELPER FUNCTIONS ---

function handlePlayerVotingResults(game: Lobby, updates: Partial<Lobby>, oustedSet: Set<string>) {
    const pVotes = game.playerVotes || {};
    const counts: Record<string, number> = {};
    for (const targetId of Object.values(pVotes)) {
        counts[targetId] = (counts[targetId] || 0) + 1;
    }
    
    let oustedId = null;
    let max = 0;
    for (const [tId, c] of Object.entries(counts)) {
        if (c > max) { max = c; oustedId = tId; }
    }

    if (oustedId) {
        oustedSet.add(oustedId);
        updates.oustedPlayers = Array.from(oustedSet);
        updates.lastOustedPlayer = oustedId;
    }
    updates.playerVotes = {};
}

function handleBillVotingResults(game: Lobby, updates: Partial<Lobby>, activistPoints: Record<number, number>, lobbyistPoints: Record<number, number>) {
    const votes = game.votes || {};
    const voteCounts: Record<number, number> = {};
    for (const billIdx of Object.values(votes)) {
        voteCounts[billIdx] = (voteCounts[billIdx] || 0) + 1;
    }

    let winningBillIdx = -1;
    let maxVotes = -1;
    for (const [idxStr, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) { maxVotes = count; winningBillIdx = parseInt(idxStr); }
    }

    if (winningBillIdx !== -1 && game.bills && game.bills[winningBillIdx]) {
        const winningBill = game.bills[winningBillIdx];
        updates.lastPassedBill = winningBill;

        if (winningBill.activistCategory) activistPoints[winningBill.activistCategory] += winningBill.activistScore;
        if (winningBill.lobbyistCategory) lobbyistPoints[winningBill.lobbyistCategory] += winningBill.lobbyistScore;

        updates.activistPoints = activistPoints;
        updates.lobbyistPoints = lobbyistPoints;
    }

    updates.votes = {};
    updates.bills = generateBills();
}

function evaluateWinConditions(game: Lobby, updates: Partial<Lobby>, activistPoints: Record<number, number>, lobbyistPoints: Record<number, number>, oustedSet: Set<string>) {
    // Evaluate Win Conditions
    // 1. Point Based conditions
    const activistsWinPoints = [1,2,3,4,5].every(cat => activistPoints[cat] >= 5);
    const lobbyistsWinPoints = [1,2,3,4,5].filter(cat => lobbyistPoints[cat] >= 7).length >= 3;

    // 2. Population Based conditions (Ousted players don't count)
    const activePlayers = game.players.filter(p => !oustedSet.has(p.userId));
    const activeActivists = activePlayers.filter(p => p.role === 'advocate').length;
    const activeLobbyists = activePlayers.filter(p => p.role === 'lobbyist').length;

    const lobbyistsWinPop = activeActivists === activeLobbyists; // Same number
    const activistsWinPop = activeLobbyists === 0;               // No lobbyists left

    if (lobbyistsWinPoints || lobbyistsWinPop) {
        updates.status = 'ended';
        updates.winnerFaction = 'lobbyist';
    } else if (activistsWinPoints || activistsWinPop) {
        updates.status = 'ended';
        updates.winnerFaction = 'advocate';
    }
}

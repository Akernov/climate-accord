import { Lobby } from "../../src/types/game.js";
import { generateBills } from "./generateBills.js";

export function handlePlayerVotingResults(game: Lobby, updates: Partial<Lobby>, oustedSet: Set<string>) {
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

export function handleBillVotingResults(game: Lobby, updates: Partial<Lobby>, activistPoints: Record<number, number>, lobbyistPoints: Record<number, number>) {
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

export function evaluateWinConditions(game: Lobby, updates: Partial<Lobby>, activistPoints: Record<number, number>, lobbyistPoints: Record<number, number>, oustedSet: Set<string>) {
    // Evaluate Win Conditions
    // 1. Point Based conditions
    const activistsWinPoints = [1, 2, 3, 4, 5].every(cat => activistPoints[cat] >= 5);
    const lobbyistsWinPoints = [1, 2, 3, 4, 5].filter(cat => lobbyistPoints[cat] >= 7).length >= 3;

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

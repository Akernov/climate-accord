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

        const voterNames = Object.entries(votes)
            .filter(([userId, billIdx]) => billIdx === winningBillIdx)
            .map(([userId]) => {
                const player = game.players.find(p => p.userId === userId);
                return player ? player.name : "Unknown";
            });

        updates.lastPassedBillVoters = voterNames;

        const isBlindRound = game.roundCount < 2;

        if (isBlindRound) {
            // Route points into hidden pools during the first 2 rounds
            const hiddenAct = { ...(game.hiddenActivistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 }) };
            const hiddenLob = { ...(game.hiddenLobbyistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 }) };
            if (winningBill.activistCategory) hiddenAct[winningBill.activistCategory] += winningBill.activistScore;
            if (winningBill.lobbyistCategory) hiddenLob[winningBill.lobbyistCategory] += winningBill.lobbyistScore;
            updates.hiddenActivistPoints = hiddenAct;
            updates.hiddenLobbyistPoints = hiddenLob;
        } else {
            // Normal: route points into public pools
            if (winningBill.activistCategory) activistPoints[winningBill.activistCategory] += winningBill.activistScore;
            if (winningBill.lobbyistCategory) lobbyistPoints[winningBill.lobbyistCategory] += winningBill.lobbyistScore;
            updates.activistPoints = activistPoints;
            updates.lobbyistPoints = lobbyistPoints;
        }
    }

    updates.roundCount = game.roundCount + 1;
    updates.votes = {};
    updates.bills = generateBills();
}

export function evaluateWinConditions(game: Lobby, updates: Partial<Lobby>, activistPoints: Record<number, number>, lobbyistPoints: Record<number, number>, oustedSet: Set<string>) {
    // Merge public + hidden pools for accurate win condition evaluation
    const hiddenAct = updates.hiddenActivistPoints || game.hiddenActivistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 };
    const hiddenLob = updates.hiddenLobbyistPoints || game.hiddenLobbyistPoints || { 1:0, 2:0, 3:0, 4:0, 5:0 };

    const totalAct: Record<number, number> = {};
    const totalLob: Record<number, number> = {};
    for (const cat of [1, 2, 3, 4, 5]) {
        totalAct[cat] = (activistPoints[cat] || 0) + (hiddenAct[cat] || 0);
        totalLob[cat] = (lobbyistPoints[cat] || 0) + (hiddenLob[cat] || 0);
    }

    // 1. Point Based conditions (using merged totals)
    const activistsWinPoints = [1, 2, 3, 4, 5].every(cat => totalAct[cat] >= 5);
    const lobbyistsWinPoints = [1, 2, 3, 4, 5].filter(cat => totalLob[cat] >= 7).length >= 3;

    // 2. Population Based conditions
    const activePlayers = game.players.filter(p => !oustedSet.has(p.userId));
    const activeActivists = activePlayers.filter(p => p.role === 'advocate').length;
    const activeLobbyists = activePlayers.filter(p => p.role === 'lobbyist').length;

    const lobbyistsWinPop = activeActivists === activeLobbyists;
    const activistsWinPop = activeLobbyists === 0;

    if (lobbyistsWinPoints || lobbyistsWinPop) {
        updates.status = 'ended';
        updates.winnerFaction = 'lobbyist';
    } else if (activistsWinPoints || activistsWinPop) {
        updates.status = 'ended';
        updates.winnerFaction = 'advocate';
    }

    // Only check powerups if the game hasn't ended
    if (updates.status !== 'ended') {
        const powerups = checkOvershootPowerups(totalAct, totalLob);
        if (powerups.length > 0) {
            updates.activePowerups = powerups;
            updates.billRemovalVotes = {};
            updates.removedBillIndex = null;
        }
    }
}

export function checkOvershootPowerups(
    totalAct: Record<number, number>,
    totalLob: Record<number, number>
): ('activist_vision' | 'lobbyist_remove')[] {
    const powerups: ('activist_vision' | 'lobbyist_remove')[] = [];

    // Activist overshoot (any cat >= 6) → lobbyists get bill removal
    const activistOvershoot = [1, 2, 3, 4, 5].some(cat => totalAct[cat] >= 6);
    // Lobbyist overshoot (any cat >= 8) → activists get full bill vision
    const lobbyistOvershoot = [1, 2, 3, 4, 5].some(cat => totalLob[cat] >= 8);

    if (lobbyistOvershoot) powerups.push('activist_vision');
    if (activistOvershoot) powerups.push('lobbyist_remove');

    return powerups;
}

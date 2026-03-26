import { LobbyPhase } from "../../src/types/game.js";

/**
 * Authoritative durations for each game phase, in milliseconds.
 */
export const PHASE_DURATIONS: Record<Exclude<LobbyPhase, null>, number> = {
    'Discussion': 30 * 1000,
    'Bill Voting': 10 * 1000,
    'Player Voting': 10 * 1000,
    'Grace Period': 5 * 1000,
};

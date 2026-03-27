import { SupabaseClient } from "@supabase/supabase-js";

export class DB {
    supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async createGame() {
        const { data, error } = await this.supabase
            .from('games')
            .insert([{}])
            .select('id')
            .single();

        if (error) throw new Error(error.message);
        return { game_id: data.id };
    }

    async addPlayerToGame({ gameId, userId }: { gameId: string; userId: string; }) {
        const { error } = await this.supabase
            .from('game_players')
            .insert([{ game_id: gameId, user_id: userId }]);

        if (error) throw new Error(error.message);
    }

    async setWinner({ gameId, winnerFaction }: { gameId: string; winnerFaction: 'advocate' | 'lobbyist' }) {
        const { error } = await this.supabase
            .from('games')
            .update({ winner_faction: winnerFaction })
            .eq('id', gameId);

        if (error) throw new Error(error.message);
    }
}

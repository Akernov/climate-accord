import { SupabaseClient } from "@supabase/supabase-js";

export class DB {
    supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async createLobby({ code, hostId, maxPlayers }: { code: string; hostId: string; maxPlayers: number }) {
        const { data, error } = await this.supabase
            .from('games')
            .insert([{ lobby_code: code, host_user_id: hostId, max_players: maxPlayers, status: 'lobby' }])
            .select('id, lobby_code')
            .single();

        if (error) throw new Error(error.message);
        return { game_id: data.id, lobby_code: data.lobby_code };
    }

    async getGameByCode({ code }: { code: string }) {
        const { data, error } = await this.supabase
            .from('games')
            .select('id, lobby_code, host_user_id, status, max_players, max_rounds, current_round')
            .eq('lobby_code', code)
            .in('status', ['lobby', 'in_progress'])
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) return null;
        
        return {
            game_id: data.id,
            lobby_code: data.lobby_code,
            host_user_id: data.host_user_id,
            status: data.status,
            max_players: data.max_players,
            max_rounds: data.max_rounds,
            current_round: data.current_round
        };
    }

    async addPlayerToGame({ gameId, userId, displayName }: { gameId: string; userId: string; displayName: string }) {
        const { error } = await this.supabase
            .from('game_players')
            .upsert({ 
                game_id: gameId, 
                user_id: userId, 
                display_name_snapshot: displayName 
            }, {
                onConflict: 'game_id,user_id'
            });

        if (error) throw new Error(error.message);
        return true;
    }

    async getPlayersInGame({ gameId }: { gameId: string }) {
        const { data, error } = await this.supabase
            .from('game_players')
            .select('user_id, display_name_snapshot, score, role')
            .eq('game_id', gameId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        
        return data.map(row => ({
            userId: row.user_id,
            name: row.display_name_snapshot,
            score: row.score,
            role: row.role
        }));
    }
    
    async getLobbyState({ code }: { code: string }) {
        const game = await this.getGameByCode({ code });
        if (!game) return null;
        const players = await this.getPlayersInGame({ gameId: game.game_id });
        const hostPlayer = players.find((p: { userId: string; name: string; score: number; role: string }) => p.userId === game.host_user_id);
        
        return {
            code: game.lobby_code,
            host: game.host_user_id,
            started: game.status === 'in_progress',
            phase: game.status === 'in_progress' ? 'playing' : 'waiting',
            round: game.current_round,
            maxRounds: game.max_rounds,
            maxPlayers: game.max_players,
            players
        };
    }

    async removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }) {
        const { data, error } = await this.supabase
            .from('game_players')
            .delete()
            .match({ game_id: gameId, user_id: userId })
            .select('display_name_snapshot')
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message); 
        return data?.display_name_snapshot;
    }

    async deleteLobby({ gameId }: { gameId: string }) {
        const { error } = await this.supabase
            .from('games')
            .delete()
            .eq('id', gameId);

        if (error) throw new Error(error.message);
    }

    async updateLobbyHost({ gameId, newHostId }: { gameId: string; newHostId: string }) {
        const { error } = await this.supabase
            .from('games')
            .update({ host_user_id: newHostId })
            .eq('id', gameId);

        if (error) throw new Error(error.message);
    }

    async startGame({ gameId }: { gameId: string }) {
        const { error } = await this.supabase
            .from('games')
            .update({ status: 'in_progress', current_round: 1 })
            .eq('id', gameId);

        if (error) throw new Error(error.message);
    }

    async assignRoles({ gameId, updates }: { gameId: string; updates: {userId: string, role: string}[] }) {
        for (const u of updates) {
            const { error } = await this.supabase
                .from('game_players')
                .update({ role: u.role })
                .match({ game_id: gameId, user_id: u.userId });
            
            if (error) throw new Error(error.message);
        }
    }
}

import { SupabaseClient } from "@supabase/supabase-js";
import type { Player, Lobby, Role } from "../src/types/game";

export class DB {
    supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async createLobby({ code, hostId, maxPlayers }: { code: string; hostId: string; maxPlayers: number }) {
        const { data, error } = await this.supabase
            .from('games')
            .insert([{ lobby_code: code, host_user_id: hostId, max_players: maxPlayers, status: 'waiting' }])
            .select('id, lobby_code')
            .single();

        if (error) throw new Error(error.message);
        return { game_id: data.id, lobby_code: data.lobby_code };
    }

    async getGameByCode({ code }: { code: string }) {
        const { data, error } = await this.supabase
            .from('games')
            .select('id, lobby_code, host_user_id, status, max_players, winner_faction, phase')
            .eq('lobby_code', code)
            .in('status', ['waiting', 'started', 'ended'])
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
            winner_faction: data.winner_faction,
            phase: data.phase
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

    async getPlayersInGame({ gameId }: { gameId: string }): Promise<Player[]> {
        const { data, error } = await this.supabase
            .from('game_players')
            .select('user_id, display_name_snapshot, role')
            .eq('game_id', gameId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        
        return data.map(row => ({
            userId: row.user_id,
            name: row.display_name_snapshot,
            role: row.role as Role
        }));
    }
    
    async getLobbyState({ code }: { code: string }): Promise<Lobby | null> {
        const game = await this.getGameByCode({ code });
        if (!game) return null;
        const players = await this.getPlayersInGame({ gameId: game.game_id });
        
        return {
            code: game.lobby_code,
            host: game.host_user_id,
            status: game.status,
            phase: game.phase,
            winnerFaction: game.winner_faction,
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

    async assignRoles({ gameId, updates }: { gameId: string; updates: {userId: string, role: string}[] }) {
        for (const u of updates) {
            const { error } = await this.supabase
                .from('game_players')
                .update({ role: u.role })
                .match({ game_id: gameId, user_id: u.userId });
            
            if (error) throw new Error(error.message);
        }
    }

    async updateGameStatus({ gameId, status, phase }: { gameId: string; status?: 'waiting' | 'started' | 'ended'; phase?: 'Bill Voting' | 'Discussion' | 'Player Voting' | null }) {
        const updateData: {
            status?: 'waiting' | 'started' | 'ended';
            phase?: 'Bill Voting' | 'Discussion' | 'Player Voting' | null;
        } = {};
        if (status !== undefined) updateData.status = status;
        if (phase !== undefined) updateData.phase = phase;

        const { error } = await this.supabase
            .from('games')
            .update(updateData)
            .eq('id', gameId);
            
        if (error) throw new Error(error.message);
    }
}

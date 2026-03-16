import { Pool, PoolClient } from "pg";
import { doInTransaction } from "./util.js";

export class DB {
    pgPool: Pool;

    constructor(pgPool: Pool) {
        this.pgPool = pgPool;
    }

    createLobby({ code, hostId, maxPlayers }: { code: string; hostId: string; maxPlayers: number }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            const gameResult = await client.query(
                `INSERT INTO public.games (lobby_code, host_user_id, max_players, status)
                 VALUES ($1, $2, $3, 'lobby')
                 RETURNING id as game_id, lobby_code`,
                [code, hostId, maxPlayers]
            );

            const newGame = gameResult.rows[0];
            return newGame;
        });
    }

    getGameByCode({ code }: { code: string }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            const result = await client.query(
                `SELECT id as game_id, lobby_code, host_user_id, status, max_players, max_rounds, current_round 
                 FROM public.games WHERE lobby_code = $1 AND status IN ('lobby', 'in_progress') LIMIT 1`,
                [code]
            );
            return result.rows[0];
        });
    }

    addPlayerToGame({ gameId, userId, displayName }: { gameId: string; userId: string; displayName: string }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            await client.query(
                `INSERT INTO public.game_players (game_id, user_id, display_name_snapshot)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (game_id, user_id) DO UPDATE SET display_name_snapshot = EXCLUDED.display_name_snapshot`,
                [gameId, userId, displayName]
            );
            return true;
        });
    }

    getPlayersInGame({ gameId }: { gameId: string }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            const result = await client.query(
                `SELECT gp.user_id, gp.display_name_snapshot as name, gp.score, gp.role 
                 FROM public.game_players gp
                 WHERE gp.game_id = $1
                 ORDER BY gp.created_at ASC`,
                [gameId]
            );
            return result.rows.map(row => ({
                userId: row.user_id,
                name: row.name,
                score: row.score,
                role: row.role
            }));
        });
    }
    
    getLobbyState({ code }: { code: string }) {
        return doInTransaction(this.pgPool, async (_client) => {
            const game = await this.getGameByCode({ code });
            if (!game) return null;
            const players = await this.getPlayersInGame({ gameId: game.game_id });
            const hostPlayer = players.find((p: { userId: string; name: string; score: number; role: string }) => p.userId === game.host_user_id);
            return {
                code: game.lobby_code,
                host: hostPlayer?.name || game.host_user_id,
                started: game.status === 'in_progress',
                phase: game.status === 'in_progress' ? 'playing' : 'waiting',
                round: game.current_round,
                maxRounds: game.max_rounds,
                maxPlayers: game.max_players,
                players
            };
        });
    }

    removePlayerFromGame({ gameId, userId }: { gameId: string; userId: string }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            const result = await client.query(
                `DELETE FROM public.game_players WHERE game_id = $1 AND user_id = $2 RETURNING display_name_snapshot`,
                [gameId, userId]
            );
            return result.rows[0]?.display_name_snapshot;
        });
    }

    deleteLobby({ gameId }: { gameId: string }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            await client.query(`DELETE FROM public.games WHERE id = $1`, [gameId]);
        });
    }

    updateLobbyHost({ gameId, newHostId }: { gameId: string; newHostId: string }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            await client.query(
                `UPDATE public.games SET host_user_id = $1 WHERE id = $2`,
                [newHostId, gameId]
            );
        });
    }

    startGame({ gameId }: { gameId: string }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            await client.query(
                `UPDATE public.games SET status = 'in_progress', current_round = 1 WHERE id = $1`,
                [gameId]
            );
        });
    }

    assignRoles({ gameId, updates }: { gameId: string; updates: {userId: string, role: string}[] }) {
        return doInTransaction(this.pgPool, async (client: PoolClient) => {
            for (const u of updates) {
                await client.query(
                    `UPDATE public.game_players SET role = $1 WHERE game_id = $2 AND user_id = $3`,
                    [u.role, gameId, u.userId]
                );
            }
        });
    }
}

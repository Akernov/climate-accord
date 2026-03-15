import sql from "sql-bricks-postgres";
import { Pool } from "pg";
import { doInTransaction } from "./util.js";

const { select, ilike, eq, not, lt, gt } = sql;

export class DB {
    pgPool: Pool;

    constructor(pgPool: Pool) { 
        this.pgPool = pgPool;
    }

    createTempPlayer({ username }: { username: string; }) {
        return doInTransaction(this.pgPool, async (client) => {
        const results = await client.query(
                "INSERT INTO players (username, password_hash, temp) VALUES ($1, $2, $3) RETURNING player_id",
                [username, 'password', true]
            );
            
            return results.rows[0].player_id;
        });
    }

    deleteTempPlayer({ username }: { username: string; }) {
        return doInTransaction(this.pgPool, async (client) => {
            const result = await client.query(
                "DELETE FROM players WHERE username = $1 AND temp = $2",
                [username, true]
            );

            return result.rowCount? result.rowCount : 0;
        });
    }

    createLobby({ code, hostId, maxPlayers }: { code: string; hostId: number; maxPlayers: number;}) {
        return doInTransaction(this.pgPool, async (client) => {
            const gameResult = await client.query(
                `INSERT INTO games (code, host_id, status, max_players, player_count) 
                VALUES ($1, $2, 'waiting', $3, 1) 
                RETURNING game_id, code`,
                [code, hostId, maxPlayers]
            );

            const newGame = gameResult.rows[0];
            
            await client.query(
                `INSERT INTO game_players (game_id, player_id, role)
                 VALUES ($1, $2, 'unassigned')`,
                [newGame.game_id, hostId]
            );

            return newGame;
        });
    }

    getGameByCode({ code }: { code: string;}) {
        return doInTransaction(this.pgPool, async (client) => {
            const result = await client.query(
                `SELECT * FROM games WHERE code = $1`,
                [code]
            );

            return result.rows[0];
        });
    }

    getPlayerInGameByUsername({ gameId, username }: { gameId: number; username: string; }) {
        return doInTransaction(this.pgPool, async (client) => {
            const result = await client.query(
                `SELECT p.player_id 
                 FROM game_players gp 
                 JOIN players p ON gp.player_id = p.player_id 
                 WHERE gp.game_id = $1 AND p.username = $2 LIMIT 1`,
                [gameId, username]
            );
            return result.rows[0];
        });
    }

    getHostInGameByID({ gameId, playerId }: { gameId: number; playerId: number; }) {
        return doInTransaction(this.pgPool, async (client) => {
            const result = await client.query(
                `SELECT p.player_id 
                 FROM game_players gp 
                 JOIN players p ON gp.player_id = p.player_id 
                 WHERE gp.game_id = $1 AND g.host_id = $2 LIMIT 1`,
                [gameId, playerId]
            );
            return result.rows[0];
        }); 
    }

    addPlayerToGame({ gameId, playerId }: { gameId: number; playerId: number; }) {
        return doInTransaction(this.pgPool, async (client) => {
            await client.query(
                `INSERT INTO game_players (game_id, player_id, role)
                 VALUES ($1, $2, 'unassigned')`,
                [gameId, playerId]
            );

            await client.query(
                `UPDATE games 
                 SET player_count = player_count + 1 
                 WHERE game_id = $1`,
                [gameId]
            );
            
            return true;
        });
    }

    getPlayersInGame({ gameId }: { gameId: number; }) {
        return doInTransaction(this.pgPool, async (client) => {
            const result = await client.query(
                `SELECT p.username, gp.role
                 FROM game_players gp 
                 JOIN players p ON gp.player_id = p.player_id 
                 WHERE gp.game_id = $1`,
                [gameId]
            );

            return result.rows; 
        });
    }

    getHostUsername({ gameId }: { gameId:number }) {
        return doInTransaction(this.pgPool, async (client) => {
          const res = await client.query(`
            SELECT p.username 
            FROM games g
            JOIN players p ON g.host_id = p.player_id
            WHERE g.game_id = $1
          `, [gameId]);

          return res.rows[0]?.username ?? null;
        });
      }

    resolvePlayerJoin({ gameId, username, maxPlayers, currentCount }: 
        { gameId: number; username: string; maxPlayers: number; currentCount: number; }) {
        return doInTransaction(this.pgPool, async (client) => {
            const existing = await this.getPlayerInGameByUsername({ gameId, username });
            if (existing) {
                return { playerId: existing.player_id, isNew: false };
            }

            if (currentCount >= maxPlayers) {
                throw new Error("This lobby is full.");
            }

            const playerId = await this.createTempPlayer({ username });
            await this.addPlayerToGame({ gameId, playerId });
            
            return { playerId, isNew: true };
        });
    }
}
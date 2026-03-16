import express from 'express';
import http from 'http';
import pg from "pg";
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { DB } from "./db.js";
import { createAdapter } from "@socket.io/postgres-adapter";
import { readBearerToken, verifyAccessToken } from "./supabase/verifier.js";

import { createLobby } from './lobby/create.js';
import { joinLobby } from './lobby/join.js';
import { getLobbyState } from './lobby/get-state.js';
import { leaveLobby } from './lobby/leave.js';
import { kickPlayer } from './lobby/kick.js';
import { startGame } from './lobby/start-game.js';

dotenv.config();

// Define the shape of your config object
interface AppConfig {
    postgres: pg.PoolConfig;
    cors: cors.CorsOptions;
}

export async function createApp(httpServer: http.Server, config: AppConfig) {
    const pgPool = new pg.Pool(config.postgres);

    const app = express();
    // Attach express to the http server
    httpServer.on("request", app);
    app.use(cors(config.cors));

    // Setup Socket.IO with the Postgres adapter
    const io = new Server(httpServer, {
        cors: config.cors,
        adapter: createAdapter(pgPool),
    });

    const db = new DB(pgPool);

    // Auth Middleware
    io.use(async (socket, next) => {
        try {
            const tokenFromAuth = typeof socket.handshake.auth?.token === "string"
                ? socket.handshake.auth.token
                : "";
            const tokenFromHeader = readBearerToken(socket.handshake.headers.authorization);
            const accessToken = tokenFromAuth || tokenFromHeader;

            if (!accessToken) {
                next(new Error("Unauthorized: missing access token."));
                return;
            }

            const verified = await verifyAccessToken(accessToken);
            if (!verified.user) {
                next(new Error(`Unauthorized: ${verified.error}`));
                return;
            }

            socket.data.user = verified.user;
            next();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Auth verification failed.";
            next(new Error(`Unauthorized: ${message}`));
        }
    });

    io.on('connection', (socket) => {
        console.log('--- New Connection ---');
        console.log('User connected:', socket.id);

        socket.on("lobby:create", createLobby({ io, socket, db }));
        socket.on("lobby:join", joinLobby({ io, socket, db }));
        socket.on("lobby:get_state", getLobbyState({ io, socket, db }));
        socket.on("lobby:leave", leaveLobby({ io, socket, db }));
        socket.on("lobby:kick_player", kickPlayer({ io, socket, db }));
        socket.on("lobby:start_game", startGame({ io, socket, db }));

        // Graceful disconnect logic could be implemented if tracking presence via connection state
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return {
        pgPool,
        async close() {
            io.close();
            await pgPool.end();
        },
    };
}

const httpServer = http.createServer();
const PORT = process.env.PORT || 3001;

const config = {
    postgres: {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    },
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
};

createApp(httpServer, config).then(() => {
    httpServer.listen(PORT, () => {
        console.log(`>>>> Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start server:", err);
});

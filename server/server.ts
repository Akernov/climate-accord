import express from 'express';
import http from 'http';
import { createClient } from "@supabase/supabase-js";
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { DB } from "./db.js";
import { GameManager } from "./game/manager.js";
import { readBearerToken, verifyAccessToken } from "./supabase/verifier.js";
import { trackSocket, untrackSocket } from "./util.js";

import { createLobby } from './lobby/create.js';
import { joinLobby } from './lobby/join.js';
import { getLobbyState } from './lobby/get-state.js';
import { leaveLobby } from './lobby/leave.js';
import { kickPlayer } from './lobby/kick.js';
import { startGame } from './lobby/start-game.js';
import { voteBill } from './game/vote.js';
import { callPlayerVote } from './game/call-player-vote.js';
import { votePlayer } from './game/vote-player.js';

dotenv.config();

// Define the shape of your config object
interface AppConfig {
    cors: cors.CorsOptions;
}

export async function createApp(httpServer: http.Server, config: AppConfig) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key missing from environment.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const app = express();
    // Attach express to the http server
    httpServer.on("request", app);
    app.use(cors(config.cors));

    // Setup Socket.IO
    const io = new Server(httpServer, {
        cors: config.cors,
    });

    const db = new DB(supabase);
    const manager = new GameManager();

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

        const user = socket.data.user;
        if (user) {
            trackSocket(user.id, socket.id);
            // Auto-reconnect if they are already in an active game memory map
            const activeCode = manager.getPlayerLobby(user.id);
            if (activeCode) {
                console.log(`Reconnecting user ${user.id} to lobby ${activeCode}`);
                socket.join(activeCode);
            }
        }

        socket.on("lobby:create", createLobby({ io, socket, manager }));
        socket.on("lobby:join", joinLobby({ io, socket, manager }));
        socket.on("lobby:get_state", getLobbyState({ io, socket, manager }));
        socket.on("lobby:leave", leaveLobby({ io, socket, manager }));
        socket.on("lobby:kick_player", kickPlayer({ io, socket, manager }));
        socket.on("lobby:start_game", startGame({ io, socket, db, manager }));
        socket.on("game:vote_bill", voteBill({ io, socket, manager }));
        socket.on("game:call_player_vote", callPlayerVote({ io, socket, manager, db }));
        socket.on("game:vote_player", votePlayer({ io, socket, manager }));

        // Graceful disconnect logic could be implemented if tracking presence via connection state
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            if (user) {
                untrackSocket(user.id);
            }
        });
    });

    return {
        supabase,
        async close() {
            io.close();
        },
    };
}

const httpServer = http.createServer();
const PORT = process.env.PORT || 3001;

const config = {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
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

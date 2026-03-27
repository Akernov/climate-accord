import express from 'express';
import http from 'http';
import { createClient } from "@supabase/supabase-js";
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { DB } from "./db.js";
import { ServerState } from "./state.js";
import { readBearerToken, verifyAccessToken } from "./supabase/verifier.js";

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

/** 
 * Class which creates server application for backend (runs only once)
 * @param httpServer - HTTP server
 * @param config - Server configuration
 */
export async function createApp(httpServer: http.Server, config: AppConfig) {
    // Supabase setup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key missing from environment.');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const db = new DB(supabase);

    // Express setup
    const app = express();
    // Attach express to the http server
    httpServer.on("request", app);
    app.use(cors(config.cors));

    // Socket.IO setup
    const io = new Server(httpServer, {
        cors: config.cors,
    });

    // Game state
    const state = new ServerState();

    /** 
     * Socket.IO middleware for authentication
     * All users must pass through this before connecting
     * @param socket - Socket.IO socket
     * @param next - Socket.IO/Next middleware
     */
    io.use(async (socket, next) => {
        try {
            // Get token from Socket.IO handshake auth (via frontend)
            const tokenFromAuth = typeof socket.handshake.auth?.token === "string"
                ? socket.handshake.auth.token
                : "";
            // Get token from HTTP headers (via curl, etc.)
            const tokenFromHeader = readBearerToken(socket.handshake.headers.authorization);
            // If either token is present, use it
            const accessToken = tokenFromAuth || tokenFromHeader;

            // If an access token is not provided, reject the connection
            if (!accessToken) {
                next(new Error("Unauthorized: missing access token."));
                return;
            }

            // Verify the access token
            const verified = await verifyAccessToken(accessToken);
            // If the access token is not valid, reject the connection
            if (!verified.user) {
                next(new Error(`Unauthorized: ${verified.error}`));
                return;
            }

            // Attach the verified user to the socket
            socket.data.user = verified.user;
            // And accept the connection
            next();
        } catch (error) {
            // If an error occurs, reject the connection
            const message = error instanceof Error ? error.message : "Auth verification failed.";
            next(new Error(`Unauthorized: ${message}`));
        }
    });

    /** 
     * Socket.IO connection handler
     * @param socket - Socket.IO socket
     */
    io.on('connection', (socket) => {
        // Log new connections
        console.log('--- New Connection ---');
        console.log('User connected:', socket.id);

        // Get user from socket data (set by auth middleware)
        const user = socket.data.user;

        // If there is a valid user, track the socket
        if (user) {
            state.trackSocket(user.id, socket.id);
            // Auto-reconnect if they are already in an active game memory map
            const activeCode = state.getPlayerLobby(user.id);
            if (activeCode) {
                console.log(`Reconnecting user ${user.id} to lobby ${activeCode}`);
                socket.join(activeCode);
            }
        }

        socket.on("lobby:create", createLobby({ io, socket, state }));
        socket.on("lobby:join", joinLobby({ io, socket, state }));
        socket.on("lobby:get_state", getLobbyState({ io, socket, state }));
        socket.on("lobby:leave", leaveLobby({ io, socket, state }));
        socket.on("lobby:kick_player", kickPlayer({ io, socket, state }));
        socket.on("lobby:start_game", startGame({ io, socket, db, state }));

        socket.on("game:vote_bill", voteBill({ io, socket, state }));
        socket.on("game:call_player_vote", callPlayerVote({ io, socket, state, db }));
        socket.on("game:vote_player", votePlayer({ io, socket, state }));

        /**
         * On the disconnect of a user, perform a number of tasks:
         * 1. Untrack the socket
         * 2. Check if the user is in an active game
         * 3. If the user is in an active game, check if there are any other active players
         * 4. If there are no other active players, end the game
         */
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            if (user) {
                state.untrackSocket(user.id);
                const activeCode = state.getPlayerLobby(user.id);
                if (activeCode) {
                    setTimeout(() => {
                        const lobby = state.getGame(activeCode);
                        if (lobby) {
                            // Specifically, in the lobby assigned to the code, for each player in that lobby, check if they are still connected
                            const hasActivePlayers = lobby.players.some(p => state.isUserConnected(p.userId));
                            if (!hasActivePlayers) {
                                console.log(`Lobby ${activeCode} has been empty for 5s. Closing game to save memory.`);
                                lobby.players.forEach(p => state.removePlayerFromLobby(p.userId));
                                state.endGame(activeCode);
                            }
                        }
                    }, 5000);
                }
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
        origin: "*",
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

import express from 'express';
import http from 'http';
import pg from "pg";
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { DB } from "./db.js"
import { createAdapter } from "@socket.io/postgres-adapter";
import { joinLobby } from './lobby/join.js';
import { createLobby } from './lobby/create.js';
//import { leaveLobby } from './lobby/leave';
//import { kickPlayer } from './lobby/kick';
import { getLobbyState } from './lobby/get-state.js'; // <-- Add import

const pgPool = new pg.Pool({});
const db = new DB(pgPool);

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

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        socket.on("lobby:create", createLobby({ io, socket, db}));
        socket.on("lobby:join", joinLobby({ io, socket, db}));
        socket.on("lobby:get_state", getLobbyState({ io, socket, db }));
        //socket.on("lobby:leave", leaveLobby({ io, socket, db}));
        //socket.on("lobby:kick_player", kickPlayer({ io, socket, db}));
        /*
        socket.on('disconnect', () => {
            for (const code in lobbies) {
                const playerIndex = lobbies[code].players.findIndex((p: any) => p.socketId === socket.id);
                if (playerIndex !== -1) {
                    const playerName = lobbies[code].players[playerIndex].name;
                    lobbies[code].players.splice(playerIndex, 1);

                    // Reassign host if necessary
                    if (lobbies[code].host === playerName && lobbies[code].players.length > 0) {
                        lobbies[code].host = lobbies[code].players[0].name;
                    }

                    io.to(code).emit('lobby_updated', lobbies[code]);
                    break;
                }
            }
        });
        */
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
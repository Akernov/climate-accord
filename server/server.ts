import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
}));

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// In-memory store for all active lobbies
const lobbies: Record<string, any> = {};

io.on('connection', (socket) => {
    console.log('--- New Connection ---');
    console.log('Socket ID:', socket.id);

    // 1. Handle joining a lobby
    socket.on('join_lobby', ({ code, name }) => {
        if (!code || !name) {
            console.log("Join failed: Missing code or name");
            return;
        }

        socket.join(code);
        
        // If the lobby doesn't exist yet, create it
        if (!lobbies[code]) {
            console.log(`Creating new lobby: ${code} (Host: ${name})`);
            lobbies[code] = {
                code,
                host: name,
                players: [],
                started: false,
                phase: "waiting",
                round: 1,
                maxRounds: 5
            };
        }

        // Add the player if they aren't already in the list
        const playerExists = lobbies[code].players.find((p: any) => p.name === name);
        if (!playerExists) {
            lobbies[code].players.push({ name, score: 0 });
            console.log(`Added player ${name} to lobby ${code}`);
        } else {
            console.log(`Player ${name} re-joined lobby ${code}`);
        }

        // Broadcast the updated lobby state to everyone in that specific room
        // Using io.to(code) ensures everyone gets it, including the person who just joined
        io.to(code).emit('lobby_updated', lobbies[code]);
    });

    // 2. Handle starting the game
    socket.on('start_game', ({ code, updatedLobby }) => {
        lobbies[code] = updatedLobby; 
        console.log(`!!! Game Started in lobby: ${code} !!!`);
        io.to(code).emit('game_started', lobbies[code]);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`>>>> Server running on http://localhost:${PORT}`);
});
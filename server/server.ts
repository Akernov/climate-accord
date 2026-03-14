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
    console.log('User connected:', socket.id);

    // 1. Handle joining a lobby
    socket.on('join_lobby', ({ code, name, maxPlayers }) => {
        if (!code || !name) {
            console.log("Join failed: Missing code or name");
            return;
        }

        if (!lobbies[code]) {
            // Initialize lobby state if it doesn't exist
            console.log(`Creating new lobby: ${code} (Host: ${name})`);
            lobbies[code] = {
                code,
                host: name,
                players: [],
                started: false,
                phase: "waiting",
                round: 1,
                maxRounds: 5,
                maxPlayers: maxPlayers || 5 // Store the capacity limit
            };
        }

        // Add the player if they aren't already in the list
        const playerExists = lobbies[code].players.find((p: any) => p.name === name);
        
        // CHECK: Is the lobby full? 
        // We only block if it's a new player and count exceeds maxPlayers
        if (!playerExists && lobbies[code].players.length >= lobbies[code].maxPlayers) {
            console.log(`Join rejected: Lobby ${code} is full.`);
            socket.emit('error_message', 'This lobby is full.');
            return;
        }

        socket.join(code);
        
        if (!playerExists) {
            // Store the socketId so we can target this specific user for "kicking"
            lobbies[code].players.push({ name, score: 0, socketId: socket.id });
            console.log(`Added player ${name} to lobby ${code}`);
        } else {
            // Update socketId if a player with the same name reconnects
            playerExists.socketId = socket.id;
        }

        // Broadcast the updated lobby state to everyone in that specific room
        // Using io.to(code) ensures everyone gets it, including the person who just joined
        io.to(code).emit('lobby_updated', lobbies[code]);
    });

    // 2. Handle a player leaving voluntarily
    socket.on('leave_lobby', ({ code, name }) => {
        if (lobbies[code]) {
            // Filter out the player who is leaving
            lobbies[code].players = lobbies[code].players.filter((p: any) => p.name !== name);
            
            // Logic: If the host leaves, assign the next available player as host
            if (lobbies[code].host === name && lobbies[code].players.length > 0) {
                lobbies[code].host = lobbies[code].players[0].name;
            } else if (lobbies[code].players.length === 0) {
                // Delete the lobby entirely if it's empty
                delete lobbies[code];
            }

            // Sync the updated state and remove the socket from the room
            io.to(code).emit('lobby_updated', lobbies[code]);
            socket.leave(code);
        }
    });

    // 3. Handle host kicking a player
    socket.on('kick_player', ({ code, targetName }) => {
        if (lobbies[code]) {
            const playerToKick = lobbies[code].players.find((p: any) => p.name === targetName);
            
            if (playerToKick) {
                // Remove player from the array
                lobbies[code].players = lobbies[code].players.filter((p: any) => p.name !== targetName);
                
                // Specifically tell the kicked player to redirect
                io.to(playerToKick.socketId).emit('player_kicked');
                
                // Update the lobby list for everyone else
                io.to(code).emit('lobby_updated', lobbies[code]);
            }
        }
    });

    // 4. Start game event
    socket.on('start_game', ({ code, updatedLobby }) => {
        lobbies[code] = updatedLobby; 
        console.log(`!!! Game Started in lobby: ${code} !!!`);
        io.to(code).emit('game_started', lobbies[code]);
    });

    // 5. Cleanup on unexpected disconnect (e.g., closing the tab)
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
});

server.listen(PORT, () => {
    console.log(`>>>> Server running on http://localhost:${PORT}`);
});
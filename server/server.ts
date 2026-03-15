import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import type { User } from "@supabase/supabase-js";
import { readBearerToken, verifyAccessToken } from "./supabase/verifier";

dotenv.config();

type Role = "advocate" | "lobbyist";

type Player = {
    userId: string;
    name: string;
    score: number;
    socketId: string;
    role?: Role;
};

type Lobby = {
    code: string;
    host: string;
    players: Player[];
    started: boolean;
    phase: "waiting" | "playing";
    round: number;
    maxRounds: number;
    maxPlayers: number;
};

const DEFAULT_MAX_PLAYERS = 5;
const MIN_MAX_PLAYERS = 2;
const MAX_MAX_PLAYERS = 10;

function normalizeCode(value: string): string {
    return value.trim().toUpperCase();
}

function normalizeName(value: string): string {
    return value.trim();
}

function getSocketUser(socket: { data: { user?: User } }): User | null {
    return socket.data.user ?? null;
}

function getDisplayNameFromUser(user: User): string {
    const maybeName = user.user_metadata?.display_name ?? user.user_metadata?.name;
    if (typeof maybeName === "string" && maybeName.trim()) {
        return maybeName.trim();
    }

    if (typeof user.email === "string" && user.email.trim()) {
        return user.email.split("@")[0];
    }

    return `user-${user.id.slice(0, 8)}`;
}

function clampMaxPlayers(value: unknown): number {
    const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_MAX_PLAYERS;
    }

    const floored = Math.floor(parsed);
    return Math.min(MAX_MAX_PLAYERS, Math.max(MIN_MAX_PLAYERS, floored));
}

function getLobbyistCount(playerCount: number): number {
    if (playerCount <= 5) return 1;
    if (playerCount <= 7) return 2;
    if (playerCount <= 9) return 3;
    return 4;
}

function shuffleArray<T>(array: T[]): T[] {
    const cloned = [...array];
    for (let i = cloned.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = cloned[i];
        cloned[i] = cloned[j];
        cloned[j] = temp;
    }
    return cloned;
}

function assignRoles(players: Player[]): Player[] {
    const lobbyistCount = getLobbyistCount(players.length);
    const roles: Role[] = [
        ...Array(lobbyistCount).fill("lobbyist"),
        ...Array(players.length - lobbyistCount).fill("advocate"),
    ];
    const shuffledRoles = shuffleArray(roles);

    return players.map((player, index) => ({
        ...player,
        role: shuffledRoles[index],
    }));
}

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

// In-memory store for all active lobbies
const lobbies: Record<string, Lobby> = {};

io.on('connection', (socket) => {
    console.log('--- New Connection ---');
    console.log('User connected:', socket.id);

    // 1. Handle joining a lobby
    socket.on('join_lobby', (payload: { code?: string; name?: string; maxPlayers?: number; createLobby?: boolean }) => {
        const user = getSocketUser(socket);
        if (!user) {
            socket.emit('error_message', 'Unauthorized.');
            return;
        }

        const code = normalizeCode(payload.code ?? "");
        const requestedName = normalizeName(payload.name ?? "");
        const fallbackName = getDisplayNameFromUser(user);
        const name = requestedName || fallbackName;
        const createLobby = payload.createLobby === true;

        if (!code) {
            console.log("Join failed: Missing code");
            socket.emit('error_message', 'Missing lobby code.');
            return;
        }

        if (!lobbies[code]) {
            if (!createLobby) {
                console.log(`Join rejected: Lobby ${code} does not exist.`);
                socket.emit('error_message', 'Lobby not found.');
                return;
            }

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
                maxPlayers: clampMaxPlayers(payload.maxPlayers), // Store the capacity limit
            };
        }

        const lobby = lobbies[code];

        // Add the player if they aren't already in the list
        const playerExists = lobby.players.find((p) => p.userId === user.id);

        if (!playerExists) {
            const nameAlreadyTaken = lobby.players.some((p) => p.name === name);
            if (nameAlreadyTaken) {
                socket.emit('error_message', 'That display name is already in use in this lobby.');
                return;
            }
        }

        if (lobby.started && !playerExists) {
            console.log(`Join rejected: Lobby ${code} already started.`);
            socket.emit('error_message', 'Game already started.');
            return;
        }
        
        // CHECK: Is the lobby full? 
        // We only block if it's a new player and count exceeds maxPlayers
        if (!playerExists && lobby.players.length >= lobby.maxPlayers) {
            console.log(`Join rejected: Lobby ${code} is full.`);
            socket.emit('error_message', 'This lobby is full.');
            return;
        }

        socket.join(code);
        
        if (!playerExists) {
            // Store the socketId so we can target this specific user for "kicking"
            lobby.players.push({ userId: user.id, name, score: 0, socketId: socket.id });
            console.log(`Added player ${name} to lobby ${code}`);
        } else {
            // Update socketId if a player with the same name reconnects
            playerExists.socketId = socket.id;
        }

        // Broadcast the updated lobby state to everyone in that specific room
        // Using io.to(code) ensures everyone gets it, including the person who just joined
        io.to(code).emit('lobby_updated', lobby);
    });

    // 2. Handle a player leaving voluntarily
    socket.on('leave_lobby', (payload: { code?: string; name?: string }) => {
        const user = getSocketUser(socket);
        if (!user) {
            socket.emit('error_message', 'Unauthorized.');
            return;
        }

        const code = normalizeCode(payload.code ?? "");
        const lobby = lobbies[code];

        if (lobby) {
            const leavingPlayer = lobby.players.find((p) => p.userId === user.id);
            if (!leavingPlayer) {
                return;
            }

            // Filter out the player who is leaving
            lobby.players = lobby.players.filter((p) => p.userId !== user.id);
            
            // Logic: If the host leaves, assign the next available player as host
            if (lobby.host === leavingPlayer.name && lobby.players.length > 0) {
                lobby.host = lobby.players[0].name;
            } else if (lobby.players.length === 0) {
                // Delete the lobby entirely if it's empty
                delete lobbies[code];
                return;
            }

            // Sync the updated state and remove the socket from the room
            io.to(code).emit('lobby_updated', lobby);
            socket.leave(code);
        }
    });

    // 3. Handle host kicking a player
    socket.on('kick_player', (payload: { code?: string; targetName?: string }) => {
        const user = getSocketUser(socket);
        if (!user) {
            socket.emit('error_message', 'Unauthorized.');
            return;
        }

        const code = normalizeCode(payload.code ?? "");
        const targetName = normalizeName(payload.targetName ?? "");
        const lobby = lobbies[code];

        if (lobby && targetName) {
            const requester = lobby.players.find((p) => p.userId === user.id);
            if (!requester || requester.name !== lobby.host) {
                socket.emit('error_message', 'Only the host can kick players.');
                return;
            }

            const playerToKick = lobby.players.find((p) => p.name === targetName);
            
            if (playerToKick && playerToKick.name !== lobby.host) {
                // Remove player from the array
                lobby.players = lobby.players.filter((p) => p.name !== targetName);
                
                // Specifically tell the kicked player to redirect
                io.to(playerToKick.socketId).emit('player_kicked');

                if (lobby.players.length === 0) {
                    delete lobbies[code];
                    return;
                }
                
                // Update the lobby list for everyone else
                io.to(code).emit('lobby_updated', lobby);
            }
        }
    });

    // 4. Start game event
    socket.on('start_game', (payload: { code?: string }) => {
        const user = getSocketUser(socket);
        if (!user) {
            socket.emit('error_message', 'Unauthorized.');
            return;
        }

        const code = normalizeCode(payload.code ?? "");
        const lobby = lobbies[code];

        if (!lobby) return;

        const requester = lobby.players.find((p) => p.userId === user.id);
        if (!requester || requester.name !== lobby.host) {
            socket.emit('error_message', 'Only the host can start the game.');
            return;
        }

        if (lobby.players.length < 2) {
            socket.emit('error_message', 'Need at least 2 players to start.');
            return;
        }

        lobby.players = assignRoles(lobby.players);
        lobby.started = true;
        lobby.phase = "playing";
        lobby.round = 1;

        console.log(`!!! Game Started in lobby: ${code} !!!`);
        io.to(code).emit('game_started', lobby);
        io.to(code).emit('lobby_updated', lobby);
    });

    // 5. Cleanup on unexpected disconnect (e.g., closing the tab)
    socket.on('disconnect', () => {
        for (const code of Object.keys(lobbies)) {
            const lobby = lobbies[code];
            const playerIndex = lobby.players.findIndex((p) => p.socketId === socket.id);
            if (playerIndex !== -1) {
                const playerName = lobby.players[playerIndex].name;
                lobby.players.splice(playerIndex, 1);

                if (lobby.players.length === 0) {
                    delete lobbies[code];
                    break;
                }

                // Reassign host if necessary
                if (lobby.host === playerName && lobby.players.length > 0) {
                    lobby.host = lobby.players[0].name;
                }

                io.to(code).emit('lobby_updated', lobby);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`>>>> Server running on http://localhost:${PORT}`);
});

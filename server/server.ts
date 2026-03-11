import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// HTTP needed for socket.io to intercept requests, holding both express and socket on the same port.
const server = http.createServer(app);

// Configure environmental variables at a later time.
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
})

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    });

    // Add logic here!

});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});
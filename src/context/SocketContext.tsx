"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
    // 1. Initialize the socket lazily in useState.
    // By passing a function to useState, it only runs once when the component mounts.
    const [socket] = useState<Socket>(() => io("http://localhost:3001", {
        autoConnect: false // Don't auto-connect yet to keep initialization lightweight
    }));
    
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 2. Now we just tell the already-created socket to connect.
        socket.connect();

        function onConnect() {
            setIsConnected(true);
            console.log("Socket connected:", socket.id);
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log("Socket disconnected");
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.disconnect();
        };
    }, [socket]); // socket is stable, but we add it to satisfy exhaustive-deps

    return (
        // 3. We pass 'socket' (which is state) safely to the provider
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);

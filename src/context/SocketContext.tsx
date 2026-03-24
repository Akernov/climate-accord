"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
    const supabase = getSupabaseBrowserClient();

    // 1. Initialize the socket lazily in useState.
    // By passing a function to useState, it only runs once when the component mounts.
    const [socket] = useState<Socket>(() => io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
        autoConnect: false // Don't auto-connect yet to keep initialization lightweight
    }));
    
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        async function syncConnectionWithSession(accessToken?: string) {
            const token = accessToken?.trim() ?? "";
            if (!token) {
                socket.disconnect();
                setIsConnected(false);
                console.log("Not Connected");
                return;
            }

            socket.auth = { token };
            if (socket.connected) {
                socket.disconnect();
            }
            socket.connect();
        }

        // Prime connection state from existing auth session on initial mount.
        void supabase.auth.getSession().then(({ data }) => {
            void syncConnectionWithSession(data.session?.access_token);
        });

        function onConnect() {
            setIsConnected(true);
            console.log("Socket connected:", socket.id);
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log("Socket disconnected");
        }

        function onConnectError(error: Error) {
            setIsConnected(false);
            console.log("Socket connect error:", error.message);
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            void syncConnectionWithSession(session?.access_token);
        });

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);

        return () => {
            subscription.unsubscribe();
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error", onConnectError);
            socket.disconnect();
        };
    }, [socket, supabase]); // socket is stable, but we add it to satisfy exhaustive-deps

    return (
        // 3. We pass 'socket' (which is state) safely to the provider
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);

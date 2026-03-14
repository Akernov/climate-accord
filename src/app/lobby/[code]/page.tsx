"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { assignRoles } from "../../logic/page";
import { useSocket } from "@/context/SocketContext";

type Player = {
  name: string; 
  score: number; 
  role?: "advocate" | "lobbyist";
};

type Lobby = {
  code: string;       
  host: string;       
  players: Player[];  
  started: boolean;   
  phase: string;      
  round: number;      
  maxRounds: number;  
};

export default function LobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useSocket();

  const code = params?.code as string; 
  const name = searchParams.get("name") || ""; 

  const [lobby, setLobby] = useState<Lobby | null>(null);

  useEffect(() => {
    // Only proceed if socket is connected and we have the URL data
    if (!socket || !code || !name) return;

    console.log(`Attempting to join lobby: ${code} as ${name}`);

    // Join the lobby
    socket.emit("join_lobby", { code, name });

    // Listen for state updates from server
    const onLobbyUpdated = (updatedLobby: Lobby) => {
      console.log("Lobby state received from server:", updatedLobby);
      setLobby(updatedLobby);
    };

    // Listen for the start signal
    const onGameStarted = (startedLobby: Lobby) => {
       console.log("Game start signal received!");
       router.push(`/game/${code}?name=${name}`);
    };

    // Listen if THIS specific client was kicked
    const onKicked = () => {
        alert("You have been removed from the lobby by the host.");
        router.push("/");
    };

    socket.on("lobby_updated", onLobbyUpdated);
    socket.on("game_started", onGameStarted);
    socket.on("player_kicked", onKicked);

    // Cleanup listeners on unmount
    return () => {
      socket.off("lobby_updated", onLobbyUpdated);
      socket.off("game_started", onGameStarted);
      socket.off("player_kicked", onKicked);
    };
  }, [socket, code, name, router]);

  const handleStartGame = () => {
    if (!lobby || !socket) return;

    const updatedLobby = { ...lobby };
    // assignRoles logic is imported from logic/page.tsx
    updatedLobby.players = assignRoles(updatedLobby.players);
    updatedLobby.started = true;
    updatedLobby.phase = "playing";

    socket.emit("start_game", { code, updatedLobby });
  };

  const handleLeaveLobby = () => {
    if (!socket) return;
    socket.emit("leave_lobby", { code, name });
    router.push("/");
  };

  const handleKickPlayer = (targetName: string) => {
    if (!socket) return;
    socket.emit("kick_player", { code, targetName });
  };

  // State guard for initial connection
  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">
        <p className="text-2xl font-bold text-black animate-pulse">Connecting to lobby...</p>
      </div>
    );
  }

  const isHost = name === lobby.host;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300 p-4">
      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px] text-black border border-white/20">
        <h1 className="text-4xl font-bold text-center mb-6">Lobby</h1>
        <p className="text-xl text-center mb-6">Code: <span className="font-mono font-bold bg-white/50 px-2 rounded">{code}</span></p>
        
        <h2 className="text-2xl mb-3 font-semibold">Players ({lobby.players.length})</h2>
        <ul className="mb-8 space-y-3">
          {lobby.players.map((player) => (
            <li key={player.name} className="py-2 px-4 bg-white/50 rounded-lg flex justify-between items-center shadow-sm">
              <span className="font-medium">
                {player.name} {player.name === lobby.host && "👑"}
              </span>
              
              {/* Kick button: Only visible to host, and can't kick yourself */}
              {isHost && player.name !== name && (
                <button 
                    onClick={() => handleKickPlayer(player.name)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors shadow-sm"
                >
                    Kick
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="space-y-3">
            {isHost ? (
            <button
                onClick={handleStartGame}
                disabled={lobby.players.length < 2}
                className={`w-full text-white text-xl font-bold py-4 rounded-lg border-4 transition-all shadow-lg ${
                    lobby.players.length < 2 
                    ? "bg-gray-500 border-gray-700 cursor-not-allowed opacity-50" 
                    : "bg-green-700 border-green-900 hover:bg-green-800 hover:scale-105"
                }`}
            >
                {lobby.players.length < 2 ? "Waiting for players..." : "Start Game"}
            </button>
            ) : (
            <div className="text-center p-4 bg-blue-100/50 rounded-lg border-2 border-blue-400 italic mb-4">
                Waiting for host to start...
            </div>
            )}

            <button
                onClick={handleLeaveLobby}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg transition-colors border border-slate-300 shadow-sm"
            >
                Leave Lobby
            </button>
        </div>
      </div>
    </div>
  );
}
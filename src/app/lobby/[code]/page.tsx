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
  const name = searchParams.get("name"); 

  const [lobby, setLobby] = useState<Lobby | null>(null);

  useEffect(() => {
    // Only proceed if socket is connected and we have the URL data
    if (!socket || !code || !name) return;

    console.log(`Attempting to join lobby: ${code} as ${name}`);

    // Join the lobby
    socket.emit("join_lobby", { code, name });

    const onLobbyUpdated = (updatedLobby: Lobby) => {
      console.log("Lobby state received from server:", updatedLobby);
      setLobby(updatedLobby);
    };

    const onGameStarted = (startedLobby: Lobby) => {
       console.log("Game start signal received!");
       router.push(`/game/${code}?name=${name}`);
    };

    socket.on("lobby_updated", onLobbyUpdated);
    socket.on("game_started", onGameStarted);

    return () => {
      socket.off("lobby_updated", onLobbyUpdated);
      socket.off("game_started", onGameStarted);
    };
  }, [socket, code, name, router]);

  const handleStartGame = () => {
    if (!lobby || !socket) return;

    const updatedLobby = { ...lobby };
    updatedLobby.players = assignRoles(updatedLobby.players);
    updatedLobby.started = true;
    updatedLobby.phase = "playing";

    socket.emit("start_game", { code, updatedLobby });
  };

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">
        <div className="text-center">
            <p className="text-2xl font-bold text-black animate-pulse">Connecting to lobby...</p>
            <p className="text-sm text-gray-600 mt-2">Check server console and browser console (F12) for logs.</p>
        </div>
      </div>
    );
  }

  const players = lobby.players;
  const host = lobby.host;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">
      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px] text-black border border-white/20">
        <h1 className="text-4xl font-bold text-center mb-6">Lobby Waiting Room</h1>
        <p className="text-xl text-center mb-6">Lobby Code: <b>{code}</b></p>
        <h2 className="text-2xl mb-3">Players ({players.length})</h2>
        <ul className="mb-6 space-y-2">
          {players.map((player) => (
            <li key={player.name} className="py-2 px-4 bg-white/30 rounded-lg flex justify-between">
              <span>{player.name}</span>
              {player.name === host && <span className="text-sm bg-yellow-400 px-2 py-0.5 rounded text-yellow-900 font-bold">HOST 👑</span>}
            </li>
          ))}
        </ul>
        {name === host ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className={`w-full text-white text-xl font-bold py-4 rounded-lg border-4 transition-all ${
                players.length < 2 
                ? "bg-gray-500 border-gray-700 cursor-not-allowed opacity-50" 
                : "bg-green-700 border-green-900 hover:bg-green-800 hover:scale-105"
            }`}
          >
            {players.length < 2 ? "Waiting for players..." : "Start Game"}
          </button>
        ) : (
          <div className="text-center p-4 bg-blue-100/50 rounded-lg border-2 border-blue-400 italic">
            Waiting for host to start...
          </div>
        )}
      </div>
    </div>
  );
}
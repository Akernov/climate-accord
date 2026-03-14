"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import BillBoard from "@/components/BillBoard";
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

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { socket } = useSocket();

  const code = params.code as string;
  const name = searchParams.get("name") || "";

  const [lobby, setLobby] = useState<Lobby | null>(null);

  useEffect(() => {
    if (!socket || !code || !name) return;

    // Request the latest state from the server to get the assigned roles
    socket.emit("join_lobby", { code, name });

    // Update local state when the server responds
    const onLobbyUpdated = (serverLobby: Lobby) => {
      setLobby(serverLobby);
    };

    socket.on("lobby_updated", onLobbyUpdated);

    return () => {
      socket.off("lobby_updated", onLobbyUpdated);
    };
  }, [socket, code, name]);

  // Prevent rendering the board until we have the data from the server
  if (!lobby) {
    return (
      <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center justify-center">
        <p className="text-2xl font-bold text-gray-300">Loading game board...</p>
      </div>
    );
  }

  const players = lobby.players;
  const round = lobby.round;
  const phase = lobby.phase;

  const currentPlayer = players.find((p) => p.name === name);

  const activistProgress = 0;
  const lobbyistProgress = 0;

  return (
    <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center p-8 text-gray-300">
      
      {/* GAME HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold tracking-wide text-gray-400/90">
        Climate Accord
        </h1>
 
        
        <p className="text-lg mt-2">
          Lobby Code: <b>{code}</b>
        </p>

        <p className="text-md">
          Round {round} • Phase: {phase}
        </p>

        {currentPlayer?.role && (
          <p className="mt-3 text-xl font-semibold">
            Your Role:{" "}
            {currentPlayer.role === "lobbyist"
              ? "Industrial Lobbyist 🏭"
              : "Climate Advocate 🌱"}
          </p>
        )}
      </div>

      {/* MAIN GAME BOARD AREA */}
      <div className="w-full max-w-6xl space-y-8">
        
        {/* LOBBYIST POLICY TRACK */}
        {currentPlayer?.role === "lobbyist" && (
          <div className="bg-gradient-to-r from-red-700 to-red-600 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-center text-white mb-5">
              Lobbyist Policy Track • Points: {lobbyistProgress}/6
            </h2>
            <div className="flex justify-center gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-24 h-32 bg-gray-800 rounded-lg border-4 border-red-800 flex items-center justify-center text-xs text-gray-400 shadow-md"
                >
                  place card
                </div>
              ))}
            </div>
          </div>
        )}

        <BillBoard role={currentPlayer?.role} />

        {/* ACTIVIST POLICY TRACK */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-white mb-5">
            Activist Policy Track • Points: {activistProgress}/5
          </h2>
          <div className="flex justify-center gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-24 h-32 bg-gray-800 rounded-lg border-4 border-green-800 flex items-center justify-center text-xs text-gray-400 shadow-md"
              >
                place card
              </div>
            ))}
          </div>
        </div>

        {/* PLAYER LIST DISPLAY */}
        <div className="bg-gray-900 p-4 rounded-xl shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-3">
            Players
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {players.map((p) => (
              <div
                key={p.name}
                className="bg-gray-800 px-4 py-2 rounded-lg shadow font-medium flex gap-2 items-center"
              >
                {p.name} 
                {p.name === lobby.host && <span>👑</span>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
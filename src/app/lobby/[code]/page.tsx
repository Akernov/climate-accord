"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { assignRoles } from "../../logic/page";
import { useSocket } from "@/context/SocketContext";

type Player = {
  name: string; 
  role?: "advocate" | "lobbyist";
};

type Lobby = {
  code: string;       
  host: string;       
  players: Player[];  
  maxPlayers: number; 
};

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const { socket } = useSocket();

  const code = params?.code as string;

  const [lobby, setLobby] = useState<Lobby | null>(null);

  useEffect(() => {
    if (!socket || !code) return;

    // Listeners
    const onLobbyUpdated = (updatedLobby: Lobby) => {
      setLobby(updatedLobby);
    };

    const onKicked = () => {
        alert("You have been removed from the lobby by the host.");
        router.push("/");
    };

    const onError = (message: string) => {
      alert(message);
      router.push("/");
    };

    socket.on("lobby_updated", onLobbyUpdated);
    socket.on("player_kicked", onKicked);
    socket.on("error_message", onError);

    // Fetch the initial state upon entering the page!
    socket.emit(
      "lobby:get_state", 
      { code }, 
      (res: { status: "SUCCESS" | "ERROR"; error?: string }) => {
        if (res.status === "ERROR") {
            console.error("Failed to fetch lobby state:", res.error);
            // Optional: Send the user back home if the lobby doesn't exist
            router.push("/");
        }
      }
    );

    return () => {
      socket.off("lobby_updated", onLobbyUpdated);
      socket.off("player_kicked", onKicked);
      socket.off("error_message", onError);
    };
  }, [socket, code, router]);

  const handleStartGame = () => {
    if (!lobby || !socket) return;

    const updatedLobby = { ...lobby };
    updatedLobby.players = assignRoles(updatedLobby.players);

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

  if (!lobby) {
    return (
      <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center justify-center">
        <p className="text-2xl font-bold text-gray-300 animate-pulse">Connecting to lobby...</p>
      </div>
    );
  }

  // To check if the current user is host, you'll need the user's name saved somewhere, 
  // or you could check socket.id against a host_socket_id attribute if you track it.
  // For now, since `name` was removed from the URL, `isHost` logic needs 
  // adjusting based on how you store session identity. If you are using localStorage:
  // const isHost = localStorage.getItem("playerName") === lobby.host;
  const isHost = false; // Adjust this according to your auth/session logic!

  return (
    <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center justify-center p-4">
      <div className="bg-gray-900/80 p-10 rounded-xl shadow-xl w-[450px] text-gray-300 border border-gray-700">
        <h1 className="text-4xl font-bold text-center mb-6 tracking-wide">Lobby</h1>

        <p className="text-xl text-center mb-2">
          Code: <span className="font-mono font-bold bg-gray-800 px-2 rounded">{code}</span>
        </p>

        <p className="text-center text-sm text-gray-400 mb-6 font-semibold">
          Capacity: {lobby.players.length} / {lobby.maxPlayers}
        </p>
        
        <h2 className="text-2xl mb-3 font-semibold">Players</h2>

        <ul className="mb-8 space-y-3">
          {lobby.players.map((player) => (
            <li key={player.name} className="py-2 px-4 bg-gray-800 rounded-lg flex justify-between items-center shadow-sm">
              <span className="font-medium">
                {player.name} {player.name === lobby.host && "👑"}
              </span>
              
              {/* Kick button: Only visible to host, and can't kick yourself */}
              {isHost && player.name !== lobby.host && (
                <button 
                    onClick={() => handleKickPlayer(player.name)}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors shadow-sm"
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
                    ? "bg-gray-600 border-gray-800 cursor-not-allowed opacity-50" 
                    : "bg-green-700 border-green-900 hover:bg-green-800 hover:scale-105"
                }`}
            >
                {lobby.players.length < 2 ? "Waiting for players..." : "Start Game"}
            </button>
            ) : (
            <div className="text-center p-4 bg-gray-800 rounded-lg border-2 border-blue-500 italic mb-4">
                Waiting for host to start...
            </div>
            )}

            <button
                onClick={handleLeaveLobby}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-lg transition-colors border border-gray-600 shadow-sm"
            >
                Leave Lobby
            </button>
        </div>
      </div>
    </div>
  );
}
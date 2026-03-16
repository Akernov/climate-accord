"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import "./LobbyPage.css";

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
    socket.emit("lobby:start_game", { code });
  };

  const handleLeaveLobby = () => {
    if (!socket) return;
    socket.emit("lobby:leave", { code });
    router.push("/");
  };

  const handleKickPlayer = (targetName: string) => {
    if (!socket) return;
    socket.emit("lobby:kick_player", { code, targetName });
  };

  if (!lobby) {
    return (
      <div className="lobby-loading-container">
        <p className="lobby-loading-text">Connecting to lobby...</p>
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
    <div className="lobby-container">
      <div className="lobby-card">
        <h1 className="lobby-title">Lobby</h1>

        <p className="lobby-code">
          Code: <span className="lobby-code-span">{code}</span>
        </p>

        <p className="lobby-capacity">
          Capacity: {lobby.players.length} / {lobby.maxPlayers}
        </p>

        <h2 className="lobby-players-title">Players</h2>

        <ul className="lobby-players-list">
          {lobby.players.map((player) => (
            <li key={player.name} className="lobby-player-item">
              <span className="lobby-player-name">
                {player.name} {player.name === lobby.host && "👑"}
              </span>
              
              {/* Kick button: Only visible to host, and can't kick yourself */}
              {isHost && player.name !== lobby.host && (
                <button 
                    onClick={() => handleKickPlayer(player.name)}
                    className="lobby-kick-button"
                >
                  Kick
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="lobby-actions">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={lobby.players.length < 2}
              className={`lobby-start-button ${
                lobby.players.length < 2 ? "lobby-start-button-disabled" : "lobby-start-button-enabled"
              }`}
            >
              {lobby.players.length < 2 ? "Waiting for players..." : "Start Game"}
            </button>
          ) : (
            <div className="lobby-waiting-message">
              Waiting for host to start...
            </div>
          )}

          <button onClick={handleLeaveLobby} className="lobby-leave-button">
            Leave Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

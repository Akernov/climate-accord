"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { assignRoles } from "../../logic/page";
import { useSocket } from "@/context/SocketContext";
import "./LobbyPage.css";

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
  maxPlayers: number;
};

export default function LobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useSocket();

  const code = params?.code as string;
  const name = searchParams.get("name") || "";
  const maxPlayersFromUrl = parseInt(searchParams.get("maxPlayers") || "5");

  const [lobby, setLobby] = useState<Lobby | null>(null);

  useEffect(() => {
    if (!socket || !code || !name) return;

    console.log(`Attempting to join lobby: ${code} as ${name}`);

    socket.emit("join_lobby", { code, name, maxPlayers: maxPlayersFromUrl });

    const onLobbyUpdated = (updatedLobby: Lobby) => {
      console.log("Lobby state received from server:", updatedLobby);
      setLobby(updatedLobby);
    };

    const onGameStarted = (startedLobby: Lobby) => {
      console.log("Game start signal received!");
      router.push(`/game/${code}?name=${name}`);
    };

    const onKicked = () => {
      alert("You have been removed from the lobby by the host.");
      router.push("/");
    };

    const onError = (message: string) => {
      console.log("Error received from server:", message);
      alert(message);
      router.push("/");
    };

    socket.on("lobby_updated", onLobbyUpdated);
    socket.on("game_started", onGameStarted);
    socket.on("player_kicked", onKicked);
    socket.on("error_message", onError);

    return () => {
      socket.off("lobby_updated", onLobbyUpdated);
      socket.off("game_started", onGameStarted);
      socket.off("player_kicked", onKicked);
      socket.off("error_message", onError);
    };
  }, [socket, code, name, router, maxPlayersFromUrl]);

  const handleStartGame = () => {
    if (!lobby || !socket) return;

    const updatedLobby = { ...lobby };
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

  if (!lobby) {
    return (
      <div className="lobby-loading-container">
        <p className="lobby-loading-text">Connecting to lobby...</p>
      </div>
    );
  }

  const isHost = name === lobby.host;

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

              {isHost && player.name !== name && (
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
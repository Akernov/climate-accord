"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Player, Lobby } from "@/types/game";
import "./LobbyPage.css";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const { socket } = useSocket();

  const code = params?.code as string;

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (!socket || !code) return;

    const onLobbyUpdated = (updatedLobby: Lobby) => setLobby(updatedLobby);
    
    const onKicked = (data: { targetID: string }) => {
      // ONLY redirect if the person kicked was ME
      if (data.targetID === currentUserId) {
        alert("You have been removed from the lobby by the host.");
        router.push("/");
      }
    };

    const onStart = () => {
      router.push(`/game/${lobby?.code}`)
    }

    const onError = (message: string) => {
      alert(message);
      router.push("/");
    };

    socket.on("lobby:updated", onLobbyUpdated);
    socket.on("lobby:kick_player", onKicked);
    socket.on("lobby:start_game", onStart);
    socket.on("error_message", onError);

    socket.emit(
      "lobby:get_state", 
      { code }, 
      (res: { status: "SUCCESS" | "ERROR"; error?: string; data?: Lobby }) => {
        if (res.status === "ERROR") {
            console.error("Failed to fetch lobby state:", res.error);
            router.push("/");
        } else if (res.status === "SUCCESS" && res.data) {
            setLobby(res.data);
        }
      }
    );

    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });

    return () => {
      socket.off("lobby:updated", onLobbyUpdated);
      socket.off("lobby:kick_player", onKicked);
      socket.on("lobby:start_game", onStart);
      socket.off("error_message", onError);
    };
  }, [socket, code, router, currentUserId, lobby?.code]); 

  if (!lobby) {
    return (
      <div className="lobby-loading-container">
        <p className="lobby-loading-text">Connecting to lobby...</p>
      </div>
    );
  }

  const isHost = lobby.host === currentUserId;
  const isReadyToStart = lobby.players.length >= 2;

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
            <li key={player.userId} className="lobby-player-item">
              <span className="lobby-player-name">
                {player.name} {player.userId === lobby.host && "👑"}
              </span>
              
              {isHost && player.userId !== currentUserId && (
                <button 
                    onClick={() => socket?.emit("lobby:kick_player", { code, targetID: player.userId }, () => {})}
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
              onClick={() => socket?.emit("lobby:start_game", { code }, () => {})}
              disabled={!isReadyToStart}
              className={`lobby-start-button ${!isReadyToStart ? "lobby-start-button-disabled" : "lobby-start-button-enabled"}`}
            >
              {!isReadyToStart ? "Waiting for players..." : "Start Game"}
            </button>
          ) : (
            <div className="lobby-waiting-message">
              Waiting for host to start...
            </div>
          )}

          <button 
            onClick={() => { socket?.emit("lobby:leave", { code }, () => {}); router.push("/"); }} 
            className="lobby-leave-button"
          >
            Leave Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

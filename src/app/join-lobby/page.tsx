"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./JoinLobby.css";
import { useSocket } from "@/context/SocketContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function JoinLobby() {
  const router = useRouter();
  const { socket } = useSocket();

  // State variable for storing the player's entered name
  const [playerName, setPlayerName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");

  // Function executed when the user presses the "Join Game" button
  async function joinLobby() {
    const normalizedName = playerName.trim();
    const normalizedCode = lobbyCode.trim().toUpperCase();

    // Validate that both fields have been filled in
    if (!normalizedName || !normalizedCode) {
      alert("Please enter your name and lobby code");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      const { data: signInData, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: `${normalizedName}_${Math.random().toString(36).substring(2, 6)}`,
          }
        }
      });

      if (error) {
        alert("Failed to connect as guest: " + error.message);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); 
    }

    if (!socket) return;

    const res = await socket.emitWithAck("lobby:join", {
      code: lobbyCode,
      playerName: playerName
    });

    // 1. Change "OK" to "SUCCESS"
    if (res.status === "SUCCESS") {

      router.push(`/lobby/${lobbyCode}`);
    } else {
      // 3. Add an error catch so users know if it fails
      alert(res.error || "Failed to join lobby");
    }
  }

  return (
    <div className="join-lobby-container">
      <div className="join-lobby-center">
        <div className="join-lobby-card">
          <h1 className="join-lobby-title">JOIN LOBBY</h1>

          {/* Player Name Input Section */}
          <div className="join-lobby-input-group">
            <label className="join-lobby-label">Player Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="join-lobby-input"
            />
          </div>

          {/* Lobby Code Input Section */}
          <div className="join-lobby-input-group">
            <label className="join-lobby-label">Lobby Code</label>
            <input
              type="text"
              placeholder="Enter lobby code"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              className="join-lobby-code-input"
            />
          </div>

          {/* Button used to attempt joining the lobby */}
          <button onClick={joinLobby} className="join-lobby-button">
            JOIN GAME
          </button>
        </div>
      </div>
    </div>
  );
}

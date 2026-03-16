"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import "./CreateLobby.css";

export default function CreateLobby() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const { socket } = useSocket();

  // Function triggered when the user presses the "Create Game" button
  async function createLobby() {

    const normalizedName = playerName.trim();

    if (!normalizedName) {
      alert("Please enter your name");
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

    const res = await socket.emitWithAck("lobby:create", {
      playerName: playerName,
      maxPlayers: maxPlayers,
    });

    // 1. Change "OK" to "SUCCESS"
    if (res.status === "SUCCESS") {
      const newLobbyCode = res.data.lobbyCode;

      // 2. You probably want to pass the name and maxPlayers to the lobby URL as query params
      // so the lobby can auto-join on arrival!
      router.push(`/lobby/${newLobbyCode}`);
    } else {
      console.error("DEBUG:", res);
      // 3. Add an error catch so users know if it fails
      alert(res.error || "Failed to create lobby");
    }
  }

  return (
    <div className="create-lobby-container">
      <div className="create-lobby-center">
        <div className="create-lobby-card">
          <h1 className="create-lobby-title">CREATE LOBBY</h1>

          {/* Player Name */}
          <div className="create-lobby-input-group">
            <label className="create-lobby-label">Player Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="create-lobby-input"
            />
          </div>

          {/* Max Players */}
          <div className="create-lobby-input-group">
            <label className="create-lobby-label">Max Players</label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="create-lobby-select"
            >
              <option value={5}>5 Players</option>
              <option value={6}>6 Players</option>
              <option value={7}>7 Players</option>
              <option value={8}>8 Players</option>
              <option value={9}>9 Players</option>
              <option value={10}>10 Players</option>
            </select>
          </div>

          <button onClick={createLobby} className="create-lobby-button">
            CREATE GAME
          </button>
        </div>
      </div>
    </div>
  );
}

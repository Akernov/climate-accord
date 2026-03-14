"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./CreateLobby.css";

export default function CreateLobby() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);

  function createLobby() {
    if (!playerName) {
      alert("Please enter your name");
      return;
    }

    const lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    router.push(`/lobby/${lobbyCode}?name=${playerName}&max=${maxPlayers}`);
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
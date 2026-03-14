"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./JoinLobby.css";

export default function JoinLobby() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");

  function joinLobby() {
    if (!playerName || !lobbyCode) {
      alert("Please enter your name and lobby code");
      return;
    }

    router.push(`/lobby/${lobbyCode.toUpperCase()}?name=${playerName}`);
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
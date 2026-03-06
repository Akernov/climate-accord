"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">

      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px]">

        <h1 className="text-4xl font-bold text-center text-green-900 mb-6">
          JOIN LOBBY
        </h1>

        {/* Player Name */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-black mb-2">
            Player Name
          </label>

          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-400 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>

        {/* Lobby Code */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-black mb-2">
            Lobby Code
          </label>

          <input
            type="text"
            placeholder="Enter lobby code"
            value={lobbyCode}
            onChange={(e) => setLobbyCode(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-400 text-black uppercase placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>

        {/* Join Button */}
        <button
          onClick={joinLobby}
          className="w-full bg-blue-700 text-white text-xl font-bold py-4 rounded-lg border-4 border-blue-900 hover:bg-blue-800 hover:scale-105 transition-all"
        >
          JOIN GAME
        </button>

      </div>

    </div>
  );
}
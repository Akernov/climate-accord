"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLobby() {

  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);

  function createLobby() {

    if (!playerName) {
      alert("Please enter your name");
      return;
    }

    // Generate simple lobby code
    const lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    // For now we just redirect to the lobby page
    router.push(`/lobby/${lobbyCode}?name=${playerName}&max=${maxPlayers}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">

      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px]">

        <h1 className="text-4xl font-bold text-center text-green-900 mb-6">
          CREATE LOBBY
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
            className="w-full p-3 rounded-lg border border-gray-400 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>

        {/* Max Players */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-black mb-2">
            Max Players
          </label>

          <select
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full p-3 rounded-lg border border-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-green-700"
          >
            <option value={5}>5 Players</option>
            <option value={6}>6 Players</option>
            <option value={7}>7 Players</option>
            <option value={8}>8 Players</option>
            <option value={9}>9 Players</option>
            <option value={10}>10 Players</option>
          </select>
        </div>

        {/* Create Button */}
        <button
          onClick={createLobby}
          className="w-full bg-green-700 text-white text-xl font-bold py-4 rounded-lg border-4 border-green-900 hover:bg-green-800 hover:scale-105 transition-all"
        >
          CREATE GAME
        </button>

      </div>

    </div>
  );
}
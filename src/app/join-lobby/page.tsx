"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

export default function JoinLobby() {

  const router = useRouter();
  const { socket } = useSocket();

  // State variable for storing the player's entered name
  const [playerName, setPlayerName] = useState("");

  // State variable for storing the lobby code entered by the user
  const [lobbyCode, setLobbyCode] = useState("");

  // Function executed when the user presses the "Join Game" button
  async function joinLobby() {

    // Validate that both fields have been filled in
    if (!playerName || !lobbyCode) {
      alert("Please enter your name and lobby code");
      return;
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

    // Main container that centers the lobby join form on the page
    <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden">

      <div className="flex flex-1 items-center justify-center">

        {/* Lobby join card */}
        <div className="bg-gray-900/80 p-10 rounded-xl shadow-xl w-[450px] border border-gray-700">

          {/* Page title */}
          <h1 className="text-4xl font-bold text-center text-gray-300 mb-8 tracking-wide">
            JOIN LOBBY
          </h1>

          {/* Player Name Input Section */}
          <div className="mb-6">

            {/* Label for player name input */}
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Player Name
            </label>

            {/* Input field where the player enters their name */}
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              // Controlled input linked to playerName state

              onChange={(e) => setPlayerName(e.target.value)}
              // Updates playerName state when the user types

              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          {/* Lobby Code Input Section */}
          <div className="mb-8">

            {/* Label for lobby code input */}
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Lobby Code
            </label>

            {/* Input field for entering the lobby code */}
            <input
              type="text"
              placeholder="Enter lobby code"
              value={lobbyCode}
              // Controlled input linked to lobbyCode state

              onChange={(e) => setLobbyCode(e.target.value)}
              // Updates lobbyCode state when the user types

              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white uppercase placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          {/* Button used to attempt joining the lobby */}
          <button
            onClick={joinLobby}
            // Calls joinLobby function when clicked

            className="w-full bg-blue-700 text-white text-xl font-bold py-4 rounded-lg border-4 border-blue-900 hover:bg-blue-800 hover:scale-105 transition-all"
          >
            JOIN GAME
          </button>

        </div>

      </div>

    </div>
  );
}
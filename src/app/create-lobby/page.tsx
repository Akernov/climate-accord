"use client"; 

import { useState } from "react"; 
import { useRouter } from "next/navigation"; 


export default function CreateLobby() {

  const router = useRouter(); 
  // Initialize router so we can redirect the user to another route

  // State variable to store the player's name entered in the input field
  const [playerName, setPlayerName] = useState("");

  // State variable to store the maximum number of players allowed in the lobby
  const [maxPlayers, setMaxPlayers] = useState(6);

  // Function triggered when the user presses the "Create Game" button
  function createLobby() {

    const normalizedName = playerName.trim();

    if (!normalizedName) {
      alert("Please enter your name");
      return;
    }

    // Generate a simple random lobby code
    // Converts a random number to base36 and extracts a short uppercase string
    const lobbyCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    const query = new URLSearchParams({
      name: normalizedName,
      maxPlayers: String(maxPlayers),
      create: "1",
    });

    // Redirect user to the lobby page with query parameters
    router.push(`/lobby/${lobbyCode}?${query.toString()}`);
  }

  return (

    // Uses a gradient background for visual styling
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">

      {/* Lobby creation card */}
      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px]">

        {/* Page title */}
        <h1 className="text-4xl font-bold text-center text-green-900 mb-6">
          CREATE LOBBY
        </h1>

        {/* Player Name Input Section */}
        <div className="mb-6">

          {/* Label for player name input */}
          <label className="block text-lg font-semibold text-black mb-2">
            Player Name
          </label>

          {/* User enters their name */}
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName} 

            onChange={(e) => setPlayerName(e.target.value)} 
            // Updates state whenever user types in the input field

            className="w-full p-3 rounded-lg border border-gray-400 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-700"
          />
        </div>

        {/* Max Players Selection Section */}
        <div className="mb-8">

          {/* Label for player count dropdown */}
          <label className="block text-lg font-semibold text-black mb-2">
            Max Players
          </label>

          {/* Dropdown menu to select maximum number of players */}
          <select
            value={maxPlayers} 
            // Controlled component linked to maxPlayers state

            onChange={(e) => setMaxPlayers(Number(e.target.value))} 
            // Updates maxPlayers when a different option is selected

            className="w-full p-3 rounded-lg border border-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-green-700"
          >

            {/* Available player count options */}
            <option value={5}>5 Players</option>
            <option value={6}>6 Players</option>
            <option value={7}>7 Players</option>
            <option value={8}>8 Players</option>
            <option value={9}>9 Players</option>
            <option value={10}>10 Players</option>

          </select>
        </div>

        {/* Button used to create the lobby */}
        <button
          onClick={createLobby} 
          // Calls the createLobby function when clicked

          className="w-full bg-green-700 text-white text-xl font-bold py-4 rounded-lg border-4 border-green-900 hover:bg-green-800 hover:scale-105 transition-all"
        >
          CREATE GAME
        </button>

      </div>

    </div>
  );
}

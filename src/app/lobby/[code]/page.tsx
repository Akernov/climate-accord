"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";

import { useState } from "react";

import { assignRoles } from "../../logic/page";
// Function responsible for assigning roles to players when the game starts

// Type definition for a player in the lobby
type Player = {
  name: string; 
  score: number; 
  role?: "advocate" | "lobbyist";
};

// Type definition describing the lobby/game state
type Lobby = {
  code: string;       // Unique lobby identifier
  host: string;       // Player who created the lobby
  players: Player[];  // List of players currently in the lobby
  started: boolean;   // Whether the game has started
  phase: string;      // Current game phase
  round: number;      // Current round number
  maxRounds: number;  // Maximum number of rounds in the game
};

export default function LobbyPage() {

  // Retrieve route and query parameters
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = params.code as string; // Lobby code from dynamic route
  const name = searchParams.get("name"); // Player name from query string

  // Key used to store/retrieve the lobby from localStorage
  const lobbyKey = `lobby-${code}`;

  // Initialize lobby state using a lazy initializer
  // This retrieves the lobby from localStorage or creates one if it does not exist
  const [lobby] = useState<Lobby>(() => {

    // If required parameters are missing, return an empty lobby object
    if (!name || !code) {
      return {
        code: "",
        host: "",
        players: [],
        started: false,
        phase: "waiting",
        round: 1,
        maxRounds: 5
      };
    }

    // Attempt to retrieve an existing lobby from localStorage
    const storedLobby = localStorage.getItem(lobbyKey);

    if (storedLobby) {

      // Parse the stored lobby data
      const parsed: Lobby = JSON.parse(storedLobby);

      // If the current player is not already in the lobby, add them
      if (!parsed.players.find((p) => p.name === name)) {
        parsed.players.push({
          name,
          score: 0
        });
      }

      // Update the stored lobby with the new player
      localStorage.setItem(lobbyKey, JSON.stringify(parsed));

      return parsed;
    }

    // If no lobby exists, create a new one and set the current player as host
    const newLobby: Lobby = {
      code,
      host: name,
      players: [{ name, score: 0 }],
      started: false,
      phase: "waiting",
      round: 1,
      maxRounds: 5
    };

    // Save the new lobby to localStorage
    localStorage.setItem(lobbyKey, JSON.stringify(newLobby));

    return newLobby;
  });

  // Extract commonly used lobby information
  const players = lobby.players;
  const host = lobby.host;

  return (

    // Main container for the lobby waiting room interface
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">

      {/* Lobby display card */}
      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px] text-black">

        {/* Page title */}
        <h1 className="text-4xl font-bold text-center mb-6">
          Lobby Waiting Room
        </h1>

        {/* Display the lobby code so players can join */}
        <p className="text-xl text-center mb-6">
          Lobby Code: <b>{code}</b>
        </p>

        {/* Player list section */}
        <h2 className="text-2xl mb-3">Players</h2>

        {/* Display all players currently in the lobby */}
        <ul className="mb-6">
          {players.map((player) => (
            <li key={player.name}>
              {player.name} {player.name === host ? "(Host)" : ""}
            </li>
          ))}
        </ul>

        {/* Start Game button is only visible to the lobby host */}
        {name === host && (
          <button
            onClick={() => {

              // Retrieve the latest lobby state from localStorage
              const storedLobby = localStorage.getItem(lobbyKey);
              if (!storedLobby) return;

              const lobby: Lobby = JSON.parse(storedLobby);

              // Assign roles to players before starting the game
              lobby.players = assignRoles(lobby.players);

              // Update lobby state to indicate the game has started
              lobby.started = true;
              lobby.phase = "playing";

              // Save the updated lobby back to localStorage
              localStorage.setItem(lobbyKey, JSON.stringify(lobby));

              // Navigate players to the main game page
              router.push(`/game/${code}?name=${name}`);
            }}

            className="w-full bg-green-700 text-white text-xl font-bold py-4 rounded-lg border-4 border-green-900 hover:bg-green-800 hover:scale-105 transition-all"
          >
            Start Game
          </button>
        )}

      </div>

    </div>
  );
}
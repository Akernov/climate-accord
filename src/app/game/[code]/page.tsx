"use client";

import { useParams, useSearchParams } from "next/navigation";

import { useState } from "react";

import BillBoard from "@/components/BillBoard";
// UI component responsible for rendering the bill interaction area

// Type definition for a player in the lobby
type Player = {
  name: string;       // Player's display name
  score: number;      // Player's current score
  role?: "advocate" | "lobbyist"; // 2 options for player roles, assigned at game start
};

// Type definition for the lobby/game state
type Lobby = {
  code: string;       // Unique lobby identifier
  host: string;       // Player who created the lobby
  players: Player[];  // List of players currently in the lobby
  started: boolean;   // Whether the game has started
  phase: string;      // Current game phase
  round: number;      // Current round number
  maxRounds: number;  // Maximum rounds before game ends
};

export default function GamePage() {

  const params = useParams();

  const searchParams = useSearchParams();

  const code = params.code as string; // Lobby code from URL
  const name = searchParams.get("name"); // Player name from query string

  // Initialize lobby state by retrieving data stored in localStorage
  const [lobby] = useState<Lobby | null>(() => {

    if (!code) return null;

    // Local storage key used to persist lobby data
    const lobbyKey = `lobby-${code}`;

    // Retrieve stored lobby data
    const storedLobby = localStorage.getItem(lobbyKey);

    if (!storedLobby) return null;

    // Convert stored JSON string back into a Lobby object
    return JSON.parse(storedLobby);
  });

  // Extract commonly used values from lobby state with safe defaults
  const players = lobby?.players ?? [];
  const round = lobby?.round ?? 1;
  const phase = lobby?.phase ?? "playing";

  // Determine which player corresponds to the current user
  const currentPlayer = players.find((p) => p.name === (name ?? ""));

  // Placeholder values for policy progress
  const activistProgress = 0;
  const lobbyistProgress = 0;

  return (

    // Main game container with centered layout and gradient background
    <div className="min-h-screen bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 flex flex-col items-center p-8 text-gray-900">

      {/* GAME HEADER */}
      <div className="text-center mb-8">

        {/* Game title */}
        <h1 className="text-5xl font-extrabold tracking-wide">
          Climate Accord
        </h1>

        {/* Display lobby code so players can share it */}
        <p className="text-lg mt-2">
          Lobby Code: <b>{code}</b>
        </p>

        {/* Current round and phase indicator */}
        <p className="text-md">
          Round {round} • Phase: {phase}
        </p>

        {/* Display the current player's assigned role */}
        {currentPlayer?.role && (
          <p className="mt-3 text-xl font-semibold">
            Your Role:{" "}
            {currentPlayer.role === "lobbyist"
              ? "Industrial Lobbyist 🏭"
              : "Climate Advocate 🌱"}
          </p>
        )}
      </div>

      {/* MAIN GAME BOARD AREA */}
      <div className="w-full max-w-6xl space-y-8">

        {/* LOBBYIST POLICY TRACK (only visible to lobbyists) */}
        {currentPlayer?.role === "lobbyist" && (
          <div className="bg-gradient-to-r from-red-500 to-red-400 p-6 rounded-2xl shadow-lg">

            {/* Track title and current progress */}
            <h2 className="text-2xl font-bold text-center text-white mb-5">
              Lobbyist Policy Track • Points: {lobbyistProgress}/6
            </h2>

            {/* Card placement area */}
            <div className="flex justify-center gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-24 h-32 bg-white rounded-lg border-4 border-red-700 flex items-center justify-center text-xs text-gray-500 shadow-md"
                >
                  place card
                </div>
              ))}
            </div>

          </div>
        )}

        {/* BILL INTERACTION AREA */}
        {/* Delegated to a separate UI component for modularity */}
        <BillBoard role={currentPlayer?.role} />

        {/* ACTIVIST POLICY TRACK */}
        <div className="bg-gradient-to-r from-green-500 to-green-400 p-6 rounded-2xl shadow-lg">

          {/* Track title and progress */}
          <h2 className="text-2xl font-bold text-center text-white mb-5">
            Activist Policy Track • Points: {activistProgress}/5
          </h2>

          {/* Card placement slots */}
          <div className="flex justify-center gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-24 h-32 bg-white rounded-lg border-4 border-green-700 flex items-center justify-center text-xs text-gray-500 shadow-md"
              >
                place card
              </div>
            ))}
          </div>

        </div>

        {/* PLAYER LIST DISPLAY */}
        <div className="bg-slate-200 p-4 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-3">
            Players
          </h2>

          {/* Display all players currently in the lobby */}
          <div className="flex flex-wrap gap-3 justify-center">
            {players.map((p) => (
              <div
                key={p.name}
                className="bg-white px-4 py-2 rounded-lg shadow font-medium"
              >
                {p.name}
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import BillBoard from "@/components/BillBoard";

type Player = {
  name: string;
  score: number;
  role?: "advocate" | "lobbyist";
};

type Lobby = {
  code: string;
  host: string;
  players: Player[];
  started: boolean;
  phase: string;
  round: number;
  maxRounds: number;
};

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const code = params.code as string;
  const name = searchParams.get("name");

  const [lobby] = useState<Lobby | null>(() => {
    if (!code) return null;

    const lobbyKey = `lobby-${code}`;
    const storedLobby = localStorage.getItem(lobbyKey);

    if (!storedLobby) return null;

    return JSON.parse(storedLobby);
  });

  const players = lobby?.players ?? [];
  const round = lobby?.round ?? 1;
  const phase = lobby?.phase ?? "playing";

  const currentPlayer = players.find((p) => p.name === (name ?? ""));

  // placeholder progress values (connect to game logic later)
  const activistProgress = 0;
  const lobbyistProgress = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 flex flex-col items-center p-8 text-gray-900">

      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold tracking-wide">
          Climate Accord
        </h1>

        <p className="text-lg mt-2">
          Lobby Code: <b>{code}</b>
        </p>

        <p className="text-md">
          Round {round} • Phase: {phase}
        </p>

        {currentPlayer?.role && (
          <p className="mt-3 text-xl font-semibold">
            Your Role:{" "}
            {currentPlayer.role === "lobbyist"
              ? "Industrial Lobbyist 🏭"
              : "Climate Advocate 🌱"}
          </p>
        )}
      </div>

      {/* BOARD */}
      <div className="w-full max-w-6xl space-y-8">

        {/* LOBBYIST TRACK */}
        {currentPlayer?.role === "lobbyist" && (
          <div className="bg-gradient-to-r from-red-500 to-red-400 p-6 rounded-2xl shadow-lg">

            <h2 className="text-2xl font-bold text-center text-white mb-5">
              Lobbyist Policy Track • Points: {lobbyistProgress}/6
            </h2>

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

        {/* BILL AREA */}
        <BillBoard role={currentPlayer?.role} />

        {/* ACTIVIST TRACK */}
        <div className="bg-gradient-to-r from-green-500 to-green-400 p-6 rounded-2xl shadow-lg">

          <h2 className="text-2xl font-bold text-center text-white mb-5">
            Activist Policy Track • Points: {activistProgress}/5
          </h2>

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

        {/* PLAYERS */}
        <div className="bg-slate-200 p-4 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-3">
            Players
          </h2>

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
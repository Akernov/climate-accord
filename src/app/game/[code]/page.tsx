"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

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
  const phase = lobby?.phase ?? "waiting";

  const currentPlayer = players.find((p) => p.name === name);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">

      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[500px] text-black">

        <h1 className="text-4xl font-bold text-center mb-6">
          Game Started
        </h1>

        <p className="text-xl text-center mb-2">
          Lobby Code: <b>{code}</b>
        </p>

        <p className="text-lg text-center mb-2">
          Round {round} • Phase: {phase}
        </p>

        {currentPlayer?.role && (
          <p className="text-center text-xl mb-6 font-bold">
            Your Role: {currentPlayer.role === "lobbyist"
              ? "Industrial Lobbyist"
              : "Climate Advocate"}
          </p>
        )}

        <h2 className="text-2xl mb-3">Players</h2>

        <ul className="mb-6">
          {players.map((player) => (
            <li key={player.name}>
              {player.name} — Score: {player.score}
            </li>
          ))}
        </ul>

        <p className="text-center text-lg">
          Game logic coming next...
        </p>

      </div>

    </div>
  );
}
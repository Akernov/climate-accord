"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { assignRoles } from "../../logic/page";

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

export default function LobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = params.code as string;
  const name = searchParams.get("name");

  const lobbyKey = `lobby-${code}`;

  const [lobby] = useState<Lobby>(() => {
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

    const storedLobby = localStorage.getItem(lobbyKey);

    if (storedLobby) {
      const parsed: Lobby = JSON.parse(storedLobby);

      if (!parsed.players.find((p) => p.name === name)) {
        parsed.players.push({
          name,
          score: 0
        });
      }

      localStorage.setItem(lobbyKey, JSON.stringify(parsed));
      return parsed;
    }

    const newLobby: Lobby = {
      code,
      host: name,
      players: [{ name, score: 0 }],
      started: false,
      phase: "waiting",
      round: 1,
      maxRounds: 5
    };

    localStorage.setItem(lobbyKey, JSON.stringify(newLobby));
    return newLobby;
  });

  const players = lobby.players;
  const host = lobby.host;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">
      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px] text-black">

        <h1 className="text-4xl font-bold text-center mb-6">
          Lobby Waiting Room
        </h1>

        <p className="text-xl text-center mb-6">
          Lobby Code: <b>{code}</b>
        </p>

        <h2 className="text-2xl mb-3">Players</h2>

        <ul className="mb-6">
          {players.map((player) => (
            <li key={player.name}>
              {player.name} {player.name === host ? "(Host)" : ""}
            </li>
          ))}
        </ul>

        {name === host && (
          <button
            onClick={() => {
              const storedLobby = localStorage.getItem(lobbyKey);
              if (!storedLobby) return;

              const lobby: Lobby = JSON.parse(storedLobby);

              // assign roles to players
              lobby.players = assignRoles(lobby.players);

              lobby.started = true;
              lobby.phase = "playing";

              localStorage.setItem(lobbyKey, JSON.stringify(lobby));

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
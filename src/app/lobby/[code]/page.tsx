"use client";

import { useParams, useSearchParams } from "next/navigation";

export default function LobbyPage() {

  const params = useParams();
  const searchParams = useSearchParams();

  const code = params.code;
  const name = searchParams.get("name");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-200 via-blue-200 to-slate-300">

      <div className="bg-white/40 backdrop-blur-md p-10 rounded-xl shadow-xl w-[450px] text-black">

        <h1 className="text-4xl font-bold text-center mb-6">
          Lobby Waiting Room
        </h1>

        <p className="text-xl mb-4 text-center">
          Lobby Code: <b>{code}</b>
        </p>

        <h2 className="text-2xl mb-2">Players</h2>

        <ul className="mb-6">
          <li>{name} (Host)</li>
        </ul>

        <button className="w-full bg-green-700 text-white text-xl font-bold py-4 rounded-lg border-4 border-green-900 hover:bg-green-800 hover:scale-105 transition-all">
          Start Game
        </button>

      </div>

    </div>
  );
}
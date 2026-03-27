"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

export default function CreateLobby() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const { socket } = useSocket();

  async function createLobby() {
    const normalizedName = playerName.trim();

    if (!normalizedName) {
      alert("Please enter your name");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      const { error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            display_name: `${normalizedName}_${Math.random()
              .toString(36)
              .substring(2, 6)}`,
          },
        },
      });

      if (error) {
        alert("Failed to connect as guest: " + error.message);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!socket) return;

    const res = await socket.emitWithAck("lobby:create", {
      playerName,
      maxPlayers,
    });

    if (res.status === "SUCCESS") {
      const newLobbyCode = res.data.lobbyCode;
      router.push(`/lobby/${newLobbyCode}`);
    } else {
      console.error("DEBUG:", res);
      alert(res.error || "Failed to create lobby");
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-white">

      {/* 🌍 BACKGROUND (same as homepage) */}
      <div className="absolute inset-0 bg-[url('/images/worldmapbackground.png')] bg-cover bg-center opacity-15 blur-[2px]" />
      <div className="absolute inset-0 animate-greenPulse bg-gradient-to-br from-green-400/50 via-green-300/20 to-transparent blur-[40px]" />
      <div className="absolute inset-0 animate-grayPulse bg-gradient-to-tr from-gray-300/30 via-transparent to-transparent blur-[40px]" />
      <div className="absolute inset-0 bg-black/40" />

      {/* 🧩 CONTENT */}
      <div className="relative z-10 flex flex-1 items-center justify-center">

        <div className="bg-gray-900/80 p-10 rounded-xl w-[450px] border border-gray-700 shadow-xl backdrop-blur">

          <h1 className="text-3xl font-bold text-center text-gray-300 mb-8 tracking-wide">
            CREATE LOBBY
          </h1>

          {/* Player Name */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Player Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>

          {/* Max Players */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Max Players
            </label>
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            >
              {[4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} Players</option>
              ))}
            </select>
          </div>

          {/* Button */}
          <button
            onClick={createLobby}
            className="w-full bg-green-700 text-white text-xl font-bold py-4 rounded-lg border-4 border-green-900 shadow-lg hover:scale-105 hover:bg-green-800 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all"
          >
            CREATE GAME
          </button>

        </div>
      </div>

      {/* 🎞️ ANIMATIONS (same as homepage) */}
      <style>{`
        @keyframes greenPulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }

        @keyframes grayPulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1.05);
          }
          50% {
            opacity: 0.7;
            transform: scale(1);
          }
        }

        .animate-greenPulse {
          animation: greenPulse 8s ease-in-out infinite;
        }

        .animate-grayPulse {
          animation: grayPulse 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
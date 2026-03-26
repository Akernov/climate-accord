"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";

export default function UserStats() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const { socket } = useSocket();

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
            STATS
          </h1>

          {/* Player Name */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Wins
            </label>
            7
          </div>

          {/* Max Players */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-300 mb-2">
              Losses
            </label>
            3
          </div>
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
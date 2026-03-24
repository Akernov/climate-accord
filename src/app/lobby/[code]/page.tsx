"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Lobby } from "@/types/game";
import "./LobbyPage.css";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const { socket } = useSocket();

  const code = params?.code as string;

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (lobby?.status === 'started') {
      router.push(`/game/${code}`);
    }
  }, [lobby, code, router]);

  useEffect(() => {
    if (!socket || !code) return;

    const onLobbyUpdated = (updatedLobby: Lobby) => {
      setLobby(updatedLobby);
    };
    
    const onKicked = (data: { targetID: string }) => {
      if (data.targetID === currentUserId) {
        alert("You have been removed from the lobby by the host.");
        router.push("/");
      }
    };

    const onError = (message: string) => {
      alert(message);
      router.push("/");
    };

    socket.on("lobby:updated", onLobbyUpdated);
    socket.on("lobby:kick_player", onKicked);
    socket.on("error_message", onError);

    socket.emit(
      "lobby:get_state",
      { code },
      (res: { status: "SUCCESS" | "ERROR"; error?: string; data?: Lobby }) => {
        if (res.status === "ERROR") {
          console.error(res.error);
          router.push("/");
        } else if (res.data) {
          setLobby(res.data);
        }
      }
    );

    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });

    return () => {
      socket.off("lobby:updated", onLobbyUpdated);
      socket.off("lobby:kick_player", onKicked);
      socket.off("error_message", onError);
    };
  }, [socket, code, router, currentUserId]); 

  // LOADING SCREEN
  if (!lobby) {
    return (
      <div className="relative min-h-screen flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-black" />
        <p className="relative z-10 text-xl font-bold animate-pulse text-gray-300">
          Connecting to lobby...
        </p>
      </div>
    );
  }

  const isHost = lobby.host === currentUserId;
  const isReadyToStart = lobby.players.length >= 2;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-white">

      {/* BACKGROUND (same as create page) */}
      <div className="absolute inset-0 bg-[url('/images/worldmapbackground.png')] bg-cover bg-center opacity-15 blur-[2px]" />
      <div className="absolute inset-0 animate-greenPulse bg-gradient-to-br from-green-400/50 via-green-300/20 to-transparent blur-[40px]" />
      <div className="absolute inset-0 animate-grayPulse bg-gradient-to-tr from-gray-300/30 via-transparent to-transparent blur-[40px]" />
      <div className="absolute inset-0 bg-black/40" />

      {/*  CONTENT */}
      <div className="relative z-10 flex flex-1 items-center justify-center">

        <div className="bg-gray-900/80 p-10 rounded-xl w-[450px] border border-gray-700 shadow-xl backdrop-blur">

          <h1 className="text-3xl font-bold text-center text-gray-300 mb-6 tracking-wide">
            LOBBY
          </h1>

          <p className="text-center text-lg mb-1">
            Code:{" "}
            <span className="font-mono font-bold bg-gray-800 px-2 py-1 rounded">
              {code}
            </span>
          </p>

          <p className="text-center text-sm text-gray-400 mb-6 font-semibold">
            {lobby.players.length} / {lobby.maxPlayers} Players
          </p>

          {/* PLAYERS */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Players</h2>

            <ul className="space-y-3">
              {lobby.players.map((player) => (
                <li
                  key={player.userId}
                  className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded-lg"
                >
                  <span>
                    {player.name}{" "}
                    {player.userId === lobby.host && "👑"}
                  </span>

                  {isHost && player.userId !== currentUserId && (
                    <button
                      onClick={() =>
                        socket?.emit("lobby:kick_player", {
                          code,
                          targetID: player.userId,
                        })
                      }
                      className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700 transition"
                    >
                      Kick
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3">

            {isHost ? (
              <button
                onClick={() =>
                  socket?.emit("lobby:start_game", { code })
                }
                disabled={!isReadyToStart}
                className={`w-full text-xl font-bold py-4 rounded-lg border-4 transition-all
                  ${
                    isReadyToStart
                      ? "bg-green-700 border-green-900 hover:bg-green-800 hover:scale-105 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                      : "bg-gray-600 border-gray-800 opacity-50 cursor-not-allowed"
                  }`}
              >
                {isReadyToStart ? "START GAME" : "Waiting for players..."}
              </button>
            ) : (
              <div className="text-center p-3 bg-gray-800 rounded-lg border border-blue-500 italic">
                Waiting for host to start...
              </div>
            )}

            <button
              onClick={() => {
                socket?.emit("lobby:leave", { code });
                router.push("/");
              }}
              className="w-full bg-gray-800 border border-gray-600 py-2 rounded-lg font-bold hover:bg-gray-700 transition"
            >
              LEAVE LOBBY
            </button>

          </div>
        </div>
      </div>

      {/* ANIMATIONS */}
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
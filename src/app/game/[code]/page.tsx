"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Player, Lobby, Bill } from "@/types/game";
import BillVotingPhase from "@/components/BillVotingPhase";
import DiscussionPhase from "@/components/DiscussionPhase";
import PlayerVotingPhase from "@/components/PlayerVotingPhase";
import EndGameScreen from "@/components/EndGameScreen";
import Timer from "@/components/Timer";

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const { socket } = useSocket();

  const code = params?.code as string;

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (!socket || !code) return;

    const onLobbyUpdated = (serverLobby: Lobby) => setLobby(serverLobby);

    const onError = (message: string) => {
      alert(message);
      router.push("/");
    };

    socket.on("lobby:updated", onLobbyUpdated);
    socket.on("error_message", onError);

    socket.emit(
      "lobby:get_state", 
      { code }, 
      (res: { status: "SUCCESS" | "ERROR"; error?: string; data?: Lobby }) => {
        if (res.status === "ERROR") {
            console.error("Failed to fetch lobby state:", res.error);
            router.push("/");
        } else if (res.status === "SUCCESS" && res.data) {
            setLobby(res.data);
        }
      }
    );

    // Fetch and store the user's UUID
    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });

    return () => {
      socket.off("lobby:updated", onLobbyUpdated);
      socket.off("error_message", onError);
    };
  }, [socket, code, router]);

  // Prevent rendering the board until we have the data from the server
  if (!lobby) {
    return (
      <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center justify-center">
        <p className="text-2xl font-bold text-gray-300">Loading game board...</p>
      </div>
    );
  }

  const players = lobby.players;
  const phase = lobby.phase;

  const currentPlayer = players.find((p) => p.userId === currentUserId);

  if (lobby.status === 'ended') {
      return (
        <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center justify-center p-8">
           <EndGameScreen lobby={lobby} currentPlayer={currentPlayer} />
        </div>
      );
  }

  const renderPhaseComponent = () => {
    switch (phase) {
      case 'Bill Voting':
        return <BillVotingPhase lobby={lobby} currentPlayer={currentPlayer} />;
      case 'Discussion':
        return <DiscussionPhase lobby={lobby} currentPlayer={currentPlayer} />;
      case 'Player Voting':
      case 'Grace Period':
        return <PlayerVotingPhase lobby={lobby} currentPlayer={currentPlayer} />;
      default:
        return <p>Waiting for the next phase...</p>;
    }
  };

  return (
    <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center p-8 text-gray-300">
      
      {/* GAME HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold tracking-wide text-gray-400/90">
        Climate Accord
        </h1>
 
        <div className="mt-4 space-y-2">
            <p className="text-lg">
              Lobby Code: <b>{code}</b>
            </p>

            <div className="flex items-center justify-center gap-4">
                <p className="text-md">
                    Phase: {phase}
                </p>
                {lobby.phaseEndTime && <Timer endTime={lobby.phaseEndTime} />}
            </div>

            {currentPlayer?.role && (
              <p className="mt-3 text-xl font-semibold">
                Your Role:{" "}
                {currentPlayer.role === "lobbyist"
                  ? "Industrial Lobbyist 🏭"
                  : "Climate Advocate 🌱"}
              </p>
            )}
        </div>
      </div>

      {/* MAIN GAME BOARD AREA */}
      <div className="w-full max-w-6xl space-y-8">

        {renderPhaseComponent()}

        {/* PLAYER LIST DISPLAY */}
        <div className="bg-gray-900 p-4 rounded-xl shadow border border-gray-700">
          <h2 className="text-xl font-bold mb-3">
            Players
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {players.map((p) => {
              const isSpectator = (lobby.oustedPlayers || []).includes(p.userId);
              return (
                <div
                  key={p.userId}
                  className={`px-4 py-2 rounded-lg shadow font-medium flex gap-2 items-center ${isSpectator ? 'bg-gray-900 border border-gray-700 text-gray-600 line-through' : 'bg-gray-800 text-white'}`}
                >
                  {p.name} 
                  {p.userId === lobby.host && <span>👑</span>}
                  {isSpectator && <span className="text-xs ml-1 no-underline uppercase tracking-widest font-black text-gray-500">Ousted</span>}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

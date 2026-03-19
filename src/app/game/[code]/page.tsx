"use client";
// This tells Next.js that this page runs in the browser
// because we are using hooks and real-time socket connections.

import { useParams, useRouter } from "next/navigation";
// useParams lets us read the lobby code from the URL
// useRouter allows us to redirect users to other pages

import { useState, useEffect } from "react";
// React hooks used for managing state and running side effects

import BillBoard from "@/components/BillBoard";
// Component that will display the bills being voted on in the game

import { useSocket } from "@/context/SocketContext";
// Custom hook that provides the real-time socket connection to the server

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
// Supabase client used for authentication

import { Player, Lobby, Bill } from "@/types/game";
// TypeScript types describing the structure of game data


export default function GamePage() {

  const router = useRouter();
  const params = useParams();
  const { socket } = useSocket();

  // Extract the lobby code from the URL
  const code = params?.code as string;

  // State to store the lobby data received from the server
  const [lobby, setLobby] = useState<Lobby | null>(null);

  // State to store the current user's ID (from Supabase)
  const [currentUserId, setCurrentUserId] = useState<string>("");


  useEffect(() => {

    // If the socket or lobby code is missing, do nothing
    if (!socket || !code) return;

    // Event listener that runs whenever the server sends updated lobby data
    const onLobbyUpdated = (serverLobby: Lobby) => setLobby(serverLobby);

    // Event listener for server errors
    const onError = (message: string) => {
      alert(message);
      router.push("/");
    };

    // Subscribe to real-time events from the server
    socket.on("lobby:updated", onLobbyUpdated);
    socket.on("error_message", onError);

    // Ask the server for the current lobby state
    socket.emit(
      "lobby:get_state", 
      { code }, 
      (res: { status: "SUCCESS" | "ERROR"; error?: string; data?: Lobby }) => {

        // If the server reports an error, redirect back to home
        if (res.status === "ERROR") {
            console.error("Failed to fetch lobby state:", res.error);
            router.push("/");
        } 
        
        // If successful, store the lobby data in state
        else if (res.status === "SUCCESS" && res.data) {
            setLobby(res.data);
        }
      }
    );

    // Fetch the currently authenticated user from Supabase
    // This lets us identify which player in the lobby is "us"
    getSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });

    // Cleanup function to remove event listeners when the page unmounts
    return () => {
      socket.off("lobby:updated", onLobbyUpdated);
      socket.off("error_message", onError);
    };

  }, [socket, code, router]);


  // Prevent rendering the game board until lobby data is loaded
  if (!lobby) {
    return (
      <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center justify-center">
        <p className="text-2xl font-bold text-gray-300">
          Loading game board...
        </p>
      </div>
    );
  }


  // Extract player list and game phase from the lobby object
  const players = lobby.players;
  const phase = lobby.phase;

  // Find the player object corresponding to the current user
  const currentPlayer = players.find((p) => p.userId === currentUserId);


  return (
    <div className="relative min-h-screen mx-auto flex flex-col bg-black overflow-hidden items-center p-8 text-gray-300">
      
      {/* GAME HEADER */}
      {/* Displays basic game information */}
      <div className="text-center mb-8">

        <h1 className="text-5xl font-extrabold tracking-wide text-gray-400/90">
          Climate Accord
        </h1>

        {/* Show the lobby code so other players can join */}
        <p className="text-lg mt-2">
          Lobby Code: <b>{code}</b>
        </p>

        {/* Display the current game phase */}
        <p className="text-md">
          Phase: {phase}
        </p>

        {/* Display the player's assigned role */}
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

        {/* Component that will show the bills currently in play */}
        <BillBoard role={currentPlayer?.role} bills={[]} />

        {/* PLAYER LIST DISPLAY */}
        {/* Shows all players currently in the lobby */}
        <div className="bg-gray-900 p-4 rounded-xl shadow border border-gray-700">

          <h2 className="text-xl font-bold mb-3">
            Players
          </h2>

          <div className="flex flex-wrap gap-3 justify-center">

            {players.map((p) => (

              <div
                key={p.userId}
                className="bg-gray-800 px-4 py-2 rounded-lg shadow font-medium flex gap-2 items-center"
              >
                {p.name}

                {/* Crown icon shows who the host of the lobby is */}
                {p.userId === lobby.host && <span>👑</span>}

              </div>

            ))}

          </div>
        </div>

      </div>
    </div>
  );
}
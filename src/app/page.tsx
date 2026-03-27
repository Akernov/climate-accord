"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Home() {
  const [showInfo, setShowInfo] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        // Treat anonymous users as not logged in for button display
        const loggedIn = !!data.session && !data.session.user.is_anonymous;
        setIsLoggedIn(loggedIn);
      }
    };

    checkAuth();

    // Optional: listen for auth changes to update UI reactively
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        const loggedIn = !!session && !session.user.is_anonymous;
        setIsLoggedIn(loggedIn);
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // While loading auth status, you can show a minimal placeholder (or nothing)
  if (isLoggedIn === null) {
    return (
      <div className="relative min-h-screen mx-auto flex flex-col overflow-hidden text-white">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen mx-auto flex flex-col overflow-hidden text-white">

      {/* BACKGROUND LAYERS */}
      <div className="absolute inset-0 bg-[url('/images/worldmapbackground.png')] bg-cover bg-center opacity-15 blur-[2px]" />
      <div className="absolute inset-0 animate-greenPulse bg-gradient-to-br from-green-400/50 via-transparent to-transparent blur-[40px]" />
      <div className="absolute inset-0 animate-grayPulse bg-gradient-to-tr from-gray-300/30 via-transparent to-transparent blur-[40px]" />
      <div className="absolute inset-0 bg-black/40" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Title */}
        <header className="text-center py-12">
          <h1 className="text-7xl font-extrabold tracking-widest text-gray-300 drop-shadow-lg">
            CLIMATE <br /> ACCORD
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Negotiate climate policy. Compete. Shape the future.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            SENG 401 Group 10
          </p>
        </header>

        {/* Menu */}
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col gap-6 w-[420px]">

            {/* Conditionally show Sign Up / Log In when NOT logged in */}
            {!isLoggedIn && (
              <>
                <Link
                  href="/signup"
                  className="bg-teal-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-teal-900 shadow-lg hover:scale-105 hover:bg-teal-800 hover:shadow-[0_0_25px_rgba(20,184,166,0.6)] transition-all text-center"
                >
                  SIGN UP
                </Link>

                <Link
                  href="/login"
                  className="bg-amber-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-amber-900 shadow-lg hover:scale-105 hover:bg-amber-800 hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] transition-all text-center"
                >
                  LOG IN
                </Link>
              </>
            )}

            {/* Always visible game and info buttons */}
            <Link
              href="/create-lobby"
              className="bg-green-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-green-900 shadow-lg hover:scale-105 hover:bg-green-800 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all text-center"
            >
              HOST GAME
            </Link>

            <Link
              href="/join-lobby"
              className="bg-blue-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-blue-900 shadow-lg hover:scale-105 hover:bg-blue-800 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all text-center"
            >
              JOIN GAME
            </Link>

            <Link
              href="/profile"
              className="bg-gray-800 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-black shadow-lg hover:scale-105 hover:bg-gray-900 transition-all text-center"
            >
              MY STATS
            </Link>

            <button
              onClick={() => setShowInfo(true)}
              className="bg-purple-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-purple-900 shadow-lg hover:scale-105 hover:bg-purple-800 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all"
            >
              HOW TO PLAY
            </button>

          </div>
        </main>

        {/* Footer */}
        <footer className="text-center pb-6 text-gray-600">
          A SENG 401 Project
        </footer>
      </div>

      {/* HOW TO PLAY MODAL */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl max-w-lg text-center border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <p className="text-gray-300 mb-4">
              Climate Accord is a social strategy game where players take on hidden roles as either Activists or Lobbyists, each with opposing goals.
              At the start of the game, every player is secretly assigned a role. Lobbyists know their teammates, while Activists must rely on discussion and deduction to identify them.
              Each round, players are presented with Bills that contain both public and hidden outcomes. Players vote anonymously to decide which Bill passes, influencing progress toward each faction’s objectives.
              After each round, players may initiate a voting phase to eliminate a suspected opponent. Eliminated players can still observe and participate in discussions, but cannot vote.
              As the game progresses, special abilities may be unlocked to help balance the game and increase strategic depth.
            </p>
            <p className="text-gray-400 mb-4">
              The game ends when the Activists either complete all their objectives or eliminate all Lobbyists, or when the Lobbyists achieve 7 points in three objectives. The winning faction is then declared.
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-4 bg-red-600 px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* SMOOTH ANIMATIONS */}
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
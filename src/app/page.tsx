"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert(`Failed to log out: ${error.message}`);
        setIsLoggingOut(false);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to log out: ${message}`);
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative min-h-screen mx-auto flex flex-col bg-gray overflow-hidden">
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Title */}
        <header className="text-center py-12">
          <h1 className="text-7xl font-extrabold tracking-widest text-gray-400/90 drop-shadow-lg">
            CLIMATE <br /> ACCORD
          </h1>

          <p className="mt-4 text-xl text-gray-700">
            A political strategy game about global climate policy
          </p>
           <p className="mt-4 text-xl text-gray-700">
            SENG 401 Group 10
          </p>
        </header>

        {/* Menu */}
        <main className="flex flex-1 items-center justify-center">

          <div className="flex flex-col gap-6 w-[420px]">

            <Link
              href="/create-lobby"
              className="bg-green-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-green-900 shadow-lg hover:scale-105 hover:bg-green-800 transition-all text-center"
            >
              CREATE LOBBY
            </Link>

            <Link
              href="/join-lobby"
              className="bg-blue-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-blue-900 shadow-lg hover:scale-105 hover:bg-blue-800 transition-all text-center"
            >
              JOIN LOBBY
            </Link>

            <Link
              href="/profile"
              className="bg-gray-800 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-black shadow-lg hover:scale-105 hover:bg-gray-900 transition-all text-center"
            >
              PLAYER STATS
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-700 text-white text-xl font-bold py-5 px-8 rounded-lg border-4 border-red-900 shadow-lg hover:scale-105 hover:bg-red-800 transition-all text-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "LOGGING OUT..." : "LOG OUT"}
            </button>

          </div>

        </main>

        <footer className="text-center pb-6 text-gray-700">
          A SENG 401 Project
        </footer>

      </div>

    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getUserMatchHistory } from "@/lib/supabase/profile";

type StatsSummary = {
  displayName: string;
  wins: number;
  losses: number;
  total: number;
};

function getDisplayNameFromSession(sessionUser: {
  user_metadata?: { display_name?: unknown; name?: unknown };
  email?: string | null;
  id: string;
}): string {
  const fromMetadata =
    (typeof sessionUser.user_metadata?.display_name === "string" &&
      sessionUser.user_metadata.display_name.trim()) ||
    (typeof sessionUser.user_metadata?.name === "string" &&
      sessionUser.user_metadata.name.trim());

  if (fromMetadata) {
    return fromMetadata;
  }

  if (typeof sessionUser.email === "string" && sessionUser.email.trim()) {
    return sessionUser.email.split("@")[0];
  }

  return `user-${sessionUser.id.slice(0, 8)}`;
}

export default function UserStatsPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setErrorMessage("");
      setIsLoading(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (sessionError) {
        setErrorMessage(sessionError.message);
        setIsLoading(false);
        return;
      }

      const session = sessionData.session;
      if (!session || session.user.is_anonymous) {
        router.replace("/login?next=/stats");
        return;
      }

      const { matches, error } = await getUserMatchHistory(supabase, session.user.id);
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error);
        setIsLoading(false);
        return;
      }

      const wins = matches.filter((match) => match.role === match.winner_faction).length;
      const losses = matches.length - wins;

      setSummary({
        displayName: getDisplayNameFromSession(session.user),
        wins,
        losses,
        total: matches.length,
      });
      setIsLoading(false);
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-white">
      <div className="absolute inset-0 bg-[url('/images/worldmapbackground.png')] bg-cover bg-center opacity-15 blur-[2px]" />
      <div className="absolute inset-0 animate-greenPulse bg-gradient-to-br from-green-400/50 via-transparent to-transparent blur-[40px]" />
      <div className="absolute inset-0 animate-grayPulse bg-gradient-to-tr from-gray-300/30 via-transparent to-transparent blur-[40px]" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-xl border border-gray-700 bg-gray-900/90 p-8 shadow-xl">
          <h1 className="text-center text-3xl font-bold tracking-wide text-gray-300">MY STATS</h1>

          {isLoading && <p className="mt-6 text-center text-lg text-gray-300">Loading stats...</p>}

          {!isLoading && errorMessage && (
            <div className="mt-6 rounded-lg border border-red-700 bg-red-900/50 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && summary && (
            <>
              <p className="mt-4 text-center text-sm font-semibold text-gray-400">
                Player: <span className="text-gray-200">{summary.displayName}</span>
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-green-700 bg-green-900/30 p-4 text-center shadow">
                  <p className="text-xs font-bold uppercase tracking-wider text-green-300">Wins</p>
                  <p className="mt-2 text-4xl font-black text-green-200">{summary.wins}</p>
                </div>

                <div className="rounded-lg border border-red-700 bg-red-900/30 p-4 text-center shadow">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-300">Losses</p>
                  <p className="mt-2 text-4xl font-black text-red-200">{summary.losses}</p>
                </div>
              </div>

              <p className="mt-5 text-center text-sm text-gray-400">
                Total Completed Games: <span className="font-semibold text-gray-200">{summary.total}</span>
              </p>
            </>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border-4 border-blue-900 bg-blue-700 px-4 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-800 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
            >
              Refresh Stats
            </button>

            <Link
              href="/"
              className="rounded-lg border-4 border-black bg-gray-800 px-4 py-3 text-center text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-gray-900"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>

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

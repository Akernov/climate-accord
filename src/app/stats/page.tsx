"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserMatchHistory, MatchRecord } from "@/lib/supabase/profile";
import Link from "next/link";

export default function UserStats() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { matches: history, error: fetchError } = await getUserMatchHistory(supabase, user.id);
      if (fetchError) {
        setError(fetchError);
      } else {
        setMatches(history);
      }
      setLoading(false);
    }
    loadStats();
  }, [router]);

  const stats = matches.reduce((acc, match) => {
    const isWin = match.role === match.winner_faction;
    if (isWin) acc.wins++;
    else acc.losses++;
    return acc;
  }, { wins: 0, losses: 0 });

  const total = matches.length;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-2xl font-black text-gray-500 animate-pulse uppercase tracking-widest">Loading Stats...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-white font-sans">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[url('/images/worldmapbackground.png')] bg-cover bg-center opacity-10 grayscale" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black opacity-90" />
      
      <div className="relative z-10 flex flex-1 flex-col items-center py-12 px-4 gap-8">
        
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
            Player <span className="text-green-500">Analytics</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2 opacity-60">Climate Accord Personal History</p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl">
          <StatCard label="Total Games" value={total} color="text-blue-400" />
          <StatCard label="Wins" value={stats.wins} color="text-green-400" />
          <StatCard label="Losses" value={stats.losses} color="text-red-400" />
          <StatCard label="Win Rate" value={`${winRate}%`} color="text-yellow-400" />
        </div>

        {/* MATCH HISTORY LIST */}
        <div className="w-full max-w-5xl bg-gray-900/60 border-2 border-gray-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col">
          <div className="bg-gray-800/80 p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-gray-300">Match Log</h2>
            <Link 
              href="/"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Back Home
            </Link>
          </div>

          <div className="overflow-y-auto max-h-[500px] scrollbar-hide">
            {matches.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-800 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-700">
                  <tr>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Factions</th>
                    <th className="px-8 py-4 text-center">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {matches.map((match) => {
                    const isWin = match.role === match.winner_faction;
                    const date = new Date(match.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    return (
                      <tr key={match.game_id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="font-bold text-gray-400 text-sm">{date}</div>
                           <div className="text-[10px] text-gray-600 font-black uppercase tracking-tighter">{match.game_id.slice(0,8)}</div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase border ${match.role === 'advocate' ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-red-900/20 text-red-400 border-red-800'}`}>
                                {match.role}
                              </span>
                              <span className="text-gray-600 text-[10px] font-black uppercase opacity-50">vs</span>
                              <span className="text-gray-400 font-bold text-sm">Industrialists</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                           <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg ${isWin ? 'bg-green-500 text-black shadow-green-900/40' : 'bg-red-500/20 text-red-500 border border-red-900/50 shadow-none opacity-80'}`}>
                              {isWin ? 'Victory' : 'Defeat'}
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="text-4xl">🌵</div>
                <div className="text-gray-500 font-black uppercase tracking-widest text-center">
                   No battle history found.<br/>
                   <span className="text-xs text-gray-700">Go play a game to see your stats!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-3xl flex flex-col items-center gap-2 hover:border-gray-700 transition-all">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</span>
      <span className={`text-3xl font-black ${color}`}>{value}</span>
    </div>
  );
}
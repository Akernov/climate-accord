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
      console.log("[StatsPage] Attempting to load stats...");
      const supabase = getSupabaseBrowserClient();
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("[StatsPage] Authentication check failed:", userError.message);
        setLoading(false);
        setError("Session expired. Please log in again.");
        return;
      }

      if (!user) {
        console.warn("[StatsPage] No active user session found.");
        router.push("/login");
        return;
      }

      console.log("[StatsPage] User validated:", user.id);

      try {
        const { matches: history, error: fetchError } = await getUserMatchHistory(supabase, user.id);
        
        if (fetchError) {
          console.error("[StatsPage] Match history fetch failed:", fetchError);
          setError(fetchError);
        } else {
          console.log("[StatsPage] Loaded match records:", history.length);
          setMatches(history);
        }
      } catch (err: any) {
        console.error("[StatsPage] Unexpected execution error:", err);
        setError("Failed to synchronize with database.");
      } finally {
        setLoading(false);
      }
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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans tracking-tighter">
        <div className="w-16 h-1 w-64 bg-gray-900 rounded-full overflow-hidden mb-4">
           <div className="h-full bg-green-500 animate-progress origin-left" />
        </div>
        <div className="text-sm font-black text-gray-600 uppercase tracking-widest animate-pulse">Retrieving Combat Logs...</div>
        <style>{`
          @keyframes progress {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.5); }
            100% { transform: scaleX(1); }
          }
          .animate-progress { animation: progress 2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border-2 border-red-500/20 p-10 rounded-[3rem] max-w-md shadow-2xl shadow-red-900/20">
          <div className="text-6xl mb-6">📡</div>
          <h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter mb-4">Sync Error</h2>
          <p className="text-gray-400 font-medium mb-8 leading-relaxed">{error}</p>
          <Link href="/" className="px-10 py-4 bg-red-600 hover:bg-red-500 text-black font-black uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-950/40">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-white font-sans bg-black">
      {/* CINEMATIC BACKGROUND */}
      <div className="absolute inset-0 bg-[url('/images/worldmapbackground.png')] bg-cover bg-center opacity-[0.05] grayscale brightness-50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-green-900/10" />
      
      <div className="relative z-10 flex flex-1 flex-col items-center py-16 px-6 gap-12 max-w-7xl mx-auto w-full">
        
        {/* DESIGNER HEADER */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-green-500/10 text-green-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-green-500/20">System Records Active</div>
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter text-center">
            Match <span className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">Analytics</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] opacity-40">Personal Performance Audits • Climate Accord v1.0</p>
        </div>

        {/* METRIC GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <MetricCard label="Total Deployments" value={total} color="text-gray-300" />
          <MetricCard label="Victories" value={stats.wins} color="text-green-400" />
          <MetricCard label="Defeats" value={stats.losses} color="text-red-400" />
          <MetricCard label="Success Rate" value={`${winRate}%`} color="text-yellow-400" />
        </div>

        {/* LOG SECTION */}
        <div className="w-full bg-gray-950/40 border-2 border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl flex flex-col">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Combat Chronology</h2>
            </div>
            <Link 
              href="/"
              className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:border-white/20 active:scale-95"
            >
              Close Records
            </Link>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            {matches.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] text-gray-600 text-[9px] uppercase font-black tracking-[0.25em]">
                    <th className="px-10 py-6">Timestamp</th>
                    <th className="px-10 py-6">Strategic Role</th>
                    <th className="px-10 py-6 text-center">Final Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {matches.map((match) => {
                    const isWin = match.role === match.winner_faction;
                    const date = new Date(match.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    return (
                      <tr key={match.game_id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-6">
                           <div className="font-bold text-gray-300 text-sm group-hover:text-white transition-colors">{date}</div>
                           <div className="text-[9px] text-gray-700 font-mono uppercase tracking-tighter mt-1">{match.game_id.slice(0,13)}...</div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <span className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase border tracking-widest ${match.role === 'advocate' ? 'bg-green-500/5 text-green-500 border-green-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'}`}>
                                {match.role}
                              </span>
                              <span className="text-gray-700 text-[9px] font-black uppercase tracking-widest">vs</span>
                              <span className="text-gray-500 font-black text-[10px] uppercase opacity-60">Status Quo</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                           <div className={`inline-flex items-center px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all ${isWin ? 'bg-green-500 text-black shadow-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-none grayscale group-hover:grayscale-0'}`}>
                              {isWin ? 'Victory' : 'Defeat'}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="w-20 h-20 bg-gray-900 rounded-[2rem] flex items-center justify-center text-3xl opacity-20 border border-white/5">📂</div>
                <div className="flex flex-col items-center gap-2">
                   <div className="text-gray-600 font-black uppercase tracking-[0.3em] text-[11px]">No Recorded Sessions</div>
                   <div className="text-[9px] text-gray-700 uppercase tracking-widest italic tracking-wider opacity-60">Complete a game to synchronize your history</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-gray-950/40 border-2 border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center gap-3 backdrop-blur-xl hover:border-white/10 transition-all hover:translate-y-[-4px] shadow-2xl">
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">{label}</span>
      <span className={`text-5xl font-black tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}
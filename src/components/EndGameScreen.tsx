// src/components/EndGameScreen.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { Lobby, Player } from '@/types/game';

type Props = {
  lobby: Lobby;
  currentPlayer: Player | undefined;
}

const EndGameScreen: React.FC<Props> = ({ lobby }) => {
  const router = useRouter();
  
  const winnerText = lobby.winnerFaction === 'advocate' ? 'Climate Advocates Win!' : 'Industrial Lobbyists Win!';
  const winnerColor = lobby.winnerFaction === 'advocate' ? 'text-green-500' : 'text-red-500';
  const winnerBg = lobby.winnerFaction === 'advocate' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]';

  return (
    <div className={`w-full max-w-4xl bg-gray-900 p-10 rounded-3xl shadow-2xl border-4 ${winnerBg} flex flex-col items-center gap-10`}>
        <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-widest ${winnerColor} text-center drop-shadow-lg`}>
            {winnerText}
        </h1>

        <p className="text-2xl text-gray-300 font-medium tracking-wide">The game has officially concluded.</p>

        <div className="w-full bg-black border-2 border-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-500 mb-8 text-center border-b-2 border-gray-800 pb-4 uppercase tracking-widest">Final Player Manifest</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {lobby.players.map(p => {
                   const isAdvocate = p.role === 'advocate';
                   const roleText = isAdvocate ? 'Advocate 🌱' : 'Lobbyist 🏭';
                   const roleColor = isAdvocate ? 'text-green-400 bg-green-900/40 border-green-800' : 'text-red-400 bg-red-900/40 border-red-800';
                   const isOusted = (lobby.oustedPlayers || []).includes(p.userId);

                   return (
                       <div key={p.userId} className={`flex justify-between items-center bg-gray-900 p-5 rounded-xl border-2 ${isOusted ? 'border-gray-800 opacity-50' : 'border-gray-700 hover:border-gray-500 transition-colors'}`}>
                           <span className={`font-black text-xl flex items-center gap-2 ${isOusted ? 'line-through text-gray-600' : 'text-gray-100'}`}>
                               {p.name} 
                               {p.userId === lobby.host && <span className="text-2xl">👑</span>}
                           </span>
                           <span className={`px-4 py-2 rounded-lg font-black ${roleColor} uppercase tracking-wider text-sm border`}>
                               {roleText}
                           </span>
                       </div>
                   )
               })}
            </div>
        </div>

        <button 
           onClick={() => router.push('/')}
           className="mt-6 px-10 py-5 bg-gray-800 hover:bg-[var(--show-cyan)] hover:text-black border-4 border-gray-700 hover:border-[var(--show-cyan)] transition-all font-black text-xl uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-[0_0_20px_rgba(0,255,255,0.6)]"
        >
            Return to Main Menu
        </button>
    </div>
  );
};

export default EndGameScreen;

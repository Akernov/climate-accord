// src/components/PlayerVotingPhase.tsx
import React, { useState } from 'react';
import { Lobby, Player } from '@/types/game';
import { useSocket } from "@/context/SocketContext";

type Props = {
  lobby: Lobby;
  currentPlayer: Player | undefined;
}

const PlayerVotingPhase: React.FC<Props> = ({ lobby, currentPlayer }) => {
  const { socket } = useSocket();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isSpectator = currentPlayer ? (lobby.oustedPlayers || []).includes(currentPlayer.userId) : false;

  const handleVote = (userId: string) => {
      setSelectedUserId(userId);
      if (socket) {
          socket.emit("game:vote_player", { targetUserId: userId });
      }
  };

  if (lobby.phase === 'Grace Period') {
      const oustedPlayerName = lobby.players.find(p => p.userId === lobby.lastOustedPlayer)?.name || "Nobody";
      
      return (
        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border-4 text-white border-red-900 flex flex-col items-center">
             <h2 className="text-4xl font-black mb-4 text-center text-red-500 uppercase tracking-widest">A Player Was Ousted</h2>
             <p className="text-xl text-gray-300 font-bold mb-6">The vote has concluded.</p>
             <div className="bg-black border border-red-800 p-6 rounded-xl">
                 <p className="text-2xl text-red-400 font-black tracking-widest line-through">{oustedPlayerName}</p>
             </div>
             <p className="mt-8 text-gray-500 uppercase tracking-widest font-bold">Resuming game shortly...</p>
        </div>
      );
  }

  // Active Phase: Player Voting
  return (
    <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border-4 text-white border-red-900">
      <h2 className="text-3xl font-black mb-6 text-center text-red-500 uppercase tracking-wider">Emergency Player Vote</h2>
      
      {isSpectator ? (
         <p className="text-center text-red-400 italic font-bold">You have been ousted. You cannot vote.</p>
      ) : (
         <p className="text-center text-gray-300 mb-8 max-w-lg mx-auto">Select a player to outvote. The player with the most votes will become a spectator and lose their voting privileges.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
         {lobby.players.map((player) => {
             const isOusted = (lobby.oustedPlayers || []).includes(player.userId);
             const isSelf = player.userId === currentPlayer?.userId;
             const isSelected = selectedUserId === player.userId;

             if (isOusted) return null; // Can't vote to out someone already out

             return (
                 <button
                    key={player.userId}
                    onClick={() => handleVote(player.userId)}
                    disabled={isSpectator || isSelf}
                    className={`p-6 rounded-xl border-2 transition-all font-bold text-lg uppercase tracking-wider ${
                        isSelected ? 'bg-red-900 border-red-500 text-red-100 scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                        (isSpectator || isSelf) ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed opacity-50' :
                        'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                    }`}
                 >
                     {player.name}
                     {isSelf && <span className="block text-xs mt-2 text-gray-500 tracking-widest">You</span>}
                 </button>
             );
         })}
      </div>
    </div>
  );
};

export default PlayerVotingPhase;

// src/components/BillVotingPhase.tsx
import React, { useState, useEffect } from 'react';
import { Lobby, Player } from '@/types/game';
import { useSocket } from "@/context/SocketContext";

type Props = {
  lobby: Lobby;
  currentPlayer: Player | undefined;
}

const BillVotingPhase: React.FC<Props> = ({ lobby, currentPlayer }) => {
  const { socket } = useSocket();
  const [selectedBillIndex, setSelectedBillIndex] = useState<number | null>(null);

  // If the phase changes, reset local selection
  useEffect(() => {
    setSelectedBillIndex(null);
  }, [lobby.phase]);

  const isSpectator = currentPlayer ? (lobby.oustedPlayers || []).includes(currentPlayer.userId) : false;
  const hasVision = (lobby.activePowerups || []).includes('activist_vision') && currentPlayer?.role === 'advocate';

  const handleVote = (index: number) => {
    if (isSpectator) return;
    setSelectedBillIndex(index);
    if (socket) {
      socket.emit("game:vote_bill", { billIndex: index });
    }
  };

  return (
    <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border-4 text-white border-gray-700">
      <h2 className="text-3xl font-black mb-2 text-center text-[var(--show-orange)] uppercase tracking-wider">Vote on Bills</h2>
      <p className="text-center text-red-500 font-bold uppercase tracking-widest text-sm mb-6">🚫 No Communication Allowed</p>

      {hasVision && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-900/40 border border-yellow-600 text-center">
          <p className="text-yellow-300 font-bold uppercase tracking-wider text-sm">⚡ Tactical Vision Active — All bill info revealed!</p>
        </div>
      )}

      {!lobby.bills || lobby.bills.length === 0 ? (
        <p className="text-center text-gray-400 italic">No bills available.</p>
      ) : (
        <div className="flex justify-center flex-wrap gap-6">
          {lobby.bills.map((bill, index) => {
            const isSelected = selectedBillIndex === index;

            return (
              <div
                key={index}
                className={`w-64 border-4 p-5 rounded-2xl shadow-lg transition-transform ${isSelected ? 'border-[var(--show-cyan)] bg-gray-800 scale-105' : 'border-gray-600 bg-gray-800 hover:scale-105'}`}
              >
                <h3 className="font-bold text-center text-xl mb-4 text-gray-100">{bill.title || "Unnamed Bill"}</h3>

                <div className="space-y-2 mb-6">
                  {/* Advocate info: hidden from lobbyists during blind rounds */}
                  {(currentPlayer?.role === 'advocate' || lobby.roundCount >= 2) ? (
                    <div className="bg-green-900/40 border border-green-800 p-2 rounded-lg">
                      <p className="text-xs text-green-200 uppercase tracking-widest font-bold">Activist (Cat {bill.activistCategory})</p>
                      <p className="text-green-400 font-black text-lg">+{bill.activistScore} pts</p>
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg flex items-center justify-center h-[62px]">
                      <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Hidden</p>
                    </div>
                  )}

                  {currentPlayer?.role === 'lobbyist' || hasVision ? (
                    <div className="bg-red-900/40 border border-red-800 p-2 rounded-lg">
                      <p className="text-xs text-red-200 uppercase tracking-widest font-bold">Lobbyist (Cat {bill.lobbyistCategory})</p>
                      <p className="text-red-400 font-black text-lg">{bill.lobbyistScore > 0 ? "+" : ""}{bill.lobbyistScore} pts</p>
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg flex items-center justify-center h-[62px]">
                      <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Hidden</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleVote(index)}
                  disabled={isSpectator}
                  className={`w-full py-3 rounded-xl font-black uppercase tracking-wider transition-colors ${isSpectator ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-700' :
                      isSelected ? 'bg-[var(--show-cyan)] text-[var(--show-ink)]' : 'bg-gray-600 text-white hover:bg-gray-500'
                    }`}
                >
                  {isSpectator ? "Spectator" : isSelected ? "Vote Locked" : "Cast Vote"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BillVotingPhase;

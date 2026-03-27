import React, { useState, useEffect } from 'react';
import { Lobby, Player } from '@/types/game';
import { useSocket } from "@/context/SocketContext";
import { getCategoryDisplay } from '@/lib/categories';

type Props = {
  lobby: Lobby;
  currentPlayer: Player | undefined;
}

const BillVotingPhase: React.FC<Props> = ({ lobby, currentPlayer }) => {
  const { socket } = useSocket();
  const [selectedBillIndex, setSelectedBillIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // If the phase changes, reset local selection and trigger entrance animation
  useEffect(() => {
    setSelectedBillIndex(null);
    setIsAnimating(true);
    // Remove animation class after animation completes
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [lobby.phase]);

  const isSpectator = currentPlayer ? (lobby.oustedPlayers || []).includes(currentPlayer.userId) : false;

  const handleVote = (index: number) => {
    if (isSpectator) return;
    setSelectedBillIndex(index);
    if (socket) {
      socket.emit("game:vote_bill", { billIndex: index });
    }
  };

  return (
    <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border-4 text-white border-gray-700">
      <h2 className="text-3xl font-black mb-6 text-center text-[var(--show-orange)] uppercase tracking-wider">
        Vote on Bills
      </h2>
      
      {!lobby.bills || lobby.bills.length === 0 ? (
        <p className="text-center text-gray-400 italic">No bills available.</p>
      ) : (
        <div className="flex justify-center flex-wrap gap-6">
          {lobby.bills.map((bill, index) => {
            const isSelected = selectedBillIndex === index;
            
            // Determine animation delay based on index (stagger)
            const animationDelay = `${index * 0.1}s`;
            
            return (
              <div 
                key={index} 
                className={`
                  w-64 p-5 rounded-2xl shadow-lg 
                  transition-all duration-300 ease-out
                  ${isAnimating ? 'animate-card-enter' : ''}
                  ${isSelected 
                    ? 'border-4 border-[var(--show-cyan)] bg-gray-800 scale-105 shadow-[0_0_20px_rgba(0,255,255,0.5)] animate-pulse-glow' 
                    : 'border-4 border-gray-600 bg-gray-800 hover:scale-105 hover:shadow-xl hover:border-gray-400'
                  }
                  cursor-pointer
                `}
                style={{ animationDelay }}
                onClick={() => handleVote(index)}
              >
                <h3 className="font-bold text-center text-xl mb-4 text-gray-100">
                  {bill.title || "Unnamed Bill"}
                </h3>
                
                <div className="space-y-2 mb-6">
                  <div className="bg-green-900/40 border border-green-800 p-2 rounded-lg">
                    <p className="text-xs text-green-200 uppercase tracking-widest font-bold">
                      Activist ({getCategoryDisplay(bill.activistCategory)})
                    </p>
                    <p className="text-green-400 font-black text-lg">+{bill.activistScore} pts</p>
                  </div>

                  {currentPlayer?.role === 'lobbyist' ? (
                     <div className="bg-red-900/40 border border-red-800 p-2 rounded-lg">
                       <p className="text-xs text-red-200 uppercase tracking-widest font-bold">
                         Lobbyist ({getCategoryDisplay(bill.lobbyistCategory)})
                       </p>
                       <p className="text-red-400 font-black text-lg">{bill.lobbyistScore > 0 ? "+" : ""}{bill.lobbyistScore} pts</p>
                     </div>
                  ) : (
                     <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg flex items-center justify-center h-[62px] transition-all hover:bg-gray-700">
                       <p className="text-xs text-gray-500 uppercase font-black tracking-widest">
                         Hidden
                       </p>
                     </div>
                  )}
                </div>

                <button 
                  disabled={isSpectator}
                  className={`
                    w-full py-3 rounded-xl font-black uppercase tracking-wider transition-colors duration-200
                    ${isSpectator 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50 border border-gray-700' 
                      : isSelected 
                        ? 'bg-[var(--show-cyan)] text-[var(--show-ink)] shadow-[0_0_10px_rgba(0,255,255,0.8)]' 
                        : 'bg-gray-600 text-white hover:bg-gray-500 hover:shadow-md'
                    }
                  `}
                >
                  {isSpectator ? "Spectator" : isSelected ? "Vote Locked" : "Cast Vote"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Custom keyframe animations */}
      <style jsx>{`
        @keyframes cardEnter {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(0, 255, 255, 0);
          }
        }
        
        .animate-card-enter {
          animation: cardEnter 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
          opacity: 0; /* start invisible */
        }
        
        .animate-pulse-glow {
          animation: pulseGlow 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default BillVotingPhase;
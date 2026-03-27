import React from 'react';
import { Lobby, Player } from '@/types/game';
import { useSocket } from "@/context/SocketContext";

type Props = {
  lobby: Lobby;
  currentPlayer: Player | undefined;
}

const DiscussionPhase: React.FC<Props> = ({ lobby, currentPlayer }) => {
  const { socket } = useSocket();

  const handleCallVote = () => {
     if (socket) socket.emit("game:call_player_vote", {});
  };

  const { activistPoints, lobbyistPoints, lastPassedBill, lastPassedBillVoters, callPlayerVoteIds, oustedPlayers } = lobby;
  
  const activePlayerCount = lobby.players.length - (oustedPlayers?.length || 0);
  const majority = Math.floor(activePlayerCount / 2) + 1;
  const currentCalls = callPlayerVoteIds?.length || 0;
  
  // A spectator shouldn't be able to trigger normal play functions.
  const isSpectator = currentPlayer ? (oustedPlayers || []).includes(currentPlayer.userId) : false;
  const hasVoted = currentPlayer ? (callPlayerVoteIds || []).includes(currentPlayer.userId) : false;

  return (
    <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border-4 border-gray-700 text-white flex flex-col gap-6">
      <div className="flex flex-col items-center mb-2 gap-4">
        <h2 className="text-3xl font-black text-center text-[var(--show-cyan)] uppercase tracking-wider">Discussion Phase</h2>
        {!isSpectator ? (
          <button 
            onClick={handleCallVote} 
            disabled={hasVoted}
            className={`px-6 py-2 rounded-xl font-bold uppercase tracking-wider transition ${hasVoted ? 'bg-orange-800 text-orange-200 cursor-not-allowed opacity-50' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}
          >
            {hasVoted ? `Vote Called (${currentCalls}/${majority})` : `Call Player Vote (${currentCalls}/${majority})`}
          </button>
        ) : (
          <p className="text-gray-500 italic uppercase font-bold text-sm tracking-widest">Spectating Mode</p>
        )}
      </div>
      
      {/* Last Passed Bill Section */}
      {lastPassedBill ? (
        <div className="bg-gray-800 p-4 rounded-xl border border-green-500 text-center">
          <h3 className="text-xl font-bold text-green-400 mb-2">Recently Passed Bill</h3>
          <p className="font-semibold text-lg">{lastPassedBill.title || "Unnamed Bill"}</p>
          <div className="flex justify-center gap-6 mt-3 text-sm font-bold">
            <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-lg">Advocate: +{lastPassedBill.activistScore} (Cat {lastPassedBill.activistCategory})</span>
            {currentPlayer?.role === 'lobbyist' ? (
               <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-lg">Lobbyist: +{lastPassedBill.lobbyistScore} (Cat {lastPassedBill.lobbyistCategory})</span>
            ) : (
               <span className="bg-gray-700 text-gray-400 px-3 py-1 rounded-lg">Lobbyist: Hidden</span>
            )}
          </div>
          
          {lastPassedBillVoters && lastPassedBillVoters.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-400 uppercase tracking-widest italic font-bold">
              Supported By: <span className="text-gray-200">{lastPassedBillVoters.join(", ")}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-400 italic">No bills have been passed yet. Discuss strategy!</p>
      )}

      {/* Scoreboard Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activist Scoreboard */}
        <div className="bg-gray-800 p-4 rounded-xl border-2 border-green-700">
           <h3 className="text-xl font-bold text-green-400 mb-3 text-center border-b border-green-800 pb-2">Activist Progress</h3>
           <p className="text-xs text-center text-gray-400 mb-3 uppercase tracking-widest">Goal: 5 pts in ALL categories</p>
           <ul className="space-y-2 text-sm font-semibold">
             {[1,2,3,4,5].map(cat => (
                <li key={cat} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                  <span>Category {cat}</span>
                  <span className={`px-2 py-0.5 rounded ${((activistPoints && activistPoints[cat]) || 0) >= 5 ? 'bg-green-600 text-white' : 'text-green-500'}`}>
                    {(activistPoints && activistPoints[cat]) || 0} / 5
                  </span>
                </li>
             ))}
           </ul>
        </div>

        {/* Lobbyist Scoreboard */}
        <div className="bg-gray-800 p-4 rounded-xl border-2 border-red-700">
           <h3 className="text-xl font-bold text-red-400 mb-3 text-center border-b border-red-800 pb-2">Lobbyist Progress</h3>
           <p className="text-xs text-center text-gray-400 mb-3 uppercase tracking-widest">Goal: 7 pts in 3+ categories</p>
           {currentPlayer?.role === 'lobbyist' ? (
             <ul className="space-y-2 text-sm font-semibold">
               {[1,2,3,4,5].map(cat => (
                  <li key={cat} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                    <span>Category {cat}</span>
                    <span className={`px-2 py-0.5 rounded ${((lobbyistPoints && lobbyistPoints[cat]) || 0) >= 7 ? 'bg-red-600 text-white' : 'text-red-500'}`}>
                      {(lobbyistPoints && lobbyistPoints[cat]) || 0} / 7
                    </span>
                  </li>
               ))}
             </ul>
           ) : (
             <div className="flex-1 flex items-center justify-center p-8 text-red-900 h-full">
               <span className="font-bold tracking-widest uppercase">Classified</span>
             </div>
           )}
        </div>
      </div>
      
    </div>
  );
};

export default DiscussionPhase;

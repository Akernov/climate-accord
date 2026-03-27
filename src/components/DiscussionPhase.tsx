import React, { useState } from 'react';
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

  const { activistPoints, lobbyistPoints, hiddenActivistPoints, hiddenLobbyistPoints, lastPassedBill, lastPassedBillVoters, callPlayerVoteIds, oustedPlayers, roundCount, activePowerups, bills, billRemovalVotes } = lobby;

  const activePlayerCount = lobby.players.length - (oustedPlayers?.length || 0);
  const majority = Math.floor(activePlayerCount / 2) + 1;
  const currentCalls = callPlayerVoteIds?.length || 0;

  // A spectator shouldn't be able to trigger normal play functions.
  const isSpectator = currentPlayer ? (oustedPlayers || []).includes(currentPlayer.userId) : false;
  const hasVoted = currentPlayer ? (callPlayerVoteIds || []).includes(currentPlayer.userId) : false;

  // Bill removal powerup state
  const isLobbyist = currentPlayer?.role === 'lobbyist';
  const hasRemovalPowerup = (activePowerups || []).includes('lobbyist_remove');
  const hasVotedRemoval = currentPlayer ? !!(billRemovalVotes && billRemovalVotes[currentPlayer.userId] !== undefined) : false;
  const [selectedRemovalIdx, setSelectedRemovalIdx] = useState<number | null>(null);

  const handleVoteRemoveBill = (billIndex: number) => {
    setSelectedRemovalIdx(billIndex);
    if (socket) {
      socket.emit("game:vote_remove_bill", { billIndex });
    }
  };

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

      {/* Powerup Banner */}
      {(activePowerups || []).includes('lobbyist_remove') && (
        <div className="p-3 rounded-xl bg-red-900/40 border border-red-600 text-center">
          <p className="text-red-300 font-bold uppercase tracking-wider text-sm">⚡ Lobbyist Tactical Advantage — One bill may be removed!</p>
        </div>
      )}
      {(activePowerups || []).includes('activist_vision') && (
        <div className="p-3 rounded-xl bg-yellow-900/40 border border-yellow-600 text-center">
          <p className="text-yellow-300 font-bold uppercase tracking-wider text-sm">⚡ Activist Intel Incoming — Full bill visibility next vote!</p>
        </div>
      )}

      {/* Lobbyist Bill Removal Panel */}
      {hasRemovalPowerup && isLobbyist && bills && bills.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-xl border-2 border-red-600">
          <h3 className="text-lg font-bold text-red-400 mb-3 text-center uppercase tracking-wider">Vote to Remove a Bill</h3>
          <p className="text-xs text-center text-gray-400 mb-4">Majority vote required. Ties result in no removal.</p>
          <div className="flex justify-center flex-wrap gap-3">
            {bills.map((bill, idx) => {
              const isSelectedRemoval = selectedRemovalIdx === idx || (hasVotedRemoval && billRemovalVotes?.[currentPlayer!.userId] === idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleVoteRemoveBill(idx)}
                  disabled={hasVotedRemoval}
                  className={`px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition ${
                    isSelectedRemoval ? 'bg-red-600 text-white' :
                    hasVotedRemoval ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' :
                    'bg-gray-700 text-gray-300 hover:bg-red-800 hover:text-white'
                  }`}
                >
                  {bill.title || `Bill ${idx + 1}`}
                </button>
              );
            })}
          </div>
          {hasVotedRemoval && <p className="text-xs text-center text-gray-500 mt-2 italic">Your vote has been cast.</p>}
        </div>
      )}

      {/* Upcoming Bills Preview */}
      {bills && bills.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-600">
          <h3 className="text-lg font-bold text-[var(--show-orange)] mb-3 text-center uppercase tracking-wider">Upcoming Bills</h3>
          <p className="text-xs text-center text-gray-400 mb-4">Preview the bills you'll vote on next. Strategize now!</p>
          <div className="flex justify-center flex-wrap gap-4">
            {bills.map((bill, idx) => (
              <div key={idx} className="w-52 border border-gray-600 p-3 rounded-xl bg-gray-900">
                <h4 className="font-bold text-center text-md mb-3 text-gray-200">{bill.title || `Bill ${idx + 1}`}</h4>
                <div className="space-y-2">
                  {(currentPlayer?.role === 'advocate' || roundCount >= 2) ? (
                    <div className="bg-green-900/30 border border-green-800 p-1.5 rounded-lg">
                      <p className="text-xs text-green-300 font-bold">Activist (Cat {bill.activistCategory}): +{bill.activistScore}</p>
                    </div>
                  ) : (
                    <div className="bg-green-900/15 border border-green-900 p-1.5 rounded-lg">
                      <p className="text-xs text-green-300/50 font-bold">Activist (Cat ???): +{bill.activistScore}</p>
                    </div>
                  )}
                  {currentPlayer?.role === 'lobbyist' ? (
                    <div className="bg-red-900/30 border border-red-800 p-1.5 rounded-lg">
                      <p className="text-xs text-red-300 font-bold">Lobbyist (Cat {bill.lobbyistCategory}): {bill.lobbyistScore > 0 ? "+" : ""}{bill.lobbyistScore}</p>
                    </div>
                  ) : roundCount < 2 ? (
                    <div className="bg-red-900/15 border border-red-900 p-1.5 rounded-lg">
                      <p className="text-xs text-red-300/50 font-bold">Lobbyist (Cat ???): {bill.lobbyistScore > 0 ? "+" : ""}{bill.lobbyistScore}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-700 p-1.5 rounded-lg">
                      <p className="text-xs text-gray-500 font-bold uppercase">Lobbyist: Hidden</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Passed Bill Section */}
      {lastPassedBill ? (
        <div className="bg-gray-800 p-4 rounded-xl border border-green-500 text-center">
          <h3 className="text-xl font-bold text-green-400 mb-2">Recently Passed Bill</h3>
          <p className="font-semibold text-lg">{lastPassedBill.title || "Unnamed Bill"}</p>
          <div className="flex justify-center gap-6 mt-3 text-sm font-bold">
            {/* Advocate info: category hidden from lobbyists during blind rounds */}
            {(currentPlayer?.role === 'advocate' || roundCount >= 2) ? (
              <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-lg">Advocate: +{lastPassedBill.activistScore} (Cat {lastPassedBill.activistCategory})</span>
            ) : (
              <span className="bg-green-900/30 text-green-300/50 px-3 py-1 rounded-lg">Advocate: +{lastPassedBill.activistScore} (Cat ???)</span>
            )}
            {currentPlayer?.role === 'lobbyist' ? (
              <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-lg">Lobbyist: +{lastPassedBill.lobbyistScore} (Cat {lastPassedBill.lobbyistCategory})</span>
            ) : roundCount < 2 ? (
              <span className="bg-red-900/30 text-red-300/50 px-3 py-1 rounded-lg">Lobbyist: {lastPassedBill.lobbyistScore > 0 ? "+" : ""}{lastPassedBill.lobbyistScore} (Cat ???)</span>
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
            {[1, 2, 3, 4, 5].map(cat => {
              const publicPts = (activistPoints && activistPoints[cat]) || 0;
              const hiddenPts = (currentPlayer?.role === 'advocate' && hiddenActivistPoints) ? (hiddenActivistPoints[cat] || 0) : 0;
              const displayPts = publicPts + hiddenPts;
              return (
              <li key={cat} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                <span>Category {cat}</span>
                <span className={`px-2 py-0.5 rounded ${displayPts >= 5 ? 'bg-green-600 text-white' : 'text-green-500'}`}>
                  {displayPts} / 5{hiddenPts > 0 ? ` (${hiddenPts} hidden)` : ''}
                </span>
              </li>
              );
            })}
          </ul>
        </div>

        {/* Lobbyist Scoreboard */}
        <div className="bg-gray-800 p-4 rounded-xl border-2 border-red-700">
          <h3 className="text-xl font-bold text-red-400 mb-3 text-center border-b border-red-800 pb-2">Lobbyist Progress</h3>
          <p className="text-xs text-center text-gray-400 mb-3 uppercase tracking-widest">Goal: 7 pts in 3+ categories</p>
          {currentPlayer?.role === 'lobbyist' ? (
            <ul className="space-y-2 text-sm font-semibold">
              {[1, 2, 3, 4, 5].map(cat => {
                const publicPts = (lobbyistPoints && lobbyistPoints[cat]) || 0;
                const hiddenPts = (hiddenLobbyistPoints && hiddenLobbyistPoints[cat]) || 0;
                const displayPts = publicPts + hiddenPts;
                return (
                <li key={cat} className="flex justify-between items-center bg-gray-900 p-2 rounded">
                  <span>Category {cat}</span>
                  <span className={`px-2 py-0.5 rounded ${displayPts >= 7 ? 'bg-red-600 text-white' : 'text-red-500'}`}>
                    {displayPts} / 7{hiddenPts > 0 ? ` (${hiddenPts} hidden)` : ''}
                  </span>
                </li>
                );
              })}
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

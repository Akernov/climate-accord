"use client";

import { Role, Bill } from "@/types/game";

// Props accepted by the BillBoard component
type BillBoardProps = {
  role?: Role; // Player role used to determine what information should be visible
  bills: Bill[]; // Bills currently available for voting
};

export default function BillBoard({ role, bills }: BillBoardProps) {
  return (

    // Main container for the bill display board
    <div className="bg-gray-900 p-8 rounded-2xl shadow-xl text-center border-4 border-gray-700 text-white">

      {/* Section title */}
      <h2 className="text-2xl font-bold mb-6">
        Proposed Bills
      </h2>

      {/* Container holding all displayed bill cards */}
      <div className="flex justify-center gap-8 flex-wrap">

        {/* Render a card for each selected bill */}
        {bills.map((bill, i) => (
          <div
            key={i}
            className="w-64 bg-gray-800 border-4 border-blue-600 rounded-xl p-5 shadow-lg"
          >
            {/* Title (if any) */}
            {bill.title && <h3 className="font-bold mb-2">{bill.title}</h3>}
            {/* Advocate score impact (visible to all players) */}
            <p className="text-green-400 font-semibold">
               Advocate: +{bill.activistScore}
            </p>

            {/* Lobbyist score impact
                Hidden from advocates to preserve hidden role mechanics */}
            {role === "lobbyist" ? (
              <p className="text-red-400 font-semibold">
                 Lobbyist: {bill.lobbyistScore > 0 ? "+" : ""}{bill.lobbyistScore}
              </p>
            ) : (
              <p className="text-gray-400 italic">
                 Lobbyist: Hidden
              </p>
            )}

            {/* Voting button used to select a bill during gameplay */}
            <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
              Vote
            </button>

          </div>
        ))}

      </div>
    </div>
  );
}
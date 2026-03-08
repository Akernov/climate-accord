"use client";

import { bills } from "@/data/bills";
import { useState } from "react";

type BillBoardProps = {
  role?: "advocate" | "lobbyist";
};

export default function BillBoard({ role }: BillBoardProps) {

  const [displayedBills] = useState(() => {
    return [...bills]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  });

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl text-center border-4 border-gray-300">

      <h2 className="text-2xl font-bold mb-6">
        Proposed Bills
      </h2>

      <div className="flex justify-center gap-8 flex-wrap">

        {displayedBills.map((bill, i) => (
          <div
            key={i}
            className="w-64 bg-blue-100 border-4 border-blue-500 rounded-xl p-5 shadow-lg"
          >

            <h3 className="text-lg font-bold mb-4">
              {bill.title}
            </h3>

            <p className="text-green-700 font-semibold">
               Advocate: +{bill.advocate}
            </p>

            {role === "lobbyist" ? (
              <p className="text-red-700 font-semibold">
                 Lobbyist: {bill.lobbyist}
              </p>
            ) : (
              <p className="text-gray-400 italic">
                 Lobbyist: Hidden
              </p>
            )}

            <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
              Vote
            </button>

          </div>
        ))}

      </div>
    </div>
  );
}
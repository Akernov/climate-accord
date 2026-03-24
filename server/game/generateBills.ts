import { Bill } from "../../src/types/game";

// Helper function to get a random integer
const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const generateBills = (): Bill[] => {
  const bills: Bill[] = [];
  for (let i = 0; i < 3; i++) {
    bills.push({
      activistCategory: getRandomInt(1, 5),
      activistScore: getRandomInt(1, 3),
      lobbyistCategory: getRandomInt(1, 3),
      lobbyistScore: getRandomInt(1, 5),
    });
  }
  return bills;
};

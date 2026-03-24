import { Bill } from "../../src/types/game";

// Helper function to get a random integer
const getRandomArraySlice = (array: number[]) => {
  array.sort(() => Math.random() - 0.5);
  return array.slice(0, 3);
};

export const generateBills = (): Bill[] => {
  const categories = [1, 2, 3, 4, 5];
  const score = [1, 1, 1, 1, 1, 2, 2, 2, 3]

  const bills: Bill[] = [];
  for (let i = 0; i < 3; i++) {
    bills.push({
      activistCategory: getRandomArraySlice(categories)[i],
      activistScore: getRandomArraySlice(score)[i],
      lobbyistCategory: getRandomArraySlice(categories)[i],
      lobbyistScore: getRandomArraySlice(score)[i],
    });
  }
  return bills;
};

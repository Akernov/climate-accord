import { Bill } from "../../src/types/game.js";

// Define bill templates with thematic names and associated categories
interface BillTemplate {
  name: string;
  activistCategory: number;
  baseActivistScore: number;
  baseLobbyistScore: number;
  scoreVariance: number; // How much the score can vary (±)
}

// Number of lobbyist categories available (1-5)
const LOBBYIST_CATEGORY_COUNT = 5;

// Pre-defined bill templates with thematic names
const BILL_TEMPLATES: BillTemplate[] = [
  // Energy sector bills
  { name: "⚡ Renewable Energy Mandate", activistCategory: 1, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🏭 Coal Phase-out Initiative", activistCategory: 1, baseActivistScore: 3, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "☢️ Nuclear Energy Expansion", activistCategory: 1, baseActivistScore: 1, baseLobbyistScore: 2, scoreVariance: 1 },
  { name: "🔋 Battery Storage Subsidies", activistCategory: 1, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },

  // Agriculture bills
  { name: "🌾 Sustainable Farming Credits", activistCategory: 2, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🐄 Methane Emission Regulations", activistCategory: 2, baseActivistScore: 3, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🌽 GMO Labeling Requirements", activistCategory: 2, baseActivistScore: 1, baseLobbyistScore: 2, scoreVariance: 1 },
  { name: "🚜 Organic Farming Subsidies", activistCategory: 2, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },

  // Industry bills
  { name: "🏭 Carbon Capture Mandate", activistCategory: 3, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "⚙️ Green Manufacturing Tax Credit", activistCategory: 3, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🔧 Industrial Efficiency Standards", activistCategory: 3, baseActivistScore: 3, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🏗️ Emissions Cap & Trade", activistCategory: 3, baseActivistScore: 3, baseLobbyistScore: 2, scoreVariance: 1 },

  // Transportation bills
  { name: "🚗 EV Tax Credit Expansion", activistCategory: 4, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🚌 Public Transit Funding", activistCategory: 4, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "✈️ Aviation Fuel Standards", activistCategory: 4, baseActivistScore: 3, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🚢 Shipping Emission Regulations", activistCategory: 4, baseActivistScore: 3, baseLobbyistScore: 2, scoreVariance: 1 },

  // Forestry bills
  { name: "🌲 Reforestation Initiative", activistCategory: 5, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🪵 Sustainable Logging Practices", activistCategory: 5, baseActivistScore: 2, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🏞️ National Park Expansion", activistCategory: 5, baseActivistScore: 3, baseLobbyistScore: 1, scoreVariance: 1 },
  { name: "🌳 Urban Forestry Program", activistCategory: 5, baseActivistScore: 1, baseLobbyistScore: 2, scoreVariance: 1 },
];

// Helper function to get a random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to get a random element from an array
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to shuffle array and get first n elements (maintaining original array)
const getRandomSlice = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

// Generate a random score based on base value with variance
const generateScore = (baseScore: number, variance: number): number => {
  const min = Math.max(1, baseScore - variance);
  const max = baseScore + variance;
  return getRandomInt(min, max);
};

export const generateBills = (): Bill[] => {
  // Get 3 unique random bill templates
  const selectedTemplates = getRandomSlice(BILL_TEMPLATES, 3);

  const bills: Bill[] = selectedTemplates.map(template => ({
    title: template.name,
    activistCategory: template.activistCategory,
    activistScore: generateScore(template.baseActivistScore, template.scoreVariance),
    lobbyistCategory: getRandomInt(1, LOBBYIST_CATEGORY_COUNT),
    lobbyistScore: generateScore(template.baseLobbyistScore, template.scoreVariance),
  }));

  return bills;
};
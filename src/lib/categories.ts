export const CATEGORIES = [
  { id: 1, name: 'Energy', emoji: '⚡' },
  { id: 2, name: 'Agriculture', emoji: '🌾' },
  { id: 3, name: 'Industry', emoji: '🏭' },
  { id: 4, name: 'Transportation', emoji: '🚗' },
  { id: 5, name: 'Forestry', emoji: '🌲' },
] as const;

export function getCategoryDisplay(catId: number): string {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? `${cat.emoji} ${cat.name}` : `Category ${catId}`;
}
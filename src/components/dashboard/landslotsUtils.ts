export type Item = 'water'|'fertilizer'|'antiBug';
export type SelectedMap = Record<number, Set<Item>>;
export type Inventory = { water?: number; fertilizer?: number; antiBug?: number };

export const totalSelectedCounts = (selectedMap: SelectedMap) => {
  const counts: Record<Item, number> = { water: 0, fertilizer: 0, antiBug: 0 };
  Object.values(selectedMap).forEach(set => {
    for (const s of Array.from(set)) {
      counts[s] = (counts[s] || 0) + 1;
    }
  });
  return counts;
};

export const availableFor = (item: Item, selected: Item[], selectedMap: SelectedMap, inventory: Inventory) => {
  const invCount = inventory ? (inventory as any)[item] || 0 : 0;
  const reserved = totalSelectedCounts(selectedMap)[item] || 0;
  if (selected.includes(item)) return true;
  return (invCount - reserved) > 0;
};

export const remainingFor = (item: Item, selected: Item[], selectedMap: SelectedMap, inventory: Inventory) => {
  const invCount = inventory ? (inventory as any)[item] || 0 : 0;
  const reserved = totalSelectedCounts(selectedMap)[item] || 0;
  const includeSelf = selected.includes(item) ? 1 : 0;
  return Math.max(0, invCount - reserved + includeSelf);
};

export const canStartForSlot = (selected: Item[], selectedMap: SelectedMap, inventory: Inventory) => {
  const required: Item[] = ['water','fertilizer','antiBug'];
  if (!required.every(i => selected.includes(i))) return false;
  return required.every(i => remainingFor(i, selected, selectedMap, inventory) >= 1);
};
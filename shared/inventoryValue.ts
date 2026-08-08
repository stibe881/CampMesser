/**
 * Inventar-Gesamtwert (#511): Die Einzelwerte stehen seit #178 am
 * Gegenstand – die Summe (auch als Versicherungs-Argument nach einem
 * Einbruch ins Vorzelt) fehlte. Reine Funktionen für Statistik und
 * Tests.
 */

export interface ValuedInventoryItemLike {
  category: string;
  priceRappen: number | null;
  quantity: number;
}

export interface InventoryValueRow {
  category: string;
  rappen: number;
}

export interface InventoryValueSummary {
  totalRappen: number;
  /** Gegenstände MIT erfasstem Preis (× Stückzahl). */
  valuedCount: number;
  /** Gegenstände ohne Preis – die Summe ist also eine Untergrenze. */
  unvaluedCount: number;
  rows: InventoryValueRow[];
}

/** Wert je Kategorie (Preis × Stückzahl), grösste zuerst. */
export function inventoryValue(
  items: readonly ValuedInventoryItemLike[]
): InventoryValueSummary {
  const byCategory = new Map<string, number>();
  let totalRappen = 0;
  let valuedCount = 0;
  let unvaluedCount = 0;
  for (const item of items) {
    if (item.priceRappen == null || item.priceRappen <= 0) {
      unvaluedCount += 1;
      continue;
    }
    const quantity = Math.max(1, item.quantity);
    const value = item.priceRappen * quantity;
    valuedCount += 1;
    totalRappen += value;
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + value);
  }
  const rows = Array.from(byCategory.entries())
    .map(([category, rappen]) => ({ category, rappen }))
    .sort((a, b) => b.rappen - a.rappen);
  return { totalRappen, valuedCount, unvaluedCount, rows };
}

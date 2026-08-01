/**
 * Gewichts- und Volumen-Bilanz einer Packliste über den Namens-Abgleich mit
 * dem Inventar. Reine Funktionen – von Client und Tests genutzt.
 */

export interface PackItemLike {
  name: string;
  quantity: number;
  checked: boolean;
}

export interface InventoryItemLike {
  name: string;
  weightGrams: number;
  volumeLiters: number;
}

export interface PackWeightSummary {
  /** Gesamtgewicht aller zugeordneten Einträge (g) */
  totalGrams: number;
  /** Gewicht der bereits abgehakten Einträge (g) */
  packedGrams: number;
  /** Gesamtvolumen aller zugeordneten Einträge (l) */
  totalVolumeLiters: number;
  /** Anzahl Listen-Einträge mit Inventar-Treffer */
  matchedCount: number;
  /** Anzahl Listen-Einträge ohne Inventar-Treffer */
  unmatchedCount: number;
}

/** Namens-Normalisierung für den Abgleich (Gross-/Kleinschreibung, Leerraum). */
function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Bilanz einer Packliste berechnen: Einträge werden per Name dem Inventar zugeordnet. */
export function computePackWeight(
  items: PackItemLike[],
  inventory: InventoryItemLike[]
): PackWeightSummary {
  const byName = new Map<string, InventoryItemLike>();
  for (const inv of inventory) {
    const key = normalizeName(inv.name);
    if (!byName.has(key)) byName.set(key, inv);
  }
  const summary: PackWeightSummary = {
    totalGrams: 0,
    packedGrams: 0,
    totalVolumeLiters: 0,
    matchedCount: 0,
    unmatchedCount: 0,
  };
  for (const item of items) {
    const match = byName.get(normalizeName(item.name));
    if (!match) {
      summary.unmatchedCount += 1;
      continue;
    }
    const grams = match.weightGrams * item.quantity;
    summary.matchedCount += 1;
    summary.totalGrams += grams;
    summary.totalVolumeLiters += match.volumeLiters * item.quantity;
    if (item.checked) summary.packedGrams += grams;
  }
  summary.totalVolumeLiters = Math.round(summary.totalVolumeLiters * 10) / 10;
  return summary;
}

/** Gramm menschenlesbar formatieren, z. B. 12480 → «12,5 kg». */
export function formatGrams(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1).replace(".", ",")} kg`;
  }
  return `${Math.round(grams)} g`;
}

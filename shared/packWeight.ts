/**
 * Gewichts- und Volumen-Bilanz einer Packliste über den Namens-Abgleich mit
 * dem Inventar. Reine Funktionen – von Client und Tests genutzt.
 */
import type { Language } from "./i18n";

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

export type WeightBudgetLevel = "ok" | "warn" | "over";

export interface WeightBudgetStatus {
  /** ok = unter 90 %, warn = 90–100 %, over = Budget überschritten */
  level: WeightBudgetLevel;
  /** Anteil Ist/Budget in Prozent (gerundet, kann über 100 liegen) */
  percent: number;
  /** Gramm über dem Budget (0, solange nicht überschritten) */
  overGrams: number;
}

/** Schwelle, ab der ein Budget als «bald erreicht» gewarnt wird (in Prozent). */
export const WEIGHT_BUDGET_WARN_PERCENT = 90;

/** Status des Gewichts-Budgets: Auslastung in Prozent plus Ampel-Stufe. */
export function weightBudgetStatus(
  totalGrams: number,
  budgetGrams: number
): WeightBudgetStatus {
  const percent =
    budgetGrams > 0 ? Math.round((totalGrams / budgetGrams) * 100) : 0;
  const overGrams = Math.max(0, totalGrams - budgetGrams);
  const level: WeightBudgetLevel =
    overGrams > 0
      ? "over"
      : percent >= WEIGHT_BUDGET_WARN_PERCENT
        ? "warn"
        : "ok";
  return { level, percent, overGrams };
}

/** Gramm menschenlesbar formatieren, z. B. 12480 → «12,5 kg» (en: «12.5 kg»). */
export function formatGrams(grams: number, lang: Language = "de"): string {
  if (grams >= 1000) {
    const value = (grams / 1000).toFixed(1);
    return `${lang === "en" ? value : value.replace(".", ",")} kg`;
  }
  return `${Math.round(grams)} g`;
}

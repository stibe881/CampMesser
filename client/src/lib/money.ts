/**
 * Geld-Helfer fürs Inventar: Preise werden als Ganzzahl in RAPPEN gespeichert
 * (Muster weightGrams) – so entstehen keine Rundungsfehler. Für die Anzeige
 * rechnen wir erst hier auf Franken um und formatieren in der aktiven Sprache.
 * Reine Logik ohne React – von der Seite und den Tests genutzt.
 */
import { LOCALE_TAGS, type Language } from "@shared/i18n";

/**
 * Rappen als Franken-Betrag formatieren, immer mit zwei Nachkommastellen
 * (z. B. 12345 → «123.45» in de-CH). Ungültige Werte ergeben «0.00».
 */
export function formatChf(rappen: number, lang: Language): string {
  const value = Number.isFinite(rappen) ? rappen / 100 : 0;
  return new Intl.NumberFormat(LOCALE_TAGS[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Minimalform eines Inventar-Eintrags für die Wert-Summe. */
export interface PricedItem {
  priceRappen?: number | null;
  quantity: number;
}

/**
 * Gesamtwert des Inventars in Rappen: Summe aus Preis × Anzahl. Einträge ohne
 * Preis zählen mit 0, unplausible Werte (NaN, negativ) werden ignoriert.
 */
export function inventoryTotalRappen(items: PricedItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.priceRappen ?? 0;
    const quantity = item.quantity;
    if (!Number.isFinite(price) || !Number.isFinite(quantity)) return sum;
    if (price <= 0 || quantity <= 0) return sum;
    return sum + Math.round(price) * Math.round(quantity);
  }, 0);
}

/** Gibt es überhaupt einen erfassten Preis? Ohne Preise blenden wir die Zeile aus. */
export function hasAnyPrice(items: PricedItem[]): boolean {
  return items.some(item => (item.priceRappen ?? 0) > 0);
}

/**
 * CHF-Eingabe (Franken, mit «.» oder «,» als Dezimaltrenner) in Rappen
 * umrechnen; leere oder unlesbare Eingaben ergeben null (= nicht erfasst).
 */
export function parseChfInput(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const francs = Number(trimmed);
  if (!Number.isFinite(francs) || francs < 0) return null;
  return Math.round(francs * 100);
}

/** Rappen für das Eingabefeld als schlichte Franken-Zahl («123.45»). */
export function rappenToInput(rappen: number | null | undefined): string {
  if (rappen === null || rappen === undefined || !Number.isFinite(rappen)) {
    return "";
  }
  return (rappen / 100).toFixed(2);
}

/**
 * Einkaufs-Verlauf für Autocomplete-Vorschläge: die zuletzt hinzugefügten
 * Einträge (Name + gemerkte Kategorie/Menge) liegen lokal in localStorage
 * (Schlüssel campmesser.shoppingHistory, neueste zuerst, max. 100) und
 * wandern über den Geräte-Sync (useSyncedSetting «shoppingHistory») aufs
 * Konto. Pflege und Vorschlags-Ranking sind reine Funktionen – testbar
 * ohne Browser (server/shoppingHistory.test.ts).
 */
import { isShoppingCategoryValue } from "@shared/shopping";

export interface ShoppingHistoryEntry {
  name: string;
  /** Gemerkte Kategorie (Katalog-Schlüssel oder «custom:<Name>»), null = ohne */
  category?: string | null;
  /** Gemerkte Menge, z. B. «2×» oder «500 g» */
  quantity?: string | null;
}

export const SHOPPING_HISTORY_KEY = "campmesser.shoppingHistory";
/** Obergrenze des Verlaufs – ältere Einträge fallen hinten raus. */
export const SHOPPING_HISTORY_MAX = 100;
/** Höchstens so viele Vorschläge im Dropdown. */
export const SHOPPING_SUGGESTION_LIMIT = 6;

/** Name-Vergleichsschlüssel: getrimmt und ohne Gross-/Kleinschreibung. */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Einen unbekannten Wert defensiv in einen Verlaufs-Eintrag übersetzen. */
function sanitizeEntry(raw: unknown): ShoppingHistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const { name, category, quantity } = raw as Record<string, unknown>;
  if (typeof name !== "string") return null;
  const trimmed = name.trim().slice(0, 160);
  if (!trimmed) return null;
  const entry: ShoppingHistoryEntry = { name: trimmed };
  if (typeof category === "string" && isShoppingCategoryValue(category)) {
    entry.category = category;
  }
  if (typeof quantity === "string" && quantity.trim()) {
    entry.quantity = quantity.trim().slice(0, 40);
  }
  return entry;
}

/**
 * Rohdaten (localStorage/Server-Sync) in einen sauberen Verlauf übersetzen:
 * ungültige Einträge fliegen raus, Namen werden case-insensitiv dedupliziert
 * (erster gewinnt – der Verlauf ist «neueste zuerst» sortiert), max. 100.
 */
export function sanitizeShoppingHistory(raw: unknown): ShoppingHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: ShoppingHistoryEntry[] = [];
  for (const item of raw) {
    if (result.length >= SHOPPING_HISTORY_MAX) break;
    const entry = sanitizeEntry(item);
    if (!entry) continue;
    const key = nameKey(entry.name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

/**
 * Einen frisch hinzugefügten Eintrag im Verlauf vermerken: er wandert (mit
 * aktueller Kategorie/Menge) an den Anfang, ein gleichnamiger alter Eintrag
 * verschwindet (case-insensitiv), die Liste bleibt bei max. 100 Einträgen.
 * Ungültige Eingaben lassen den Verlauf unverändert. Pure Funktion.
 */
export function rememberShoppingEntry(
  history: ShoppingHistoryEntry[],
  entry: ShoppingHistoryEntry
): ShoppingHistoryEntry[] {
  const clean = sanitizeEntry(entry);
  if (!clean) return history;
  const key = nameKey(clean.name);
  return [clean, ...history.filter(e => nameKey(e.name) !== key)].slice(
    0,
    SHOPPING_HISTORY_MAX
  );
}

/**
 * Vorschläge zum Getippten: Präfix-Treffer stehen vor Enthält-Treffern,
 * innerhalb der Gruppen bleibt die Reihenfolge der Quellen erhalten
 * (Aufrufer stellt den Verlauf – neueste zuerst – vor die Listen-Einträge).
 * Namen werden case-insensitiv dedupliziert; leere Eingabe → keine Vorschläge.
 */
export function shoppingSuggestions(
  query: string,
  sources: ShoppingHistoryEntry[],
  limit: number = SHOPPING_SUGGESTION_LIMIT
): ShoppingHistoryEntry[] {
  const q = nameKey(query);
  if (!q) return [];
  const seen = new Set<string>();
  const prefix: ShoppingHistoryEntry[] = [];
  const contains: ShoppingHistoryEntry[] = [];
  for (const source of sources) {
    const entry = sanitizeEntry(source);
    if (!entry) continue;
    const key = nameKey(entry.name);
    if (seen.has(key)) continue;
    const idx = key.indexOf(q);
    if (idx === -1) continue;
    seen.add(key);
    (idx === 0 ? prefix : contains).push(entry);
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...contains].slice(0, Math.max(0, limit));
}

/** Verlauf vom Gerät laden (kaputte/blockierte Daten → leer). */
export function loadShoppingHistory(): ShoppingHistoryEntry[] {
  try {
    return sanitizeShoppingHistory(
      JSON.parse(localStorage.getItem(SHOPPING_HISTORY_KEY) ?? "[]")
    );
  } catch {
    return [];
  }
}

/** Verlauf auf dem Gerät speichern (Speicher blockiert → still ignorieren). */
export function saveShoppingHistory(history: ShoppingHistoryEntry[]): void {
  try {
    localStorage.setItem(SHOPPING_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Speicher nicht verfügbar – der Verlauf gilt nur für die Sitzung
  }
}

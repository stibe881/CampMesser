/**
 * Sortierung fürs Kühlbox-Inventar: «Nach Ablauf» (Standard – ablaufende
 * Vorräte zuerst, Einträge ohne MHD zuletzt) oder «Nach Name» (alphabetisch
 * in der aktiven Sprache). Die Wahl wird in localStorage gemerkt.
 * Reine Sortier-Funktion – von der Seite und den Tests genutzt.
 */
import { expirySortKey } from "@shared/food";
import { LOCALE_TAGS, type Language } from "@shared/i18n";

export type FoodSortMode = "expiry" | "name";

export const FOOD_SORT_KEY = "campmesser.foodSort";

/** Unbekannte Werte (z. B. aus alten Ständen) fallen auf den Standard zurück. */
export function isFoodSortMode(value: unknown): value is FoodSortMode {
  return value === "expiry" || value === "name";
}

/** Gemerkte Sortier-Wahl lesen – alles ausser «name» fällt auf «expiry» zurück. */
export function loadFoodSort(): FoodSortMode {
  try {
    const raw = localStorage.getItem(FOOD_SORT_KEY);
    return isFoodSortMode(raw) ? raw : "expiry";
  } catch {
    return "expiry";
  }
}

export function storeFoodSort(mode: FoodSortMode) {
  try {
    localStorage.setItem(FOOD_SORT_KEY, mode);
  } catch {
    /* Sitzung reicht */
  }
}

/**
 * Kühlbox-Einträge sortiert zurückgeben (Original bleibt unverändert).
 * «expiry»: früheste MHD zuerst, ohne MHD ans Ende – Gleichstand nach Name.
 * «name»: sprachrichtig per localeCompare – Gleichstand nach MHD.
 */
export function sortFoodItems<
  T extends { name: string; expiryDate: string | null },
>(items: readonly T[], mode: FoodSortMode, lang: Language): T[] {
  const locale = LOCALE_TAGS[lang];
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, locale);
  const byExpiry = (a: T, b: T) =>
    expirySortKey(a.expiryDate) - expirySortKey(b.expiryDate);
  return [...items].sort((a, b) =>
    mode === "name"
      ? byName(a, b) || byExpiry(a, b)
      : byExpiry(a, b) || byName(a, b)
  );
}

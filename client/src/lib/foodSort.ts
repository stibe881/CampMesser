/**
 * Ansicht-Einstellungen der Vorrats-Seite: Sortierung («Nach Ablauf» –
 * Standard, ablaufende Vorräte zuerst, Einträge ohne MHD zuletzt – oder
 * «Nach Name», alphabetisch in der aktiven Sprache) und das zuletzt
 * gewählte Lager (#233). Beides merkt sich das Gerät in localStorage.
 * Reine Funktionen – von der Seite und den Tests genutzt.
 */
import {
  expirySortKey,
  isFoodStorage,
  DEFAULT_FOOD_STORAGE,
  type FoodStorage,
} from "@shared/food";
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

export const FOOD_STORAGE_KEY = "campmesser.foodStorage";

/** Zuletzt gewähltes Lager lesen – Unbekanntes fällt auf die Kühlbox zurück. */
export function loadFoodStorage(): FoodStorage {
  try {
    const raw = localStorage.getItem(FOOD_STORAGE_KEY);
    return isFoodStorage(raw) ? raw : DEFAULT_FOOD_STORAGE;
  } catch {
    return DEFAULT_FOOD_STORAGE;
  }
}

export function storeFoodStorage(storage: FoodStorage) {
  try {
    localStorage.setItem(FOOD_STORAGE_KEY, storage);
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

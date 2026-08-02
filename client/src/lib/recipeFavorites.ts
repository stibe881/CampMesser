/**
 * Rezept-Favoriten: reine Logik rund um die gemerkten Rezept-Ids
 * (statische Ids wie «gemuese-curry» und eigene wie «eigenes-7»).
 * Persistiert in localStorage und über den Geräte-Sync (useSyncedSetting).
 */

/** localStorage-Schlüssel der Favoriten-Liste. */
export const RECIPE_FAVORITES_KEY = "campmesser.recipeFavorites";

/** Obergrenzen – schützen localStorage und den Geräte-Sync-Payload. */
export const MAX_FAVORITES = 300;
export const MAX_ID_LENGTH = 80;

/**
 * Unbekannte Daten (localStorage/Geräte-Sync) defensiv in eine saubere
 * Id-Liste überführen: nur nicht-leere Strings, getrimmt und gekürzt,
 * Duplikate verworfen, Anzahl gekappt. Reihenfolge bleibt erhalten.
 */
export function sanitizeRecipeFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (result.length >= MAX_FAVORITES) break;
    if (typeof entry !== "string") continue;
    const id = entry.trim().slice(0, MAX_ID_LENGTH);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/** Favorit umschalten – gibt eine neue Liste zurück (nie mutierend). */
export function toggleFavorite(favorites: string[], id: string): string[] {
  const clean = id.trim().slice(0, MAX_ID_LENGTH);
  if (!clean) return favorites;
  if (favorites.includes(clean)) return favorites.filter(f => f !== clean);
  if (favorites.length >= MAX_FAVORITES) return favorites;
  return [...favorites, clean];
}

/** Favoriten aus localStorage laden (defensiv – kaputte Werte ergeben []). */
export function loadRecipeFavorites(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECIPE_FAVORITES_KEY);
    return raw ? sanitizeRecipeFavorites(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** Favoriten in localStorage schreiben (Fehler wie volle Quota ignorieren). */
export function storeRecipeFavorites(favorites: string[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RECIPE_FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    /* Quota voll o. Ä. – der Geräte-Sync gleicht es später aus */
  }
}

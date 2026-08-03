/**
 * Personenzahl fürs Umrechnen der Menüplan-Mengen (#231): pro Reise und Gerät
 * in localStorage gemerkt. null = keine Umrechnung («wie im Rezept»).
 * Die eigentliche Rechnerei liegt in shared/servings.ts.
 */
import { clampServings, MIN_SERVINGS } from "@shared/servings";

const KEY_PREFIX = "campmesser.menuPersons.";

/** Gemerkte Personenzahl einer Reise – null, wenn nichts (Gültiges) da ist. */
export function loadMenuPersons(tripId: number): number | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${tripId}`);
    if (raw === null) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < MIN_SERVINGS) return null;
    return clampServings(value);
  } catch {
    return null;
  }
}

/** Personenzahl merken; null löscht den Eintrag (keine Umrechnung). */
export function storeMenuPersons(tripId: number, persons: number | null) {
  try {
    const key = `${KEY_PREFIX}${tripId}`;
    if (persons === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(clampServings(persons)));
  } catch {
    /* Sitzung reicht */
  }
}

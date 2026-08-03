/**
 * Allergie-Profil für den Pollenflug: welche Pollenarten betreffen dich?
 * Reine Logik – Validierung unbekannter Daten (localStorage/Geräte-Sync),
 * Umschalten einer Art und Sortierung der Messwerte. Ohne DOM-Abhängigkeiten,
 * damit testbar (Muster weatherPlaces).
 */

import { POLLEN_TYPES, type PollenType } from "@shared/pollen";

/** localStorage-Schlüssel des Allergie-Profils. */
export const POLLEN_PROFILE_KEY = "campmesser.pollenProfile";

/**
 * Unbekannte Daten in ein sauberes Profil überführen: nur bekannte Arten aus
 * POLLEN_TYPES, ohne Duplikate und immer in der Reihenfolge des Katalogs.
 */
export function sanitizePollenProfile(value: unknown): PollenType[] {
  if (!Array.isArray(value)) return [];
  const result: PollenType[] = [];
  POLLEN_TYPES.forEach(type => {
    if (value.includes(type)) result.push(type);
  });
  return result;
}

/** Eine Art an- oder abwählen – liefert eine NEUE Liste in Katalog-Reihenfolge. */
export function togglePollenType(
  profile: PollenType[],
  type: PollenType
): PollenType[] {
  const next = profile.includes(type)
    ? profile.filter(t => t !== type)
    : [...profile, type];
  return sanitizePollenProfile(next);
}

/**
 * Messwerte so ordnen, dass die eigenen Arten zuerst stehen; innerhalb der
 * beiden Gruppen bleibt die ursprüngliche Reihenfolge erhalten. Ohne Profil
 * bleibt die Liste unverändert.
 */
export function sortPollenReadings<T extends { type: PollenType }>(
  readings: T[],
  profile: PollenType[]
): T[] {
  if (profile.length === 0) return readings;
  const mine = readings.filter(r => profile.includes(r.type));
  const others = readings.filter(r => !profile.includes(r.type));
  return [...mine, ...others];
}

/** Gespeichertes Profil laden (defensiv – kaputte Daten werden bereinigt). */
export function loadPollenProfile(): PollenType[] {
  try {
    const raw = localStorage.getItem(POLLEN_PROFILE_KEY);
    return raw ? sanitizePollenProfile(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** Profil merken – schlägt das fehl, gilt die Auswahl nur diese Sitzung. */
export function storePollenProfile(profile: PollenType[]) {
  try {
    localStorage.setItem(POLLEN_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Speicher voll/blockiert – die Auswahl lebt dann nur diese Sitzung
  }
}

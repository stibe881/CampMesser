/**
 * Lokaler Speicher der Energie-Einstellungen (localStorage) – der Strom-
 * Speicher des Budget-Rechners (#229). Die Rechenlogik liegt in
 * shared/powerBudget.ts.
 *
 * Wie die Fahrzeug-Profile (#227) hängen die Werte am Geräte-Sync: lokal
 * schnell und offline, angemeldet zusätzlich am Konto. Eine DB-Tabelle
 * braucht es dafür nicht – das sind Einstellungen, keine Daten.
 */
import { sanitizePowerStorage, type PowerStorage } from "@shared/powerBudget";

export const POWER_STORAGE_KEY = "campmesser.powerStorage";

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadPowerStorage(): PowerStorage {
  return sanitizePowerStorage(readJson(POWER_STORAGE_KEY));
}

export function savePowerStorage(storage: PowerStorage) {
  try {
    localStorage.setItem(POWER_STORAGE_KEY, JSON.stringify(storage));
  } catch {
    /* Speicher voll oder blockiert – die Sitzung funktioniert trotzdem */
  }
}

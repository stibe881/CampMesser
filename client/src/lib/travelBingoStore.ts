/**
 * Reise-Bingo (#240): die laufenden Karten in localStorage.
 *
 * Bewusst ohne Konto und ohne Server – das Bingo läuft im Funkloch auf der
 * Autobahn, und mehr als ein paar Karten pro Gerät gibt es nie. Geprüft und
 * zurechtgebogen wird beim Laden mit `sanitizeBingoCards()` aus
 * shared/travelBingo.ts (Muster lib/huntTimes.ts).
 */
import { sanitizeBingoCards, type BingoCard } from "@shared/travelBingo";

const STORAGE_KEY = "campmesser.travelBingo";

/** Karten laden; kaputter oder fehlender Speicher ergibt eine leere Liste. */
export function loadBingoCards(): BingoCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitizeBingoCards(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** Karten sichern; blockierter Speicher bleibt folgenlos (Sitzung reicht). */
export function storeBingoCards(cards: BingoCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    /* Privat-Modus o. Ä. – die Karten gelten für diese Sitzung */
  }
}

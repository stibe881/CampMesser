/**
 * Schnellzugriff-Leiste (#297): lokale Speicherung der frei belegten
 * Plätze. localStorage ist die schnelle, offlinefähige Quelle; der
 * Geräte-Sync (`quickBar`) hängt in der Ansicht daran – dasselbe Muster
 * wie bei Kachel-Reihenfolge und Startseiten-Widgets.
 */
import { modules } from "@/data/modules";
import { sanitizeQuickBar } from "@shared/quickBar";

export const QUICK_BAR_KEY = "campmesser.quickBar";

/** Alle Pfade, die überhaupt in die Leiste dürfen. */
export function quickBarChoices(): string[] {
  return modules.map(module => module.path);
}

export function loadQuickBar(): string[] {
  try {
    const raw = localStorage.getItem(QUICK_BAR_KEY);
    return sanitizeQuickBar(raw ? JSON.parse(raw) : null, quickBarChoices());
  } catch {
    return sanitizeQuickBar(null, quickBarChoices());
  }
}

export function saveQuickBar(custom: readonly string[]): void {
  try {
    localStorage.setItem(QUICK_BAR_KEY, JSON.stringify(custom));
  } catch {
    /* Sitzung reicht */
  }
}

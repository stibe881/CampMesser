/**
 * Menüplan pro Trip: Tage-Raster und Zutaten-Zusammenführung als reine
 * Funktionen – von Client und Tests genutzt, ohne DB-Abhängigkeit.
 */
import { l4, type L4 } from "./i18n";

/** Mahlzeiten-Slots pro Tag, in Anzeige-Reihenfolge. */
export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Meal = (typeof MEALS)[number];

/** Anzeige-Labels der Mahlzeiten (Schlüssel bleiben englisch in der DB). */
export const MEAL_LABELS: Record<Meal, L4> = {
  breakfast: l4("Morgenessen", "Petit-déjeuner", "Colazione", "Breakfast"),
  lunch: l4("Mittagessen", "Déjeuner", "Pranzo", "Lunch"),
  dinner: l4("Abendessen", "Souper", "Cena", "Dinner"),
  snack: l4("Znüni/Zvieri", "En-cas", "Merenda", "Snack"),
};

const DAY_MS = 86400000;
/** Obergrenze fürs Raster, damit ein Tippfehler im Datum die Seite nicht sprengt. */
export const MAX_MENU_DAYS = 60;

function parseIsoDay(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/**
 * Alle Tage eines Aufenthalts als ISO-Strings (Anreise- bis Abreisetag,
 * beide inklusive). Ungültige Daten → leeres Raster; Abreise vor Anreise →
 * nur der Anreisetag; Länge auf MAX_MENU_DAYS begrenzt.
 */
export function tripDays(startDate: string, endDate: string): string[] {
  const start = parseIsoDay(startDate);
  if (start === null) return [];
  const end = parseIsoDay(endDate);
  const days: string[] = [];
  const count =
    end === null || end < start
      ? 1
      : Math.min(MAX_MENU_DAYS, Math.round((end - start) / DAY_MS) + 1);
  for (let i = 0; i < count; i++) {
    days.push(new Date(start + i * DAY_MS).toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Zutaten-Zeilen für die Einkaufsliste zusammenführen: trimmen, Leerzeilen
 * entfernen und Duplikate (gross-/kleinschreibungsunabhängig) zusammenfassen –
 * die zuerst gesehene Schreibweise gewinnt.
 */
export function mergeIngredientLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(trimmed);
  });
  return merged;
}

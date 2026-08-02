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

/** Eignung eines Rezepts fürs automatische Füllen (Heuristik liegt im Client). */
export type AutofillKind = "breakfast" | "main" | "any";

/** Aufbereitetes Rezept fürs automatische Füllen – nur Id und Eignung. */
export interface AutofillRecipe {
  id: string;
  kind: AutofillKind;
}

/** Bereits belegter Slot; recipeId zählt für die Folgetag-Regel mit. */
export interface AutofillExisting {
  day: string;
  meal: Meal;
  recipeId?: string | null;
}

/** Vom Autofill neu zu setzender Slot. */
export interface AutofillAssignment {
  day: string;
  meal: Meal;
  recipeId: string;
}

/** Deterministischer 32-Bit-Hash eines Seeds (Zahl oder Text). */
function hashSeed(seed: string | number): number {
  const text = String(seed);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Kleiner deterministischer Zufallsgenerator (mulberry32) – kein Math.random. */
function mulberry32(a: number): () => number {
  let state = a >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates-Mischung mit injiziertem Zufallsgenerator (deterministisch). */
function shuffle<T>(items: T[], rand: () => number): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

/**
 * Menüplan automatisch füllen: belegt nur LEERE Slots der übergebenen
 * Mahlzeiten (Snacks werden nie gefüllt). Frühstücks-Slots bevorzugen
 * Rezepte mit kind "breakfast" (dann "any", zuletzt "main"), Mittag/Abend
 * nutzen "main" und "any". Ein Rezept wiederholt sich nie am selben oder
 * direkt benachbarten Tag – auch nicht gegenüber bereits geplanten
 * Einträgen; reicht der Vorrat nicht, bleibt der Slot leer (Wiederholung
 * frühestens nach 2 Tagen). Deterministisch über den Seed (z. B. tripId).
 */
export function autofillMenuPlan(options: {
  days: string[];
  meals: Meal[];
  existing: AutofillExisting[];
  recipes: AutofillRecipe[];
  seed: string | number;
}): AutofillAssignment[] {
  const { days, meals, existing, recipes, seed } = options;
  const rand = mulberry32(hashSeed(seed));

  // Rotations-Warteschlangen pro Eignung, deterministisch gemischt
  const queues: Record<AutofillKind, string[]> = {
    breakfast: shuffle(
      recipes.filter(r => r.kind === "breakfast").map(r => r.id),
      rand
    ),
    main: shuffle(
      recipes.filter(r => r.kind === "main").map(r => r.id),
      rand
    ),
    any: shuffle(
      recipes.filter(r => r.kind === "any").map(r => r.id),
      rand
    ),
  };

  // Belegte Slots und bereits verwendete Rezepte pro Tag (inkl. Bestand)
  const occupied = new Set(existing.map(e => `${e.day}|${e.meal}`));
  const usedByDay = new Map<string, Set<string>>();
  const markUsed = (day: string, recipeId: string) => {
    const set = usedByDay.get(day) ?? new Set<string>();
    set.add(recipeId);
    usedByDay.set(day, set);
  };
  existing.forEach(e => {
    if (e.recipeId) markUsed(e.day, e.recipeId);
  });

  const usedOn = (day: string | undefined, recipeId: string) =>
    day !== undefined && (usedByDay.get(day)?.has(recipeId) ?? false);

  /** Erstes Rezept der Warteschlange, das die Nachbartage-Regel erfüllt. */
  const pickFrom = (queue: string[], dayIndex: number): string | null => {
    const prev = days[dayIndex - 1];
    const day = days[dayIndex];
    const next = days[dayIndex + 1];
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      if (usedOn(prev, id) || usedOn(day, id) || usedOn(next, id)) continue;
      queue.splice(i, 1);
      queue.push(id); // ans Ende rotieren → gleichmässige Abwechslung
      return id;
    }
    return null;
  };

  const assignments: AutofillAssignment[] = [];
  days.forEach((day, dayIndex) => {
    meals.forEach(meal => {
      if (meal === "snack") return; // Snacks nie automatisch füllen
      if (occupied.has(`${day}|${meal}`)) return;
      const order: AutofillKind[] =
        meal === "breakfast" ? ["breakfast", "any", "main"] : ["main", "any"];
      for (const kind of order) {
        const id = pickFrom(queues[kind], dayIndex);
        if (id !== null) {
          assignments.push({ day, meal, recipeId: id });
          markUsed(day, id);
          break;
        }
      }
    });
  });
  return assignments;
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

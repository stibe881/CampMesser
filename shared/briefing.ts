/**
 * Morgen-Briefing (#255): Was heute zählt, in einer Karte statt über die
 * halbe Startseite verstreut – Wetter, Mahlzeiten, offene Aufgaben und ein
 * Blick in den Himmel.
 *
 * Zwei Entscheidungen stecken in dieser Datei:
 *
 *  - Das Briefing erscheint NUR morgens und nur während einer laufenden
 *    Reise. Ein «Morgen-Briefing» um neun Uhr abends ist keins, und daheim
 *    im Winter braucht es keine Zusammenfassung des Zeltplatz-Tages. Ein
 *    dauerhaft sichtbarer Kasten würde zur Tapete und nicht mehr gelesen.
 *  - Leere Zeilen fallen weg statt «keine Aufgaben» zu melden. Eine
 *    Zusammenfassung, die zur Hälfte aus Fehlanzeigen besteht, spart keine
 *    Zeit – und gibt es zu gar nichts etwas zu sagen, erscheint die Karte
 *    gar nicht erst.
 *
 * Reine Rechnerei ohne Abruf – Client, Server und Tests teilen sie.
 */

/** Ab dieser vollen Stunde (Ortszeit) gilt es als Morgen. */
export const BRIEFING_FROM_HOUR = 4;

/** Ab dieser vollen Stunde ist der Morgen vorbei (ausschliessend). */
export const BRIEFING_TO_HOUR = 12;

/** Mehr offene Aufgaben zeigt die Karte nicht – der Rest wird gezählt. */
export const MAX_BRIEFING_TASKS = 3;

/** Ist es gerade Morgen im Sinne des Briefings? */
export function isBriefingTime(hour: number): boolean {
  return (
    Number.isFinite(hour) &&
    hour >= BRIEFING_FROM_HOUR &&
    hour < BRIEFING_TO_HOUR
  );
}

/** Die vier Zeilen des Briefings, in fester Reihenfolge. */
export type BriefingKind = "weather" | "meals" | "tasks" | "astro";

export interface BriefingItem {
  kind: BriefingKind;
  text: string;
}

export interface BriefingInput {
  /** Wetter-Zeile, z. B. «18–26 °C, sonnig» */
  weather?: string | null;
  /** Mahlzeiten-Zeile, z. B. «Frühstück: Zopf · Abend: Chili» */
  meals?: string | null;
  /** Offene Aufgaben der Pinnwand, wichtigste zuerst */
  tasks?: readonly string[];
  /** Ein Satz zum Himmel, z. B. «Vollmond – heute Nacht hell» */
  astro?: string | null;
}

/** Leerzeichen-Text als «nichts» behandeln. */
function clean(value: string | null | undefined): string | null {
  const text = (value ?? "").trim();
  return text.length > 0 ? text : null;
}

/**
 * Aufgaben fürs Briefing kürzen: höchstens `max` Zeilen, leere fallen weg.
 * Zurück kommt auch, wie viele übrig bleiben – «und 4 weitere» ist eine
 * ehrlichere Anzeige als eine stillschweigend abgeschnittene Liste.
 */
export function briefingTasks(
  tasks: readonly string[] | undefined,
  max: number = MAX_BRIEFING_TASKS
): { shown: string[]; remaining: number } {
  const all = (tasks ?? [])
    .map(task => clean(task))
    .filter((task): task is string => task !== null);
  const limit = Math.max(0, max);
  return {
    shown: all.slice(0, limit),
    remaining: Math.max(0, all.length - limit),
  };
}

/**
 * Die Zeilen des Briefings zusammenstellen – immer in derselben Reihenfolge
 * (Wetter, Mahlzeiten, Aufgaben, Himmel), damit das Auge sie morgens ohne
 * Suchen findet. Was leer ist, fällt raus.
 *
 * Die Aufgaben-Zeile wird hier NICHT gebaut: Wie «und 4 weitere» heisst,
 * hängt an der Sprache und gehört in die Ansicht. Übergeben wird der
 * fertige Text.
 */
export function briefingItems(input: BriefingInput): BriefingItem[] {
  const items: BriefingItem[] = [];
  const weather = clean(input.weather);
  if (weather) items.push({ kind: "weather", text: weather });
  const meals = clean(input.meals);
  if (meals) items.push({ kind: "meals", text: meals });
  const { shown } = briefingTasks(input.tasks);
  shown.forEach(task => items.push({ kind: "tasks", text: task }));
  const astro = clean(input.astro);
  if (astro) items.push({ kind: "astro", text: astro });
  return items;
}

/** Gibt es überhaupt etwas zu sagen? Sonst zeigt die Startseite nichts. */
export function hasBriefingContent(input: BriefingInput): boolean {
  return briefingItems(input).length > 0;
}

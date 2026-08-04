/**
 * «Heute»-Ansicht während der Reise (#298).
 *
 * Auf dem Platz braucht niemand ein Menü aus vierzig Kacheln. Man will
 * wissen: Wie wird das Wetter, was gibt es zu essen, was steht noch an –
 * und das, ohne zu suchen. Deshalb bekommt eine laufende Reise eine
 * eigene Seite, und beim App-Start landet man dort.
 *
 * NUR EINMAL PRO SITZUNG WIRD UMGELEITET. Wer «Start» in der
 * Schnellzugriff-Leiste antippt, will die Kacheln sehen – wenn die App
 * ihn von dort jedes Mal zurückwirft, ist sie kaputt. Der Sprung
 * passiert beim ersten Öffnen und danach nicht mehr; `hasJumped` ist die
 * Erinnerung daran (in der Ansicht: sessionStorage).
 *
 * UND NUR BEI EINER LAUFENDEN REISE. Zuhause im November ist die
 * «Heute»-Ansicht leer und die Kacheln sind richtig.
 */
import { MEALS, type Meal } from "./menuPlan";
import { currentTripDay, type TripLike } from "./trips";

/** Soll die App beim Öffnen zur «Heute»-Ansicht springen? */
export function shouldOpenToday(input: {
  /** Einstellung des Kontos; aus ist aus. */
  enabled: boolean;
  /** Läuft heute überhaupt eine Reise? */
  hasRunningTrip: boolean;
  /** Wurde in dieser Sitzung schon gesprungen? */
  hasJumped: boolean;
}): boolean {
  return input.enabled && input.hasRunningTrip && !input.hasJumped;
}

/**
 * Die Reise, um die es heute geht.
 *
 * Bei Überlappung gewinnt die zuletzt angetretene – wer am
 * Anreisetag der nächsten Reise noch in der alten steht, meint die neue.
 * Null, wenn heute keine läuft.
 */
export function pickRunningTrip<T extends TripLike & { id: number }>(
  trips: readonly T[],
  today: string
): T | null {
  const running = trips
    .filter(trip => currentTripDay(trip, today) !== null)
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  return running[0] ?? null;
}

export interface MealEntryLike {
  day: string;
  meal: string;
  recipeId: string | null;
  customRecipeId: number | null;
  freeText: string | null;
}

/**
 * Die Mahlzeiten von heute in der Reihenfolge des Tages – nicht in der
 * Reihenfolge, in der sie eingetragen wurden. Leere Slots fallen weg:
 * «Mittagessen: –» ist keine Information.
 */
export function todayMeals<T extends MealEntryLike>(
  entries: readonly T[],
  day: string
): { meal: Meal; entry: T }[] {
  const result: { meal: Meal; entry: T }[] = [];
  MEALS.forEach(meal => {
    const entry = entries.find(e => e.day === day && e.meal === meal);
    if (!entry) return;
    if (!entry.recipeId && !entry.customRecipeId && !entry.freeText) return;
    result.push({ meal, entry });
  });
  return result;
}

export interface BoardTaskLike {
  id: number;
  kind: string;
  text: string;
  doneAt: Date | string | null;
}

/**
 * Offene Aufgaben von der Pinnwand, älteste zuerst.
 *
 * ÄLTESTE ZUERST, weil eine Aufgabe, die seit drei Tagen dasteht,
 * dringender ist als die von vorhin – und weil man sonst nie das Ende
 * der Liste sieht. Nachrichten sind keine Aufgaben und bleiben draussen.
 */
export function openTasks<T extends BoardTaskLike>(
  notes: readonly T[],
  limit = 5
): T[] {
  return notes
    .filter(note => note.kind === "task" && note.doneAt == null)
    .slice()
    .sort((a, b) => a.id - b.id)
    .slice(0, limit);
}

/**
 * Wie viele Nächte noch? Der letzte Tag ist der Abreisetag, an dem man
 * nicht mehr schläft – deshalb Tage bis Ende, nicht Nächte plus eins.
 */
export function nightsLeft(
  trip: Pick<TripLike, "startDate" | "endDate">,
  today: string
): number | null {
  const progress = currentTripDay(trip, today);
  if (!progress) return null;
  return Math.max(0, progress.total - progress.day);
}

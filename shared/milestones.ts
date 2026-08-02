/**
 * Meilenstein-Abzeichen fürs Reise-Tagebuch (Erwachsene): reine Funktionen
 * über abgeschlossene Aufenthalte – testbar ohne DB. Der Katalog liegt als
 * L4 vor; `milestones()` liefert erreichte Meilensteine mit dem Datum des
 * Erreichens (≈ Enddatum des auslösenden Trips) und offene mit Fortschritt.
 */
import { l4, pick, type L4, type Language } from "./i18n";
import { tripNights } from "./trips";

/** Minimale Trip-Sicht für die Meilenstein-Berechnung. */
export interface MilestoneTrip {
  startDate: string;
  endDate: string;
  /** Anzeigename des Orts (Favorit oder Freitext); leer = zählt nicht als Ort */
  placeName?: string | null;
}

/** Ein Meilenstein mit Stand: erreicht (achievedOn gesetzt) oder offen. */
export interface Milestone {
  id: string;
  /** Anzeigename in der gewählten Sprache */
  label: string;
  /** Zielwert (Fortschritt: current von target) */
  target: number;
  /** Aktueller Stand, auf target gedeckelt */
  current: number;
  achieved: boolean;
  /** Datum des Erreichens ≈ Enddatum des auslösenden Trips; null = offen */
  achievedOn: string | null;
}

/** Meteorologische Jahreszeit des Startdatums (Dez–Feb Winter usw.). */
export function seasonOf(
  isoDate: string
): "spring" | "summer" | "autumn" | "winter" | null {
  const month = Number(isoDate.slice(5, 7));
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

const NIGHT_STEPS = [10, 25, 50, 100] as const;
const PLACE_STEPS = [5, 10, 20] as const;
const TRIP_STEPS = [5, 15, 30] as const;
/** Derselbe Ort so oft besucht → «Wiederkehrer». */
export const RETURNER_VISITS = 3;

const NIGHT_LABELS: Record<number, L4> = {
  10: l4("10 Übernachtungen", "10 nuitées", "10 pernottamenti", "10 nights"),
  25: l4("25 Übernachtungen", "25 nuitées", "25 pernottamenti", "25 nights"),
  50: l4("50 Übernachtungen", "50 nuitées", "50 pernottamenti", "50 nights"),
  100: l4(
    "100 Übernachtungen",
    "100 nuitées",
    "100 pernottamenti",
    "100 nights"
  ),
};
const PLACE_LABELS: Record<number, L4> = {
  5: l4(
    "5 verschiedene Orte",
    "5 lieux différents",
    "5 luoghi diversi",
    "5 different places"
  ),
  10: l4(
    "10 verschiedene Orte",
    "10 lieux différents",
    "10 luoghi diversi",
    "10 different places"
  ),
  20: l4(
    "20 verschiedene Orte",
    "20 lieux différents",
    "20 luoghi diversi",
    "20 different places"
  ),
};
const TRIP_LABELS: Record<number, L4> = {
  5: l4("5 Aufenthalte", "5 séjours", "5 soggiorni", "5 stays"),
  15: l4("15 Aufenthalte", "15 séjours", "15 soggiorni", "15 stays"),
  30: l4("30 Aufenthalte", "30 séjours", "30 soggiorni", "30 stays"),
};
const SEASONS_LABEL: L4 = l4(
  "4 Jahreszeiten",
  "4 saisons",
  "4 stagioni",
  "4 seasons"
);
const RETURNER_LABEL: L4 = l4(
  "Wiederkehrer (3× derselbe Ort)",
  "Habitué·e (3× le même lieu)",
  "Habitué (3× lo stesso posto)",
  "Regular (same place 3×)"
);

/**
 * Meilensteine über alle ABGESCHLOSSENEN Aufenthalte (endDate ≤ today;
 * geplante und laufende zählen noch nicht). Trips werden nach Enddatum
 * verarbeitet, damit das Datum des Erreichens dem Enddatum des auslösenden
 * Trips entspricht. Ungültige Zeiträume zählen 0 Nächte, aber als Aufenthalt.
 */
export function milestones(
  trips: MilestoneTrip[],
  today: string,
  lang: Language = "de"
): Milestone[] {
  const done = trips
    .filter(trip => /^\d{4}-\d{2}-\d{2}$/.test(trip.endDate))
    .filter(trip => trip.endDate <= today)
    .slice()
    .sort(
      (a, b) =>
        a.endDate.localeCompare(b.endDate) ||
        a.startDate.localeCompare(b.startDate)
    );

  // Kumulierte Stände plus «wann wurde Schwelle x erstmals erreicht?»
  let nightSum = 0;
  const nightReachedOn = new Map<number, string>();
  const placeSet = new Set<string>();
  const placeReachedOn = new Map<number, string>();
  const tripReachedOn = new Map<number, string>();
  const seasonSet = new Set<string>();
  let seasonsReachedOn: string | null = null;
  const visitsByPlace = new Map<string, number>();
  let returnerReachedOn: string | null = null;
  let maxVisits = 0;

  done.forEach((trip, index) => {
    nightSum += tripNights(trip.startDate, trip.endDate);
    for (const step of NIGHT_STEPS) {
      if (nightSum >= step && !nightReachedOn.has(step)) {
        nightReachedOn.set(step, trip.endDate);
      }
    }
    const place = trip.placeName?.trim();
    if (place) {
      // Orte gross-/kleinschreibungsunabhängig zusammenfassen
      const key = place.toLowerCase();
      placeSet.add(key);
      for (const step of PLACE_STEPS) {
        if (placeSet.size >= step && !placeReachedOn.has(step)) {
          placeReachedOn.set(step, trip.endDate);
        }
      }
      const visits = (visitsByPlace.get(key) ?? 0) + 1;
      visitsByPlace.set(key, visits);
      maxVisits = Math.max(maxVisits, visits);
      if (visits >= RETURNER_VISITS && returnerReachedOn === null) {
        returnerReachedOn = trip.endDate;
      }
    }
    for (const step of TRIP_STEPS) {
      if (index + 1 >= step && !tripReachedOn.has(step)) {
        tripReachedOn.set(step, trip.endDate);
      }
    }
    const season = seasonOf(trip.startDate);
    if (season) {
      seasonSet.add(season);
      if (seasonSet.size === 4 && seasonsReachedOn === null) {
        seasonsReachedOn = trip.endDate;
      }
    }
  });

  const entry = (
    id: string,
    label: L4,
    target: number,
    current: number,
    achievedOn: string | null
  ): Milestone => ({
    id,
    label: pick(label, lang),
    target,
    current: Math.min(target, current),
    achieved: achievedOn !== null,
    achievedOn,
  });

  return [
    ...NIGHT_STEPS.map(step =>
      entry(
        `nights-${step}`,
        NIGHT_LABELS[step],
        step,
        nightSum,
        nightReachedOn.get(step) ?? null
      )
    ),
    ...PLACE_STEPS.map(step =>
      entry(
        `places-${step}`,
        PLACE_LABELS[step],
        step,
        placeSet.size,
        placeReachedOn.get(step) ?? null
      )
    ),
    ...TRIP_STEPS.map(step =>
      entry(
        `trips-${step}`,
        TRIP_LABELS[step],
        step,
        done.length,
        tripReachedOn.get(step) ?? null
      )
    ),
    entry("seasons", SEASONS_LABEL, 4, seasonSet.size, seasonsReachedOn),
    entry(
      "returner",
      RETURNER_LABEL,
      RETURNER_VISITS,
      maxVisits,
      returnerReachedOn
    ),
  ];
}

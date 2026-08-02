/**
 * Reise-Tagebuch: Nächte-Berechnung und Statistik über alle Einträge.
 * Reine Funktionen auf ISO-Datumsstrings (YYYY-MM-DD) – testbar ohne DB.
 */
import { LOCALE_TAGS, type Language } from "./i18n";

export interface TripLike {
  startDate: string;
  endDate: string;
  /** Anzeigename des Orts (Favorit oder Freitext) */
  placeName?: string | null;
  /** Sterne-Bewertung 1–5; null/undefined = nicht bewertet */
  rating?: number | null;
}

export interface TripStats {
  totalTrips: number;
  totalNights: number;
  /** Nächte pro Jahr – eine Nacht zählt zum Jahr ihres Abends */
  nightsByYear: Record<number, number>;
  /** Orte nach Nächten absteigend sortiert */
  topPlaces: { name: string; nights: number }[];
  /** Ø-Bewertung über alle bewerteten Einträge; null = keine Bewertung */
  avgRating: number | null;
}

/** Gültige Bewertung (ganze Zahl 1–5) oder null. */
function validRating(rating: number | null | undefined): number | null {
  return typeof rating === "number" &&
    Number.isInteger(rating) &&
    rating >= 1 &&
    rating <= 5
    ? rating
    : null;
}

const DAY_MS = 86400000;
/** Obergrenze pro Eintrag, damit ein Tippfehler im Datum die Statistik nicht sprengt. */
const MAX_NIGHTS_PER_TRIP = 1000;

function parseIsoDay(iso: string): number | null {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/** Anzahl Nächte zwischen An- und Abreise (gleicher Tag = 0, ungültig = 0). */
export function tripNights(startDate: string, endDate: string): number {
  const start = parseIsoDay(startDate);
  const end = parseIsoDay(endDate);
  if (start === null || end === null || end <= start) return 0;
  return Math.min(MAX_NIGHTS_PER_TRIP, Math.round((end - start) / DAY_MS));
}

/** Nächte eines Aufenthalts pro Jahr aufteilen (die Nacht zählt zum Datum ihres Abends). */
export function nightsByYear(
  startDate: string,
  endDate: string
): Record<number, number> {
  const result: Record<number, number> = {};
  const start = parseIsoDay(startDate);
  const nights = tripNights(startDate, endDate);
  if (start === null || nights === 0) return result;
  for (let i = 0; i < nights; i++) {
    const year = new Date(start + i * DAY_MS).getUTCFullYear();
    result[year] = (result[year] ?? 0) + 1;
  }
  return result;
}

/** Ist der Aufenthalt aus heutiger Sicht geplant (Anreise heute oder später)? */
export function isUpcomingTrip(startDate: string, today: string): boolean {
  return startDate >= today;
}

/** Tage bis zur Anreise (0 = heute; negativ bei laufenden/vergangenen Trips). */
export function daysUntilTrip(startDate: string, today: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(now)) return 0;
  return Math.round((start - now) / DAY_MS);
}

/** Ein Ort mit Nächte-Zahl für die Highlights des Jahresrückblicks. */
export interface YearHighlight {
  name: string;
  nights: number;
}

export interface YearReview {
  year: number;
  /** Anzahl Aufenthalte mit Anreise in diesem Jahr */
  trips: number;
  /** Übernachtungen gesamt */
  nights: number;
  /** Anzahl verschiedener Orte */
  places: number;
  /** Ort mit den meisten Nächten */
  topPlace: YearHighlight | null;
  /** Längster Aufenthalt am Stück (Ort + Nächte) */
  longestStay: YearHighlight | null;
  /** Best bewerteter Platz (höchste Ø-Bewertung, mindestens 1 Bewertung) */
  bestRated: { name: string; rating: number } | null;
}

/**
 * Jahresrückblick: Kennzahlen aller Aufenthalte mit Anreise im gegebenen Jahr.
 * Bewusst einfach gehalten: ein Trip zählt komplett zum Jahr seines Startdatums –
 * ein Silvester-Aufenthalt wird also NICHT auf zwei Jahre aufgeteilt.
 * Vergangen/geplant filtert die Aufrufstelle (lang steuert nur die Orts-Sortierung).
 */
export function computeYearReview(
  trips: TripLike[],
  year: number,
  lang: Language = "de"
): YearReview {
  const inYear = trips.filter(trip => {
    const start = parseIsoDay(trip.startDate);
    return start !== null && new Date(start).getUTCFullYear() === year;
  });
  const review: YearReview = {
    year,
    trips: inYear.length,
    nights: 0,
    places: 0,
    topPlace: null,
    longestStay: null,
    bestRated: null,
  };
  const placeNights = new Map<string, number>();
  const placeRatings = new Map<string, { sum: number; count: number }>();
  const places = new Set<string>();
  for (const trip of inYear) {
    const nights = tripNights(trip.startDate, trip.endDate);
    review.nights += nights;
    const place = trip.placeName?.trim();
    if (place) {
      places.add(place);
      if (nights > 0) {
        placeNights.set(place, (placeNights.get(place) ?? 0) + nights);
      }
      const rating = validRating(trip.rating);
      if (rating !== null) {
        const entry = placeRatings.get(place) ?? { sum: 0, count: 0 };
        entry.sum += rating;
        entry.count += 1;
        placeRatings.set(place, entry);
      }
    }
    // Längster Aufenthalt: bei Gleichstand gewinnt der zuerst eingetragene
    if (
      nights > 0 &&
      (review.longestStay === null || nights > review.longestStay.nights)
    ) {
      review.longestStay = { name: place ?? "", nights };
    }
  }
  review.places = places.size;
  const ranked = Array.from(placeNights.entries())
    .map(([name, nights]) => ({ name, nights }))
    .sort(
      (a, b) =>
        b.nights - a.nights || a.name.localeCompare(b.name, LOCALE_TAGS[lang])
    );
  review.topPlace = ranked[0] ?? null;
  // Best bewerteter Platz: höchste Ø-Bewertung, bei Gleichstand mehr
  // Bewertungen, dann alphabetisch – deterministisch in jeder Sprache.
  const rankedByRating = Array.from(placeRatings.entries())
    .map(([name, { sum, count }]) => ({
      name,
      rating: sum / count,
      count,
    }))
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        b.count - a.count ||
        a.name.localeCompare(b.name, LOCALE_TAGS[lang])
    );
  const best = rankedByRating[0];
  review.bestRated = best ? { name: best.name, rating: best.rating } : null;
  return review;
}

/** Gesamt-Statistik über alle Tagebuch-Einträge (lang steuert nur die Orts-Sortierung). */
export function computeTripStats(
  trips: TripLike[],
  lang: Language = "de"
): TripStats {
  const stats: TripStats = {
    totalTrips: trips.length,
    totalNights: 0,
    nightsByYear: {},
    topPlaces: [],
    avgRating: null,
  };
  const placeNights = new Map<string, number>();
  let ratingSum = 0;
  let ratingCount = 0;
  for (const trip of trips) {
    const nights = tripNights(trip.startDate, trip.endDate);
    stats.totalNights += nights;
    const perYear = nightsByYear(trip.startDate, trip.endDate);
    for (const [year, n] of Object.entries(perYear)) {
      stats.nightsByYear[Number(year)] =
        (stats.nightsByYear[Number(year)] ?? 0) + n;
    }
    const place = trip.placeName?.trim();
    if (place && nights > 0) {
      placeNights.set(place, (placeNights.get(place) ?? 0) + nights);
    }
    const rating = validRating(trip.rating);
    if (rating !== null) {
      ratingSum += rating;
      ratingCount += 1;
    }
  }
  if (ratingCount > 0) stats.avgRating = ratingSum / ratingCount;
  stats.topPlaces = Array.from(placeNights.entries())
    .map(([name, nights]) => ({ name, nights }))
    .sort(
      (a, b) =>
        b.nights - a.nights || a.name.localeCompare(b.name, LOCALE_TAGS[lang])
    );
  return stats;
}

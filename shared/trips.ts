/**
 * Reise-Tagebuch: Nächte-Berechnung und Statistik über alle Einträge.
 * Reine Funktionen auf ISO-Datumsstrings (YYYY-MM-DD) – testbar ohne DB.
 */

export interface TripLike {
  startDate: string;
  endDate: string;
  /** Anzeigename des Orts (Favorit oder Freitext) */
  placeName?: string | null;
}

export interface TripStats {
  totalTrips: number;
  totalNights: number;
  /** Nächte pro Jahr – eine Nacht zählt zum Jahr ihres Abends */
  nightsByYear: Record<number, number>;
  /** Orte nach Nächten absteigend sortiert */
  topPlaces: { name: string; nights: number }[];
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
export function nightsByYear(startDate: string, endDate: string): Record<number, number> {
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

/** Gesamt-Statistik über alle Tagebuch-Einträge. */
export function computeTripStats(trips: TripLike[]): TripStats {
  const stats: TripStats = { totalTrips: trips.length, totalNights: 0, nightsByYear: {}, topPlaces: [] };
  const placeNights = new Map<string, number>();
  for (const trip of trips) {
    const nights = tripNights(trip.startDate, trip.endDate);
    stats.totalNights += nights;
    const perYear = nightsByYear(trip.startDate, trip.endDate);
    for (const [year, n] of Object.entries(perYear)) {
      stats.nightsByYear[Number(year)] = (stats.nightsByYear[Number(year)] ?? 0) + n;
    }
    const place = trip.placeName?.trim();
    if (place && nights > 0) {
      placeNights.set(place, (placeNights.get(place) ?? 0) + nights);
    }
  }
  stats.topPlaces = Array.from(placeNights.entries())
    .map(([name, nights]) => ({ name, nights }))
    .sort((a, b) => b.nights - a.nights || a.name.localeCompare(b.name, "de-CH"));
  return stats;
}

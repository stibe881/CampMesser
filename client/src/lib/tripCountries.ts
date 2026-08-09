/**
 * Länder-Statistik der Reisen (#510): Welche Länder stecken im
 * Reise-Tagebuch? Das Land wird aus dem ORT geraten – über dieselben
 * Länder-Aliasse wie bei den Länderregeln (#228). Ehrlich: Ein Ort wie
 * «Thun» nennt kein Land und bleibt darum unzugeordnet, statt geraten
 * in der Schweiz zu landen.
 */
import { findCountryRules, guessCountryCode } from "@/data/roadRules";
import { tripNights } from "@shared/trips";
import type { L4 } from "@shared/i18n";

export interface CountryTripLike {
  /** Für die Etappen-Zuordnung (#592); ohne Id zählt nur der Reise-Ort. */
  id?: number;
  title: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  spotId?: number | null;
}

/** Etappe für die Länder-Zuordnung (#592). */
export interface CountryStopLike {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CountryStatsRow {
  code: string;
  flag: string;
  name: L4;
  trips: number;
  nights: number;
}

export interface CountryStats {
  rows: CountryStatsRow[];
  /** Reisen, deren Ort kein Land verrät – ehrlich ausgewiesen. */
  unassigned: number;
}

export function visitedCountryRows(
  trips: readonly CountryTripLike[],
  /** Zeltplatz-Namen je Id – der Platzname nennt das Land oft eher. */
  spotNameById?: ReadonlyMap<number, string>,
  /**
   * Etappen je Reise (#592): Nennt eine Etappe ein Land, zählt die
   * Rundreise für JEDES dieser Länder – mit den Nächten der jeweiligen
   * Etappe. Etappen ohne Länder-Hinweis fallen ans Hauptland (falls
   * eins geraten wurde); ganz ohne Treffer bleibt die Reise wie bisher
   * unzugeordnet.
   */
  stopsByTripId?: ReadonlyMap<number, readonly CountryStopLike[]>
): CountryStats {
  const byCode = new Map<string, { trips: number; nights: number }>();
  let unassigned = 0;
  const bump = (code: string, nights: number) => {
    const entry = byCode.get(code) ?? { trips: 0, nights: 0 };
    entry.trips += 1;
    entry.nights += nights;
    byCode.set(code, entry);
  };
  for (const trip of trips) {
    const spotName =
      trip.spotId != null ? spotNameById?.get(trip.spotId) : undefined;
    const primary =
      guessCountryCode(
        [trip.location, trip.title, spotName].filter(Boolean).join(" ")
      ) ?? null;
    const stops = trip.id != null ? (stopsByTripId?.get(trip.id) ?? []) : [];
    const nightsByStopCode = new Map<string, number>();
    let strayNights = 0;
    for (const stop of stops) {
      const code = guessCountryCode(stop.name);
      const nights = tripNights(stop.startDate, stop.endDate);
      if (code) {
        nightsByStopCode.set(code, (nightsByStopCode.get(code) ?? 0) + nights);
      } else {
        strayNights += nights;
      }
    }
    if (nightsByStopCode.size === 0) {
      // Wie bisher: die ganze Reise dem geratenen Land – oder ehrlich
      // unzugeordnet.
      if (!primary) {
        unassigned += 1;
        continue;
      }
      bump(primary, tripNights(trip.startDate, trip.endDate));
      continue;
    }
    if (primary) {
      nightsByStopCode.set(
        primary,
        (nightsByStopCode.get(primary) ?? 0) + strayNights
      );
    }
    for (const [code, nights] of Array.from(nightsByStopCode.entries())) {
      bump(code, nights);
    }
  }
  const rows: CountryStatsRow[] = [];
  for (const [code, entry] of Array.from(byCode.entries())) {
    const country = findCountryRules(code);
    if (!country) continue;
    rows.push({
      code,
      flag: country.flag,
      name: country.name,
      trips: entry.trips,
      nights: entry.nights,
    });
  }
  rows.sort((a, b) => b.nights - a.nights || b.trips - a.trips);
  return { rows, unassigned };
}

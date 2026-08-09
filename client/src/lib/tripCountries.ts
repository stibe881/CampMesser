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
  title: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  spotId?: number | null;
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
  spotNameById?: ReadonlyMap<number, string>
): CountryStats {
  const byCode = new Map<string, { trips: number; nights: number }>();
  let unassigned = 0;
  for (const trip of trips) {
    const spotName =
      trip.spotId != null ? spotNameById?.get(trip.spotId) : undefined;
    const code =
      guessCountryCode(
        [trip.location, trip.title, spotName].filter(Boolean).join(" ")
      ) ?? null;
    if (!code) {
      unassigned += 1;
      continue;
    }
    const entry = byCode.get(code) ?? { trips: 0, nights: 0 };
    entry.trips += 1;
    entry.nights += tripNights(trip.startDate, trip.endDate);
    byCode.set(code, entry);
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

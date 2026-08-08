/**
 * Wander-Jahresbilanz (#450): Touren, Kilometer und Höhenmeter pro Jahr
 * aus den gespeicherten Tracks (#220) – die Frage «wie viel sind wir
 * dieses Jahr gewandert?» beantwortet bisher niemand.
 *
 * Reine Funktion für die Statistik-Seite; gerechnet wird mit den bereits
 * serverseitig berechneten Spalten (distanceM, ascentM), nicht mit den
 * Punktreihen. Velo-Touren (#449) zählen zur Bilanz dazu, werden aber
 * getrennt ausgewiesen – 40 Velo-Kilometer sind keine Wander-Kilometer.
 */
import { normalizeTrackActivity } from "./track";

export interface TrackYearLike {
  startedAt: Date | string;
  distanceM: number;
  ascentM: number;
  activity?: string | null;
}

export interface TrackYearRow {
  year: number;
  /** Alle Touren des Jahres (Wandern + Velo). */
  tours: number;
  hikeTours: number;
  bikeTours: number;
  distanceM: number;
  ascentM: number;
}

/** Jahreszeilen, neuste zuoberst; Zeilen ohne lesbares Datum fallen weg. */
export function trackYearRows(
  tracks: readonly TrackYearLike[]
): TrackYearRow[] {
  const byYear = new Map<number, TrackYearRow>();
  for (const track of tracks) {
    const date = new Date(track.startedAt);
    const year = date.getFullYear();
    if (!Number.isFinite(year) || year < 1970) continue;
    let row = byYear.get(year);
    if (!row) {
      row = {
        year,
        tours: 0,
        hikeTours: 0,
        bikeTours: 0,
        distanceM: 0,
        ascentM: 0,
      };
      byYear.set(year, row);
    }
    row.tours += 1;
    if (normalizeTrackActivity(track.activity) === "bike") {
      row.bikeTours += 1;
    } else {
      row.hikeTours += 1;
    }
    row.distanceM += Math.max(0, track.distanceM);
    row.ascentM += Math.max(0, track.ascentM);
  }
  return Array.from(byYear.values()).sort((a, b) => b.year - a.year);
}

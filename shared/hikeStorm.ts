/**
 * Gewitterrisiko für die Wanderung (#391).
 *
 * WAS FEHLTE: Die Umkehrzeit (#379) kennt den Sonnenuntergang – aber in
 * den Bergen ist das Nachmittagsgewitter das zweite, oft frühere Ende
 * des Tages. Die CAPE-Werte liegen stundengenau in der Prognose und
 * wurden nur für die Unwetter-Erkennung am Zeltplatz benutzt (#48).
 * Wer um 10 Uhr startet und um 15 Uhr auf dem Grat steht, hätte es
 * gern VORHER gewusst.
 *
 * DIESELBEN SCHWELLEN WIE DIE UNWETTER-ERKENNUNG: Ein gemeldetes
 * Gewitter (WMO-Code 95/96/99) ist eine Ansage, CAPE über
 * STORM_CAPE_THRESHOLD eine Neigung. Zwei verschiedene eigene Schwellen
 * hiessen, dass das Wetter-Modul warnt und die Wanderkarte schweigt –
 * oder umgekehrt, und beides untergräbt das Vertrauen in beide.
 *
 * NUR DER HEUTIGE TAG: Die Umkehrzeit rechnet für heute, also auch das
 * Gewitter. Und nur die Stunden AB JETZT – das Gewitter von heute
 * Morgen ist vorbei und keine Warnung mehr wert.
 */

/** Dieselbe Schwelle wie in der Unwetter-Erkennung (shared/weather.ts). */
export const STORM_CAPE_THRESHOLD = 1500;

/** Eine Prognosestunde, so weit sie hier zählt. */
export interface StormHour {
  /** Lokale Zeit «2026-08-08T14:00». */
  time: string;
  weatherCode: number;
  cape: number;
}

export type StormKind = "forecast" | "propensity";

export interface StormRisk {
  /** Minuten seit Mitternacht der ersten Risiko-Stunde. */
  minutes: number;
  /** Angesagtes Gewitter oder «nur» labile Schichtung. */
  kind: StormKind;
}

function isThunderCode(code: number): boolean {
  return code === 95 || code === 96 || code === 99;
}

function minutesOf(time: string): number | null {
  const hour = Number(time.slice(11, 13));
  const minute = Number(time.slice(14, 16));
  if (!Number.isFinite(hour)) return null;
  return hour * 60 + (Number.isFinite(minute) ? minute : 0);
}

/**
 * Die erste Risiko-Stunde HEUTE ab jetzt – oder null.
 *
 * Die früheste Stunde gewinnt, nicht die schwerste: Wer um 13 Uhr in
 * die labile Luft läuft, dem hilft es nichts, dass das eigentliche
 * Gewitter erst um 16 Uhr angesagt ist. Trifft beides auf dieselbe
 * Stunde, zählt das angesagte Gewitter.
 */
export function firstStormRisk(
  hours: readonly StormHour[],
  todayIso: string,
  nowMinutes: number
): StormRisk | null {
  for (const hour of hours) {
    if (!hour.time.startsWith(todayIso)) continue;
    const minutes = minutesOf(hour.time);
    if (minutes === null || minutes < nowMinutes) continue;
    if (isThunderCode(hour.weatherCode)) {
      return { minutes, kind: "forecast" };
    }
    if (hour.cape > STORM_CAPE_THRESHOLD) {
      return { minutes, kind: "propensity" };
    }
  }
  return null;
}

/** «14:00» aus Minuten seit Mitternacht. */
export function stormClock(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

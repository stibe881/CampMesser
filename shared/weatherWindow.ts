/**
 * Wetterfenster-Finder (#538): «Wann lohnt sich das nächste
 * Camping-Wochenende?» – bewertet alle Wochenenden innerhalb der
 * 16-Tage-Prognose und sagt ehrlich, welches taugt.
 *
 * Reine Funktionen ohne Abruf: Die Wetterseite füttert die ohnehin
 * geladene Tagesprognose hinein, die Tests füttern Fixtures.
 */

export interface WeekendDayLike {
  /** ISO-Tag (YYYY-MM-DD). */
  date: string;
  tempMaxC: number;
  precipitationSumMm: number;
  precipitationProbabilityMax?: number;
  windGustsMaxKmh?: number;
}

export type WeekendVerdict = "top" | "ok" | "bad";

export interface WeekendWindow {
  saturday: WeekendDayLike;
  sunday: WeekendDayLike;
  /** 0–100; Mittel der beiden Tage. */
  score: number;
  verdict: WeekendVerdict;
  /** Regensumme beider Tage in mm (gerundet). */
  rainMm: number;
  /** Wärmster der beiden Tage (gerundet). */
  tempMaxC: number;
}

/**
 * Ein Tag auf 0–100 Punkte: Regen wiegt am schwersten (nass ist nass),
 * danach Temperatur ausserhalb des Wohlfühlbereichs 15–28 °C, zuletzt
 * Sturmböen. Die Gewichte sind bewusst grob – die Frage ist «lohnt es
 * sich?», nicht «wie viel Grad genau».
 */
function dayScore(day: WeekendDayLike): number {
  let score = 100;
  score -= Math.min(60, day.precipitationSumMm * 10);
  const prob = day.precipitationProbabilityMax ?? 0;
  score -= Math.min(20, Math.max(0, prob - 30) / 3.5);
  if (day.tempMaxC < 15) score -= Math.min(30, (15 - day.tempMaxC) * 3);
  if (day.tempMaxC > 28) score -= Math.min(20, (day.tempMaxC - 28) * 2);
  const gusts = day.windGustsMaxKmh ?? 0;
  if (gusts > 40) score -= Math.min(25, (gusts - 40) / 2);
  return Math.max(0, Math.round(score));
}

/** Wochentag eines ISO-Tags (0 = Sonntag … 6 = Samstag), UTC-stabil. */
function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/**
 * Alle vollständigen Wochenenden (Sa+So) ab heute, bestes zuerst.
 * Ein Wochenende zählt nur, wenn BEIDE Tage noch bevorstehen und in der
 * Prognose liegen – ein halbes Wochenende ist keine Empfehlung.
 */
export function weekendWindows(
  days: readonly WeekendDayLike[],
  todayIso: string
): WeekendWindow[] {
  const byDate = new Map(days.map(d => [d.date, d]));
  const windows: WeekendWindow[] = [];
  for (const day of days) {
    if (weekday(day.date) !== 6 || day.date < todayIso) continue;
    const sundayDate = new Date(`${day.date}T00:00:00Z`);
    sundayDate.setUTCDate(sundayDate.getUTCDate() + 1);
    const sunday = byDate.get(sundayDate.toISOString().slice(0, 10));
    if (!sunday) continue;
    const score = Math.round((dayScore(day) + dayScore(sunday)) / 2);
    windows.push({
      saturday: day,
      sunday,
      score,
      verdict: score >= 75 ? "top" : score >= 50 ? "ok" : "bad",
      rainMm: Math.round(day.precipitationSumMm + sunday.precipitationSumMm),
      tempMaxC: Math.round(Math.max(day.tempMaxC, sunday.tempMaxC)),
    });
  }
  return windows.sort(
    (a, b) =>
      b.score - a.score || a.saturday.date.localeCompare(b.saturday.date)
  );
}

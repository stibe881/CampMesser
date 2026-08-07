/**
 * Tau- und Kondens-Hinweis für die Nacht (#397).
 *
 * DAS NASSE ZELT AM MORGEN ist selten Regen: In einer klaren, windstillen
 * Nacht kühlt das Aussenzelt unter den Taupunkt der Luft, und der Tau
 * schlägt sich innen wie aussen nieder. Wer das am Abend vorher weiss,
 * plant den Abbau nach dem Abtrocknen – oder lässt die Lüfter offen.
 *
 * DER TAUPUNKT WIRD GERECHNET, NICHT GEHOLT: Temperatur und Luftfeuchte
 * stehen längst in der Stundenprognose des Wetter-Moduls; die
 * Magnus-Formel macht daraus den Taupunkt. Ein zusätzliches API-Feld
 * würde nur dieselbe Zahl aus derselben Quelle liefern.
 *
 * EHRLICH ALS ABSCHÄTZUNG: Ob das Zelt wirklich nass wird, hängt auch an
 * Wiese, Senke und Bachnähe – das weiss keine Prognose. Deshalb sagt der
 * Hinweis «wahrscheinlich» und «möglich», nie «wird». Und ohne genügend
 * Nachtstunden in den Daten sagt er gar nichts statt irgendetwas.
 */

/** Taupunkt praktisch erreicht – ab hier schlägt sich Tau nieder. */
export const CONDENSATION_SPREAD_C = 2;
/** Nahe dran: Bei klarer, ruhiger Nacht kühlt das Zelt noch tiefer. */
export const CONDENSATION_NEAR_SPREAD_C = 4;
/** «Klar» heisst: im Mittel höchstens so viel Bewölkung (Prozent). */
export const CLEAR_NIGHT_MAX_CLOUD = 40;
/** «Windstill» heisst: im Mittel höchstens so viel Wind (km/h). */
export const CALM_NIGHT_MAX_WIND_KMH = 10;
/** Unter so vielen Nachtstunden mit Daten wird nichts behauptet. */
export const MIN_NIGHT_HOURS = 6;

/**
 * Taupunkt in °C nach der Magnus-Formel (gültig für den Wetterbereich,
 * in dem gezeltet wird). Ohne brauchbare Luftfeuchte kommt null zurück.
 */
export function dewPointC(
  temperatureC: number,
  humidityPercent: number
): number | null {
  if (!Number.isFinite(temperatureC) || !Number.isFinite(humidityPercent)) {
    return null;
  }
  if (humidityPercent <= 0 || humidityPercent > 100) return null;
  const a = 17.62;
  const b = 243.12;
  const gamma =
    Math.log(humidityPercent / 100) + (a * temperatureC) / (b + temperatureC);
  return (b * gamma) / (a - gamma);
}

/** Eine Stunde, so weit der Hinweis sie braucht. */
export interface CondensationHour {
  /** Lokale Zeit «2026-08-08T23:00». */
  time: string;
  temperatureC: number;
  /** Relative Luftfeuchte in Prozent; fehlt sie, fällt die Stunde weg. */
  humidityPercent?: number;
  cloudCover: number;
  windSpeedKmh: number;
}

export type CondensationLevel = "high" | "possible";

export interface CondensationOutlook {
  level: CondensationLevel;
  /** Kleinster Abstand Temperatur–Taupunkt der Nacht, in °C. */
  minSpreadC: number;
  /** Stunde des kleinsten Abstands («2026-08-09T05:00»). */
  atTime: string;
  clearNight: boolean;
  calmNight: boolean;
}

/** «2026-08-08» → «2026-08-09», über die Kalenderfelder gerechnet. */
function nextIsoDay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const next = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1)
  );
  return next.toISOString().slice(0, 10);
}

/**
 * Der Blick auf die KOMMENDE Nacht: heute 20 Uhr bis morgen 8 Uhr.
 *
 * null heisst «keine Aussage» – zu wenige Nachtstunden mit Luftfeuchte
 * in den Daten – und ausserdem «kein Grund zur Meldung»: Eine Nacht, die
 * weder wahrscheinlich noch möglich nass wird, erzeugt keine Karte. Ein
 * täglicher Kasten «Zelt bleibt trocken» wäre eine Zusage, die die
 * Prognose nicht geben kann.
 */
export function condensationOutlook(
  hours: readonly CondensationHour[],
  todayIso: string
): CondensationOutlook | null {
  const from = `${todayIso}T20:00`;
  const to = `${nextIsoDay(todayIso)}T08:00`;

  let minSpread = Infinity;
  let atTime = "";
  let cloudSum = 0;
  let windSum = 0;
  let count = 0;
  for (const hour of hours) {
    if (hour.time < from || hour.time > to) continue;
    const dew = dewPointC(hour.temperatureC, hour.humidityPercent ?? NaN);
    if (dew === null) continue;
    const spread = hour.temperatureC - dew;
    if (spread < minSpread) {
      minSpread = spread;
      atTime = hour.time;
    }
    cloudSum += hour.cloudCover;
    windSum += hour.windSpeedKmh;
    count++;
  }
  if (count < MIN_NIGHT_HOURS) return null;

  const clearNight = cloudSum / count <= CLEAR_NIGHT_MAX_CLOUD;
  const calmNight = windSum / count <= CALM_NIGHT_MAX_WIND_KMH;
  const radiative = clearNight && calmNight;

  let level: CondensationLevel | null = null;
  if (minSpread <= CONDENSATION_SPREAD_C) {
    // Taupunkt erreicht: bei Abstrahlungswetter sicher genug für
    // «wahrscheinlich», sonst bleibt es ein «möglich».
    level = radiative ? "high" : "possible";
  } else if (minSpread <= CONDENSATION_NEAR_SPREAD_C && radiative) {
    // Die Prognose misst die LUFT in zwei Metern Höhe – das Zeltdach
    // strahlt in einer klaren Nacht ein paar Grad darunter ab.
    level = "possible";
  }
  if (!level) return null;

  return {
    level,
    minSpreadC: Math.round(minSpread * 10) / 10,
    atTime,
    clearNight,
    calmNight,
  };
}

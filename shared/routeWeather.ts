/**
 * Unwetter auf der Fahrtstrecke (#275).
 *
 * Warum das nicht dasselbe ist wie die Warnung am Ziel: Wer um zehn Uhr
 * losfährt und um vier ankommt, fährt sechs Stunden durch Gegenden, für
 * die niemand nachgeschaut hat. Genau dort steht man dann im Hagel – am
 * Ziel ist es derweil schön.
 *
 * DIE ENTSCHEIDENDE IDEE ist deshalb nicht «Wetter entlang der Linie»,
 * sondern «Wetter DANN, WENN ich dort bin»: Für jeden Punkt auf der
 * Strecke wird die voraussichtliche Ankunftszeit geschätzt und genau
 * diese Prognosestunde geprüft. Eine Gewitterzelle, die um 14 Uhr über
 * dem Gotthard steht, interessiert nicht, wenn man um 11 Uhr durchfährt.
 *
 * Die Fahrzeit wird aus der Luftlinie geschätzt und ist damit
 * notgedrungen grob – das steht auch in der Ansicht. Für die Frage
 * «wann ungefähr bin ich wo» reicht es; für eine Minutenplanung nicht.
 */
import {
  RAIN_DANGER_MM,
  RAIN_WARN_MM,
  WIND_DANGER_KMH,
  WIND_WARN_KMH,
  type AlertSeverity,
  type HourlyWeather,
} from "./weather";

/**
 * So viele Punkte werden geprüft. Mehr wäre genauer, kostet aber eine
 * längere Abfrage und macht die Liste unlesbar – acht Punkte bedeuten
 * bei einer Fahrt quer durch die Schweiz rund alle 40 Kilometer einen.
 */
export const MAX_ROUTE_WEATHER_POINTS = 8;

/**
 * Angenommene Reisegeschwindigkeit über Grund in km/h, bezogen auf die
 * LUFTLINIE. Eine Autobahn fährt man mit 100, die Strecke ist aber
 * kurviger als die Luftlinie – 70 km/h trifft die Ankunftszeit über
 * längere Fahrten erfahrungsgemäss besser als jeder Tacho-Wert.
 */
export const ROUTE_SPEED_KMH = 70;

/** Fahrten unter dieser Länge lohnen die Prüfung nicht. */
export const MIN_ROUTE_KM = 20;

/**
 * Aus einer Punktliste gleichmässig auswählen – Anfang und Ende bleiben
 * immer drin, denn Start und Ziel sind die beiden Punkte, an denen man
 * sicher ist.
 */
export function sampleRoutePoints<T>(
  points: readonly T[],
  max = MAX_ROUTE_WEATHER_POINTS
): T[] {
  if (points.length <= max) return points.slice();
  if (max <= 1) return [points[0]];
  const result: T[] = [];
  for (let i = 0; i < max; i++) {
    const index = Math.round((i * (points.length - 1)) / (max - 1));
    result.push(points[index]);
  }
  return result;
}

/**
 * Geschätzte Ankunftszeit an einem Punkt der Strecke, in Millisekunden.
 * `fraction` ist der Anteil der Strecke (0 = Start, 1 = Ziel).
 */
export function etaAt(
  departureMs: number,
  totalKm: number,
  fraction: number,
  speedKmh = ROUTE_SPEED_KMH
): number {
  const clamped = Math.max(0, Math.min(1, fraction));
  const hours = (totalKm * clamped) / speedKmh;
  return departureMs + hours * 3_600_000;
}

/** Geschätzte Gesamtfahrzeit in Minuten. */
export function routeMinutes(
  totalKm: number,
  speedKmh = ROUTE_SPEED_KMH
): number {
  return Math.round((totalKm / speedKmh) * 60);
}

/**
 * Die Prognosestunde, die einem Zeitpunkt am nächsten liegt. Die Zeiten
 * kommen als lokale ISO-Strings ohne Zeitzone aus Open-Meteo; sie werden
 * als Ortszeit gelesen, weil sie das auch sind.
 */
export function hourIndexFor(
  hours: readonly HourlyWeather[],
  targetMs: number
): number | null {
  if (hours.length === 0) return null;
  let best = -1;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < hours.length; i++) {
    const time = new Date(hours[i].time).getTime();
    if (Number.isNaN(time)) continue;
    const delta = Math.abs(time - targetMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  // Mehr als drei Stunden daneben heisst: Für diese Zeit gibt es keine
  // Prognose mehr – dann lieber nichts sagen als etwas Falsches
  if (best === -1 || bestDelta > 3 * 3_600_000) return null;
  return best;
}

export type RouteRiskKind = "gewitter" | "sturm" | "regen" | "schnee";

export interface RouteRisk {
  kind: RouteRiskKind;
  severity: AlertSeverity;
}

/** WMO-Codes für Gewitter. */
const THUNDER_CODES = [95, 96, 99];
/** WMO-Codes für Schnee und Schneeschauer. */
const SNOW_CODES = [71, 73, 75, 77, 85, 86];

/**
 * Das Risiko einer einzelnen Prognosestunde auf der Strecke. Bewusst
 * NICHT `detectAlerts`: Das prüft 48 Stunden und beantwortet die Frage
 * «wird es hier irgendwann ungemütlich». Hier zählt genau die eine
 * Stunde, in der man durchfährt.
 *
 * Die Reihenfolge ist die der Gefährlichkeit am Steuer: Gewitter und
 * Sturm vor Regen, Schnee zählt eigens, weil er auch bei wenig
 * Niederschlag die Strasse verändert.
 */
export function hourRisk(hour: HourlyWeather): RouteRisk | null {
  if (THUNDER_CODES.includes(hour.weatherCode)) {
    return { kind: "gewitter", severity: "gefahr" };
  }
  if (hour.windGustsKmh >= WIND_DANGER_KMH) {
    return { kind: "sturm", severity: "gefahr" };
  }
  if (SNOW_CODES.includes(hour.weatherCode)) {
    return { kind: "schnee", severity: "warnung" };
  }
  if (hour.precipitationMm >= RAIN_DANGER_MM) {
    return { kind: "regen", severity: "gefahr" };
  }
  if (hour.windGustsKmh >= WIND_WARN_KMH) {
    return { kind: "sturm", severity: "warnung" };
  }
  if (hour.precipitationMm >= RAIN_WARN_MM) {
    return { kind: "regen", severity: "warnung" };
  }
  return null;
}

/** Rangfolge der Stufen, damit sich «die schlimmste» bestimmen lässt. */
const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 1,
  warnung: 2,
  gefahr: 3,
};

/** Die schlimmste Stufe einer Liste; null, wenn nichts anliegt. */
export function worstSeverity(
  risks: readonly (RouteRisk | null)[]
): AlertSeverity | null {
  let worst: AlertSeverity | null = null;
  for (const risk of risks) {
    if (!risk) continue;
    if (worst === null || SEVERITY_RANK[risk.severity] > SEVERITY_RANK[worst]) {
      worst = risk.severity;
    }
  }
  return worst;
}

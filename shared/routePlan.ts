/**
 * Route vorher zeichnen (#281): Wegpunkte setzen, Länge, Höhenmeter und
 * Gehzeit schätzen.
 *
 * WARUM: «Sind das zwei Stunden oder vier?» ist die Frage, die am Vorabend
 * über die Wanderung entscheidet – mit Kindern noch mehr als allein. Die
 * Länge auf der Karte abzuschätzen kann man üben; die Gehzeit nicht, weil
 * die Höhenmeter sie dominieren: 8 km flach sind zwei Stunden, 8 km mit
 * 800 Höhenmetern sind vier.
 *
 * GERECHNET wird nach dem in der Schweiz und in Deutschland üblichen
 * Verfahren (SAC bzw. DIN 33466): Horizontal- und Vertikalzeit getrennt,
 * dann die grössere Zeit voll und die kleinere zur Hälfte. Diese
 * Verrechnung sieht seltsam aus, bildet aber ab, dass man im Steilen
 * kaum vorwärtskommt und in der Ebene kaum steigt – die beiden Zeiten
 * überlappen sich also teilweise.
 *
 * PAUSEN sind NICHT enthalten. Das ist die Konvention aller
 * Wanderzeit-Angaben auf gelben Wegweisern, und es ist ehrlicher, als
 * eine Pausenzeit zu erfinden, die niemand einhält.
 */
import { distanceMeters } from "./geo";

/** Ein gesetzter Wegpunkt; `ele` erst nach dem Höhen-Abruf gefüllt. */
export interface RouteWaypoint {
  lat: number;
  lon: number;
  ele: number | null;
}

/** Zwischenpunkt auf der Route (Wegpunkt oder interpolierte Stützstelle). */
export interface RouteSample extends RouteWaypoint {
  /** Strecke vom Start bis hierher, in Metern. */
  distanceM: number;
}

/** Höhenbilanz einer Route. */
export interface RouteElevation {
  ascentM: number;
  descentM: number;
  minM: number;
  maxM: number;
}

/**
 * Höchstzahl gesetzter Wegpunkte. Wer mehr braucht, zeichnet keine Route
 * mehr, sondern kartiert – und die Höhen-Abfrage hat ein eigenes Limit.
 */
export const MAX_ROUTE_WAYPOINTS = 40;

/** Namenslänge wie bei den aufgezeichneten Tracks. */
export const ROUTE_NAME_MAX_LENGTH = 80;

/**
 * Abstand der Höhen-Stützstellen. 200 m ist feiner als das, was ein
 * Höhenmodell hergibt, und grob genug, dass eine Tageswanderung mit den
 * erlaubten 100 Abfragepunkten auskommt.
 */
export const ROUTE_SAMPLE_SPACING_M = 200;

/**
 * Open-Meteo nimmt pro Abfrage 100 Koordinaten entgegen. Bei längeren
 * Routen wird der Abstand entsprechend vergrössert, statt die Route hinten
 * abzuschneiden – lieber grob über die ganze Strecke als genau über die
 * erste Hälfte.
 */
export const MAX_ROUTE_SAMPLES = 100;

/**
 * Schwelle für die Höhenbilanz. Ein Höhenmodell rauscht um ein bis zwei
 * Meter; ohne Schwelle summierten sich daraus über zwanzig Kilometer
 * mehrere hundert Höhenmeter, die es nicht gibt.
 */
export const ROUTE_ELEVATION_THRESHOLD_M = 5;

/** Horizontale Gehgeschwindigkeit in km/h (SAC/DIN-Wert). */
export const ROUTE_SPEED_KMH = 4;

/** Steigleistung in Höhenmetern pro Stunde. */
export const ROUTE_ASCENT_MPH = 300;

/** Abstiegsleistung in Höhenmetern pro Stunde. */
export const ROUTE_DESCENT_MPH = 500;

/** Gehtempo-Vorgaben zur Auswahl: gemütlich, normal, zügig. */
export const ROUTE_PACE_FACTORS = {
  slow: 1.3,
  normal: 1,
  fast: 0.8,
} as const;

export type RoutePace = keyof typeof ROUTE_PACE_FACTORS;

/** Länge der Route in Metern (Luftlinie von Wegpunkt zu Wegpunkt). */
export function routeDistanceM(waypoints: RouteWaypoint[]): number {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += distanceMeters(
      waypoints[i - 1].lat,
      waypoints[i - 1].lon,
      waypoints[i].lat,
      waypoints[i].lon
    );
  }
  return total;
}

/** Punkt auf der Strecke zwischen zwei Wegpunkten (lineare Näherung). */
function interpolate(
  a: RouteWaypoint,
  b: RouteWaypoint,
  fraction: number
): { lat: number; lon: number } {
  return {
    lat: a.lat + (b.lat - a.lat) * fraction,
    lon: a.lon + (b.lon - a.lon) * fraction,
  };
}

/**
 * Stützstellen für den Höhen-Abruf: die gesetzten Wegpunkte plus
 * Zwischenpunkte, damit ein Hügel zwischen zwei Klicks nicht verschwindet.
 *
 * Nur die Wegpunkte abzufragen wäre die naheliegende Lösung und die
 * falsche: Wer zwei Punkte drei Kilometer auseinander setzt, hat dazwischen
 * womöglich einen Sattel – und der ist genau das, was die Gehzeit ausmacht.
 */
export function routeSamples(
  waypoints: RouteWaypoint[],
  maxSamples = MAX_ROUTE_SAMPLES
): RouteSample[] {
  if (waypoints.length === 0) return [];
  if (waypoints.length === 1) {
    return [{ ...waypoints[0], distanceM: 0 }];
  }
  const total = routeDistanceM(waypoints);
  // Abstand so wählen, dass die Abfrage-Grenze eingehalten wird
  const spacing = Math.max(
    ROUTE_SAMPLE_SPACING_M,
    total / Math.max(1, maxSamples - waypoints.length)
  );
  const samples: RouteSample[] = [{ ...waypoints[0], distanceM: 0 }];
  let travelled = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    const legM = distanceMeters(from.lat, from.lon, to.lat, to.lon);
    const steps = Math.floor(legM / spacing);
    for (let s = 1; s <= steps; s++) {
      const fraction = (s * spacing) / legM;
      if (fraction >= 1) break;
      const point = interpolate(from, to, fraction);
      samples.push({
        lat: point.lat,
        lon: point.lon,
        ele: null,
        distanceM: travelled + fraction * legM,
      });
    }
    travelled += legM;
    samples.push({ ...to, distanceM: travelled });
  }
  // Sicherheitsnetz: bleibt trotzdem etwas über der Grenze, gleichmässig
  // ausdünnen statt hinten abschneiden – Start und Ziel bleiben drin
  if (samples.length > maxSamples) {
    const kept: RouteSample[] = [];
    const step = (samples.length - 1) / (maxSamples - 1);
    for (let i = 0; i < maxSamples; i++) {
      kept.push(samples[Math.round(i * step)]);
    }
    return kept;
  }
  return samples;
}

/**
 * Auf- und Abstieg aus den Höhen der Stützstellen. Punkte ohne Höhe
 * werden übersprungen, nicht als 0 gelesen – ein Loch im Höhenmodell darf
 * keinen Absturz auf Meereshöhe erzeugen.
 */
export function routeElevation(
  samples: RouteWaypoint[],
  threshold = ROUTE_ELEVATION_THRESHOLD_M
): RouteElevation | null {
  const heights = samples
    .map(s => s.ele)
    .filter((e): e is number => e !== null && Number.isFinite(e));
  if (heights.length < 2) return null;
  let ascent = 0;
  let descent = 0;
  let reference = heights[0];
  let minM = heights[0];
  let maxM = heights[0];
  for (let i = 1; i < heights.length; i++) {
    const height = heights[i];
    if (height < minM) minM = height;
    if (height > maxM) maxM = height;
    const delta = height - reference;
    if (delta >= threshold) {
      ascent += delta;
      reference = height;
    } else if (delta <= -threshold) {
      descent += -delta;
      reference = height;
    }
  }
  return {
    ascentM: Math.round(ascent),
    descentM: Math.round(descent),
    minM: Math.round(minM),
    maxM: Math.round(maxM),
  };
}

/**
 * Gehzeit in Minuten nach SAC/DIN 33466: Horizontal- und Vertikalzeit
 * getrennt rechnen, dann die grössere voll und die kleinere zur Hälfte
 * nehmen. Ohne Pausen.
 */
export function hikingMinutes(input: {
  distanceM: number;
  ascentM: number;
  descentM: number;
  pace?: RoutePace;
}): number {
  const factor = ROUTE_PACE_FACTORS[input.pace ?? "normal"];
  const horizontalH = input.distanceM / 1000 / ROUTE_SPEED_KMH;
  const verticalH =
    input.ascentM / ROUTE_ASCENT_MPH + input.descentM / ROUTE_DESCENT_MPH;
  const combined =
    Math.max(horizontalH, verticalH) + Math.min(horizontalH, verticalH) / 2;
  return Math.round(combined * 60 * factor);
}

/** Wegpunkte kompakt speichern: [lat, lon, ele | null]. */
export function serializeWaypoints(waypoints: RouteWaypoint[]): string {
  const round = (value: number, digits: number) => {
    const f = Math.pow(10, digits);
    return Math.round(value * f) / f;
  };
  return JSON.stringify(
    waypoints
      .slice(0, MAX_ROUTE_WAYPOINTS)
      .map(w => [
        round(w.lat, 6),
        round(w.lon, 6),
        w.ele === null || !Number.isFinite(w.ele) ? null : round(w.ele, 1),
      ])
  );
}

/** Wegpunkte lesen – kaputte Inhalte ergeben eine leere Route. */
export function parseWaypoints(
  json: string | null | undefined
): RouteWaypoint[] {
  if (!json) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const waypoints: RouteWaypoint[] = [];
  parsed.slice(0, MAX_ROUTE_WAYPOINTS).forEach(entry => {
    if (!Array.isArray(entry)) return;
    const [lat, lon, ele] = entry as unknown[];
    if (typeof lat !== "number" || !Number.isFinite(lat)) return;
    if (typeof lon !== "number" || !Number.isFinite(lon)) return;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
    waypoints.push({
      lat,
      lon,
      ele: typeof ele === "number" && Number.isFinite(ele) ? ele : null,
    });
  });
  return waypoints;
}

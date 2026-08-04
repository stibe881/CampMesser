/**
 * Höhenprofil im Track-Detail (#280): das Diagramm zur aufgezeichneten
 * Wanderung, samt Zwischenzeiten pro Kilometer.
 *
 * Ein GPS-Track hat schnell einige tausend Punkte. Für ein Diagramm auf
 * einem Handy sind das zu viele – nicht wegen der Rechenzeit, sondern
 * weil daraus ein Zackenteppich wird, in dem man nichts mehr sieht.
 * Deshalb wird auf eine feste Zahl Stützstellen AUSGEDÜNNT, und zwar
 * über die zurückgelegte STRECKE und nicht über den Index: Wer zehn
 * Minuten an einem Ort steht, produziert hundert Punkte, die im
 * Höhenprofil nichts zu suchen haben.
 *
 * Die Zwischenzeiten sind das, was man nach einer Wanderung wirklich
 * anschaut: Wo bin ich langsamer geworden, und wo lag das an der
 * Steigung? Deshalb steht neben jedem Kilometer die Zeit UND die
 * Höhendifferenz.
 */
import { distanceMeters } from "./geo";
import { type TrackPoint } from "./track";

/** So viele Stützstellen hat das Diagramm – genug für die Form, wenig genug fürs Auge. */
export const PROFILE_SAMPLE_COUNT = 120;

/** Ein Punkt des Höhenprofils. */
export interface ProfilePoint {
  /** Zurückgelegte Strecke bis hierher, in Metern. */
  distanceM: number;
  /** Höhe in Metern; null, wenn das Gerät keine geliefert hat. */
  elevationM: number | null;
  /** Zeit seit dem Start in Sekunden. */
  elapsedS: number;
}

/** Kumulierte Strecke je Punkt – Grundlage für alles Weitere. */
export function cumulativeDistances(points: readonly TrackPoint[]): number[] {
  const result: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      total += distanceMeters(
        points[i - 1].lat,
        points[i - 1].lon,
        points[i].lat,
        points[i].lon
      );
    }
    result.push(total);
  }
  return result;
}

/**
 * Das Höhenprofil: `PROFILE_SAMPLE_COUNT` Stützstellen, gleichmässig
 * über die STRECKE verteilt. Zu jeder Stützstelle wird der Punkt
 * genommen, dessen kumulierte Strecke am nächsten liegt.
 */
export function elevationProfile(
  points: readonly TrackPoint[],
  samples = PROFILE_SAMPLE_COUNT
): ProfilePoint[] {
  if (points.length === 0) return [];
  const distances = cumulativeDistances(points);
  const totalM = distances[distances.length - 1];
  const startT = points[0].t;

  const toProfile = (index: number): ProfilePoint => ({
    distanceM: distances[index],
    elevationM: points[index].ele,
    elapsedS: Math.max(0, Math.round((points[index].t - startT) / 1000)),
  });

  if (points.length <= samples || totalM <= 0) {
    return points.map((_, i) => toProfile(i));
  }

  const result: ProfilePoint[] = [];
  let cursor = 0;
  for (let i = 0; i < samples; i++) {
    const targetM = (i * totalM) / (samples - 1);
    while (cursor < distances.length - 1 && distances[cursor] < targetM) {
      cursor++;
    }
    result.push(toProfile(cursor));
  }
  return result;
}

/** Eine Kilometer-Zwischenzeit. */
export interface Split {
  /** Nummer des Kilometers (1 = erster Kilometer). */
  km: number;
  /** Dauer dieses Kilometers in Sekunden. */
  seconds: number;
  /** Höhengewinn auf diesem Kilometer, in Metern. */
  ascentM: number;
  /** Höhenverlust auf diesem Kilometer, in Metern (positive Zahl). */
  descentM: number;
  /** Ist der Kilometer vollständig, oder endet der Track mittendrin? */
  complete: boolean;
}

/**
 * Zwischenzeiten pro Kilometer. Ein angebrochener letzter Kilometer wird
 * mitgeliefert, aber als `complete: false` gekennzeichnet – ihn
 * wegzulassen wäre unehrlich, ihn als vollen Kilometer zu zeigen
 * ebenfalls.
 *
 * Auf- und Abstieg werden hier OHNE Glättung gerechnet: Über einen
 * Kilometer summiert sich das GPS-Rauschen weit weniger auf als über
 * einen ganzen Track, und die Zahl soll zur angezeigten Höhenlinie
 * passen.
 */
export function kilometerSplits(points: readonly TrackPoint[]): Split[] {
  if (points.length < 2) return [];
  const distances = cumulativeDistances(points);
  const totalM = distances[distances.length - 1];
  if (totalM < 1) return [];

  const splits: Split[] = [];
  let startIndex = 0;
  const kmCount = Math.ceil(totalM / 1000);

  for (let km = 1; km <= kmCount; km++) {
    const targetM = km * 1000;
    let endIndex = startIndex;
    while (endIndex < distances.length - 1 && distances[endIndex] < targetM) {
      endIndex++;
    }

    let ascentM = 0;
    let descentM = 0;
    for (let i = startIndex + 1; i <= endIndex; i++) {
      const prev = points[i - 1].ele;
      const cur = points[i].ele;
      if (prev === null || cur === null) continue;
      const delta = cur - prev;
      if (delta > 0) ascentM += delta;
      else descentM -= delta;
    }

    splits.push({
      km,
      seconds: Math.max(
        0,
        Math.round((points[endIndex].t - points[startIndex].t) / 1000)
      ),
      ascentM: Math.round(ascentM),
      descentM: Math.round(descentM),
      complete: distances[endIndex] >= targetM,
    });
    startIndex = endIndex;
  }
  return splits;
}

/**
 * Höchster und tiefster Punkt des Tracks – für die Achsenbeschriftung
 * und die Kennzahlen über dem Diagramm. Ohne jede Höhenangabe: null.
 */
export function elevationRange(
  points: readonly TrackPoint[]
): { minM: number; maxM: number } | null {
  const values = points
    .map(p => p.ele)
    .filter((e): e is number => e !== null && Number.isFinite(e));
  if (values.length === 0) return null;
  return { minM: Math.min(...values), maxM: Math.max(...values) };
}

/** Hat der Track überhaupt brauchbare Höhenangaben? */
export function hasElevation(points: readonly TrackPoint[]): boolean {
  return points.some(p => p.ele !== null && Number.isFinite(p.ele));
}

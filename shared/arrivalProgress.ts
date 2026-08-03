/**
 * «Wie weit noch?» (#242): Fortschritt einer Anfahrt und die
 * Zwischenziel-Meilensteine. Reine Funktionen auf Koordinaten – Client und
 * Tests rechnen damit dasselbe (Muster shared/track.ts).
 *
 * EHRLICHKEIT ZUERST: Gerechnet wird ausschliesslich mit der LUFTLINIE.
 * Die Strasse ist immer länger, und über einen Pass ist sie viel länger.
 * Die Oberfläche schreibt das an jeder Stelle dazu; hier steht es, damit
 * niemand die Zahlen für eine Navigation hält.
 *
 * Der Fortschritt ist nicht einfach «Distanz zum Ziel», sondern der Anteil
 * der Start-Ziel-Strecke, der hinter uns liegt: die Projektion des Vektors
 * Start→Jetzt auf die Achse Start→Ziel, über den Kosinussatz aus den drei
 * Distanzen. Das hat drei Eigenschaften, die auf dem Rücksitz zählen:
 *
 * 1. Wer in die falsche Richtung losfährt, kommt nicht «voran» – der Wert
 *    wird negativ und die Anzeige bleibt bei 0 %.
 * 2. Ein Umweg quer zur Achse (Stau-Umfahrung, Mittagspause im Nachbardorf)
 *    lässt den Balken stehen, statt ihn springen zu lassen.
 * 3. Wer über das Ziel hinausschiesst (Ausfahrt verpasst), kommt rechnerisch
 *    über 100 % – angezeigt wird gekappt 100 %, damit kein Kind fragt, warum
 *    es 112 % geschafft hat und trotzdem nicht da ist.
 *
 * Die Distanzen kommen aus shared/geo.ts (Haversine). Der Kosinussatz ist
 * eine ebene Formel auf kugeligen Distanzen – auf den paar hundert
 * Kilometern einer Anreise ist der Fehler weit kleiner als die Ungenauigkeit
 * der sparsamen Standortmessung.
 */
import { distanceMeters } from "./geo";

/** Ein Punkt auf der Erde, wie ihn die Geolocation-API liefert. */
export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Bei diesen Prozentwerten wird gefeiert. */
export const ARRIVAL_MILESTONES: number[] = [25, 50, 75];

/** Ab dieser Entfernung zum Ziel gilt die Fahrt als angekommen (Meter). */
export const ARRIVED_RADIUS_M = 300;

export interface ArrivalProgress {
  /** Luftlinie Start → Ziel in Metern. */
  totalM: number;
  /** Luftlinie Jetzt → Ziel in Metern (das «noch»). */
  remainingM: number;
  /** Zurückgelegter Anteil der Luftlinie in Metern (auf 0 begrenzt). */
  coveredM: number;
  /** Fortschritt in Prozent, gekappt auf 0–100. */
  percent: number;
  /** Ungekappter Fortschritt – negativ beim Rückwärtsfahren, über 100 beim Überschiessen. */
  rawPercent: number;
  /** Ziel praktisch erreicht (innerhalb ARRIVED_RADIUS_M). */
  arrived: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Fortschritt einer Anfahrt bestimmen. Start und Ziel identisch (oder nur
 * ein paar Meter auseinander) heisst: schon da – 100 %, sonst würde durch
 * null geteilt.
 */
export function arrivalProgress(
  start: GeoPoint,
  current: GeoPoint,
  target: GeoPoint
): ArrivalProgress {
  const totalM = distanceMeters(start.lat, start.lon, target.lat, target.lon);
  const remainingM = distanceMeters(
    current.lat,
    current.lon,
    target.lat,
    target.lon
  );
  if (totalM <= 0) {
    return {
      totalM: 0,
      remainingM,
      coveredM: 0,
      percent: 100,
      rawPercent: 100,
      arrived: remainingM <= ARRIVED_RADIUS_M,
    };
  }
  const fromStartM = distanceMeters(
    start.lat,
    start.lon,
    current.lat,
    current.lon
  );
  // Kosinussatz: Projektion von Start→Jetzt auf die Achse Start→Ziel
  const projectedM =
    (totalM * totalM + fromStartM * fromStartM - remainingM * remainingM) /
    (2 * totalM);
  const rawPercent = (projectedM / totalM) * 100;
  return {
    totalM,
    remainingM,
    coveredM: Math.max(0, projectedM),
    percent: clamp(rawPercent, 0, 100),
    rawPercent,
    arrived: remainingM <= ARRIVED_RADIUS_M,
  };
}

/**
 * Welche Meilensteine wurden gerade überschritten? Verglichen wird gegen den
 * HÖCHSTEN bisher erreichten Wert, nicht gegen den letzten – sonst feiert
 * die App bei jedem Zickzack im GPS-Signal die 50 % noch einmal.
 */
export function crossedMilestones(
  previousPercent: number,
  currentPercent: number
): number[] {
  if (!(currentPercent > previousPercent)) return [];
  return ARRIVAL_MILESTONES.filter(
    milestone => previousPercent < milestone && currentPercent >= milestone
  );
}

/** Der höchste bisher erreichte Fortschritt (Meilensteine bleiben verdient). */
export function highestPercent(
  previousPercent: number,
  currentPercent: number
): number {
  return Math.max(previousPercent, currentPercent, 0);
}

/** Schon erreichte Meilensteine – für die Markierungen auf dem Balken. */
export function reachedMilestones(percent: number): number[] {
  return ARRIVAL_MILESTONES.filter(milestone => percent >= milestone);
}

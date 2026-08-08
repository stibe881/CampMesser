/**
 * Wanderungs-Aufzeichnung (#220): reine Rechen- und Formatier-Logik für
 * GPS-Tracks. Bewusst ohne Browser-APIs und ohne Seiteneffekte, damit
 * Client (Live-Anzeige), Server (gespeicherte Statistik) und Tests exakt
 * dieselben Zahlen erzeugen.
 *
 * Zwei Dinge machen rohe GPS-Daten unbrauchbar, wenn man sie nicht
 * behandelt:
 *
 * 1. RAUSCHEN. Ein still liegendes Handy «wandert» je nach Empfang um ein
 *    paar Meter pro Sekunde. Ungefiltert summiert sich das auf mehrere
 *    Kilometer pro Stunde Pause. Deshalb wird jeder Punkt vor der Aufnahme
 *    durch `evaluateTrackPoint()` geschickt: zu ungenau, zu nah am letzten
 *    Punkt oder unplausibel schnell → verworfen.
 * 2. HÖHEN-ZITTERN. Die GPS-Höhe schwankt selbst im Stand um ±5 bis 10 m.
 *    `trackStats()` zählt deshalb erst dann Höhenmeter, wenn sich die Höhe
 *    um mehr als `TRACK_ELEVATION_THRESHOLD_M` gegenüber dem letzten
 *    gewerteten Niveau verändert hat (klassische Hysterese-Glättung).
 *
 * Pausen: Liegen zwischen zwei Punkten mehr als `TRACK_PAUSE_GAP_MS`, gilt
 * die Lücke als Pause (angehalten, Empfang weg, App geschlossen). Weder die
 * Zeit noch die Luftlinie über die Lücke fliessen in die Statistik ein – der
 * echte Weg dazwischen ist ja unbekannt.
 */

import { distanceMeters } from "./geo";
import { localDay } from "./localDate";

/** Ein aufgezeichneter Punkt: Position, Höhe (m ü. M., null = unbekannt), Zeit (ms seit Epoch). */
export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
  t: number;
}

/** Statistik einer Aufzeichnung – Grundlage für Live-Anzeige und Trackliste. */
export interface TrackStats {
  /** Zurückgelegte Strecke in Metern (Pausen-Lücken nicht mitgezählt). */
  distanceM: number;
  /** Reine Bewegungszeit in Sekunden (Pausen-Lücken nicht mitgezählt). */
  durationS: number;
  /** Summierter Aufstieg in Metern (geglättet). */
  ascentM: number;
  /** Summierter Abstieg in Metern (geglättet). */
  descentM: number;
  /** Durchschnittstempo in km/h; 0, solange keine Zeit gelaufen ist. */
  avgSpeedKmh: number;
}

/** Schlechtere Genauigkeit als das verwerfen wir – typische Zäune sind 10–30 m. */
export const TRACK_MAX_ACCURACY_M = 40;

/** Näher als das am letzten Punkt zählt als Stehen (reines Rauschen). */
export const TRACK_MIN_DISTANCE_M = 5;

/** Schneller als das geht zu Fuss nicht (28.8 km/h) – Sprung im Signal. */
export const TRACK_MAX_SPEED_MPS = 8;

/** Ab dieser Lücke gilt die Zeit als Pause und wird nicht mitgerechnet. */
export const TRACK_PAUSE_GAP_MS = 120_000;

/** Höhenänderungen unter dieser Schwelle sind GPS-Zittern, keine Höhenmeter. */
export const TRACK_ELEVATION_THRESHOLD_M = 4;

/** Obergrenze gespeicherter Punkte (~20 Std. bei einem Punkt alle 4 Sekunden). */
export const MAX_TRACK_POINTS = 20_000;

/** Maximale Länge eines Track-Namens. */
export const TRACK_NAME_MAX_LENGTH = 80;

/**
 * Aktivitätstyp pro Track (#449): Wandern oder Velo. Mehr Arten gäbe es
 * immer («Trailrunning», «SUP» …) – aber beim Camping sind es diese zwei,
 * und jede weitere verwässert die Jahresbilanz (#450).
 */
export const TRACK_ACTIVITIES = ["hike", "bike"] as const;
export type TrackActivity = (typeof TRACK_ACTIVITIES)[number];

/** Unbekannte Werte (alte Zeilen, kaputte Daten) gelten als Wanderung. */
export function normalizeTrackActivity(
  value: string | null | undefined
): TrackActivity {
  return (TRACK_ACTIVITIES as readonly string[]).includes(value ?? "")
    ? (value as TrackActivity)
    : "hike";
}

/**
 * Gesamtzeit vom ersten bis zum letzten Punkt in Sekunden (#480) – im
 * Gegensatz zur Bewegungszeit (`durationS`) MIT allen Pausen. Beide Zahlen
 * nebeneinander zeigen ehrlich, wie viel des Tages Rast war.
 */
export function totalTimeS(points: readonly TrackPoint[]): number {
  if (points.length < 2) return 0;
  return Math.max(
    0,
    Math.round((points[points.length - 1].t - points[0].t) / 1000)
  );
}

/**
 * Ab diesem Bewegungs-Schnitt ist es kein Wandern mehr: zügige Wanderer
 * schaffen 6 km/h, gemütliche Velofahrten beginnen darüber.
 */
export const TRACK_BIKE_GUESS_KMH = 8;

/**
 * Aktivität aus dem Schnitt-Tempo raten – für Tracks, die ohne Angabe
 * gespeichert werden (z. B. GPX-Import mit echten Zeitstempeln). Ohne
 * Bewegungszeit bleibt es eine Wanderung; wer es besser weiss, stellt
 * es beim Track um.
 */
export function guessTrackActivity(
  distanceM: number,
  durationS: number
): TrackActivity {
  if (durationS <= 0 || distanceM <= 0) return "hike";
  const kmh = (distanceM / durationS) * 3.6;
  return kmh >= TRACK_BIKE_GUESS_KMH ? "bike" : "hike";
}

/**
 * Höchstzahl Punkte in der ÖFFENTLICHEN Ansicht einer geteilten Wanderung
 * (#282). Eine Tageswanderung hat schnell zehntausend Punkte; die über das
 * Mobilnetz zu schicken, damit jemand eine Linie und ein Höhenprofil
 * anschaut, wäre Verschwendung – sichtbar ist der Unterschied nicht.
 */
export const SHARED_TRACK_MAX_POINTS = 2000;

/**
 * Punktreihe gleichmässig ausdünnen (#282). Der letzte Punkt bleibt IMMER
 * erhalten: Ohne ihn endete die Linie irgendwo kurz vor dem Ziel, und genau
 * das Ende schaut man sich an. Kürzere Reihen kommen unverändert zurück.
 */
export function thinTrackPoints(
  points: TrackPoint[],
  maxPoints = SHARED_TRACK_MAX_POINTS
): TrackPoint[] {
  if (maxPoints < 2 || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}

/**
 * Urteil über einen neuen Messpunkt.
 * - `ok`: aufnehmen
 * - `invalid`: unbrauchbare Koordinaten/Zeit
 * - `inaccurate`: Genauigkeit schlechter als `TRACK_MAX_ACCURACY_M`
 * - `stale`: nicht neuer als der letzte Punkt (doppelte Meldung)
 * - `tooClose`: weniger als `TRACK_MIN_DISTANCE_M` bewegt → Rauschen
 * - `implausible`: Sprung, der zu Fuss nicht möglich ist
 */
export type TrackPointVerdict =
  "ok" | "invalid" | "inaccurate" | "stale" | "tooClose" | "implausible";

/** Ein Messpunkt, wie ihn die Geolocation-API liefert (nur das Nötige). */
export interface TrackFix {
  lat: number;
  lon: number;
  ele: number | null;
  t: number;
  /** Horizontale Genauigkeit in Metern (Geolocation `coords.accuracy`). */
  accuracyM: number | null;
}

/**
 * Soll der Messpunkt in die Aufzeichnung? `last` ist der zuletzt AUFGENOMMENE
 * Punkt (null beim ersten Punkt).
 *
 * Ein grosser Sprung nach einer langen Lücke gilt bewusst NICHT als
 * unplausibel: Wer die App zwei Minuten schliesst oder unter einer Felswand
 * den Empfang verliert, ist danach schlicht woanders. Die Lücke rechnet
 * `trackStats()` ohnehin heraus.
 */
export function evaluateTrackPoint(
  last: TrackPoint | null,
  fix: TrackFix
): TrackPointVerdict {
  if (
    !Number.isFinite(fix.lat) ||
    !Number.isFinite(fix.lon) ||
    Math.abs(fix.lat) > 90 ||
    Math.abs(fix.lon) > 180 ||
    !Number.isFinite(fix.t)
  ) {
    return "invalid";
  }
  if (fix.accuracyM === null || !Number.isFinite(fix.accuracyM)) {
    return "inaccurate";
  }
  if (fix.accuracyM > TRACK_MAX_ACCURACY_M) return "inaccurate";
  if (!last) return "ok";
  if (fix.t <= last.t) return "stale";
  const dist = distanceMeters(last.lat, last.lon, fix.lat, fix.lon);
  if (dist < TRACK_MIN_DISTANCE_M) return "tooClose";
  const gapMs = fix.t - last.t;
  if (gapMs < TRACK_PAUSE_GAP_MS && dist / (gapMs / 1000) > TRACK_MAX_SPEED_MPS)
    return "implausible";
  return "ok";
}

/** Bequemer Kurzschluss: `evaluateTrackPoint(...) === "ok"`. */
export function shouldAppendPoint(
  last: TrackPoint | null,
  fix: TrackFix
): boolean {
  return evaluateTrackPoint(last, fix) === "ok";
}

/**
 * Geglättete Höhenmeter: Aufstieg und Abstieg werden erst gebucht, wenn die
 * Höhe die Schwelle gegenüber dem letzten gewerteten Niveau überschreitet.
 * Punkte ohne Höhenangabe werden übersprungen (sie unterbrechen die Reihe
 * nicht – die Schwelle gilt zum letzten BEKANNTEN Niveau).
 */
function elevationChange(
  points: TrackPoint[],
  thresholdM: number
): { ascentM: number; descentM: number } {
  let ascentM = 0;
  let descentM = 0;
  let reference: number | null = null;
  points.forEach(p => {
    if (p.ele === null || !Number.isFinite(p.ele)) return;
    if (reference === null) {
      reference = p.ele;
      return;
    }
    const delta = p.ele - reference;
    if (delta >= thresholdM) {
      ascentM += delta;
      reference = p.ele;
    } else if (delta <= -thresholdM) {
      descentM += -delta;
      reference = p.ele;
    }
  });
  return { ascentM, descentM };
}

/**
 * Statistik einer Punktreihe. 0 oder 1 Punkt ergeben lauter Nullen –
 * eine Aufzeichnung ohne zweiten Punkt hat weder Strecke noch Dauer.
 * Die Punkte werden in der übergebenen Reihenfolge gelesen (chronologisch).
 */
export function trackStats(points: TrackPoint[]): TrackStats {
  const clean = points.filter(
    p =>
      p &&
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lon) &&
      Number.isFinite(p.t)
  );
  if (clean.length < 2) {
    return {
      distanceM: 0,
      durationS: 0,
      ascentM: 0,
      descentM: 0,
      avgSpeedKmh: 0,
    };
  }
  let distanceM = 0;
  let durationMs = 0;
  for (let i = 1; i < clean.length; i++) {
    const prev = clean[i - 1];
    const cur = clean[i];
    const gapMs = cur.t - prev.t;
    // Rückwärts laufende Zeitstempel und Pausen-Lücken überspringen:
    // der Weg dazwischen ist unbekannt, also zählt er auch nicht mit.
    if (gapMs <= 0 || gapMs > TRACK_PAUSE_GAP_MS) continue;
    distanceM += distanceMeters(prev.lat, prev.lon, cur.lat, cur.lon);
    durationMs += gapMs;
  }
  const durationS = Math.round(durationMs / 1000);
  const { ascentM, descentM } = elevationChange(
    clean,
    TRACK_ELEVATION_THRESHOLD_M
  );
  return {
    distanceM: Math.round(distanceM),
    durationS,
    ascentM: Math.round(ascentM),
    descentM: Math.round(descentM),
    avgSpeedKmh: durationS > 0 ? (distanceM / durationS) * 3.6 : 0,
  };
}

/**
 * Dauer als «1:23:45» bzw. «23:45» (ohne Stunden). Negative oder
 * unbrauchbare Werte werden als 0 dargestellt.
 */
export function formatTrackDuration(seconds: number): string {
  const total =
    Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// ── Speicherformat ────────────────────────────────────────────────────────

/**
 * Punkte kompakt als Tupel-Array speichern: `[[lat, lon, ele|null, t], …]`.
 * Objekte mit Schlüsseln wären pro Punkt rund dreimal so gross – bei
 * tausenden Punkten je Wanderung macht das den Unterschied zwischen einer
 * schlanken und einer unnötig aufgeblähten Spalte.
 * Koordinaten auf 6 Nachkommastellen (≈ 0.1 m), Höhe auf 1 Nachkommastelle.
 */
export function serializeTrackPoints(points: TrackPoint[]): string {
  const round = (v: number, digits: number) => {
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
  };
  const tuples = points
    .slice(0, MAX_TRACK_POINTS)
    .map(p => [
      round(p.lat, 6),
      round(p.lon, 6),
      p.ele === null || !Number.isFinite(p.ele) ? null : round(p.ele, 1),
      Math.round(p.t),
    ]);
  return JSON.stringify(tuples);
}

/**
 * Punkte aus der Spalte lesen – robust gegen kaputte Inhalte (leeres Array)
 * und gegen beide Schreibweisen (Tupel und Objekte).
 */
export function parseTrackPoints(
  json: string | null | undefined,
  maxPoints = MAX_TRACK_POINTS
): TrackPoint[] {
  if (!json) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const points: TrackPoint[] = [];
  parsed.slice(0, maxPoints).forEach(entry => {
    if (Array.isArray(entry)) {
      const [lat, lon, ele, t] = entry as unknown[];
      if (typeof lat !== "number" || typeof lon !== "number") return;
      if (typeof t !== "number" || !Number.isFinite(t)) return;
      points.push({
        lat,
        lon,
        ele: typeof ele === "number" && Number.isFinite(ele) ? ele : null,
        t,
      });
      return;
    }
    if (typeof entry !== "object" || entry === null) return;
    const p = entry as Partial<TrackPoint>;
    if (typeof p.lat !== "number" || typeof p.lon !== "number") return;
    if (typeof p.t !== "number" || !Number.isFinite(p.t)) return;
    points.push({
      lat: p.lat,
      lon: p.lon,
      ele: typeof p.ele === "number" && Number.isFinite(p.ele) ? p.ele : null,
      t: p.t,
    });
  });
  return points;
}

// ── GPX-Export ────────────────────────────────────────────────────────────

/** XML-Sonderzeichen im Track-Namen entschärfen. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GPX 1.1 als reiner String – so bleibt der Export ohne Bibliothek testbar
 * und funktioniert offline. Zeitstempel als UTC-ISO (GPX-Vorgabe), Höhen nur
 * dort, wo sie bekannt sind.
 */
export function buildGpx(options: {
  name: string;
  points: TrackPoint[];
  /** Zeitpunkt im Kopf der Datei; Standard: Zeit des ersten Punkts. */
  createdAt?: Date;
}): string {
  const { name, points } = options;
  const created =
    options.createdAt ??
    (points.length > 0 ? new Date(points[0].t) : new Date(0));
  const head = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="CampMesser" xmlns="http://www.topografix.com/GPX/1/1">',
    "  <metadata>",
    `    <name>${escapeXml(name)}</name>`,
    `    <time>${new Date(created).toISOString()}</time>`,
    "  </metadata>",
    "  <trk>",
    `    <name>${escapeXml(name)}</name>`,
    "    <trkseg>",
  ];
  const body = points.map(p => {
    const parts = [
      `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}">`,
    ];
    if (p.ele !== null && Number.isFinite(p.ele)) {
      parts.push(`        <ele>${p.ele.toFixed(1)}</ele>`);
    }
    parts.push(`        <time>${new Date(p.t).toISOString()}</time>`);
    parts.push("      </trkpt>");
    return parts.join("\n");
  });
  const tail = ["    </trkseg>", "  </trk>", "</gpx>", ""];
  return [...head, ...body, ...tail].join("\n");
}

/** Dateiname für den GPX-Export: Sonderzeichen raus, Datum dran. */
export function gpxFileName(name: string, startedAt: Date): string {
  const slug =
    name
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "wanderung";
  const date = new Date(startedAt);
  // Lokaler Tag: Eine Wanderung, die um 00:30 startet, gehört in die
  // Datei des NEUEN Tages – über UTC hiesse sie nach gestern.
  const iso = Number.isFinite(date.getTime()) ? localDay(date) : "0000-00-00";
  return `${iso}-${slug}.gpx`;
}

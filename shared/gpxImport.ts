/**
 * GPX-Import (#426): fremde Aufzeichnungen und geplante Routen (Komoot,
 * Garmin & Co.) als Wanderung übernehmen. Der Export existiert seit
 * #220/#282 (buildGpx) – die Gegenrichtung fehlte.
 *
 * GEPARST WIRD MIT REGEX, NICHT MIT EINEM XML-BAUM: Die Funktion läuft
 * auch in den Node-Tests (kein DOMParser), und GPX-Dateien aus echten
 * Programmen halten sich eng genug an das Schema. Unlesbares ergibt
 * null statt eines halben Tracks.
 *
 * PUNKTE OHNE ZEITSTEMPEL (typisch für geplante Routen): Die Zeiten
 * werden aus 4 km/h Gehtempo hergeleitet – dieselbe Faustregel wie bei
 * der Routen-Gehzeit (#281). Eine erfundene 1-Sekunde-Taktung ergäbe
 * absurde Tempi; die Herleitung ergibt wenigstens eine plausible Dauer.
 */
import { MAX_TRACK_POINTS, thinTrackPoints, type TrackPoint } from "./track";
import { distanceMeters } from "./geo";

/** Gehtempo für hergeleitete Zeitstempel (km/h). */
export const GPX_IMPORT_WALK_KMH = 4;
/** Obergrenze der Dateigrösse – dahinter steckt kein Wanderweg mehr. */
export const GPX_IMPORT_MAX_BYTES = 10 * 1024 * 1024;

export interface GpxImportResult {
  name: string | null;
  points: TrackPoint[];
  /** Zeiten aus dem Gehtempo hergeleitet (Datei ohne Zeitstempel)? */
  timesEstimated: boolean;
}

const POINT_RE =
  /<(?:trkpt|rtept)\b[^>]*lat="(-?[\d.]+)"[^>]*lon="(-?[\d.]+)"[^>]*(?:\/>|>([\s\S]*?)<\/(?:trkpt|rtept)>)/g;

function readTag(body: string | undefined, tag: string): string | null {
  if (!body) return null;
  const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(body);
  return match ? match[1].trim() : null;
}

export function parseGpx(xml: string, nowMs: number): GpxImportResult | null {
  if (!xml.includes("<gpx")) return null;
  // Modulweite /g-Regex: lastIndex zurücksetzen, falls ein früherer
  // Aufruf über die Punkt-Obergrenze hinaus abgebrochen hat.
  POINT_RE.lastIndex = 0;

  const raw: {
    lat: number;
    lon: number;
    ele: number | null;
    t: number | null;
  }[] = [];
  let match: RegExpExecArray | null;
  while ((match = POINT_RE.exec(xml)) !== null) {
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const ele = Number(readTag(match[3], "ele"));
    const time = readTag(match[3], "time");
    const parsed = time ? Date.parse(time) : NaN;
    raw.push({
      lat,
      lon,
      ele: Number.isFinite(ele) ? ele : null,
      t: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
    });
    if (raw.length >= MAX_TRACK_POINTS * 2) break;
  }
  if (raw.length < 2) return null;

  // Zeiten: Nur wenn ALLE Punkte einen aufsteigenden Zeitstempel tragen,
  // gelten die echten – gemischte Dateien wären in sich widersprüchlich.
  let timesEstimated = false;
  let usable = raw.every(
    (point, i) => point.t !== null && (i === 0 || point.t > (raw[i - 1].t ?? 0))
  );
  if (!usable) {
    timesEstimated = true;
    const speedMps = (GPX_IMPORT_WALK_KMH * 1000) / 3600;
    let t = nowMs;
    for (let i = 0; i < raw.length; i += 1) {
      if (i > 0) {
        const gap = distanceMeters(
          raw[i - 1].lat,
          raw[i - 1].lon,
          raw[i].lat,
          raw[i].lon
        );
        t += Math.max(1000, Math.round((gap / speedMps) * 1000));
      }
      raw[i].t = t;
    }
  }

  const points = thinTrackPoints(
    raw.map(point => ({
      lat: point.lat,
      lon: point.lon,
      ele: point.ele,
      t: point.t as number,
    })),
    MAX_TRACK_POINTS
  );
  const name = readTag(xml, "name");
  return { name: name || null, points, timesEstimated };
}

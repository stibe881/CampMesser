/**
 * ISS-Überflüge (#222): sichtbare Überflüge der Raumstation für einen Ort.
 *
 * Die Bahnrechnung (SGP4) macht bewusst NICHT diese Datei – sie kommt von
 * einer freien, schlüssellosen Schnittstelle (api.g7vrd.co.uk), die aus den
 * TLE-Bahndaten alle GEOMETRISCH möglichen Überflüge liefert. Hier steckt
 * alles, was danach kommt und was die Schnittstelle nicht kann:
 *
 * - `parseIssPasses` liest die Antwort defensiv,
 * - `culminationAzimuth` ergänzt die fehlende Richtung des Höchststands,
 * - `isPassVisible` entscheidet, ob ein Überflug überhaupt SICHTBAR ist
 *   (dunkel am Boden, Station noch in der Sonne),
 * - `estimateMagnitude` schätzt die Helligkeit aus der Gipfelhöhe.
 *
 * Alles reine Logik ohne DOM und ohne Netz – testbar in server/iss.test.ts.
 */
import { getSunPosition } from "../client/src/lib/sun";
import { compassDirection } from "./solar";
import type { Language } from "./i18n";

/** NORAD-Katalognummer der Internationalen Raumstation. */
export const ISS_NORAD_ID = 25544;

/** Mittlere Bahnhöhe der ISS in Kilometern (schwankt um ±20 km). */
export const ISS_ALTITUDE_KM = 420;

/** Mittlerer Erdradius in Kilometern (passend zu shared/geo.ts). */
const EARTH_RADIUS_KM = 6371;

/**
 * Mindesthöhe über dem Horizont, ab der ein Überflug abgefragt wird. Tiefer
 * verschwindet die Station ohnehin hinter Bäumen, Häusern und Bergen.
 */
export const ISS_MIN_ELEVATION_DEG = 10;

/** Vorhersage-Zeitraum in Stunden (die Schnittstelle liefert höchstens ein paar Tage). */
export const ISS_FORECAST_HOURS = 96;

/**
 * Sonnenhöhe, ab der es am Boden dunkel genug ist: das Ende der bürgerlichen
 * Dämmerung. Darüber überstrahlt der Himmel selbst die helle ISS.
 */
export const ISS_DARK_SUN_ALTITUDE_DEG = -6;

/**
 * Standardhelligkeit der ISS: scheinbare Grösse bei 1000 km Entfernung und
 * etwa halb beleuchteter Station (gebräuchlicher Richtwert der Satelliten-
 * Beobachtung).
 */
const ISS_STANDARD_MAGNITUDE = -1.8;

/** Ein Überflug, so wie ihn die Schnittstelle liefert (rein geometrisch). */
export interface RawIssPass {
  /** Aufgang über der Mindesthöhe (ms seit Epoch) */
  startMs: number;
  /** Höchststand (ms seit Epoch) */
  culminationMs: number;
  /** Untergang (ms seit Epoch) */
  endMs: number;
  /** Azimut beim Aufgang in Grad (0 = Nord, im Uhrzeigersinn) */
  riseAzimuth: number;
  /** Azimut beim Untergang in Grad */
  setAzimuth: number;
  /** Grösste Höhe über dem Horizont in Grad */
  maxElevationDeg: number;
}

/** Ein sichtbarer Überflug, angereichert um Richtung, Dauer und Helligkeit. */
export interface IssPass extends RawIssPass {
  /** Azimut des Höchststands in Grad (aus Auf- und Untergang genähert) */
  culminationAzimuth: number;
  /** Dauer über der Mindesthöhe in ganzen Minuten (mindestens 1) */
  durationMinutes: number;
  /** Geschätzte scheinbare Helligkeit (kleiner = heller) */
  magnitude: number;
  /** Sonnenhöhe am Beobachtungsort beim Höchststand in Grad (immer negativ) */
  sunAltitudeDeg: number;
}

/**
 * Abfrage-URL der freien Überflug-Schnittstelle. Kein Schlüssel nötig; der
 * Dienst rechnet die Bahn aus den aktuellen TLE-Daten und nennt in der
 * Antwort auch, wann er sie zuletzt geholt hat.
 */
export function issPassesUrl(
  latitude: number,
  longitude: number,
  hours: number = ISS_FORECAST_HOURS,
  minElevationDeg: number = ISS_MIN_ELEVATION_DEG
): string {
  const params = new URLSearchParams({
    hours: String(Math.round(hours)),
    minelevation: String(Math.round(minElevationDeg)),
  });
  return (
    `https://api.g7vrd.co.uk/v1/satellite-passes/${ISS_NORAD_ID}/` +
    `${latitude.toFixed(4)}/${longitude.toFixed(4)}.json?${params.toString()}`
  );
}

/** Winkel in den Bereich [0, 360) bringen (auch negative Werte). */
function normalizeAzimuth(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isoMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Antwort der Schnittstelle in saubere Überflüge übersetzen. Alles, was
 * unvollständig oder unplausibel ist (kaputte Zeitstempel, Höchststand
 * ausserhalb von Auf- und Untergang, Gipfelhöhe ausserhalb 0–90°), fliegt
 * still raus – ein Teilausfall der Quelle soll die Liste nicht sprengen.
 */
export function parseIssPasses(json: unknown): RawIssPass[] {
  if (!json || typeof json !== "object") return [];
  const raw = (json as { passes?: unknown }).passes;
  if (!Array.isArray(raw)) return [];
  const passes: RawIssPass[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const startMs = isoMs(e.start);
    const culminationMs = isoMs(e.tca);
    const endMs = isoMs(e.end);
    const maxElevationDeg = finiteNumber(e.max_elevation);
    const riseAzimuth = finiteNumber(e.aos_azimuth);
    const setAzimuth = finiteNumber(e.los_azimuth);
    if (startMs === null || culminationMs === null || endMs === null) continue;
    if (maxElevationDeg === null) continue;
    if (riseAzimuth === null || setAzimuth === null) continue;
    if (endMs <= startMs) continue;
    if (culminationMs < startMs || culminationMs > endMs) continue;
    if (maxElevationDeg <= 0 || maxElevationDeg > 90) continue;
    passes.push({
      startMs,
      culminationMs,
      endMs,
      riseAzimuth: normalizeAzimuth(riseAzimuth),
      setAzimuth: normalizeAzimuth(setAzimuth),
      maxElevationDeg,
    });
  }
  passes.sort((a, b) => a.startMs - b.startMs);
  return passes;
}

/**
 * Richtung des Höchststands aus Auf- und Untergangs-Azimut nähern: die
 * Station zieht auf einem Bogen über den Himmel, der Gipfel liegt in der
 * Mitte der KÜRZEREN Drehung zwischen den beiden Randpunkten (ein Überflug
 * unter dem Zenit überstreicht nie mehr als 180°).
 *
 * Genau 180° Drehung heisst «durch den Zenit» – dort gibt es keine
 * sinnvolle Richtung mehr; der Wert ist dann willkürlich die eine Seite,
 * was bei 90° Gipfelhöhe niemanden stört.
 */
export function culminationAzimuth(
  riseAzimuth: number,
  setAzimuth: number
): number {
  const sweep = ((setAzimuth - riseAzimuth + 540) % 360) - 180;
  return normalizeAzimuth(riseAzimuth + sweep / 2);
}

/**
 * Wie tief die Sonne höchstens stehen darf, damit ein Körper in `altitudeKm`
 * Höhe noch von ihr beschienen wird: der Erdschatten reicht am Beobachtungs-
 * ort bis zur Sonnenhöhe −acos(R / (R + h)). Bei 420 km sind das rund 20°.
 */
export function earthShadowLimitDeg(
  altitudeKm: number = ISS_ALTITUDE_KM
): number {
  const ratio = EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm);
  return (Math.acos(Math.min(1, Math.max(-1, ratio))) * 180) / Math.PI;
}

/**
 * Ist ein Überflug bei dieser Sonnenhöhe SICHTBAR? Es braucht beides:
 * unten dunkel (Sonne mindestens 6° unter dem Horizont) und oben Sonne
 * (Station noch nicht im Erdschatten). Dazwischen liegt das schmale
 * Fenster, in dem die ISS als heller, ruhig ziehender Punkt auffällt.
 *
 * Die Sonnenhöhe wird am BEOBACHTUNGSORT gemessen – eine Näherung: die
 * Station steht bis zu gut tausend Kilometer daneben. Für die Auswahl
 * «lohnt sich das Rausgehen?» reicht das, Grenzfälle können knapp danebenliegen.
 */
export function isPassVisible(
  sunAltitudeDeg: number,
  altitudeKm: number = ISS_ALTITUDE_KM
): boolean {
  if (!Number.isFinite(sunAltitudeDeg)) return false;
  if (sunAltitudeDeg > ISS_DARK_SUN_ALTITUDE_DEG) return false;
  return sunAltitudeDeg >= -earthShadowLimitDeg(altitudeKm);
}

/**
 * Schrägentfernung zur Station in Kilometern, wenn sie `elevationDeg` über
 * dem Horizont steht (ebener Kosinussatz im Dreieck Erdmittelpunkt –
 * Beobachtung – Station). Im Zenit ist es die Bahnhöhe, am Horizont das
 * Dreifache davon – daher der grosse Helligkeits-Unterschied.
 */
export function slantRangeKm(
  elevationDeg: number,
  altitudeKm: number = ISS_ALTITUDE_KM
): number {
  const sinEl = Math.sin((elevationDeg * Math.PI) / 180);
  const r = EARTH_RADIUS_KM;
  const root = Math.sqrt(
    r * r * sinEl * sinEl + 2 * r * altitudeKm + altitudeKm * altitudeKm
  );
  return root - r * sinEl;
}

/**
 * Grobe Helligkeitsschätzung eines Überflugs aus seiner Gipfelhöhe:
 * ausgehend von der Standardhelligkeit bei 1000 km wird über das
 * Entfernungsgesetz (5·log10) auf die tatsächliche Schrägentfernung
 * umgerechnet. Der Beleuchtungswinkel bleibt bewusst aussen vor – dafür
 * bräuchte es die Stellung von Sonne, Station und Beobachtung zueinander.
 * Ergebnis auf eine Nachkommastelle gerundet; kleiner heisst heller.
 */
export function estimateMagnitude(
  maxElevationDeg: number,
  altitudeKm: number = ISS_ALTITUDE_KM
): number {
  const rangeKm = slantRangeKm(maxElevationDeg, altitudeKm);
  const magnitude =
    ISS_STANDARD_MAGNITUDE + 5 * Math.log10(Math.max(1, rangeKm) / 1000);
  return Math.round(magnitude * 10) / 10;
}

/**
 * Sichtbare Überflüge aus den geometrischen heraussuchen und um Richtung,
 * Dauer und Helligkeit ergänzen. Massgeblich ist die Sonnenhöhe am
 * Höchststand – dort ist der Überflug am hellsten und am ehesten zu sehen.
 */
export function selectVisiblePasses(
  passes: RawIssPass[],
  latitude: number,
  longitude: number,
  maxCount = 6
): IssPass[] {
  const visible: IssPass[] = [];
  for (let i = 0; i < passes.length && visible.length < maxCount; i++) {
    const pass = passes[i];
    const sun = getSunPosition(
      new Date(pass.culminationMs),
      latitude,
      longitude
    );
    if (!isPassVisible(sun.altitude)) continue;
    visible.push({
      ...pass,
      culminationAzimuth: culminationAzimuth(pass.riseAzimuth, pass.setAzimuth),
      durationMinutes: Math.max(
        1,
        Math.round((pass.endMs - pass.startMs) / 60000)
      ),
      magnitude: estimateMagnitude(pass.maxElevationDeg),
      sunAltitudeDeg: Math.round(sun.altitude * 10) / 10,
    });
  }
  return visible;
}

/**
 * Weg über den Himmel als Kurztext, z. B. «W → N → O». Nutzt die
 * Himmelsrichtungs-Kürzel aus shared/solar.ts, damit im ganzen Projekt
 * dieselben Abkürzungen stehen (DE «O» für Ost, FR/IT «E»/«O»).
 */
export function passPathText(pass: IssPass, lang: Language = "de"): string {
  return [pass.riseAzimuth, pass.culminationAzimuth, pass.setAzimuth]
    .map(azimuth => compassDirection(azimuth, lang))
    .join(" → ");
}

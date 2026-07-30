/**
 * Sonnenstand-Berechnung nach vereinfachtem NOAA/PSA-Algorithmus.
 * Genauigkeit ~0.1–0.3°, völlig ausreichend für Stellplatz- und Solarplanung.
 * Funktioniert offline – keine API nötig.
 */
export interface SunPosition {
  /** Azimut in Grad, 0 = Nord, 90 = Ost, 180 = Süd, 270 = West */
  azimuth: number;
  /** Höhenwinkel über Horizont in Grad (negativ = unter Horizont) */
  altitude: number;
}

const rad = Math.PI / 180;
const dayMs = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const obliquity = rad * 23.4397;

function toJulian(date: Date) {
  return date.valueOf() / dayMs - 0.5 + J1970;
}
function toDays(date: Date) {
  return toJulian(date) - J2000;
}
function solarMeanAnomaly(d: number) {
  return rad * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(M: number) {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + Math.PI;
}
function declination(l: number, b: number) {
  return Math.asin(Math.sin(b) * Math.cos(obliquity) + Math.cos(b) * Math.sin(obliquity) * Math.sin(l));
}
function rightAscension(l: number, b: number) {
  return Math.atan2(Math.sin(l) * Math.cos(obliquity) - Math.tan(b) * Math.sin(obliquity), Math.cos(l));
}
function siderealTime(d: number, lw: number) {
  return rad * (280.16 + 360.9856235 * d) - lw;
}

/** Sonnenposition (Azimut/Höhe) für Zeitpunkt und Ort. */
export function getSunPosition(date: Date, lat: number, lng: number): SunPosition {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const ra = rightAscension(L, 0);
  const H = siderealTime(d, lw) - ra;

  const altitude =
    Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / rad;
  // Azimut: 0 = Süd im Rohwert → auf 0 = Nord normalisieren
  const azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) / rad;
  const azimuth = (azRaw + 180 + 360) % 360;
  return { azimuth, altitude };
}

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date;
}

function julianCycle(d: number, lw: number) {
  return Math.round(d - 0.0009 - lw / (2 * Math.PI));
}
function approxTransit(Ht: number, lw: number, n: number) {
  return 0.0009 + (Ht + lw) / (2 * Math.PI) + n;
}
function solarTransitJ(ds: number, M: number, L: number) {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
}
function hourAngle(h: number, phi: number, d: number) {
  return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));
}
function fromJulian(j: number) {
  return new Date((j + 0.5 - J1970) * dayMs);
}

/** Sonnenauf-/-untergang und Sonnenhöchststand für Datum und Ort. */
export function getSunTimes(date: Date, lat: number, lng: number): SunTimes {
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const h0 = rad * -0.833; // Standard-Horizont inkl. Refraktion
  const cosH = (Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosH < -1 || cosH > 1) {
    // Polartag/-nacht
    return { sunrise: null, sunset: null, solarNoon: fromJulian(Jnoon) };
  }
  const w = hourAngle(h0, phi, dec);
  const a = approxTransit(w, lw, n);
  const Jset = solarTransitJ(a, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset), solarNoon: fromJulian(Jnoon) };
}

/** Koordinaten-Formatierung fürs SOS-Dashboard. */
export function formatDMS(lat: number, lng: number): string {
  const f = (v: number, pos: string, neg: string) => {
    const abs = Math.abs(v);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = ((minFloat - min) * 60).toFixed(1);
    return `${deg}° ${min}' ${sec}" ${v >= 0 ? pos : neg}`;
  };
  return `${f(lat, "N", "S")}  ${f(lng, "E", "W")}`;
}

/**
 * Näherungsweise Umrechnung WGS84 → Schweizer Koordinaten LV95 (E/N).
 * Offizielle swisstopo-Näherungsformeln, Genauigkeit ca. 1 m – für Notfall-Angaben geeignet.
 * Gültig nur innerhalb der Schweiz.
 */
export function wgs84ToLV95(lat: number, lng: number): { east: number; north: number } | null {
  if (lat < 45.5 || lat > 48 || lng < 5.5 || lng > 11) return null;
  const phi = (lat * 3600 - 169028.66) / 10000;
  const lam = (lng * 3600 - 26782.5) / 10000;
  const east =
    2600072.37 +
    211455.93 * lam -
    10938.51 * lam * phi -
    0.36 * lam * phi * phi -
    44.54 * lam * lam * lam;
  const north =
    1200147.07 +
    308807.95 * phi +
    3745.25 * lam * lam +
    76.63 * phi * phi -
    194.56 * lam * lam * phi +
    119.79 * phi * phi * phi;
  return { east: Math.round(east), north: Math.round(north) };
}

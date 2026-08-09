/**
 * Fahrzeiten von Google (Routes API) – die reine Logik ohne Abruf.
 *
 * WARUM ÜBERHAUPT ZWEI DIENSTE? Weil sie verschiedene Dinge gut können.
 * OSRM auf OpenStreetMap kennt jeden Wanderweg der Schweiz samt SAC-Skala;
 * was es nicht kennt, ist der Stau. Google kennt den Stau. Also kommt von
 * Google GENAU EINE ZAHL – die Fahrzeit mit Verkehr – und sonst nichts.
 *
 * ALLE WEGE, STRECKEN UND LINIEN BLEIBEN BEI OSM/OSRM. Das ist nicht nur
 * Geschmack: Die Nutzungsbedingungen von Google untersagen es, ihre Inhalte
 * zusammen mit einer fremden Karte zu zeigen. ReiseKompass zeichnet auf
 * Leaflet mit OpenStreetMap-Kacheln – eine von Google berechnete Linie
 * gehörte dort nicht hin. Eine Zahl im Text ist etwas anderes als eine
 * Geometrie auf einer fremden Karte.
 *
 * Der Schlüssel steht in der Server-`.env` und kommt nie in den Browser;
 * diese Datei baut nur die Anfrage und liest die Antwort.
 */

/** Endpunkt der Routes API (die Nachfolgerin der Directions API). */
export const GOOGLE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

/**
 * Feldmaske: Google verlangt, dass man die gewünschten Felder benennt, und
 * rechnet danach ab. Wir wollen zwei Zahlen – nicht die Geometrie, nicht die
 * Abbiegehinweise, nicht die Strassennamen.
 */
export const GOOGLE_ROUTES_FIELD_MASK = "routes.duration,routes.distanceMeters";

/**
 * Wie weit im Voraus Google die Verkehrslage überhaupt schätzt. Weiter
 * entfernte Abfahrten fragen wir ohne Zeitangabe (= Verkehr von jetzt),
 * denn eine Prognose für in drei Monaten gibt es nicht.
 */
export const MAX_TRAFFIC_LEAD_MS = 14 * 24 * 60 * 60 * 1000;

/** Google will eine Abfahrt in der Zukunft; eine Minute Vorlauf genügt. */
const MIN_LEAD_MS = 60 * 1000;

export interface DriveTime {
  /** Fahrzeit in Sekunden – mit Verkehr, wenn eine Abfahrtszeit mitkam. */
  durationS: number;
  /** Fahrstrecke in Metern. */
  distanceM: number;
}

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Anfrage-Körper bauen. `departureAtMs` ist freiwillig: ohne Angabe rechnet
 * Google mit dem Verkehr von jetzt, mit Angabe mit der Prognose für diesen
 * Zeitpunkt – das ist der Unterschied zwischen «Freitag 17 Uhr» und
 * «Dienstag 10 Uhr» und damit der eigentliche Grund für diesen Dienst.
 */
export function googleRouteBody(
  from: LatLon,
  to: LatLon,
  departureAtMs?: number | null
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    origin: {
      location: { latLng: { latitude: from.lat, longitude: from.lon } },
    },
    destination: {
      location: { latLng: { latitude: to.lat, longitude: to.lon } },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    units: "METRIC",
  };
  if (
    departureAtMs != null &&
    Number.isFinite(departureAtMs) &&
    departureAtMs > 0
  ) {
    body.departureTime = new Date(departureAtMs).toISOString();
  }
  return body;
}

/**
 * «5466s» → 5466. Google liefert Dauern als Zeichenkette mit angehängtem
 * «s»; wer das übersieht, bekommt NaN und rechnet damit weiter.
 */
export function parseGoogleDuration(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value.trim());
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? seconds : null;
}

/**
 * Antwort lesen. Gibt null zurück, wenn nichts Brauchbares drinsteht – die
 * aufrufende Seite fällt dann auf die OSRM-Fahrzeit zurück, statt eine
 * erfundene Zahl anzuzeigen.
 */
export function parseGoogleRoute(json: unknown): DriveTime | null {
  if (!json || typeof json !== "object") return null;
  const routes = (json as { routes?: unknown }).routes;
  if (!Array.isArray(routes) || routes.length === 0) return null;
  const first = routes[0] as { duration?: unknown; distanceMeters?: unknown };
  const durationS = parseGoogleDuration(first.duration);
  if (durationS == null || durationS <= 0) return null;
  const distance = first.distanceMeters;
  const distanceM =
    typeof distance === "number" && Number.isFinite(distance) ? distance : 0;
  return { durationS, distanceM };
}

/**
 * Nächstes Vorkommen einer Uhrzeit («07:30») als Zeitstempel.
 *
 * Die Abfahrtsplanung rechnet mit Uhrzeiten ohne Datum – man plant «um 16
 * Uhr da sein», nicht «am 12. September um 16 Uhr». Für die Verkehrsfrage
 * braucht Google aber einen Zeitpunkt. Genommen wird deshalb das nächste
 * Vorkommen dieser Uhrzeit: heute, wenn sie noch bevorsteht, sonst morgen.
 * Damit stimmt wenigstens die TAGESZEIT – und die entscheidet über den
 * Feierabendverkehr.
 *
 * Über die Tagesgrenze wird mit dem Kalender gerechnet und nicht mit «plus
 * 24 Stunden», sonst verschiebt sich die Uhrzeit an den beiden Tagen der
 * Zeitumstellung um eine Stunde.
 */
export function nextOccurrenceMs(time: string, nowMs: number): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const at = new Date(nowMs);
  at.setHours(hours, minutes, 0, 0);
  if (at.getTime() <= nowMs + MIN_LEAD_MS) {
    at.setDate(at.getDate() + 1);
    at.setHours(hours, minutes, 0, 0);
  }
  return at.getTime();
}

/**
 * Lohnt sich die Verkehrs-Prognose für diesen Zeitpunkt? Zu weit in der
 * Zukunft weiss Google auch nichts; dann fragen wir lieber ohne Zeitangabe,
 * statt eine Genauigkeit vorzutäuschen, die es nicht gibt.
 */
export function trafficUsableAt(
  departureAtMs: number | null,
  nowMs: number
): boolean {
  if (departureAtMs == null || !Number.isFinite(departureAtMs)) return false;
  return departureAtMs > nowMs && departureAtMs - nowMs <= MAX_TRAFFIC_LEAD_MS;
}

/**
 * Schlüssel für den Zwischenspeicher: Koordinaten auf drei Nachkommastellen
 * (rund 100 m) und die Abfahrt auf die Viertelstunde gerundet. Feiner wäre
 * sinnlos – der Verkehr ist um 17:03 derselbe wie um 17:07.
 */
export function driveTimeCacheKey(
  from: LatLon,
  to: LatLon,
  departureAtMs: number | null
): string {
  const quarter =
    departureAtMs == null
      ? "now"
      : String(Math.round(departureAtMs / (15 * 60 * 1000)));
  return [
    from.lat.toFixed(3),
    from.lon.toFixed(3),
    to.lat.toFixed(3),
    to.lon.toFixed(3),
    quarter,
  ].join(",");
}

// ── Stau punktgenau (Nutzerwunsch 04.08.2026) ─────────────────────────

/**
 * Verkehrslage ABSCHNITTSWEISE statt nur als Gesamtzeit.
 *
 * WARUM NICHT EINFACH «+35 MINUTEN»: Eine Gesamtverspätung sagt nicht,
 * WO es steht. Für die Fahrt zählt aber genau das – ob der Stau vor dem
 * Gotthard liegt oder erst in der Agglomeration am Ziel, entscheidet, ob
 * man früher losfährt oder eine Pause vorzieht.
 *
 * Google liefert dazu `speedReadingIntervals`: Abschnitte des Streckenzugs
 * mit einer Einstufung. Die Abschnitte zeigen auf INDIZES im Streckenzug,
 * deshalb braucht es beides – Linie und Abschnitte.
 *
 * DIE LINIE VON GOOGLE VERLÄSST DEN SERVER NIE. Sie dient dort nur als
 * Nachschlagewerk: «welcher Punkt meiner OSRM-Stützstellen liegt in
 * welchem Abschnitt». In den Browser geht eine Einstufung je Stützstelle,
 * also Text. Damit bleibt es bei der Linie aus dem Kopf dieser Datei:
 * Zahlen und Wörter von Google ja, Geometrie auf fremder Karte nein.
 */
export const TRAFFIC_LEVELS = ["normal", "slow", "jam"] as const;
export type TrafficLevel = (typeof TRAFFIC_LEVELS)[number];

/** Feldmaske für die Anfrage MIT Verkehr auf der Linie. */
export const GOOGLE_ROUTES_TRAFFIC_FIELD_MASK = [
  "routes.duration",
  "routes.staticDuration",
  "routes.distanceMeters",
  "routes.polyline.encodedPolyline",
  "routes.travelAdvisory.speedReadingIntervals",
].join(",");

/**
 * Anfrage-Körper für die Verkehrslage entlang der Strecke.
 *
 * `OVERVIEW` und nicht `HIGH_QUALITY`: Wir tasten acht Stützstellen ab,
 * kein Navigationsgerät. Die grobe Linie genügt und ist ein Bruchteil der
 * Datenmenge.
 */
export function googleTrafficBody(
  from: LatLon,
  to: LatLon,
  departureAtMs?: number | null
): Record<string, unknown> {
  return {
    ...googleRouteBody(from, to, departureAtMs),
    extraComputations: ["TRAFFIC_ON_POLYLINE"],
    polylineQuality: "OVERVIEW",
  };
}

/**
 * Googles Streckenzug entschlüsseln (Encoded Polyline Algorithm).
 *
 * Kein Paket dafür: Das Verfahren sind zwanzig Zeilen, und eine
 * Abhängigkeit, die im Bundle landet, wäre für zwanzig Zeilen zu viel.
 */
export function decodePolyline(encoded: string): LatLon[] {
  const points: LatLon[] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lon += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lon: lon / 1e5 });
  }
  return points;
}

export interface SpeedInterval {
  start: number;
  end: number;
  level: TrafficLevel;
}

/** Googles Einstufung in unsere drei Stufen. */
function speedLevel(value: unknown): TrafficLevel | null {
  if (value === "TRAFFIC_JAM") return "jam";
  if (value === "SLOW") return "slow";
  if (value === "NORMAL") return "normal";
  return null;
}

/** Die Abschnitte aus der Antwort lesen; Unbrauchbares fällt weg. */
export function parseSpeedIntervals(json: unknown): SpeedInterval[] {
  if (!json || typeof json !== "object") return [];
  const routes = (json as { routes?: unknown }).routes;
  if (!Array.isArray(routes) || routes.length === 0) return [];
  const raw = (
    routes[0] as {
      travelAdvisory?: { speedReadingIntervals?: unknown };
    }
  ).travelAdvisory?.speedReadingIntervals;
  if (!Array.isArray(raw)) return [];
  const result: SpeedInterval[] = [];
  raw.forEach(entry => {
    if (!entry || typeof entry !== "object") return;
    const item = entry as {
      startPolylinePointIndex?: unknown;
      endPolylinePointIndex?: unknown;
      speed?: unknown;
    };
    const level = speedLevel(item.speed);
    if (!level) return;
    // Fehlt der Startindex, ist er 0 – so steht es in Googles Antwort,
    // die den Wert bei 0 weglässt
    const start =
      typeof item.startPolylinePointIndex === "number"
        ? item.startPolylinePointIndex
        : 0;
    const end =
      typeof item.endPolylinePointIndex === "number"
        ? item.endPolylinePointIndex
        : start;
    result.push({ start, end, level });
  });
  return result;
}

/** Die Einstufung an einem Index; ohne Treffer «normal». */
export function levelAtIndex(
  intervals: readonly SpeedInterval[],
  index: number
): TrafficLevel {
  let found: TrafficLevel = "normal";
  intervals.forEach(interval => {
    if (index >= interval.start && index <= interval.end)
      found = interval.level;
  });
  return found;
}

/**
 * Für jeden unserer Punkte die Verkehrslage.
 *
 * Zugeordnet wird über den NÄCHSTGELEGENEN Punkt des Streckenzugs. Beide
 * Linien beschreiben dieselbe Fahrt, laufen aber nicht Punkt für Punkt
 * gleich – Google und OSRM setzen ihre Stützstellen unterschiedlich.
 * Gerechnet wird flach in Grad: Für «welcher von tausend Punkten ist am
 * nächsten» spielt die Erdkrümmung keine Rolle.
 */
export function trafficAtPoints(
  points: readonly LatLon[],
  polyline: readonly LatLon[],
  intervals: readonly SpeedInterval[]
): TrafficLevel[] {
  if (polyline.length === 0) return points.map(() => "normal");
  return points.map(point => {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < polyline.length; i++) {
      const dLat = polyline[i].lat - point.lat;
      const dLon = polyline[i].lon - point.lon;
      const distance = dLat * dLat + dLon * dLon;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return levelAtIndex(intervals, bestIndex);
  });
}

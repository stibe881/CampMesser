/**
 * ÖV ab Platz (#249): Anbindung an die offene Schweizer Fahrplan-API
 * `transport.opendata.ch` – Haltestellen in der Nähe und ihre nächsten
 * Abfahrten.
 *
 * Hier steht ausschliesslich REINE Logik: URL-Bau, defensive Parser und die
 * Auswahl der kommenden Abfahrten. Kein `fetch`, kein DOM und ausdrücklich
 * kein `Date.now()` – die «Jetzt»-Zeit kommt als Parameter herein, damit sich
 * die Filterung Zeichen für Zeichen testen lässt (Muster `shared/ics.ts`).
 *
 * Zwei Eigenheiten der API bestimmen den Aufbau:
 *
 * 1. Die Zeitangaben kommen doppelt: als ISO-Text mit Offset OHNE Doppelpunkt
 *    (`2026-08-04T04:33:00+0200`, was `Date` nicht überall verlässlich frisst)
 *    UND als Unix-Sekunden. Wir nehmen die Sekunden, wo es sie gibt, und
 *    reparieren den Text nur dort, wo es sie nicht gibt (Prognose).
 * 2. Die Antwort ist stellenweise löchrig: `id` kann null sein (Adress-Treffer
 *    statt Haltestelle), `delay` fehlt, `number` trägt mal die Liniennummer
 *    («12»), mal die interne Fahrtnummer («018011»). Alles Unbrauchbare wird
 *    still übersprungen, statt es zu erraten.
 *
 * Abdeckung: Die API bedient den Schweizer Fahrplan samt Grenzverkehr. Weiter
 * weg kommt schlicht eine leere Liste zurück – die Oberfläche sagt das dann
 * auch so, statt eine Panne vorzutäuschen.
 */

/** Basis der offenen Fahrplan-API (schlüssellos, CORS erlaubt). */
export const TRANSPORT_API_BASE = "https://transport.opendata.ch/v1";

/** So viele Haltestellen zeigt der Abschnitt höchstens an. */
export const TRANSPORT_STATION_LIMIT = 6;

/** So viele Abfahrten holt die Fahrplantafel je Haltestelle. */
export const TRANSPORT_DEPARTURE_LIMIT = 8;

/**
 * Weiter als das ist keine Haltestelle mehr «am Platz». Die API liefert auch
 * Treffer in 20 km Entfernung – die helfen niemandem, der zu Fuss zum Bus will.
 */
export const TRANSPORT_MAX_STATION_DISTANCE_M = 5000;

/** Verkehrsmittel-Art einer Haltestelle (aus dem `icon`-Feld der API). */
export type TransitStationKind =
  "train" | "bus" | "tram" | "ship" | "cableway" | "other";

/** Eine Haltestelle in der Nähe. */
export interface TransitStation {
  /** Haltestellen-Id der API (Fahrplan-Nummer, z. B. "8503000"). */
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Luftlinie zum Suchpunkt in Metern, wie von der API geliefert. */
  distanceM: number;
  kind: TransitStationKind;
}

/** Eine Abfahrt ab einer Haltestelle. */
export interface TransitDeparture {
  /** Stabil innerhalb einer Tafel: Fahrtbezeichnung + geplante Zeit. */
  id: string;
  /** Linienbezeichnung wie «S 8», «B 31», «IR 37» – oder undefined. */
  line?: string;
  /** Endstation der Fahrt. */
  to: string;
  /** Geplante Abfahrt als Unix-Millisekunden. */
  departureMs: number;
  /** Verspätung in ganzen Minuten; 0 heisst pünktlich, undefined «unbekannt». */
  delayMin?: number;
  /** Kante/Gleis, nur wenn die API es kennt. */
  platform?: string;
}

/* ------------------------------------------------------------------ */
/* URL-Bau                                                             */
/* ------------------------------------------------------------------ */

/**
 * URL für die Haltestellensuche um einen Punkt. Die API erwartet `x`/`y` –
 * bei `type=station` sind das Längen- und Breitengrad; sie erkennt die
 * Reihenfolge selbst, wir schicken bewusst `x=lon`, `y=lat`.
 */
export function nearbyStationsUrl(lat: number, lon: number): string {
  const x = encodeURIComponent(lon.toFixed(5));
  const y = encodeURIComponent(lat.toFixed(5));
  return `${TRANSPORT_API_BASE}/locations?x=${x}&y=${y}&type=station`;
}

/** URL für die Abfahrtstafel einer Haltestelle. */
export function stationboardUrl(
  stationId: string,
  limit: number = TRANSPORT_DEPARTURE_LIMIT
): string {
  const station = encodeURIComponent(stationId);
  const capped = Math.max(1, Math.min(40, Math.round(limit)));
  return `${TRANSPORT_API_BASE}/stationboard?station=${station}&limit=${capped}`;
}

/* ------------------------------------------------------------------ */
/* Defensive Helfer                                                    */
/* ------------------------------------------------------------------ */

/** Nur nicht-leere Strings übernehmen. */
function cleanText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Endliche Zahl übernehmen; Zahlen als Text (die API mischt) auch. */
function cleanNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/** Objekt-Eigenschaft lesen, ohne bei null/undefined zu stolpern. */
function readObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

/**
 * Zeitangabe der API in Unix-Millisekunden. Bevorzugt wird der mitgelieferte
 * Sekunden-Zeitstempel; nur wenn der fehlt, wird der ISO-Text gelesen – und
 * dafür der Offset `+0200` zu `+02:00` ergänzt, weil die kurze Schreibweise
 * nicht in jeder Laufzeit sicher geparst wird. Alles Unlesbare ergibt null.
 */
export function parseTransportTime(
  isoText: unknown,
  timestampSeconds?: unknown
): number | null {
  const seconds = cleanNumber(timestampSeconds);
  if (seconds !== undefined && seconds > 0) return Math.round(seconds * 1000);
  const raw = cleanText(isoText);
  if (!raw) return null;
  const normalized = raw.replace(
    /([+-])(\d{2})(\d{2})$/,
    (_all, sign: string, hh: string, mm: string) => `${sign}${hh}:${mm}`
  );
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Verspätung in ganzen Minuten aus zwei Zeitstempeln. Eine «negative
 * Verspätung» (Fahrt früher als geplant) zeigt kein Fahrplan der Welt an und
 * wird deshalb zu 0 – abgerundet wird bewusst NICHT: eine Minute und zehn
 * Sekunden ist eine Minute Verspätung, keine zwei.
 */
export function delayMinutesBetween(
  plannedMs: number,
  actualMs: number
): number {
  if (!Number.isFinite(plannedMs) || !Number.isFinite(actualMs)) return 0;
  const diffMin = Math.floor((actualMs - plannedMs) / 60000);
  return diffMin > 0 ? diffMin : 0;
}

/** `icon`-Feld der API auf eine Verkehrsmittel-Art abbilden. */
export function parseStationKind(value: unknown): TransitStationKind {
  const raw = cleanText(value)?.toLowerCase();
  if (raw === "train") return "train";
  if (raw === "bus") return "bus";
  if (raw === "tram") return "tram";
  if (raw === "ship") return "ship";
  if (raw === "cableway") return "cableway";
  return "other";
}

/**
 * Linienbezeichnung aus `category` und `number` bauen. Die API füllt `number`
 * uneinheitlich: beim Bus steht dort die Liniennummer («31»), beim S-Bahn-Zug
 * mal die Liniennummer («12»), mal die sechsstellige, führend genullte
 * FAHRTnummer («018011»). Letztere sagt Reisenden nichts und fliegt raus –
 * dann bleibt es bei der Kategorie allein («S»), statt eine Linie zu erfinden.
 */
export function transportLineLabel(
  category: unknown,
  numberValue: unknown
): string | undefined {
  const cat = cleanText(category);
  const num = cleanText(numberValue);
  const usableNumber =
    num !== undefined && num.length <= 4 && !/^0\d+$/.test(num)
      ? num
      : undefined;
  if (cat && usableNumber) return `${cat} ${usableNumber}`;
  return cat ?? usableNumber;
}

/* ------------------------------------------------------------------ */
/* Parser                                                              */
/* ------------------------------------------------------------------ */

/**
 * `/v1/locations` in Haltestellen übersetzen. Übersprungen wird alles ohne
 * Fahrplan-Id (die API mischt Adress-Treffer darunter, die keine Abfahrtstafel
 * haben), ohne Namen und ohne Koordinaten. Achtung: im Antwort-Objekt ist
 * `coordinate.x` die BREITE und `coordinate.y` die LÄNGE – genau umgekehrt zur
 * Anfrage.
 */
export function parseTransitStations(json: unknown): TransitStation[] {
  const root = readObject(json);
  const raw = root?.stations;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: TransitStation[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = readObject(raw[i]);
    if (!entry) continue;
    const id = cleanText(entry.id);
    const name = cleanText(entry.name);
    if (!id || !name || seen.has(id)) continue;
    const coord = readObject(entry.coordinate);
    const lat = cleanNumber(coord?.x);
    const lon = cleanNumber(coord?.y);
    if (lat === undefined || lon === undefined) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const distanceM = cleanNumber(entry.distance);
    seen.add(id);
    result.push({
      id,
      name,
      lat,
      lon,
      distanceM: distanceM !== undefined ? Math.max(0, distanceM) : 0,
      kind: parseStationKind(entry.icon),
    });
  }
  return result;
}

/**
 * Haltestellen auf das Fussläufige eindampfen: näher als
 * `TRANSPORT_MAX_STATION_DISTANCE_M`, nach Distanz sortiert, auf `limit`
 * gekürzt. Bei gleicher Distanz entscheidet die Id – als schlichter
 * Zeichenvergleich und NICHT über `localeCompare`, damit die Reihenfolge in
 * jeder Sprache dieselbe und damit testbar bleibt.
 */
export function nearestTransitStations(
  list: readonly TransitStation[],
  limit: number = TRANSPORT_STATION_LIMIT,
  maxDistanceM: number = TRANSPORT_MAX_STATION_DISTANCE_M
): TransitStation[] {
  if (limit <= 0) return [];
  return list
    .filter(station => station.distanceM <= maxDistanceM)
    .slice()
    .sort(
      (a, b) =>
        a.distanceM - b.distanceM || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    )
    .slice(0, limit);
}

/**
 * `/v1/stationboard` in Abfahrten übersetzen. Ohne geplante Abfahrtszeit ist
 * ein Eintrag wertlos und fliegt raus. Die Verspätung nimmt zuerst das
 * `delay`-Feld (die API liefert dort ganze Minuten); fehlt es, wird sie aus
 * der Prognose gerechnet. Fehlt beides, bleibt sie `undefined` – «unbekannt»
 * ist etwas anderes als «pünktlich».
 */
export function parseStationboard(json: unknown): TransitDeparture[] {
  const root = readObject(json);
  const raw = root?.stationboard;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: TransitDeparture[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = readObject(raw[i]);
    if (!entry) continue;
    const stop = readObject(entry.stop);
    if (!stop) continue;
    const departureMs = parseTransportTime(
      stop.departure,
      stop.departureTimestamp
    );
    if (departureMs === null) continue;
    const to = cleanText(entry.to);
    if (!to) continue;

    const line = transportLineLabel(entry.category, entry.number);
    const id = `${cleanText(entry.name) ?? line ?? "?"}@${departureMs}`;
    if (seen.has(id)) continue;
    seen.add(id);

    let delayMin = cleanNumber(stop.delay);
    if (delayMin !== undefined) {
      delayMin = Math.max(0, Math.round(delayMin));
    } else {
      const prognosis = readObject(stop.prognosis);
      const actualMs = parseTransportTime(prognosis?.departure);
      delayMin =
        actualMs === null
          ? undefined
          : delayMinutesBetween(departureMs, actualMs);
    }

    result.push({
      id,
      line,
      to,
      departureMs,
      delayMin,
      platform: cleanText(stop.platform),
    });
  }
  return result;
}

/**
 * Nur die Abfahrten, die noch kommen – zeitlich aufsteigend, auf `limit`
 * gekürzt. Gemessen wird an der TATSÄCHLICHEN Abfahrt (geplant + Verspätung):
 * ein Bus mit fünf Minuten Verspätung steht um 08:02 noch da, obwohl er um
 * 08:00 hätte fahren sollen – ihn wegzulassen wäre falsch. Sortiert wird
 * dagegen nach der GEPLANTEN Zeit, weil die Fahrplantafel am Mast auch so
 * aussieht; bei Gleichstand entscheidet die Id als stabiler Tiebreak.
 */
export function upcomingDepartures(
  list: readonly TransitDeparture[],
  nowMs: number,
  limit: number = TRANSPORT_DEPARTURE_LIMIT
): TransitDeparture[] {
  if (limit <= 0) return [];
  return list
    .filter(
      departure =>
        departure.departureMs + (departure.delayMin ?? 0) * 60000 >= nowMs
    )
    .slice()
    .sort(
      (a, b) =>
        a.departureMs - b.departureMs ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    )
    .slice(0, limit);
}

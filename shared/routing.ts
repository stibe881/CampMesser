/**
 * Echte Wegstrecken statt Luftlinie.
 *
 * WARUM DIE ÄNDERUNG: Bis jetzt hat ReiseKompass überall dort, wo eine
 * Strecke gebraucht wurde, die Luftlinie genommen und mit einem
 * Pauschal-Tempo multipliziert. Über Land ging das knapp auf; im Gebirge
 * ist es schlicht falsch – vom Wallis ins Tessin sind es Luftlinie
 * achtzig Kilometer und über die Strasse zweihundert. Wer danach seine
 * Abfahrtszeit plant, steht drei Stunden zu spät an der Schranke.
 *
 * WOHER DIE ROUTE KOMMT: OSRM auf den Servern der FOSSGIS (dieselbe
 * Routing-Instanz, die openstreetmap.org für seine Routenplanung nutzt).
 * Kein Schlüssel, keine Registrierung, dafür ein Fair-Use-Rahmen – deshalb
 * wird jede Route zwischengespeichert und nur auf Anforderung geholt.
 *
 * WAS OHNE NETZ PASSIERT: Die App funktioniert offline, eine Route nicht.
 * Fällt der Abruf aus, wird auf die Luftlinie MIT UMWEGFAKTOR
 * zurückgefallen – und die Ansicht sagt dann, dass es eine Schätzung ist.
 * Eine Schätzung, die sich als gemessene Strecke ausgibt, wäre schlimmer
 * als gar keine.
 *
 * Reine Rechnerei und URL-Bau; der Abruf selbst steht in
 * client/src/lib/routing.ts.
 */
import { distanceMeters } from "./geo";
import type { GeoPoint } from "./hiking";

/**
 * Verkehrsmittel. OSRM der FOSSGIS bietet je eine eigene Instanz an –
 * «routed-car», «routed-foot», «routed-bike».
 */
export const ROUTING_PROFILES = {
  car: { path: "routed-car" },
  foot: { path: "routed-foot" },
  bike: { path: "routed-bike" },
} as const;

export type RoutingProfile = keyof typeof ROUTING_PROFILES;

/** Öffentliche OSRM-Instanz der FOSSGIS. */
export const OSRM_BASE_URL = "https://routing.openstreetmap.de";

/**
 * Umwegfaktor für den Rückfall auf die Luftlinie. Über Land liegt die
 * Strasse rund 20–30 % über der Luftlinie; 1,3 ist der übliche Wert für
 * Mitteleuropa und liegt eher zu hoch als zu tief – zu früh losfahren ist
 * das kleinere Übel.
 */
export const DETOUR_FACTOR = 1.3;

/** Aus der Luftlinie eine grobe Strassenstrecke schätzen. */
export function estimateRoadDistanceM(straightLineM: number): number {
  return Math.max(0, straightLineM) * DETOUR_FACTOR;
}

/** Ergebnis einer Routen-Abfrage. */
export interface RouteResult {
  /** Länge der Route in Metern – über die Strasse bzw. den Weg. */
  distanceM: number;
  /** Fahr- bzw. Gehzeit des Dienstes in Sekunden. */
  durationS: number;
  /** Verlauf der Route; für Karte, Korridor und Höhenprofil. */
  points: GeoPoint[];
  /**
   * Woher die Zahlen stammen. «estimate» heisst: Luftlinie mit
   * Umwegfaktor, weil der Dienst nicht erreichbar war.
   */
  source: "route" | "estimate";
}

/** Koordinate für OSRM: «lon,lat» mit fünf Nachkommastellen (≈ 1 m). */
function coordinate(point: GeoPoint): string {
  return `${point.lon.toFixed(5)},${point.lat.toFixed(5)}`;
}

/**
 * Anfrage-URL für OSRM. `overview=full` liefert den ganzen Verlauf, den
 * wir für Korridor und Höhenprofil brauchen; Abbiegehinweise («steps»)
 * bleiben aus – navigiert wird mit der Karten-App des Geräts.
 */
export function osrmRouteUrl(
  profile: RoutingProfile,
  points: GeoPoint[],
  options: { overview?: boolean } = {}
): string {
  const coords = points.map(coordinate).join(";");
  const params = new URLSearchParams({
    overview: options.overview === false ? "false" : "full",
    geometries: "geojson",
    steps: "false",
  });
  return `${OSRM_BASE_URL}/${ROUTING_PROFILES[profile].path}/route/v1/driving/${coords}?${params.toString()}`;
}

/**
 * Antwort von OSRM lesen. Alles, was nicht passt – anderer Code, leere
 * Route, kaputte Geometrie –, ergibt null; der Aufrufer fällt dann auf die
 * Schätzung zurück.
 */
export function parseOsrmRoute(json: unknown): RouteResult | null {
  if (!json || typeof json !== "object") return null;
  const body = json as {
    code?: unknown;
    routes?: unknown;
  };
  if (body.code !== "Ok" || !Array.isArray(body.routes)) return null;
  const route = body.routes[0] as
    | {
        distance?: unknown;
        duration?: unknown;
        geometry?: { coordinates?: unknown };
      }
    | undefined;
  if (!route) return null;
  const distanceM = route.distance;
  const durationS = route.duration;
  if (typeof distanceM !== "number" || !Number.isFinite(distanceM)) return null;
  if (typeof durationS !== "number" || !Number.isFinite(durationS)) return null;
  const raw = route.geometry?.coordinates;
  const points: GeoPoint[] = [];
  if (Array.isArray(raw)) {
    raw.forEach(entry => {
      if (!Array.isArray(entry)) return;
      const [lon, lat] = entry as unknown[];
      if (typeof lat !== "number" || typeof lon !== "number") return;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
      points.push({ lat, lon });
    });
  }
  return { distanceM, durationS, points, source: "route" };
}

/**
 * Schlüssel für den Zwischenspeicher. Auf drei Nachkommastellen gerundet
 * (rund 100 m): Wer denselben Platz zweimal anschaut, soll dieselbe Route
 * bekommen, ohne dass ein GPS-Zittern eine neue Abfrage auslöst.
 */
export function routeCacheKey(
  profile: RoutingProfile,
  points: GeoPoint[]
): string {
  const parts = points.map(p => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`);
  return `${profile}:${parts.join("|")}`;
}

/** Länge einer Punktreihe in Metern (Summe der Teilstücke). */
export function routeLengthM(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceMeters(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );
  }
  return total;
}

/**
 * Gleichmässig über die STRECKE verteilte Stützstellen auf einer Route.
 *
 * Bewusst nach Strecke und nicht nach Anzahl Stützpunkte: OSRM liefert in
 * Kurven und Kreiseln dicht an dicht Punkte und auf der Geraden kaum
 * welche. Wer jeden n-ten Punkt nimmt, tastet den Kreisel ab und die
 * Landstrasse nicht.
 */
export function pointsAlongRoute(
  points: GeoPoint[],
  count: number
): GeoPoint[] {
  const wanted = Math.max(2, Math.round(count));
  if (points.length <= 2 || points.length <= wanted) return [...points];
  const total = routeLengthM(points);
  if (total <= 0) return [points[0], points[points.length - 1]];
  const step = total / (wanted - 1);
  const result: GeoPoint[] = [points[0]];
  let travelled = 0;
  let nextMark = step;
  for (let i = 1; i < points.length && result.length < wanted - 1; i++) {
    travelled += distanceMeters(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );
    while (travelled >= nextMark && result.length < wanted - 1) {
      result.push(points[i]);
      nextMark += step;
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

export interface RouteOffset {
  /** Kilometermarke auf der Route in Metern. */
  alongM: number;
  /** Abstand des Orts zur Route in Metern (Luftlinie zum nächsten Punkt). */
  offsetM: number;
  /** Gesamtlänge der Route in Metern. */
  totalM: number;
}

/**
 * Einen Ort auf einer Route einordnen: «bei km 45 von 120, 800 m abseits».
 *
 * Gemessen wird gegen die STÜTZPUNKTE der Route, nicht gegen die
 * Teilstrecken dazwischen. Bei einer OSRM-Geometrie mit Punkten alle paar
 * Meter ist der Unterschied kleiner als die Genauigkeit, die hier
 * überhaupt gemeint ist.
 */
export function offsetOnRoute(
  target: GeoPoint,
  points: GeoPoint[]
): RouteOffset | null {
  if (points.length === 0) return null;
  let travelled = 0;
  let bestAlong = 0;
  let bestOffset = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      travelled += distanceMeters(
        points[i - 1].lat,
        points[i - 1].lon,
        points[i].lat,
        points[i].lon
      );
    }
    const offset = distanceMeters(
      target.lat,
      target.lon,
      points[i].lat,
      points[i].lon
    );
    if (offset < bestOffset) {
      bestOffset = offset;
      bestAlong = travelled;
    }
  }
  return { alongM: bestAlong, offsetM: bestOffset, totalM: travelled };
}

/** Was sich auf einer Route einordnen lässt: Id und Koordinaten. */
interface RoutePlaceLike {
  id: string;
  lat: number;
  lon: number;
}

export interface GeometryStop<T> {
  place: T;
  /** Kilometermarke in Metern ab Start – ENTLANG der Route. */
  alongM: number;
  /** Abstand zur Route in Metern. */
  offsetM: number;
}

/**
 * Funde nach ihrer Lage AUF DER ECHTEN ROUTE sortieren.
 *
 * Gegenstück zu `stopsAlongRoute` in shared/corridor.ts, das dasselbe auf
 * der Luftlinie tut. Der Unterschied ist im Gebirge gross: Eine Raststelle
 * am Talausgang liegt Luftlinie neben der Linie, auf der Strasse aber
 * dreissig Kilometer weiter vorne – und genau die Reihenfolge der Fahrt
 * will man sehen.
 *
 * Sortiert wird nach Kilometermarke, dann nach Abstand, dann nach Id (als
 * schlichter Zeichenvergleich, damit die Reihenfolge in jeder Sprache
 * dieselbe bleibt). Die Eingabeliste bleibt unangetastet.
 */
export function stopsAlongGeometry<T extends RoutePlaceLike>(
  list: readonly T[],
  points: GeoPoint[],
  limit: number
): GeometryStop<T>[] {
  if (limit <= 0 || points.length === 0) return [];
  return list
    .map(place => {
      const offset = offsetOnRoute({ lat: place.lat, lon: place.lon }, points);
      return {
        place,
        alongM: offset?.alongM ?? 0,
        offsetM: offset?.offsetM ?? 0,
      };
    })
    .sort(
      (a, b) =>
        a.alongM - b.alongM ||
        a.offsetM - b.offsetM ||
        (a.place.id < b.place.id ? -1 : a.place.id > b.place.id ? 1 : 0)
    )
    .slice(0, limit);
}

/**
 * Höchstzahl Punkte einer Wegführung, die der Client mitschicken darf.
 * Eine Tageswanderung hat als OSRM-Geometrie schnell tausend Stützpunkte;
 * für Länge und Höhenprofil genügt ein Bruchteil davon, und die Zeile in
 * der Datenbank soll nicht ins Kraut schiessen.
 */
export const MAX_ROUTE_PATH_POINTS = 400;

// ── Distanzen zu vielen Fundorten in EINER Abfrage ────────────────────────

/**
 * Höchstzahl Ziele einer Tabellen-Abfrage. OSRM verkraftet mehr, aber die
 * Listen in der App zeigen ohnehin nur eine Handvoll Treffer – und
 * gegenüber einem freien Dienst ist die kleinere Abfrage die richtige.
 */
export const MAX_TABLE_TARGETS = 25;

/**
 * Anfrage-URL für den Tabellen-Dienst: EIN Aufruf liefert die Distanzen
 * vom Standort zu allen Fundorten.
 *
 * Für jeden Laden eine eigene Route zu holen wäre der falsche Umgang mit
 * einem kostenlosen Dienst – und langsam obendrein.
 */
export function osrmTableUrl(
  profile: RoutingProfile,
  origin: GeoPoint,
  targets: GeoPoint[]
): string {
  const coords = [origin, ...targets].map(coordinate).join(";");
  const params = new URLSearchParams({
    sources: "0",
    annotations: "distance,duration",
  });
  return `${OSRM_BASE_URL}/${ROUTING_PROFILES[profile].path}/table/v1/driving/${coords}?${params.toString()}`;
}

/**
 * Tabelle über eine KETTE von Punkten (Nutzerwunsch 09.08.2026,
 * Strassen- statt Luftlinien-Kilometer in der Etappen-Statistik #580):
 * EINE Anfrage pro Reise liefert die Matrix aller Punkte, aus der die
 * aufeinanderfolgenden Abschnitte gelesen werden – ohne Geometrie, also
 * viel billiger als eine Routen-Abfrage je Abschnitt.
 */
export function osrmChainTableUrl(
  profile: RoutingProfile,
  points: GeoPoint[]
): string {
  const coords = points.map(coordinate).join(";");
  const params = new URLSearchParams({ annotations: "distance" });
  return `${OSRM_BASE_URL}/${ROUTING_PROFILES[profile].path}/table/v1/driving/${coords}?${params.toString()}`;
}

/**
 * Aus der Ketten-Antwort die Wegstrecken der AUFEINANDERFOLGENDEN
 * Abschnitte lesen (Punkt i → Punkt i+1): für n Punkte n−1 Werte, in der
 * Reihenfolge der Anfrage. `null` je Abschnitt heisst «keine Route» –
 * der Aufrufer schätzt dann diesen einen Abschnitt aus der Luftlinie.
 */
export function parseOsrmChain(
  json: unknown,
  pointCount: number
): (number | null)[] {
  const empty = new Array<number | null>(Math.max(0, pointCount - 1)).fill(
    null
  );
  if (!json || typeof json !== "object") return empty;
  const body = json as { code?: unknown; distances?: unknown };
  if (body.code !== "Ok" || !Array.isArray(body.distances)) return empty;
  return empty.map((_, index) => {
    const row = (body.distances as unknown[])[index];
    if (!Array.isArray(row)) return null;
    const value = row[index + 1];
    return typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : null;
  });
}

/**
 * Antwort des Tabellen-Diensts lesen: Wegstrecke in Metern je Ziel, in der
 * Reihenfolge der Anfrage. `null` steht für «nicht erreichbar» – eine
 * Hütte ohne Weganschluss bekommt keine erfundene Zahl.
 *
 * `field` wählt die Spalte: Meter («distances», der Normalfall) oder
 * Sekunden («durations»). Beide kommen in DERSELBEN Antwort – die
 * Abfrage oben verlangt sie ohnehin zusammen, und «Wohin am
 * Wochenende?» (#383) fragt nach der Fahrzeit, nicht nach Kilometern.
 */
export function parseOsrmTable(
  json: unknown,
  targetCount: number,
  field: "distances" | "durations" = "distances"
): (number | null)[] {
  const empty = new Array<number | null>(targetCount).fill(null);
  if (!json || typeof json !== "object") return empty;
  const body = json as { code?: unknown } & Record<string, unknown>;
  const table = body[field];
  if (body.code !== "Ok" || !Array.isArray(table)) return empty;
  const row = table[0];
  if (!Array.isArray(row)) return empty;
  // Spalte 0 ist der Standort selbst; die Ziele folgen ab Spalte 1
  return empty.map((_, i) => {
    const value = row[i + 1];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  });
}

/** Ein Fundort mit seiner Distanz, wie ihn die Listen der App führen. */
export interface DistancedPlace<T> {
  place: T;
  distanceM: number;
}

export interface RoutedPlace<T> extends DistancedPlace<T> {
  /** true = Wegstrecke, false = Luftlinie (kein Routing möglich). */
  routed: boolean;
}

/**
 * Wegstrecken in eine Fundort-Liste einsetzen und neu sortieren.
 *
 * NEU SORTIERT WIRD BEWUSST: «Der nächste Laden» ist der, zu dem man am
 * wenigsten weit fährt – nicht der, der auf der Karte am nächsten
 * aussieht. Am anderen Flussufer sind fünfhundert Meter Luftlinie sechs
 * Kilometer über die Brücke.
 *
 * Fundorte ohne Wegstrecke behalten ihre Luftlinie und sind als solche
 * gekennzeichnet, statt aus der Liste zu fallen.
 */
export function applyRouteDistances<T extends { id: string }>(
  list: readonly DistancedPlace<T>[],
  routedById: ReadonlyMap<string, number>
): RoutedPlace<T>[] {
  return list
    .map(entry => {
      const routed = routedById.get(entry.place.id);
      return routed != null && Number.isFinite(routed)
        ? { place: entry.place, distanceM: routed, routed: true }
        : { ...entry, routed: false };
    })
    .sort(
      (a, b) =>
        a.distanceM - b.distanceM ||
        (a.place.id < b.place.id ? -1 : a.place.id > b.place.id ? 1 : 0)
    );
}

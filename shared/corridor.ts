/**
 * Picknickplätze entlang der Anfahrt (#250): die Geometrie dahinter – ein
 * Korridor entlang der Strecke Start→Platz und die Einordnung eines Fundes auf
 * dieser Strecke («bei km 45 von 120»).
 *
 * EHRLICH BLEIBT: Der Korridor folgt der LUFTLINIE, nicht der Strasse.
 * CampMesser kennt keine Routenführung – ein Routing-Dienst wäre ein eigener
 * Fremddienst mit eigenem Schlüssel und eigenen Grenzen. Über Land liegt die
 * Strasse meist nah genug an der Luftlinie, dass ein Korridor von wenigen
 * Kilometern die Raststellen trifft; im Gebirge kann sie weit ausholen. Die
 * Oberfläche schreibt das ausdrücklich hin, statt Genauigkeit vorzutäuschen.
 *
 * Reine Rechnerei, kein Abruf und kein DOM – Client und Tests nutzen dasselbe.
 */
import { distanceMeters } from "./geo";
import type { GeoPoint } from "./hiking";

/** Mittlerer Erdradius in Metern (wie in `shared/geo.ts`). */
const EARTH_RADIUS_M = 6371000;

/** Regelabstand der Zwischenpunkte auf der Strecke. */
export const CORRIDOR_SPACING_M = 15000;

/**
 * Mehr Zwischenpunkte verträgt eine Overpass-Abfrage nicht sinnvoll. Bei einer
 * langen Fahrt rückt der Abstand dadurch auseinander – lieber ein gröber
 * abgetasteter Korridor als eine Abfrage, die der freie Dienst abweist.
 */
export const CORRIDOR_MAX_POINTS = 40;

/** Auswählbare Korridor-Breiten (Radius um die Luftlinie) in Metern. */
export const CORRIDOR_RADII_M = [2000, 5000, 10000];

/** Voreingestellte Korridor-Breite in Metern. */
export const CORRIDOR_DEFAULT_RADIUS_M = 5000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Nur brauchbare Koordinaten durchlassen. */
function isUsablePoint(point: GeoPoint | null | undefined): point is GeoPoint {
  return (
    !!point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lon) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lon) <= 180
  );
}

/**
 * Punkt auf dem Grosskreis zwischen zwei Orten, `fraction` von 0 (Start) bis
 * 1 (Ziel). Bewusst der Grosskreis und nicht die lineare Mischung von Grad-
 * Werten: über hunderte Kilometer laufen die beiden auseinander, und der
 * Korridor soll dort liegen, wo auch die Luftlinie liegt.
 */
export function interpolateGreatCircle(
  start: GeoPoint,
  end: GeoPoint,
  fraction: number
): GeoPoint {
  const f = Math.min(1, Math.max(0, fraction));
  const phi1 = toRadians(start.lat);
  const lambda1 = toRadians(start.lon);
  const phi2 = toRadians(end.lat);
  const lambda2 = toRadians(end.lon);
  const delta =
    distanceMeters(start.lat, start.lon, end.lat, end.lon) / EARTH_RADIUS_M;
  // Fallen Start und Ziel zusammen, gibt es nichts zu mischen
  if (delta < 1e-12) return { lat: start.lat, lon: start.lon };
  const sinDelta = Math.sin(delta);
  const a = Math.sin((1 - f) * delta) / sinDelta;
  const b = Math.sin(f * delta) / sinDelta;
  const x =
    a * Math.cos(phi1) * Math.cos(lambda1) +
    b * Math.cos(phi2) * Math.cos(lambda2);
  const y =
    a * Math.cos(phi1) * Math.sin(lambda1) +
    b * Math.cos(phi2) * Math.sin(lambda2);
  const z = a * Math.sin(phi1) + b * Math.sin(phi2);
  return {
    lat: toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lon: toDegrees(Math.atan2(y, x)),
  };
}

/**
 * Stützpunkte des Korridors: Start, Ziel und dazwischen Zwischenpunkte im
 * Abstand von rund `spacingM`. Genau diese Kette bekommt Overpass als
 * `around`-Filter – der Suchradius liegt damit um die ganze Linie, nicht nur
 * um einzelne Scheiben.
 *
 * Kaputte oder zusammenfallende Koordinaten ergeben eine leere Liste bzw. den
 * einen Punkt; wer nichts zu fahren hat, sucht auch nichts unterwegs.
 */
export function corridorPoints(
  start: GeoPoint,
  end: GeoPoint,
  spacingM: number = CORRIDOR_SPACING_M,
  maxPoints: number = CORRIDOR_MAX_POINTS
): GeoPoint[] {
  if (!isUsablePoint(start) || !isUsablePoint(end)) return [];
  const totalM = distanceMeters(start.lat, start.lon, end.lat, end.lon);
  if (totalM < 1) return [{ lat: start.lat, lon: start.lon }];

  const cap = Math.max(2, Math.floor(maxPoints));
  const spacing =
    Number.isFinite(spacingM) && spacingM > 0 ? spacingM : CORRIDOR_SPACING_M;
  // Anzahl Abschnitte: mindestens einer, höchstens so viele wie erlaubt
  const steps = Math.min(cap - 1, Math.max(1, Math.round(totalM / spacing)));

  const points: GeoPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    points.push(interpolateGreatCircle(start, end, i / steps));
  }
  return points;
}

/** Wo auf der Strecke ein Ort liegt – und wie weit neben ihr. */
export interface RoutePosition {
  /** Zurückgelegte Strecke bis zur Höhe des Orts, in Metern (0 … totalM). */
  alongM: number;
  /** Abstand des Orts zur Luftlinie in Metern. */
  offsetM: number;
  /** Gesamte Luftlinie Start→Ziel in Metern. */
  totalM: number;
}

/**
 * Einen Ort auf der Luftlinie Start→Ziel einordnen: Kilometermarke und
 * Abstand zur Linie.
 *
 * Gerechnet wird in einer örtlichen ebenen Näherung (äquidistante
 * Zylinderprojektion um die Streckenmitte) – über eine Anfahrt von ein paar
 * hundert Kilometern ist der Fehler kleiner als die Unsicherheit, die die
 * Luftlinie gegenüber der Strasse ohnehin hat. Die Kilometermarke wird
 * anschliessend auf die echte Grosskreis-Länge umgerechnet, damit «bei km 45
 * von 120» und die angezeigte Gesamtlänge zusammenpassen.
 *
 * BEWUSST NICHT über `nearestRoutePoint` aus `shared/hiking.ts`: das sucht den
 * nächsten ECKPUNKT einer Wegführung. Bei einer Wanderroute mit dichter
 * Geometrie ist das genau richtig, hier läge die Auflösung aber bei den 15 km
 * der Stützpunkte – für eine Kilometermarke unbrauchbar. Eine Gerade lässt
 * sich exakt projizieren, also wird sie exakt projiziert.
 *
 * Vor dem Start bzw. hinter dem Ziel wird auf die Strecke geklemmt: ein Fund
 * hinter dem Zeltplatz liegt «bei km 120 von 120», nicht bei km 130.
 */
export function routePosition(
  start: GeoPoint,
  end: GeoPoint,
  lat: number,
  lon: number
): RoutePosition {
  const totalM =
    isUsablePoint(start) && isUsablePoint(end)
      ? distanceMeters(start.lat, start.lon, end.lat, end.lon)
      : 0;
  if (!isUsablePoint(start) || !isUsablePoint(end)) {
    return { alongM: 0, offsetM: 0, totalM: 0 };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { alongM: 0, offsetM: 0, totalM };
  }

  // Ebene Näherung um die Streckenmitte
  const lat0 = toRadians((start.lat + end.lat) / 2);
  const cosLat0 = Math.cos(lat0);
  const project = (point: { lat: number; lon: number }) => ({
    x: EARTH_RADIUS_M * toRadians(point.lon - start.lon) * cosLat0,
    y: EARTH_RADIUS_M * toRadians(point.lat - start.lat),
  });

  const e = project(end);
  const p = project({ lat, lon });
  const lengthSq = e.x * e.x + e.y * e.y;
  if (lengthSq < 1e-9) {
    return {
      alongM: 0,
      offsetM: distanceMeters(start.lat, start.lon, lat, lon),
      totalM,
    };
  }

  const t = Math.min(1, Math.max(0, (p.x * e.x + p.y * e.y) / lengthSq));
  const footX = t * e.x;
  const footY = t * e.y;
  const offsetM = Math.hypot(p.x - footX, p.y - footY);
  return { alongM: t * totalM, offsetM, totalM };
}

/** Ein Fund mit seiner Lage auf der Strecke. */
export interface RouteStop<T> {
  place: T;
  /** Kilometermarke in Metern ab Start. */
  alongM: number;
  /** Abstand zur Luftlinie in Metern. */
  offsetM: number;
}

/** Was sich auf einer Strecke einordnen lässt: Id und Koordinaten. */
interface RoutePlaceLike {
  id: string;
  lat: number;
  lon: number;
}

/**
 * Funde nach ihrer Lage AUF DER STRECKE sortieren – nicht nach der Distanz zum
 * Ziel. Wer unterwegs rasten will, will die Reihenfolge der Fahrt sehen: was
 * zuerst kommt, steht zuoberst.
 *
 * Bei gleicher Kilometermarke entscheidet der geringere Abstand zur Linie,
 * danach die Id – als schlichter Zeichenvergleich und NICHT über
 * `localeCompare`, damit die Reihenfolge in jeder Sprache dieselbe und damit
 * testbar bleibt. Die Eingabeliste bleibt unangetastet.
 */
export function stopsAlongRoute<T extends RoutePlaceLike>(
  list: readonly T[],
  start: GeoPoint,
  end: GeoPoint,
  limit: number
): RouteStop<T>[] {
  if (limit <= 0) return [];
  return list
    .map(place => {
      const position = routePosition(start, end, place.lat, place.lon);
      return { place, alongM: position.alongM, offsetM: position.offsetM };
    })
    .sort(
      (a, b) =>
        a.alongM - b.alongM ||
        a.offsetM - b.offsetM ||
        (a.place.id < b.place.id ? -1 : a.place.id > b.place.id ? 1 : 0)
    )
    .slice(0, limit);
}

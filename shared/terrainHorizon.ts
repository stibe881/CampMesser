/**
 * Berge automatisch ins Hindernis-Profil (#372, Nutzerwunsch).
 *
 * WAS FEHLTE: Das Hindernis-Profil des Sonnen-Kompasses (#15) musste man
 * von Hand zeichnen – für jeden Baum, jedes Haus UND für den Bergkamm im
 * Süden. Der Baum vor dem Zelt ist eine Sache von zehn Sekunden; einen
 * Alpenkamm nach Augenmass in Azimut und Höhenwinkel zu übersetzen ist
 * Raterei. Dabei steht die Antwort in jedem Höhenmodell.
 *
 * DIE RECHNUNG: Von der Platz-Koordinate aus geht ein Strahlenkranz nach
 * aussen – alle 15° eine Richtung, auf jeder Richtung ein paar Stützpunkte
 * von 250 m bis 30 km. Für jeden Punkt liefert das Höhenmodell die
 * Meereshöhe; daraus wird der Höhenwinkel über dem Horizont:
 *
 *     tan(α) = (h_Punkt − h_Platz − Erdkrümmung) / Entfernung
 *
 * Der höchste Winkel je Richtung ist der Horizont dort. Das ist genau die
 * Form, die `ObstacleShape` ohnehin verlangt (Azimut, Sektorbreite,
 * Höhenwinkel) – es braucht keine neue Datenstruktur.
 *
 * DIE ERDKRÜMMUNG GEHÖRT DAZU: Auf 30 km «sinkt» der Boden um rund 60 m
 * weg. Ohne diesen Abzug bekäme ein Hügel in der Ferne einen Winkel, den
 * er nicht hat. Gerechnet wird mit dem effektiven Erdradius (7/6 × R),
 * weil die Lichtstrahlen in der Atmosphäre leicht nach unten gebogen
 * werden – dieselbe Näherung, die auch die Funktechnik benutzt.
 *
 * WAS DAS NICHT KANN, ehrlich: Bäume und Häuser stehen in keinem
 * Höhenmodell dieser Auflösung. Genau dafür bleibt das Zeichnen von Hand –
 * die Berge kommen automatisch, der Baum vor dem Zelt weiterhin per Hand.
 *
 * Reine Funktionen: Das Abholen der Höhen macht der Client, gerechnet
 * wird hier – und damit prüfbar.
 */
import type { Obstacle } from "./obstacleProfiles";

/** Erdradius in Metern. */
const EARTH_RADIUS_M = 6_371_000;
/**
 * Effektiver Radius für die Krümmung: 7/6 des echten. Lichtstrahlen
 * krümmen sich in der Atmosphäre leicht mit der Erde mit, sonst käme ein
 * zu grosser Abzug heraus.
 */
const EFFECTIVE_RADIUS_M = (EARTH_RADIUS_M * 7) / 6;

/** Breite eines Sektors in Grad – 24 Richtungen rund um den Platz. */
export const HORIZON_SECTOR_DEG = 15;
/** Stützpunkte je Richtung, in Metern. Nah dicht, fern grob. */
export const HORIZON_DISTANCES_M = [
  250, 500, 1000, 2000, 4000, 8000, 15000, 30000,
] as const;
/**
 * Unter diesem Höhenwinkel wird kein Hindernis eingetragen. Ein halbes
 * Grad ist die Sonnenscheibe selbst – darunter ist es kein Horizont mehr,
 * sondern Rauschen im Höhenmodell.
 */
export const HORIZON_MIN_DEG = 1;

/** Ein abzufragender Punkt des Strahlenkranzes. */
export interface HorizonSample {
  azimuth: number;
  distanceM: number;
  latitude: number;
  longitude: number;
}

/**
 * Die Punkte, deren Höhe geholt werden muss – 24 Richtungen × 8
 * Entfernungen. Die Verschiebung rechnet in Grad statt über eine
 * Projektion: Auf 30 km ist der Fehler kleiner als die Auflösung des
 * Höhenmodells.
 */
export function horizonSamplePoints(
  latitude: number,
  longitude: number
): HorizonSample[] {
  const points: HorizonSample[] = [];
  const latRad = (latitude * Math.PI) / 180;
  for (let azimuth = 0; azimuth < 360; azimuth += HORIZON_SECTOR_DEG) {
    const rad = (azimuth * Math.PI) / 180;
    for (const distanceM of HORIZON_DISTANCES_M) {
      const north = Math.cos(rad) * distanceM;
      const east = Math.sin(rad) * distanceM;
      const dLat = (north / EARTH_RADIUS_M) * (180 / Math.PI);
      const dLon =
        (east / (EARTH_RADIUS_M * Math.cos(latRad))) * (180 / Math.PI);
      points.push({
        azimuth,
        distanceM,
        latitude: latitude + dLat,
        longitude: longitude + dLon,
      });
    }
  }
  return points;
}

/**
 * Wie weit der Boden auf dieser Entfernung durch die Erdkrümmung
 * «wegsinkt», in Metern.
 */
export function curvatureDropM(distanceM: number): number {
  return (distanceM * distanceM) / (2 * EFFECTIVE_RADIUS_M);
}

/** Höhenwinkel eines Punktes über dem Horizont, in Grad (kann negativ sein). */
export function elevationAngleDeg(
  ownElevationM: number,
  pointElevationM: number,
  distanceM: number
): number {
  if (distanceM <= 0) return 0;
  const rise = pointElevationM - ownElevationM - curvatureDropM(distanceM);
  return (Math.atan2(rise, distanceM) * 180) / Math.PI;
}

/** Ein abgefragter Punkt samt Höhe; `null` = keine Auskunft. */
export interface HorizonReading {
  azimuth: number;
  distanceM: number;
  elevationM: number | null;
}

/**
 * Aus den Höhen den Horizont bauen: je Richtung der höchste Winkel, und
 * daraus ein Hindernis, sobald er über `HORIZON_MIN_DEG` liegt.
 *
 * Die Ids sind absichtlich vorhersagbar (`terrain-<azimut>`): Ein zweiter
 * Durchgang ersetzt damit genau dieselben Einträge, statt sie zu
 * verdoppeln.
 */
export function buildTerrainObstacles(
  ownElevationM: number,
  readings: readonly HorizonReading[]
): Obstacle[] {
  const maxByAzimuth = new Map<number, number>();
  for (const reading of readings) {
    if (reading.elevationM === null || !Number.isFinite(reading.elevationM)) {
      continue;
    }
    const angle = elevationAngleDeg(
      ownElevationM,
      reading.elevationM,
      reading.distanceM
    );
    const current = maxByAzimuth.get(reading.azimuth);
    if (current === undefined || angle > current) {
      maxByAzimuth.set(reading.azimuth, angle);
    }
  }
  const obstacles: Obstacle[] = [];
  for (const [azimuth, angle] of Array.from(maxByAzimuth.entries()).sort(
    (a, b) => a[0] - b[0]
  )) {
    if (angle < HORIZON_MIN_DEG) continue;
    obstacles.push({
      id: terrainObstacleId(azimuth),
      kind: "berg",
      azimuth,
      width: HORIZON_SECTOR_DEG,
      // Auf eine Nachkommastelle – mehr täuscht eine Genauigkeit vor, die
      // das Höhenmodell nicht hat.
      height: Math.round(angle * 10) / 10,
    });
  }
  return obstacles;
}

/** Id eines automatisch ermittelten Sektors. */
export function terrainObstacleId(azimuth: number): string {
  return `terrain-${azimuth}`;
}

/** Stammt dieses Hindernis aus dem Höhenmodell? */
export function isTerrainObstacle(obstacle: Obstacle): boolean {
  return obstacle.id.startsWith("terrain-");
}

/**
 * Automatisch ermittelte Berge einsetzen und dabei ALLES VON HAND
 * GEZEICHNETE STEHEN LASSEN.
 *
 * Das ist der Kern des Nutzerwunsches: «man soll aber auch manuell weitere
 * hinzufügen können wie Baum, Haus usw.». Ein zweiter Durchgang wirft
 * darum nur die alten Terrain-Sektoren weg, nie den Baum vor dem Zelt.
 */
export function mergeTerrainObstacles(
  existing: readonly Obstacle[],
  terrain: readonly Obstacle[]
): Obstacle[] {
  return [...existing.filter(o => !isTerrainObstacle(o)), ...terrain];
}

import { describe, expect, it } from "vitest";
import {
  HORIZON_DISTANCES_M,
  HORIZON_MIN_DEG,
  HORIZON_SECTOR_DEG,
  buildTerrainObstacles,
  curvatureDropM,
  elevationAngleDeg,
  horizonSamplePoints,
  isTerrainObstacle,
  mergeTerrainObstacles,
} from "@shared/terrainHorizon";
import { isBlocked } from "@shared/obstacles";

/**
 * Berge automatisch ins Hindernis-Profil (#372).
 *
 * WORAUF ES ANKOMMT: (1) Die Erdkrümmung darf nicht fehlen – ohne sie
 * bekommt ein ferner Hügel einen Winkel, den er nicht hat. (2) Was von
 * Hand gezeichnet wurde, muss einen zweiten Durchgang überleben; genau
 * das war der Nutzerwunsch.
 */
describe("Horizont aus dem Höhenmodell", () => {
  it("der Strahlenkranz deckt alle Richtungen ab", () => {
    const points = horizonSamplePoints(46.0, 8.9);
    expect(points).toHaveLength(
      (360 / HORIZON_SECTOR_DEG) * HORIZON_DISTANCES_M.length
    );
    expect(new Set(points.map(p => p.azimuth)).size).toBe(
      360 / HORIZON_SECTOR_DEG
    );
  });

  it("Norden liegt nördlich, Osten östlich", () => {
    const points = horizonSamplePoints(46.0, 8.9);
    const north = points.find(p => p.azimuth === 0 && p.distanceM === 1000)!;
    const east = points.find(p => p.azimuth === 90 && p.distanceM === 1000)!;
    expect(north.latitude).toBeGreaterThan(46.0);
    expect(Math.abs(north.longitude - 8.9)).toBeLessThan(1e-6);
    expect(east.longitude).toBeGreaterThan(8.9);
    expect(Math.abs(east.latitude - 46.0)).toBeLessThan(1e-6);
  });

  it("die Erdkrümmung wächst quadratisch und ist auf 30 km spürbar", () => {
    expect(curvatureDropM(1000)).toBeLessThan(0.1);
    // Rund 60 m – das ist ein Hügel, keine Rundungsfrage.
    expect(curvatureDropM(30000)).toBeGreaterThan(50);
    expect(curvatureDropM(30000)).toBeLessThan(70);
  });

  it("ein Berg auf gleicher Höhe wie der Platz ist kein Hindernis", () => {
    expect(elevationAngleDeg(500, 500, 2000)).toBeLessThan(0);
  });

  it("1000 m höher auf 1000 m Entfernung sind etwa 45°", () => {
    const angle = elevationAngleDeg(500, 1500, 1000);
    expect(angle).toBeGreaterThan(44);
    expect(angle).toBeLessThan(45);
  });

  it("flaches Land ergibt gar keine Hindernisse", () => {
    const readings = horizonSamplePoints(46, 8.9).map(p => ({
      azimuth: p.azimuth,
      distanceM: p.distanceM,
      elevationM: 400,
    }));
    expect(buildTerrainObstacles(400, readings)).toEqual([]);
  });

  it("ein Kamm im Süden wird zum Sektor im Süden", () => {
    const readings = horizonSamplePoints(46, 8.9).map(p => ({
      azimuth: p.azimuth,
      distanceM: p.distanceM,
      // Nur nach Süden (180°) steht etwas – 800 m höher auf 2 km
      elevationM: p.azimuth === 180 && p.distanceM === 2000 ? 1200 : 400,
    }));
    const obstacles = buildTerrainObstacles(400, readings);
    expect(obstacles).toHaveLength(1);
    expect(obstacles[0].azimuth).toBe(180);
    expect(obstacles[0].kind).toBe("berg");
    expect(obstacles[0].height).toBeGreaterThan(20);
    // Und er verdeckt die Sonne, wenn sie flach im Süden steht
    expect(isBlocked(180, 10, obstacles)).toBe(true);
    expect(isBlocked(0, 10, obstacles)).toBe(false);
  });

  it("Rauschen unterhalb der Schwelle wird nicht eingetragen", () => {
    const readings = horizonSamplePoints(46, 8.9).map(p => ({
      azimuth: p.azimuth,
      distanceM: p.distanceM,
      // Ein Meter auf 1 km sind rund 0,06° – weit unter der Schwelle
      elevationM: p.distanceM === 1000 ? 401 : 400,
    }));
    expect(buildTerrainObstacles(400, readings)).toEqual([]);
    expect(HORIZON_MIN_DEG).toBeGreaterThan(0);
  });

  it("Punkte ohne Auskunft kippen die Rechnung nicht", () => {
    const readings = [
      { azimuth: 180, distanceM: 2000, elevationM: null },
      { azimuth: 180, distanceM: 4000, elevationM: 1200 },
    ];
    expect(buildTerrainObstacles(400, readings)).toHaveLength(1);
  });

  it("von Hand Gezeichnetes überlebt einen zweiten Durchgang", () => {
    // Das ist der Kern des Wunsches: Berge automatisch, Baum von Hand.
    const tree = {
      id: "abc",
      kind: "baum" as const,
      azimuth: 90,
      width: 20,
      height: 15,
    };
    const first = buildTerrainObstacles(400, [
      { azimuth: 180, distanceM: 2000, elevationM: 1200 },
    ]);
    const merged = mergeTerrainObstacles(
      [tree, ...first],
      [
        ...buildTerrainObstacles(400, [
          { azimuth: 270, distanceM: 2000, elevationM: 1200 },
        ]),
      ]
    );
    expect(merged.filter(o => !isTerrainObstacle(o))).toEqual([tree]);
    expect(merged.filter(isTerrainObstacle).map(o => o.azimuth)).toEqual([270]);
  });
});

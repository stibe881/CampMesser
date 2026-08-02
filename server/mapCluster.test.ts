import { describe, expect, it } from "vitest";
// Cluster-Logik liegt im Client-Code, ist aber reine Geometrie ohne DOM.
import {
  CLUSTER_THRESHOLD_PX,
  clusterPoints,
} from "../client/src/lib/mapCluster";

/** Simple lineare Projektion für Tests: 1 Grad = 100 Pixel. */
const project = (lat: number, lon: number) => ({ x: lon * 100, y: lat * 100 });

describe("clusterPoints", () => {
  it("liefert für leere Eingabe eine leere Liste", () => {
    expect(clusterPoints([], project, 48)).toEqual([]);
  });

  it("lässt weit auseinanderliegende Punkte als Einzel-Cluster stehen", () => {
    const points = [
      { lat: 0, lon: 0, id: "a" },
      { lat: 10, lon: 0, id: "b" },
      { lat: 0, lon: 10, id: "c" },
    ];
    const clusters = clusterPoints(points, project, 48);
    expect(clusters).toHaveLength(3);
    clusters.forEach(c => expect(c.points).toHaveLength(1));
    expect(clusters[0].points[0].id).toBe("a");
    expect(clusters[0].lat).toBe(0);
    expect(clusters[0].lon).toBe(0);
  });

  it("fasst nahe Punkte zu einem Cluster mit Schwerpunkt zusammen", () => {
    const points = [
      { lat: 0, lon: 0, id: "a" },
      { lat: 0.2, lon: 0.2, id: "b" }, // 20/20 px entfernt → unter 48 px
      { lat: 5, lon: 5, id: "solo" },
    ];
    const clusters = clusterPoints(points, project, 48);
    expect(clusters).toHaveLength(2);
    const pair = clusters.find(c => c.points.length === 2);
    expect(pair).toBeDefined();
    expect(pair?.points.map(p => p.id)).toEqual(["a", "b"]);
    expect(pair?.lat).toBeCloseTo(0.1, 10);
    expect(pair?.lon).toBeCloseTo(0.1, 10);
    const solo = clusters.find(c => c.points.length === 1);
    expect(solo?.points[0].id).toBe("solo");
  });

  it("misst die Distanz zum nachgeführten Schwerpunkt, nicht zum ersten Punkt", () => {
    // a und b bilden einen Cluster mit Schwerpunkt bei x=20 px. c liegt bei
    // x=60 px: vom Schwerpunkt 40 px (< 48) entfernt, von a aber 60 px.
    const points = [
      { lat: 0, lon: 0, id: "a" },
      { lat: 0, lon: 0.4, id: "b" },
      { lat: 0, lon: 0.6, id: "c" },
    ];
    const clusters = clusterPoints(points, project, 48);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].points.map(p => p.id)).toEqual(["a", "b", "c"]);
    expect(clusters[0].lon).toBeCloseTo((0 + 0.4 + 0.6) / 3, 10);
  });

  it("wählt bei mehreren Kandidaten den nächstgelegenen Cluster", () => {
    // Zwei bestehende Cluster links (x=0) und rechts (x=80); der neue Punkt
    // bei x=50 liegt unter der Schwelle zu beiden, aber näher am rechten.
    const points = [
      { lat: 0, lon: 0, id: "links" },
      { lat: 0, lon: 0.8, id: "rechts" },
      { lat: 0, lon: 0.5, id: "neu" },
    ];
    const clusters = clusterPoints(points, project, 60);
    expect(clusters).toHaveLength(2);
    const right = clusters.find(c => c.points.some(p => p.id === "rechts"));
    expect(right?.points.map(p => p.id)).toEqual(["rechts", "neu"]);
  });

  it("trennt bei höherer Zoomstufe (gespreizte Projektion) wieder auf", () => {
    const points = [
      { lat: 0, lon: 0, id: "a" },
      { lat: 0.2, lon: 0.2, id: "b" },
    ];
    // Gleiche Punkte, aber Projektion mit 4-fachem Massstab (≈ 2 Zoomstufen
    // näher): aus 28 px Abstand werden 113 px → zwei Einzel-Pins.
    const zoomed = (lat: number, lon: number) => ({
      x: lon * 400,
      y: lat * 400,
    });
    expect(clusterPoints(points, project, 48)).toHaveLength(1);
    expect(clusterPoints(points, zoomed, 48)).toHaveLength(2);
  });

  it("nutzt ohne Angabe die Standard-Schwelle von 48 px", () => {
    expect(CLUSTER_THRESHOLD_PX).toBe(48);
    const points = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.47 }, // 47 px → zusammen
      { lat: 0, lon: 5 },
    ];
    expect(clusterPoints(points, project)).toHaveLength(2);
  });
});

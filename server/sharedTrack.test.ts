import { describe, expect, it } from "vitest";
import {
  SHARED_TRACK_MAX_POINTS,
  thinTrackPoints,
  type TrackPoint,
} from "@shared/track";

function track(count: number): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      lat: 47 + i * 0.0001,
      lon: 8,
      ele: 500 + i,
      t: 1_700_000_000_000 + i * 1000,
    });
  }
  return points;
}

describe("Wanderung per Link teilen (#282)", () => {
  it("lässt kurze Aufzeichnungen unverändert", () => {
    const points = track(500);
    expect(thinTrackPoints(points)).toBe(points);
  });

  it("dünnt lange Aufzeichnungen auf die Obergrenze aus", () => {
    const thinned = thinTrackPoints(track(20_000));
    expect(thinned.length).toBeLessThanOrEqual(SHARED_TRACK_MAX_POINTS + 1);
    expect(thinned.length).toBeGreaterThan(SHARED_TRACK_MAX_POINTS / 2);
  });

  it("behält Anfang und Ende – sonst endete die Linie im Nichts", () => {
    const points = track(9999);
    const thinned = thinTrackPoints(points, 100);
    expect(thinned[0]).toEqual(points[0]);
    expect(thinned[thinned.length - 1]).toEqual(points[points.length - 1]);
  });

  it("behält die Reihenfolge der Punkte", () => {
    const thinned = thinTrackPoints(track(5000), 50);
    for (let i = 1; i < thinned.length; i++) {
      expect(thinned[i].t).toBeGreaterThan(thinned[i - 1].t);
    }
  });

  it("kommt mit leeren und winzigen Reihen zurecht", () => {
    expect(thinTrackPoints([])).toEqual([]);
    const two = track(2);
    expect(thinTrackPoints(two, 2)).toBe(two);
    // Unsinnige Obergrenzen ändern nichts, statt alles wegzuwerfen
    expect(thinTrackPoints(two, 1)).toBe(two);
  });
});

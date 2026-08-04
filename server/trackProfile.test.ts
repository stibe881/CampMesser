import { describe, expect, it } from "vitest";
import {
  PROFILE_SAMPLE_COUNT,
  cumulativeDistances,
  elevationProfile,
  elevationRange,
  hasElevation,
  kilometerSplits,
} from "@shared/trackProfile";
import type { TrackPoint } from "@shared/track";

/**
 * Eine gerade Strecke nach Osten: rund 100 m je Schritt bei 47° Breite,
 * ein Punkt alle 60 Sekunden.
 */
function straightTrack(
  count: number,
  elevation?: (i: number) => number | null
) {
  const points: TrackPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      lat: 47,
      lon: 8 + i * 0.00132, // ≈ 100 m pro Schritt
      ele: elevation ? elevation(i) : 500 + i,
      t: 1_700_000_000_000 + i * 60_000,
    });
  }
  return points;
}

describe("Höhenprofil im Track-Detail (#280)", () => {
  it("summiert die Strecke Punkt für Punkt", () => {
    const distances = cumulativeDistances(straightTrack(3));
    expect(distances[0]).toBe(0);
    expect(distances[1]).toBeGreaterThan(90);
    expect(distances[1]).toBeLessThan(110);
    expect(distances[2]).toBeCloseTo(distances[1] * 2, 0);
  });

  it("dünnt lange Tracks auf eine feste Zahl Stützstellen aus", () => {
    const profile = elevationProfile(straightTrack(1000));
    expect(profile).toHaveLength(PROFILE_SAMPLE_COUNT);
    // Anfang und Ende bleiben erhalten
    expect(profile[0].distanceM).toBe(0);
    expect(profile[profile.length - 1].distanceM).toBeGreaterThan(
      profile[0].distanceM
    );
  });

  it("kurze Tracks bleiben unverändert", () => {
    const profile = elevationProfile(straightTrack(10));
    expect(profile).toHaveLength(10);
    expect(profile[3].elapsedS).toBe(180);
  });

  it("dünnt über die Strecke aus, nicht über den Index", () => {
    // 100 Punkte am selben Ort (Pause), danach eine echte Strecke
    const paused: TrackPoint[] = [];
    for (let i = 0; i < 100; i++) {
      paused.push({
        lat: 47,
        lon: 8,
        ele: 500,
        t: 1_700_000_000_000 + i * 1000,
      });
    }
    const moving = straightTrack(200).map((p, i) => ({
      ...p,
      t: 1_700_000_100_000 + i * 1000,
    }));
    const profile = elevationProfile([...paused, ...moving], 10);
    // Höchstens eine Stützstelle darf auf der Pause liegen
    const atStart = profile.filter(p => p.distanceM < 1).length;
    expect(atStart).toBeLessThanOrEqual(1);
  });

  it("rechnet Zwischenzeiten pro Kilometer", () => {
    // 25 Punkte à 100 m = 2,4 km, ein Punkt pro Minute
    const splits = kilometerSplits(straightTrack(25));
    expect(splits).toHaveLength(3);
    expect(splits[0].km).toBe(1);
    expect(splits[0].complete).toBe(true);
    expect(splits[0].seconds).toBeGreaterThan(0);
    // Der letzte Kilometer ist angebrochen
    expect(splits[2].complete).toBe(false);
  });

  it("summiert Auf- und Abstieg je Kilometer", () => {
    // Erst 10 Punkte aufwärts (je +10 m), dann 15 abwärts
    const points = straightTrack(25, i =>
      i <= 10 ? 500 + i * 10 : 600 - i * 5
    );
    const splits = kilometerSplits(points);
    expect(splits[0].ascentM).toBeGreaterThan(0);
    expect(splits[1].descentM).toBeGreaterThan(0);
  });

  it("kommt ohne Höhenangaben zurecht", () => {
    const flat = straightTrack(20, () => null);
    expect(hasElevation(flat)).toBe(false);
    expect(elevationRange(flat)).toBeNull();
    // Zwischenzeiten gibt es trotzdem
    const splits = kilometerSplits(flat);
    expect(splits.length).toBeGreaterThan(0);
    expect(splits[0].ascentM).toBe(0);
  });

  it("nennt höchsten und tiefsten Punkt", () => {
    const range = elevationRange(straightTrack(11))!;
    expect(range.minM).toBe(500);
    expect(range.maxM).toBe(510);
  });

  it("zu kurze Tracks liefern nichts, statt zu raten", () => {
    expect(elevationProfile([])).toEqual([]);
    expect(kilometerSplits([])).toEqual([]);
    expect(kilometerSplits(straightTrack(1))).toEqual([]);
  });
});

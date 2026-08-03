import { describe, expect, it } from "vitest";
import {
  ARRIVAL_MILESTONES,
  ARRIVED_RADIUS_M,
  arrivalProgress,
  crossedMilestones,
  highestPercent,
  reachedMilestones,
  type GeoPoint,
} from "@shared/arrivalProgress";
import { distanceMeters } from "@shared/geo";

// Eine echte Anfahrt: Zürich HB → Camping am Thunersee (grob).
const start: GeoPoint = { lat: 47.3779, lon: 8.5403 };
const target: GeoPoint = { lat: 46.7404, lon: 7.6301 };

/** Punkt auf der Strecke bei Anteil f (0 = Start, 1 = Ziel), linear genähert. */
const along = (f: number): GeoPoint => ({
  lat: start.lat + (target.lat - start.lat) * f,
  lon: start.lon + (target.lon - start.lon) * f,
});

describe("arrivalProgress – der Normalfall", () => {
  it("am Start sind es 0 %", () => {
    const progress = arrivalProgress(start, start, target);
    expect(progress.percent).toBeCloseTo(0, 5);
    expect(progress.coveredM).toBeCloseTo(0, 3);
  });

  it("am Ziel sind es 100 % und «angekommen»", () => {
    const progress = arrivalProgress(start, target, target);
    expect(progress.percent).toBeCloseTo(100, 5);
    expect(progress.remainingM).toBeCloseTo(0, 3);
    expect(progress.arrived).toBe(true);
  });

  it("auf halbem Weg sind es rund 50 %", () => {
    const progress = arrivalProgress(start, along(0.5), target);
    expect(progress.percent).toBeGreaterThan(48);
    expect(progress.percent).toBeLessThan(52);
  });

  it("der Fortschritt wächst monoton entlang der Strecke", () => {
    const values = [0, 0.2, 0.4, 0.6, 0.8, 1].map(
      f => arrivalProgress(start, along(f), target).percent
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it("die Gesamtstrecke ist die Luftlinie Start → Ziel", () => {
    const progress = arrivalProgress(start, along(0.3), target);
    expect(progress.totalM).toBeCloseTo(
      distanceMeters(start.lat, start.lon, target.lat, target.lon),
      3
    );
  });

  it("die Restdistanz ist die Luftlinie Jetzt → Ziel", () => {
    const current = along(0.3);
    const progress = arrivalProgress(start, current, target);
    expect(progress.remainingM).toBeCloseTo(
      distanceMeters(current.lat, current.lon, target.lat, target.lon),
      3
    );
  });
});

describe("arrivalProgress – Start ist gleich Ziel", () => {
  it("meldet 100 % statt durch null zu teilen", () => {
    const progress = arrivalProgress(target, target, target);
    expect(progress.totalM).toBe(0);
    expect(progress.percent).toBe(100);
    expect(progress.rawPercent).toBe(100);
    expect(progress.arrived).toBe(true);
    expect(Number.isNaN(progress.percent)).toBe(false);
  });

  it("gilt auch, wenn man sich vom Startpunkt entfernt hat", () => {
    // Start = Ziel, aber wir stehen 50 km daneben: kein Fortschritt zu rechnen
    const progress = arrivalProgress(target, start, target);
    expect(progress.percent).toBe(100);
    expect(progress.arrived).toBe(false);
    expect(progress.remainingM).toBeGreaterThan(50_000);
  });
});

describe("arrivalProgress – Rückwärtsfahren", () => {
  // Ein Punkt hinter dem Start, in der Gegenrichtung des Ziels
  const behind = along(-0.2);

  it("kommt nicht unter 0 %", () => {
    const progress = arrivalProgress(start, behind, target);
    expect(progress.percent).toBe(0);
  });

  it("meldet den negativen Wert trotzdem ehrlich als rawPercent", () => {
    const progress = arrivalProgress(start, behind, target);
    expect(progress.rawPercent).toBeLessThan(0);
  });

  it("die Restdistanz wächst beim Rückwärtsfahren", () => {
    const progress = arrivalProgress(start, behind, target);
    expect(progress.remainingM).toBeGreaterThan(progress.totalM);
  });

  it("die zurückgelegte Strecke bleibt bei 0 statt negativ zu werden", () => {
    expect(arrivalProgress(start, behind, target).coveredM).toBe(0);
  });
});

describe("arrivalProgress – über das Ziel hinaus und Umwege", () => {
  it("über das Ziel hinausgeschossen: rawPercent über 100, Anzeige gekappt", () => {
    const past = along(1.2);
    const progress = arrivalProgress(start, past, target);
    expect(progress.rawPercent).toBeGreaterThan(100);
    expect(progress.percent).toBe(100);
  });

  it("weit hinausgeschossen gilt nicht als angekommen", () => {
    const progress = arrivalProgress(start, along(1.5), target);
    expect(progress.percent).toBe(100);
    expect(progress.arrived).toBe(false);
    expect(progress.remainingM).toBeGreaterThan(ARRIVED_RADIUS_M);
  });

  it("ein Umweg quer zur Strecke lässt den Balken stehen", () => {
    // Auf halber Höhe, aber rund 30 km rechtwinklig zur Achse abgekommen:
    // Richtung Ziel ist damit nichts gewonnen und nichts verloren.
    const middle = along(0.5);
    const detour = { lat: middle.lat + 0.188, lon: middle.lon - 0.283 };
    const direct = arrivalProgress(start, middle, target);
    const off = arrivalProgress(start, detour, target);
    expect(off.remainingM).toBeGreaterThan(direct.remainingM + 5000);
    expect(Math.abs(off.percent - direct.percent)).toBeLessThan(1);
  });

  it("ein Umweg rückwärts drückt den Balken zurück, statt ihn springen zu lassen", () => {
    // 40 km in die falsche Richtung, quer weg vom Ziel
    const middle = along(0.5);
    const detour = { lat: middle.lat + 0.36, lon: middle.lon };
    const direct = arrivalProgress(start, middle, target);
    const off = arrivalProgress(start, detour, target);
    expect(off.remainingM).toBeGreaterThan(direct.remainingM);
    expect(off.percent).toBeLessThan(direct.percent);
  });

  it("der Prozentwert bleibt immer zwischen 0 und 100", () => {
    [-1, -0.3, 0, 0.5, 1, 1.4, 3].forEach(f => {
      const progress = arrivalProgress(start, along(f), target);
      expect(progress.percent).toBeGreaterThanOrEqual(0);
      expect(progress.percent).toBeLessThanOrEqual(100);
    });
  });
});

describe("arrivalProgress – angekommen", () => {
  it("gilt schon knapp vor dem Ziel als angekommen", () => {
    // Rund 100 m nördlich des Ziels
    const nearly = { lat: target.lat + 0.0009, lon: target.lon };
    const progress = arrivalProgress(start, nearly, target);
    expect(progress.remainingM).toBeLessThan(ARRIVED_RADIUS_M);
    expect(progress.arrived).toBe(true);
  });

  it("gilt einen Kilometer davor noch nicht als angekommen", () => {
    const away = { lat: target.lat + 0.009, lon: target.lon };
    expect(arrivalProgress(start, away, target).arrived).toBe(false);
  });
});

describe("crossedMilestones", () => {
  it("meldet einen frisch überschrittenen Meilenstein", () => {
    expect(crossedMilestones(20, 26)).toEqual([25]);
  });

  it("meldet mehrere auf einmal, wenn ein Fix ausgefallen ist", () => {
    expect(crossedMilestones(10, 80)).toEqual([25, 50, 75]);
  });

  it("meldet denselben Meilenstein kein zweites Mal", () => {
    expect(crossedMilestones(26, 30)).toEqual([]);
  });

  it("meldet nichts beim Zurückfallen", () => {
    expect(crossedMilestones(60, 40)).toEqual([]);
    expect(crossedMilestones(60, 60)).toEqual([]);
  });

  it("der Meilenstein zählt genau ab dem Prozentwert", () => {
    expect(crossedMilestones(49.9, 50)).toEqual([50]);
    expect(crossedMilestones(49, 49.9)).toEqual([]);
  });

  it("100 % ist kein Meilenstein, sondern die Ankunft", () => {
    expect(ARRIVAL_MILESTONES).toEqual([25, 50, 75]);
    expect(crossedMilestones(80, 100)).toEqual([]);
  });
});

describe("highestPercent / reachedMilestones", () => {
  it("behält den Höchststand, auch wenn der Wert zurückfällt", () => {
    expect(highestPercent(60, 40)).toBe(60);
    expect(highestPercent(60, 70)).toBe(70);
  });

  it("wird nie negativ", () => {
    expect(highestPercent(0, -20)).toBe(0);
  });

  it("nennt die schon erreichten Meilensteine", () => {
    expect(reachedMilestones(0)).toEqual([]);
    expect(reachedMilestones(25)).toEqual([25]);
    expect(reachedMilestones(60)).toEqual([25, 50]);
    expect(reachedMilestones(100)).toEqual([25, 50, 75]);
  });
});

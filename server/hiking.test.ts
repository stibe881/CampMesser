import { describe, expect, it } from "vitest";
import {
  cyclingTimeMinutes,
  formatWalkingTime,
  HIKING_ASCENT_M_PER_H,
  HIKING_SPEED_KMH,
  nearestRoutePoint,
  parseOsmDistanceMeters,
  parseOsmElevationMeters,
  parseSacScale,
  routeLengthMeters,
  sacScaleDescription,
  sacScaleLabel,
  walkingTimeMinutes,
  type SacGrade,
  routeLengthClass,
} from "@shared/hiking";
import { LANGUAGES } from "@shared/i18n";

describe("walkingTimeMinutes", () => {
  it("rechnet flache Strecken mit 4 km/h", () => {
    expect(walkingTimeMinutes({ lengthM: 8000 })).toBe(120);
    expect(walkingTimeMinutes({ lengthM: 1000 * HIKING_SPEED_KMH })).toBe(60);
  });

  it("zählt Höhenmeter nach SAC: grösserer Anteil plus halber kleinerer", () => {
    // 4 km flach = 1 h, 400 Hm Aufstieg = 1 h → 1 h + 0.5 h
    expect(
      walkingTimeMinutes({ lengthM: 4000, ascentM: HIKING_ASCENT_M_PER_H })
    ).toBe(90);
    // 12 km = 3 h waagrecht, 600 hoch + 600 runter = 1.5 + 0.75 = 2.25 h
    expect(
      walkingTimeMinutes({ lengthM: 12000, ascentM: 600, descentM: 600 })
    ).toBe(Math.round((3 + 2.25 / 2) * 60));
  });

  it("rechnet reine Höhenmeter ohne Strecke", () => {
    expect(walkingTimeMinutes({ lengthM: 0, ascentM: 800 })).toBe(120);
    expect(walkingTimeMinutes({ lengthM: 0, descentM: 800 })).toBe(60);
  });

  it("behandelt fehlende und unsinnige Werte als 0", () => {
    expect(walkingTimeMinutes({ lengthM: 0 })).toBe(0);
    expect(
      walkingTimeMinutes({ lengthM: 4000, ascentM: null, descentM: null })
    ).toBe(60);
    expect(
      walkingTimeMinutes({ lengthM: Number.NaN, ascentM: Number.NaN })
    ).toBe(0);
    expect(walkingTimeMinutes({ lengthM: -5000, ascentM: -300 })).toBe(0);
  });
});

describe("formatWalkingTime", () => {
  it("rundet auf 5 Minuten und schreibt Stunden aus", () => {
    expect(formatWalkingTime(45)).toBe("45 min");
    expect(formatWalkingTime(47)).toBe("45 min");
    expect(formatWalkingTime(48)).toBe("50 min");
    expect(formatWalkingTime(120)).toBe("2 h");
    expect(formatWalkingTime(133)).toBe("2 h 15 min");
    expect(formatWalkingTime(248)).toBe("4 h 10 min");
  });

  it("bleibt bei Kleinstwerten bei 5 Minuten, bei 0 aber bei 0", () => {
    expect(formatWalkingTime(1)).toBe("5 min");
    expect(formatWalkingTime(0)).toBe("0 min");
    expect(formatWalkingTime(Number.NaN)).toBe("0 min");
  });
});

describe("parseSacScale", () => {
  it("liest die OSM-Werte und die T-Schreibweise", () => {
    expect(parseSacScale("hiking")).toBe("T1");
    expect(parseSacScale("mountain_hiking")).toBe("T2");
    expect(parseSacScale("demanding_mountain_hiking")).toBe("T3");
    expect(parseSacScale("alpine_hiking")).toBe("T4");
    expect(parseSacScale("demanding_alpine_hiking")).toBe("T5");
    expect(parseSacScale("difficult_alpine_hiking")).toBe("T6");
    expect(parseSacScale(" T3 ")).toBe("T3");
    expect(parseSacScale("t6")).toBe("T6");
  });

  it("rät nichts bei unbekannten oder fehlenden Werten", () => {
    expect(parseSacScale("schwierig")).toBeNull();
    expect(parseSacScale("")).toBeNull();
    expect(parseSacScale(undefined)).toBeNull();
    expect(parseSacScale(3)).toBeNull();
  });
});

describe("SAC-Texte", () => {
  const grades: SacGrade[] = ["T1", "T2", "T3", "T4", "T5", "T6"];

  it("hat Name und Erklärung in allen vier Sprachen", () => {
    LANGUAGES.forEach(lang => {
      grades.forEach(grade => {
        const label = sacScaleLabel(grade, lang);
        expect(label.startsWith(`${grade} · `)).toBe(true);
        expect(label.length).toBeGreaterThan(grade.length + 5);
        expect(sacScaleDescription(grade, lang).length).toBeGreaterThan(30);
      });
    });
  });

  it("nutzt Deutsch als Vorgabe", () => {
    expect(sacScaleLabel("T1")).toBe("T1 · Wandern");
    expect(sacScaleDescription("T1")).toContain("Turnschuhe");
  });
});

describe("parseOsmDistanceMeters", () => {
  it("nimmt ohne Einheit Kilometer an", () => {
    expect(parseOsmDistanceMeters("12")).toBe(12000);
    expect(parseOsmDistanceMeters("12,5")).toBe(12500);
    expect(parseOsmDistanceMeters(" 12.5 km ")).toBe(12500);
    expect(parseOsmDistanceMeters("12.5km")).toBe(12500);
  });

  it("versteht Meter-Angaben", () => {
    expect(parseOsmDistanceMeters("800 m")).toBe(800);
    expect(parseOsmDistanceMeters("800m")).toBe(800);
  });

  it("liefert null statt einer geratenen Zahl", () => {
    expect(parseOsmDistanceMeters("ca. 12 km")).toBeNull();
    expect(parseOsmDistanceMeters("5-7")).toBeNull();
    expect(parseOsmDistanceMeters("12 mi")).toBeNull();
    expect(parseOsmDistanceMeters(12)).toBeNull();
    expect(parseOsmDistanceMeters(undefined)).toBeNull();
  });
});

describe("parseOsmElevationMeters", () => {
  it("nimmt ohne Einheit Meter an", () => {
    expect(parseOsmElevationMeters("1200")).toBe(1200);
    expect(parseOsmElevationMeters("1200 m")).toBe(1200);
    expect(parseOsmElevationMeters("1,2 km")).toBe(1200);
  });

  it("liefert null bei Freitext", () => {
    expect(parseOsmElevationMeters("unbekannt")).toBeNull();
    expect(parseOsmElevationMeters("")).toBeNull();
  });
});

describe("routeLengthMeters", () => {
  it("misst je Wegstück und zählt die Lücke dazwischen NICHT mit", () => {
    // 0.01° Breite ≈ 1111 m
    const einStueck = routeLengthMeters([
      [
        { lat: 46.5, lon: 7.2 },
        { lat: 46.51, lon: 7.2 },
      ],
    ]);
    expect(einStueck).toBeGreaterThan(1100);
    expect(einStueck).toBeLessThan(1120);

    const zweiStuecke = routeLengthMeters([
      [
        { lat: 46.5, lon: 7.2 },
        { lat: 46.51, lon: 7.2 },
      ],
      [
        { lat: 46.6, lon: 7.2 },
        { lat: 46.61, lon: 7.2 },
      ],
    ]);
    expect(zweiStuecke).toBeCloseTo(einStueck * 2, 0);
  });

  it("liefert 0 ohne Punkte", () => {
    expect(routeLengthMeters([])).toBe(0);
    expect(routeLengthMeters([[], [{ lat: 46.5, lon: 7.2 }]])).toBe(0);
  });
});

describe("nearestRoutePoint", () => {
  it("findet den nächsten Punkt über alle Wegstücke hinweg", () => {
    const best = nearestRoutePoint(
      [
        [
          { lat: 46.6, lon: 7.2 },
          { lat: 46.7, lon: 7.2 },
        ],
        [
          { lat: 46.51, lon: 7.2 },
          { lat: 46.55, lon: 7.2 },
        ],
      ],
      46.5,
      7.2
    );
    expect(best?.point).toEqual({ lat: 46.51, lon: 7.2 });
    expect(best?.distanceM).toBeGreaterThan(1100);
    expect(best?.distanceM).toBeLessThan(1120);
  });

  it("liefert null ohne Wegführung", () => {
    expect(nearestRoutePoint([], 46.5, 7.2)).toBeNull();
    expect(nearestRoutePoint([[]], 46.5, 7.2)).toBeNull();
  });
});

describe("cyclingTimeMinutes (#478)", () => {
  it("rechnet Tourentempo plus Aufstiegs-Zuschlag", () => {
    // 30 km flach bei 15 km/h = 120 min
    expect(cyclingTimeMinutes({ lengthM: 30_000 })).toBe(120);
    // dazu 300 Hm à 6 min/100 m = +18 min
    expect(cyclingTimeMinutes({ lengthM: 30_000, ascentM: 300 })).toBe(138);
  });

  it("behandelt Unsinn als 0", () => {
    expect(cyclingTimeMinutes({ lengthM: Number.NaN })).toBe(0);
    expect(cyclingTimeMinutes({ lengthM: 10_000, ascentM: -50 })).toBe(40);
  });
});

describe("routeLengthClass (#495)", () => {
  it("teilt Routen in kurz, mittel und lang", () => {
    expect(routeLengthClass(3000)).toBe("kurz");
    expect(routeLengthClass(5000)).toBe("kurz");
    expect(routeLengthClass(12000)).toBe("mittel");
    expect(routeLengthClass(15000)).toBe("mittel");
    expect(routeLengthClass(24000)).toBe("lang");
  });

  it("gibt null ohne verlässliche Länge (nur unter «alle» sichtbar)", () => {
    expect(routeLengthClass(undefined)).toBeNull();
    expect(routeLengthClass(0)).toBeNull();
    expect(routeLengthClass(Number.NaN)).toBeNull();
  });
});

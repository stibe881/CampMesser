import { describe, expect, it } from "vitest";
import {
  parseBarInput,
  sanitizeBar,
  sanitizeServiceDue,
  sanitizeVehicle,
} from "@shared/vehicles";
import {
  bubblePosition,
  levelingAdvice,
  sanitizeLevelProfile,
  screenTilt,
  DEFAULT_LEVEL_PROFILE,
  LEVEL_TOLERANCES,
} from "@shared/level";

describe("screenTilt", () => {
  it("übernimmt beta/gamma in natürlicher Ausrichtung (obere Kante höher = pitch positiv)", () => {
    // beta 5 = obere Kante höher; gamma 3 = rechte Kante tiefer → roll -3
    expect(screenTilt(5, 3, 0)).toEqual({ pitch: 5, roll: -3 });
  });

  it("dreht die Achsen bei gedrehtem Bildschirm mit", () => {
    expect(screenTilt(5, 3, 90)).toEqual({ pitch: 3, roll: 5 });
    expect(screenTilt(5, 3, 180)).toEqual({ pitch: -5, roll: 3 });
    expect(screenTilt(5, 3, 270)).toEqual({ pitch: -3, roll: -5 });
  });

  it("normalisiert auch negative Winkelangaben", () => {
    expect(screenTilt(5, 3, -90)).toEqual(screenTilt(5, 3, 270));
    expect(screenTilt(5, 3, 360)).toEqual(screenTilt(5, 3, 0));
  });
});

describe("bubblePosition", () => {
  it("wandert zur höheren Seite und skaliert linear", () => {
    const pos = bubblePosition({ pitch: 5, roll: -5 }, 10);
    expect(pos.y).toBeCloseTo(0.5);
    expect(pos.x).toBeCloseTo(-0.5);
  });

  it("begrenzt die Auslenkung auf ±1", () => {
    const pos = bubblePosition({ pitch: 45, roll: -45 }, 10);
    expect(pos).toEqual({ x: -1, y: 1 });
  });
});

describe("levelingAdvice", () => {
  it("meldet Waage innerhalb der Toleranz", () => {
    const advice = levelingAdvice({ pitch: 0.3, roll: -0.2 });
    expect(advice.level).toBe(true);
    expect(advice.tips).toEqual([]);
  });

  it("empfiehlt, die tiefe Seite zu unterlegen", () => {
    const advice = levelingAdvice({ pitch: 2.16, roll: -1.5 });
    expect(advice.level).toBe(false);
    expect(advice.tips).toEqual([
      "Vorne ist 2,2° höher – lege hinten unter.",
      "Links ist 1,5° höher – lege rechts unter.",
    ]);
  });

  it("gibt nur für die verletzte Achse einen Tipp", () => {
    const advice = levelingAdvice({ pitch: -1.0, roll: 0.1 });
    expect(advice.tips).toEqual(["Hinten ist 1,0° höher – lege vorne unter."]);
  });
});

describe("Fahrzeug-Profile", () => {
  it("hat als Standard den Wohnwagen mit der bisherigen Toleranz 0,4°", () => {
    expect(DEFAULT_LEVEL_PROFILE).toBe("caravan");
    expect(LEVEL_TOLERANCES[DEFAULT_LEVEL_PROFILE]).toBe(0.4);
    // Ohne Profil-Argument muss exakt dasselbe herauskommen wie mit «caravan»
    const tilt = { pitch: 0.6, roll: -0.9 };
    expect(levelingAdvice(tilt)).toEqual(
      levelingAdvice(tilt, undefined, "de", "caravan")
    );
  });

  it("nutzt die Toleranz des Profils: 1,0° ist im Zelt in Waage, im Bus nicht", () => {
    const tilt = { pitch: 1.0, roll: 0 };
    expect(levelingAdvice(tilt, undefined, "de", "tent").level).toBe(true);
    expect(levelingAdvice(tilt, undefined, "de", "bus").level).toBe(false);
    expect(levelingAdvice(tilt, undefined, "de", "caravan").level).toBe(false);
  });

  it("gibt profilspezifische Tipps", () => {
    const tilt = { pitch: 2.0, roll: -2.0 };
    expect(levelingAdvice(tilt, undefined, "de", "tent").tips).toEqual([
      "Vorne ist 2,0° höher – schlaf mit dem Kopf nach vorne oder polstere hinten unter der Matte.",
      "Links ist 2,0° höher – dreh das Zelt quer oder polstere rechts unter der Matte.",
    ]);
    expect(levelingAdvice(tilt, undefined, "de", "bus").tips).toEqual([
      "Vorne ist 2,0° höher – fahr mit den Hinterrädern auf Keile.",
      "Links ist 2,0° höher – fahr mit den rechten Rädern auf Keile.",
    ]);
  });

  it("übersetzt die profilspezifischen Tipps", () => {
    expect(
      levelingAdvice({ pitch: 0, roll: 2.0 }, undefined, "en", "bus").tips
    ).toEqual([
      "The right side is 2.0° higher – drive the left wheels onto levelling ramps.",
    ]);
    expect(
      levelingAdvice({ pitch: 0, roll: 2.0 }, undefined, "fr", "tent").tips
    ).toEqual([
      "La droite est plus haute de 2,0° – tourne la tente ou rembourre sous le matelas à gauche.",
    ]);
  });

  it("lässt eine ausdrücklich übergebene Toleranz vorgehen", () => {
    // Profil «tent» erlaubt 1,5°, hier wird auf 0,1° verschärft
    expect(
      levelingAdvice({ pitch: 0.5, roll: 0 }, 0.1, "de", "tent").level
    ).toBe(false);
  });

  it("führt unbekannte gespeicherte Profile auf den Standard zurück", () => {
    expect(sanitizeLevelProfile("tent")).toBe("tent");
    expect(sanitizeLevelProfile("bus")).toBe("bus");
    expect(sanitizeLevelProfile("wohnmobil")).toBe(DEFAULT_LEVEL_PROFILE);
    expect(sanitizeLevelProfile(null)).toBe(DEFAULT_LEVEL_PROFILE);
    expect(sanitizeLevelProfile(42)).toBe(DEFAULT_LEVEL_PROFILE);
  });
});

describe("Reifendruck & Service (#481)", () => {
  it("säubert bar-Werte und Service-Datum", () => {
    expect(sanitizeBar(2.5)).toBe(2.5);
    expect(sanitizeBar(2.55)).toBe(2.6);
    expect(sanitizeBar(99)).toBe(10);
    expect(sanitizeBar(0)).toBeNull();
    expect(sanitizeBar("2.5")).toBeNull();
    expect(parseBarInput("2,5")).toBe(2.5);
    expect(parseBarInput("")).toBeNull();
    expect(sanitizeServiceDue("2026-10-12")).toBe("2026-10-12");
    expect(sanitizeServiceDue("bald")).toBeNull();
  });

  it("nimmt die Felder durch sanitizeVehicle mit", () => {
    const vehicle = sanitizeVehicle(
      {
        name: "Bus",
        kind: "bus",
        tireFrontBar: 2.5,
        tireRearBar: 3,
        serviceDue: "2026-10-12",
      },
      "v1"
    );
    expect(vehicle?.tireFrontBar).toBe(2.5);
    expect(vehicle?.tireRearBar).toBe(3);
    expect(vehicle?.serviceDue).toBe("2026-10-12");
  });
});

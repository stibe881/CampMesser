import { describe, expect, it } from "vitest";
import { bubblePosition, levelingAdvice, screenTilt } from "@shared/level";

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

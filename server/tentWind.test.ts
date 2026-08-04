import { describe, expect, it } from "vitest";
import {
  ALIGNMENT_FAIR_DEG,
  ALIGNMENT_GOOD_DEG,
  alignmentQuality,
  angleDifference,
  normalizeDegrees,
  recommendedHeading,
  tentWindAdvice,
  windBlowsToward,
  windLevel,
} from "@shared/tentWind";

describe("normalizeDegrees", () => {
  it("bringt Winkel auf 0 bis 360", () => {
    expect(normalizeDegrees(0)).toBe(0);
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(-370)).toBe(350);
  });

  it("macht aus kaputten Werten null", () => {
    expect(normalizeDegrees(NaN)).toBe(0);
    expect(normalizeDegrees(Infinity)).toBe(0);
  });
});

describe("windBlowsToward", () => {
  it("dreht die Herkunft um 180 Grad", () => {
    expect(windBlowsToward(270)).toBe(90); // aus West bläst nach Ost
    expect(windBlowsToward(0)).toBe(180); // aus Nord bläst nach Süd
    expect(windBlowsToward(200)).toBe(20);
  });
});

describe("angleDifference", () => {
  it("nimmt immer den kürzeren Weg", () => {
    expect(angleDifference(10, 350)).toBe(20);
    expect(angleDifference(350, 10)).toBe(20);
    expect(angleDifference(0, 180)).toBe(180);
    expect(angleDifference(90, 90)).toBe(0);
  });
});

describe("recommendedHeading", () => {
  it("richtet Tunnel und Tarp mit dem schmalen Ende in den Wind", () => {
    expect(recommendedHeading(270, "tunnel")).toBe(270);
    expect(recommendedHeading(270, "tarp")).toBe(270);
  });

  it("dreht beim Kuppelzelt den Eingang weg vom Wind", () => {
    expect(recommendedHeading(270, "dome")).toBe(90);
  });
});

describe("windLevel", () => {
  it("stuft nach Böen ein", () => {
    expect(windLevel(5)).toBe("calm");
    expect(windLevel(19.9)).toBe("calm");
    expect(windLevel(20)).toBe("breezy");
    expect(windLevel(39)).toBe("breezy");
    expect(windLevel(40)).toBe("windy");
    expect(windLevel(59)).toBe("windy");
    expect(windLevel(60)).toBe("storm");
    expect(windLevel(120)).toBe("storm");
  });

  it("gilt ohne Messwert als ruhig", () => {
    expect(windLevel(NaN)).toBe("calm");
  });
});

describe("alignmentQuality", () => {
  it("bewertet die Abweichung", () => {
    expect(alignmentQuality(0)).toBe("good");
    expect(alignmentQuality(ALIGNMENT_GOOD_DEG)).toBe("good");
    expect(alignmentQuality(ALIGNMENT_GOOD_DEG + 1)).toBe("fair");
    expect(alignmentQuality(ALIGNMENT_FAIR_DEG)).toBe("fair");
    expect(alignmentQuality(ALIGNMENT_FAIR_DEG + 1)).toBe("poor");
  });

  it("nimmt das Vorzeichen nicht krumm", () => {
    expect(alignmentQuality(-10)).toBe("good");
  });
});

describe("tentWindAdvice", () => {
  it("rechnet Herkunft, Blasrichtung und Empfehlung zusammen", () => {
    const advice = tentWindAdvice(270, 15, "tunnel", null);
    expect(advice.windFromDeg).toBe(270);
    expect(advice.windTowardDeg).toBe(90);
    expect(advice.recommendedDeg).toBe(270);
    expect(advice.level).toBe("calm");
  });

  it("lässt ohne Kompass die gerätebezogenen Werte offen", () => {
    const advice = tentWindAdvice(180, 50, "dome", null);
    expect(advice.offsetDeg).toBeNull();
    expect(advice.quality).toBeNull();
    expect(advice.turnDeg).toBeNull();
    expect(advice.recommendedDeg).toBe(0);
    expect(advice.level).toBe("windy");
  });

  it("bewertet eine passende Ausrichtung als gut", () => {
    const advice = tentWindAdvice(270, 10, "tunnel", 275);
    expect(advice.offsetDeg).toBe(5);
    expect(advice.quality).toBe("good");
  });

  it("sagt, in welche Richtung gedreht werden muss", () => {
    // Empfehlung 270, Blick 250 → 20 Grad nach rechts
    expect(tentWindAdvice(270, 10, "tunnel", 250).turnDeg).toBe(20);
    // Empfehlung 270, Blick 290 → 20 Grad nach links
    expect(tentWindAdvice(270, 10, "tunnel", 290).turnDeg).toBe(-20);
  });

  it("nimmt über den Nordpunkt hinweg den kürzeren Weg", () => {
    // Empfehlung 10, Blick 350 → 20 Grad nach rechts, nicht 340 nach links
    const advice = tentWindAdvice(10, 10, "tunnel", 350);
    expect(advice.turnDeg).toBe(20);
    expect(advice.offsetDeg).toBe(20);
  });

  it("meldet eine schlechte Ausrichtung", () => {
    const advice = tentWindAdvice(270, 70, "tunnel", 90);
    expect(advice.offsetDeg).toBe(180);
    expect(advice.quality).toBe("poor");
    expect(advice.level).toBe("storm");
  });
});

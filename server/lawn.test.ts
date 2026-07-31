import { describe, expect, it } from "vitest";
import { deriveMoisture, estimateLawnTolerance, formatHours, lawnVerdict } from "../shared/lawn";

const base = {
  floor: "standard" as const,
  grass: "normal" as const,
  temperature: 20,
  sun: "partial" as const,
  moisture: "normal" as const,
};

describe("estimateLawnTolerance", () => {
  it("liefert für Standardbedingungen ca. 61 h (72 h Basis × 0.85 Temperaturfaktor > 20 °C ausgenommen)", () => {
    const r = estimateLawnTolerance(base);
    expect(r.yellowingHours).toBeGreaterThan(48);
    expect(r.yellowingHours).toBeLessThan(96);
    expect(r.damageHours).toBeGreaterThan(r.yellowingHours);
    expect(r.moveAfterHours).toBeLessThan(r.yellowingHours);
  });

  it("Mesh-Boden erlaubt längere Standzeit als Footprint", () => {
    const mesh = estimateLawnTolerance({ ...base, floor: "mesh" });
    const footprint = estimateLawnTolerance({ ...base, floor: "footprint" });
    expect(mesh.yellowingHours).toBeGreaterThan(footprint.yellowingHours);
  });

  it("Hitze und pralle Sonne verkürzen die tolerierte Standzeit deutlich", () => {
    const hot = estimateLawnTolerance({ ...base, temperature: 32, sun: "full" });
    const mild = estimateLawnTolerance({ ...base, temperature: 15, sun: "shade" });
    expect(hot.yellowingHours).toBeLessThan(mild.yellowingHours / 2);
  });

  it("empfindlicher Rasen ist schneller geschädigt als robuster", () => {
    const delicate = estimateLawnTolerance({ ...base, grass: "delicate" });
    const robust = estimateLawnTolerance({ ...base, grass: "robust" });
    expect(delicate.yellowingHours).toBeLessThan(robust.yellowingHours);
  });

  it("unterschreitet nie 12 h und übersteigt nie 240 h Vergilbungszeit", () => {
    const worst = estimateLawnTolerance({
      floor: "footprint",
      grass: "delicate",
      temperature: 35,
      sun: "full",
      moisture: "wet",
    });
    const best = estimateLawnTolerance({
      floor: "mesh",
      grass: "robust",
      temperature: 5,
      sun: "shade",
      moisture: "normal",
    });
    expect(worst.yellowingHours).toBeGreaterThanOrEqual(12);
    expect(best.yellowingHours).toBeLessThanOrEqual(240);
  });
});

describe("lawnVerdict", () => {
  it("bewertet geplante Standzeiten korrekt", () => {
    const r = { yellowingHours: 72, damageHours: 166, moveAfterHours: 58 };
    expect(lawnVerdict(48, r)).toBe("safe");
    expect(lawnVerdict(100, r)).toBe("caution");
    expect(lawnVerdict(200, r)).toBe("damage");
  });
});

describe("formatHours", () => {
  it("formatiert Stunden lesbar", () => {
    expect(formatHours(10)).toBe("10 Std.");
    expect(formatHours(24)).toBe("1 Tag");
    expect(formatHours(60)).toBe("2 Tage 12 Std.");
  });
});

describe("deriveMoisture", () => {
  it("nutzt primär die Bodenfeuchte-Prognose (m³/m³)", () => {
    expect(deriveMoisture(0.35, 0)).toBe("wet");
    expect(deriveMoisture(0.2, 0)).toBe("normal");
    expect(deriveMoisture(0.1, 20)).toBe("dry"); // Bodenfeuchte schlägt Niederschlag
  });

  it("fällt ohne Bodenfeuchte-Daten auf den Niederschlag zurück", () => {
    expect(deriveMoisture(null, 8)).toBe("wet");
    expect(deriveMoisture(undefined, 1)).toBe("normal");
    expect(deriveMoisture(null, 0)).toBe("dry");
  });

  it("ignoriert ungültige Bodenfeuchte-Werte (NaN)", () => {
    expect(deriveMoisture(Number.NaN, 8)).toBe("wet");
  });
});

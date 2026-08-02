import { describe, expect, it } from "vitest";
// Die Grössen-Berechnung liegt im Client-Code, ist aber reine Logik ohne DOM.
import { computeResizedDimensions } from "../client/src/lib/imageResize";

describe("computeResizedDimensions", () => {
  it("begrenzt die längste Kante im Querformat", () => {
    expect(computeResizedDimensions(3200, 2400, 1600)).toEqual({
      width: 1600,
      height: 1200,
    });
  });

  it("begrenzt die längste Kante im Hochformat", () => {
    expect(computeResizedDimensions(2400, 3200, 1600)).toEqual({
      width: 1200,
      height: 1600,
    });
  });

  it("skaliert kleine Bilder nie hoch", () => {
    expect(computeResizedDimensions(800, 600, 1600)).toEqual({
      width: 800,
      height: 600,
    });
    expect(computeResizedDimensions(1600, 1600, 1600)).toEqual({
      width: 1600,
      height: 1600,
    });
  });

  it("rundet die kurze Kante korrekt", () => {
    // 2000 * (1600 / 3000) = 1066.67 → 1067
    expect(computeResizedDimensions(3000, 2000, 1600)).toEqual({
      width: 1600,
      height: 1067,
    });
  });

  it("liefert für extreme Seitenverhältnisse mindestens 1 px", () => {
    expect(computeResizedDimensions(10000, 2, 1600)).toEqual({
      width: 1600,
      height: 1,
    });
  });

  it("wirft bei ungültigen Eingaben", () => {
    expect(() => computeResizedDimensions(0, 100, 1600)).toThrow();
    expect(() => computeResizedDimensions(100, -5, 1600)).toThrow();
    expect(() => computeResizedDimensions(100, 100, 0)).toThrow();
    expect(() => computeResizedDimensions(Number.NaN, 100, 1600)).toThrow();
  });
});

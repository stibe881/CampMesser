import { describe, expect, it } from "vitest";
// Kompass-Glättung liegt im Client-Code, ist aber reine Mathematik ohne DOM.
import {
  HEADING_SMOOTHING_ALPHA,
  normalizeHeading,
  smoothHeading,
} from "../client/src/lib/heading";

describe("normalizeHeading", () => {
  it("bringt Winkel in den Bereich [0, 360)", () => {
    expect(normalizeHeading(0)).toBe(0);
    expect(normalizeHeading(360)).toBe(0);
    expect(normalizeHeading(725)).toBe(5);
    expect(normalizeHeading(-90)).toBe(270);
  });
});

describe("smoothHeading", () => {
  it("übernimmt den ersten Messwert unverändert (normalisiert)", () => {
    expect(smoothHeading(null, 42)).toBe(42);
    expect(smoothHeading(null, -30)).toBe(330);
  });

  it("glättet kleine Bewegungen wie ein gewohntes exponentielles Mittel", () => {
    // 10° → 20° mit alpha 0.2: erwartet ≈ 12° (Vektor-Mittel ist bei so
    // kleinen Differenzen praktisch linear)
    expect(smoothHeading(10, 20, 0.2)).toBeCloseTo(12, 1);
  });

  it("läuft beim Umschlag 359° → 1° NICHT über 180°", () => {
    const smoothed = smoothHeading(359, 1, 0.2);
    // Kurzer Weg über Norden: 0.6° Richtung 1°, also ≈ 359.4°
    expect(smoothed).toBeCloseTo(359.4, 1);
    // und sicher nicht auf der «falschen Seite» des Kreises
    expect(smoothed > 270 || smoothed < 90).toBe(true);
  });

  it("läuft auch in der Gegenrichtung 1° → 359° über Norden", () => {
    expect(smoothHeading(1, 359, 0.2)).toBeCloseTo(0.6, 1);
  });

  it("liefert immer Werte im Bereich [0, 360)", () => {
    const smoothed = smoothHeading(350, 10, 0.5);
    expect(smoothed).toBeGreaterThanOrEqual(0);
    expect(smoothed).toBeLessThan(360);
    expect(smoothed).toBeCloseTo(0, 5);
  });

  it("übernimmt mit alpha 1 den neuen Wert vollständig", () => {
    expect(smoothHeading(90, 180, 1)).toBeCloseTo(180, 5);
  });

  it("fällt bei sich auslöschenden Richtungen auf den neuen Wert zurück", () => {
    // 0° und 180° mit alpha 0.5: Vektorsumme ist null → neuer Wert gewinnt
    expect(smoothHeading(0, 180, 0.5)).toBe(180);
  });

  it("nutzt ohne Angabe den Standard-Faktor 0.2", () => {
    expect(HEADING_SMOOTHING_ALPHA).toBe(0.2);
    expect(smoothHeading(10, 20)).toBeCloseTo(smoothHeading(10, 20, 0.2), 10);
  });
});

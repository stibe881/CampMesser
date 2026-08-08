/**
 * Schattenverlauf am Stellplatz (#452): Stichproben → Abschnitte + Summen.
 */
import { describe, expect, it } from "vitest";
import { shadeTimeline, type ShadeSample } from "@shared/shadeTimeline";

/** Stichproben im 10-Minuten-Takt bauen. */
function samples(
  spec: { from: number; to: number; up: boolean; shaded: boolean }[]
): ShadeSample[] {
  const result: ShadeSample[] = [];
  for (const s of spec) {
    for (let m = s.from; m < s.to; m += 10) {
      result.push({ minutes: m, up: s.up, shaded: s.shaded });
    }
  }
  return result.sort((a, b) => a.minutes - b.minutes);
}

describe("shadeTimeline", () => {
  it("fasst Sonne- und Schatten-Abschnitte zusammen und summiert", () => {
    const timeline = shadeTimeline(
      samples([
        { from: 0, to: 360, up: false, shaded: false }, // Nacht
        { from: 360, to: 600, up: true, shaded: false }, // Morgensonne
        { from: 600, to: 720, up: true, shaded: true }, // Baum
        { from: 720, to: 1200, up: true, shaded: false }, // Nachmittag
        { from: 1200, to: 1440, up: false, shaded: false }, // Nacht
      ])
    );
    expect(timeline.segments).toEqual([
      { startMinutes: 360, endMinutes: 600, shaded: false },
      { startMinutes: 600, endMinutes: 720, shaded: true },
      { startMinutes: 720, endMinutes: 1200, shaded: false },
    ]);
    expect(timeline.sunMinutes).toBe(720);
    expect(timeline.shadeMinutes).toBe(120);
    expect(timeline.dayStartMinutes).toBe(360);
    expect(timeline.dayEndMinutes).toBe(1200);
  });

  it("liefert ohne Sonne über dem Horizont leere Werte", () => {
    const timeline = shadeTimeline(
      samples([{ from: 0, to: 1440, up: false, shaded: false }])
    );
    expect(timeline.segments).toEqual([]);
    expect(timeline.sunMinutes).toBe(0);
    expect(timeline.dayStartMinutes).toBeNull();
  });
});

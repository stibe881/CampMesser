import { describe, expect, it } from "vitest";
import {
  cleanBuffer,
  DEFAULT_BUFFER_MIN,
  formatDuration,
  formatMinutes,
  MAX_BUFFER_MIN,
  turnaroundTime,
} from "@shared/turnaround";

/**
 * Die Umkehrzeit (#379).
 *
 * WARUM DIESE RECHNUNG GEPRÜFT GEHÖRT: Sie ist die einzige in dieser App,
 * bei der ein Fehler jemanden im Dunkeln am Berg stehen lässt. Und sie
 * ist zu einfach, um beim Lesen aufzufallen – ein `/2` an der falschen
 * Stelle oder eine vergessene Reserve sieht aus wie richtig.
 *
 * Alle Zeiten in Minuten seit Mitternacht: 13:00 = 780, 20:30 = 1230.
 */
const SUNSET = 20 * 60 + 30; // 20:30

describe("Umkehrzeit bei «hin und zurück»", () => {
  it("liegt in der Mitte der verbleibenden Zeit", () => {
    // 13:00, Sonnenuntergang 20:30, Reserve 45 → bis 19:45 zurück sein,
    // also 405 Minuten übrig; die Hälfte gehört dem Rückweg.
    const result = turnaroundTime({
      nowMinutes: 13 * 60,
      sunsetMinutes: SUNSET,
      bufferMinutes: 45,
      totalMinutes: 240,
      shape: "outAndBack",
    });
    expect(result.turnaroundMinutes).toBe(13 * 60 + 202); // 16:22
    expect(result.minutesLeft).toBe(202);
    expect(result.fits).toBe(true);
    expect(result.overdue).toBe(false);
  });

  it("rundet ab, nicht auf", () => {
    // Bei ungerader Restzeit lieber fünf Minuten zu früh umkehren als
    // fünf zu spät – deshalb `Math.floor`.
    const result = turnaroundTime({
      nowMinutes: 600,
      sunsetMinutes: 600 + 45 + 7, // 7 Minuten Fenster
      bufferMinutes: 45,
      totalMinutes: 10,
      shape: "outAndBack",
    });
    expect(result.minutesLeft).toBe(3);
  });

  it("merkt, wenn die Zeit für die geplante Tour nicht mehr reicht", () => {
    const result = turnaroundTime({
      nowMinutes: 18 * 60,
      sunsetMinutes: SUNSET,
      bufferMinutes: 45,
      totalMinutes: 240,
      shape: "outAndBack",
    });
    expect(result.fits).toBe(false);
    // Aufbrechen kann man trotzdem – nur eben nicht für die ganze Tour.
    expect(result.turnaroundMinutes).toBe(18 * 60 + 52);
  });

  it("meldet eine bereits verstrichene Umkehrzeit", () => {
    const result = turnaroundTime({
      nowMinutes: 20 * 60,
      sunsetMinutes: SUNSET,
      bufferMinutes: 45,
      totalMinutes: 120,
      shape: "outAndBack",
    });
    expect(result.overdue).toBe(true);
    expect(result.minutesLeft).toBeLessThanOrEqual(0);
  });
});

describe("Umkehrzeit auf dem Rundweg", () => {
  it("gibt es nicht – dafür den spätesten Start", () => {
    // Auf der Runde spart Umkehren nichts, sobald man über die Hälfte
    // ist. Eine Umkehrzeit hinzuschreiben wäre gelogen.
    const result = turnaroundTime({
      nowMinutes: 9 * 60,
      sunsetMinutes: SUNSET,
      bufferMinutes: 45,
      totalMinutes: 300,
      shape: "loop",
    });
    expect(result.turnaroundMinutes).toBeNull();
    expect(result.latestStartMinutes).toBe(19 * 60 + 45 - 300); // 14:45
    expect(result.fits).toBe(true);
  });

  it("reicht nicht mehr, wenn die Runde länger dauert als der Tag", () => {
    const result = turnaroundTime({
      nowMinutes: 16 * 60,
      sunsetMinutes: SUNSET,
      bufferMinutes: 45,
      totalMinutes: 300,
      shape: "loop",
    });
    expect(result.fits).toBe(false);
  });
});

describe("Ohne Sonnenuntergang", () => {
  it("wird nichts erfunden", () => {
    // Polarsommer oder kaputte Koordinate: Eine ausgedachte Umkehrzeit
    // wäre schlimmer als gar keine.
    const result = turnaroundTime({
      nowMinutes: 12 * 60,
      sunsetMinutes: null,
      totalMinutes: 200,
      shape: "outAndBack",
    });
    expect(result.turnaroundMinutes).toBeNull();
    expect(result.latestStartMinutes).toBeNull();
    expect(result.fits).toBe(true);
    expect(result.overdue).toBe(false);
  });
});

describe("Reserve", () => {
  it("ohne Angabe die vorgeschlagene", () => {
    expect(cleanBuffer(undefined)).toBe(DEFAULT_BUFFER_MIN);
    expect(cleanBuffer(null)).toBe(DEFAULT_BUFFER_MIN);
    expect(cleanBuffer(Number.NaN)).toBe(DEFAULT_BUFFER_MIN);
  });

  it("bleibt im erlaubten Bereich", () => {
    expect(cleanBuffer(-30)).toBe(0);
    expect(cleanBuffer(1000)).toBe(MAX_BUFFER_MIN);
    expect(cleanBuffer(20.4)).toBe(20);
  });
});

describe("Anzeige", () => {
  it("Uhrzeit zweistellig und ohne 25 Uhr", () => {
    expect(formatMinutes(0)).toBe("00:00");
    expect(formatMinutes(9 * 60 + 5)).toBe("09:05");
    expect(formatMinutes(1230)).toBe("20:30");
    // Über Mitternacht hinaus soll nicht «25:10» dastehen.
    expect(formatMinutes(1510)).toBe("01:10");
    expect(formatMinutes(-50)).toBe("23:10");
  });

  it("Dauer lesbar, ohne «0 h»", () => {
    expect(formatDuration(40)).toBe("40 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(130)).toBe("2 h 10 min");
    expect(formatDuration(-5)).toBe("0 min");
  });
});

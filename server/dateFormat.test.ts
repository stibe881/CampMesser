import { describe, expect, it } from "vitest";
import {
  fmtDate,
  fmtDayMonth,
  fmtLong,
  fmtMedium,
  fmtNumeric,
  fmtShort,
  fmtWeekdayDay,
  fmtWeekdayLong,
  fmtWeekdayShort,
} from "../client/src/lib/dateFormat";
import { LANGUAGES } from "@shared/i18n";

/**
 * Die Formate selbst kommen von Intl – geprüft wird nicht, wie das
 * Deutsche einen Monat abkürzt, sondern dass jedes Format sich von den
 * anderen unterscheidet und in jeder Sprache etwas liefert. Genau das
 * ging vorher verloren: 29 handgeschriebene Varianten, von denen niemand
 * mehr wusste, welche wo steht (#321).
 */
const DAY = new Date("2026-08-07T12:00:00");

describe("Datums-Formate", () => {
  it("nehmen Date, ISO-Zeichenkette und Zeitstempel gleichermassen", () => {
    expect(fmtLong("2026-08-07T12:00:00", "de")).toBe(fmtLong(DAY, "de"));
    expect(fmtLong(DAY.getTime(), "de")).toBe(fmtLong(DAY, "de"));
  });

  it("liefern in jeder Sprache einen nicht leeren Text", () => {
    const all = [
      fmtDate,
      fmtLong,
      fmtMedium,
      fmtShort,
      fmtNumeric,
      fmtDayMonth,
      fmtWeekdayDay,
      fmtWeekdayShort,
      fmtWeekdayLong,
    ];
    for (const lang of LANGUAGES) {
      for (const fn of all) {
        expect(fn(DAY, lang).length).toBeGreaterThan(0);
      }
    }
  });

  it("die langen Formate nennen das Jahr, die kurzen nicht", () => {
    expect(fmtLong(DAY, "de")).toContain("2026");
    expect(fmtMedium(DAY, "de")).toContain("2026");
    expect(fmtNumeric(DAY, "de")).toContain("2026");
    expect(fmtShort(DAY, "de")).not.toContain("2026");
    expect(fmtDayMonth(DAY, "de")).not.toContain("2026");
    expect(fmtWeekdayDay(DAY, "de")).not.toContain("2026");
  });

  it("die Wochentags-Formate nennen den Wochentag", () => {
    // 7. August 2026 ist ein Freitag.
    expect(fmtWeekdayDay(DAY, "de")).toMatch(/Fr/);
    expect(fmtWeekdayShort(DAY, "de")).toMatch(/Fr/);
    expect(fmtWeekdayLong(DAY, "de")).toMatch(/Freitag/);
    expect(fmtLong(DAY, "de")).not.toMatch(/Fr/);
  });

  it("kein Format gleicht einem anderen", () => {
    // Zwei gleiche Formate wären ein Zeichen dafür, dass eines davon
    // überflüssig ist – und die nächste Stelle wieder rät, welches gilt.
    const rendered = [
      fmtDate(DAY, "de"),
      fmtLong(DAY, "de"),
      fmtMedium(DAY, "de"),
      fmtShort(DAY, "de"),
      fmtNumeric(DAY, "de"),
      fmtDayMonth(DAY, "de"),
      fmtWeekdayDay(DAY, "de"),
      fmtWeekdayShort(DAY, "de"),
      fmtWeekdayLong(DAY, "de"),
    ];
    expect(new Set(rendered).size).toBe(rendered.length);
  });
});

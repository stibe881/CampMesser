import { describe, expect, it } from "vitest";
import { addMonths, monthGrid } from "@shared/calendar";

describe("monthGrid", () => {
  it("beginnt jede Woche am Montag und hat immer 7 Zellen", () => {
    const weeks = monthGrid(2026, 8);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
      const monday = new Date(`${week[0].iso}T00:00:00Z`);
      expect(monday.getUTCDay()).toBe(1);
    }
  });

  it("August 2026 (1. = Samstag): Überhang ab Montag 27.07., 6 Wochen", () => {
    const weeks = monthGrid(2026, 8);
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toEqual({ iso: "2026-07-27", inMonth: false });
    expect(weeks[0][5]).toEqual({ iso: "2026-08-01", inMonth: true });
    expect(weeks[5][6]).toEqual({ iso: "2026-09-06", inMonth: false });
  });

  it("enthält alle Tage des Monats genau einmal", () => {
    const weeks = monthGrid(2026, 8);
    const inMonth = weeks.flat().filter(d => d.inMonth);
    expect(inMonth).toHaveLength(31);
    expect(inMonth[0].iso).toBe("2026-08-01");
    expect(inMonth[30].iso).toBe("2026-08-31");
    expect(new Set(inMonth.map(d => d.iso)).size).toBe(31);
  });

  it("Juni 2026 (1. = Montag): kein führender Überhang, 5 Wochen", () => {
    const weeks = monthGrid(2026, 6);
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toEqual({ iso: "2026-06-01", inMonth: true });
    expect(weeks[4][6]).toEqual({ iso: "2026-07-05", inMonth: false });
  });

  it("Februar 2027 (1. = Montag, 28 Tage): exakt 4 Wochen ohne Überhang", () => {
    const weeks = monthGrid(2027, 2);
    expect(weeks).toHaveLength(4);
    expect(weeks[0][0]).toEqual({ iso: "2027-02-01", inMonth: true });
    expect(weeks[3][6]).toEqual({ iso: "2027-02-28", inMonth: true });
    expect(weeks.flat().every(d => d.inMonth)).toBe(true);
  });

  it("Schaltjahr: Februar 2024 enthält den 29.02.", () => {
    const days = monthGrid(2024, 2)
      .flat()
      .filter(d => d.inMonth);
    expect(days).toHaveLength(29);
    expect(days[28].iso).toBe("2024-02-29");
  });

  it("Jahreswechsel: Dezember 2026 endet mit Januar-Überhang", () => {
    const weeks = monthGrid(2026, 12);
    const last = weeks[weeks.length - 1][6];
    expect(last).toEqual({ iso: "2027-01-03", inMonth: false });
  });
});

describe("addMonths", () => {
  it("verschiebt innerhalb des Jahres", () => {
    expect(addMonths(2026, 5, 1)).toEqual({ year: 2026, month: 6 });
    expect(addMonths(2026, 5, -2)).toEqual({ year: 2026, month: 3 });
  });

  it("überträgt über den Jahreswechsel", () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(2026, 6, -18)).toEqual({ year: 2024, month: 12 });
  });
});

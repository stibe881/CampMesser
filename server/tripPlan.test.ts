import { describe, expect, it } from "vitest";
import {
  planDays,
  planItemsForDay,
  planProgress,
  sanitizePlanTime,
  sortPlanItems,
} from "@shared/tripPlan";

const item = (
  id: number,
  day: string,
  timeAt: string | null,
  done = false
) => ({ id, day, title: `Eintrag ${id}`, timeAt, done });

describe("Tagesplan (#666)", () => {
  it("sortiert nach Tag, dann Zeiten zuerst, dann Erfassungs-Reihenfolge", () => {
    const sorted = sortPlanItems([
      item(4, "2026-08-12", null),
      item(1, "2026-08-12", "14:00"),
      item(2, "2026-08-11", null),
      item(3, "2026-08-12", "09:30"),
      item(5, "2026-08-12", null),
    ]);
    expect(sorted.map(i => i.id)).toEqual([2, 3, 1, 4, 5]);
  });

  it("liefert die Einträge eines Tags und die geplanten Tage", () => {
    const items = [
      item(1, "2026-08-12", "14:00"),
      item(2, "2026-08-11", null),
      item(3, "2026-08-12", null),
    ];
    expect(planItemsForDay(items, "2026-08-12").map(i => i.id)).toEqual([1, 3]);
    expect(planItemsForDay(items, "2026-08-13")).toEqual([]);
    expect(planDays(items)).toEqual(["2026-08-11", "2026-08-12"]);
  });

  it("zählt den Fortschritt", () => {
    expect(
      planProgress([
        item(1, "2026-08-11", null, true),
        item(2, "2026-08-11", null),
        item(3, "2026-08-12", null, true),
      ])
    ).toEqual({ total: 3, done: 2 });
    expect(planProgress([])).toEqual({ total: 0, done: 0 });
  });

  it("säubert Zeit-Angaben", () => {
    expect(sanitizePlanTime("09:30")).toBe("09:30");
    expect(sanitizePlanTime(" 23:59 ")).toBe("23:59");
    expect(sanitizePlanTime("24:00")).toBeNull();
    expect(sanitizePlanTime("9:30")).toBeNull();
    expect(sanitizePlanTime("")).toBeNull();
    expect(sanitizePlanTime(undefined)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { ideasForMonth, tripTouchesMonth } from "@shared/monthIdeas";

const trip = (
  placeName: string | null,
  startDate: string,
  endDate: string
) => ({
  placeName,
  startDate,
  endDate,
});

describe("Reiseziel-Ideen nach Monat (#654)", () => {
  it("erkennt, ob eine Reise einen Monat berührt", () => {
    const t = trip("Elba", "2025-09-28", "2025-10-05");
    expect(tripTouchesMonth(t, 9)).toBe(true);
    expect(tripTouchesMonth(t, 10)).toBe(true);
    expect(tripTouchesMonth(t, 11)).toBe(false);
    // Jahreswechsel
    const winter = trip("Wallis", "2025-12-27", "2026-01-03");
    expect(tripTouchesMonth(winter, 12)).toBe(true);
    expect(tripTouchesMonth(winter, 1)).toBe(true);
    expect(tripTouchesMonth(winter, 6)).toBe(false);
  });

  it("fasst nach Platz zusammen und sortiert nach Besuchen", () => {
    const ideas = ideasForMonth(
      [
        trip("Tessin", "2023-10-01", "2023-10-08"),
        trip("Tessin", "2025-10-02", "2025-10-06"),
        trip("Elba", "2024-10-10", "2024-10-20"),
        trip("Sarnen", "2024-06-01", "2024-06-05"),
        trip(null, "2022-10-01", "2022-10-03"),
      ],
      10
    );
    expect(ideas.map(i => i.place)).toEqual(["Tessin", "Elba"]);
    expect(ideas[0].visits).toBe(2);
    expect(ideas[0].nights).toBe(7 + 4);
    expect(ideas[0].lastYear).toBe(2025);
  });

  it("liefert eine leere Liste, wenn der Monat unbereist ist", () => {
    expect(
      ideasForMonth([trip("Sarnen", "2024-06-01", "2024-06-05")], 2)
    ).toEqual([]);
  });
});

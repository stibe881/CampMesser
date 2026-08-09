import { describe, expect, it } from "vitest";
import { holidaysInRange, parseNagerHolidays } from "./holidaysAbroad";

describe("Feiertage des Reiselands (#539)", () => {
  it("liest landesweite Feiertage und wirft regionale weg", () => {
    expect(
      parseNagerHolidays([
        {
          date: "2026-08-15",
          localName: "Ferragosto",
          name: "Assumption Day",
          global: true,
        },
        {
          date: "2026-12-26",
          localName: "Santo Stefano",
          name: "St. Stephen's Day",
          global: false,
          counties: ["IT-32"],
        },
        { kaputt: true },
      ])
    ).toEqual([
      {
        date: "2026-08-15",
        localName: "Ferragosto",
        name: "Assumption Day",
      },
    ]);
    expect(parseNagerHolidays("quatsch")).toEqual([]);
  });

  it("schneidet auf den Reisezeitraum zu und sortiert", () => {
    const list = [
      { date: "2026-08-20", localName: "B", name: "B" },
      { date: "2026-08-01", localName: "A", name: "A" },
      { date: "2026-09-01", localName: "C", name: "C" },
    ];
    expect(
      holidaysInRange(list, "2026-08-01", "2026-08-31").map(h => h.localName)
    ).toEqual(["A", "B"]);
    expect(holidaysInRange(list, "2027-01-01", "2027-01-31")).toEqual([]);
  });
});

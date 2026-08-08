import { describe, expect, it } from "vitest";
import { visitedCountryRows } from "../client/src/lib/tripCountries";

/** Länder-Statistik der Reisen (#510). */
describe("visitedCountryRows", () => {
  it("rät das Land aus Ort/Titel/Platzname und summiert Nächte", () => {
    const stats = visitedCountryRows(
      [
        {
          title: "Sommer in Italien",
          location: "Toskana, Italien",
          startDate: "2026-07-01",
          endDate: "2026-07-08",
        },
        {
          title: null,
          location: "Ardèche, Frankreich",
          startDate: "2026-05-01",
          endDate: "2026-05-04",
        },
        // «Thun» nennt kein Land → ehrlich unzugeordnet statt geraten
        {
          title: "Wochenende",
          location: "Thun",
          startDate: "2026-06-01",
          endDate: "2026-06-03",
        },
      ],
      new Map()
    );
    expect(stats.rows.map(r => r.code)).toEqual(["IT", "FR"]);
    expect(stats.rows[0].nights).toBe(7);
    expect(stats.unassigned).toBe(1);
  });

  it("nutzt den Platznamen, wenn der Ort schweigt", () => {
    const stats = visitedCountryRows(
      [
        {
          title: null,
          location: null,
          spotId: 5,
          startDate: "2026-07-01",
          endDate: "2026-07-03",
        },
      ],
      new Map([[5, "Camping Österreich Tirol"]])
    );
    expect(stats.rows[0]?.code).toBe("AT");
  });
});

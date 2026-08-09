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

/**
 * Etappen kennen Länder (#592): Eine Rundreise durch mehrere Länder
 * zählt für jedes davon – mit den Nächten der jeweiligen Etappe.
 */
const ROUND_TRIP = {
  id: 1,
  title: "Skandinavien-Rundreise",
  location: "Schweden",
  startDate: "2026-07-01",
  endDate: "2026-07-10",
};

describe("visitedCountryRows mit Etappen", () => {
  it("zählt die Rundreise für jedes Etappen-Land", () => {
    const stops = new Map([
      [
        1,
        [
          { name: "Stockholm", startDate: "2026-07-01", endDate: "2026-07-05" },
          { name: "Oslo", startDate: "2026-07-05", endDate: "2026-07-10" },
        ],
      ],
    ]);
    const stats = visitedCountryRows([ROUND_TRIP], undefined, stops);
    const se = stats.rows.find(r => r.code === "SE");
    const no = stats.rows.find(r => r.code === "NO");
    expect(se?.trips).toBe(1);
    expect(se?.nights).toBe(4);
    expect(no?.trips).toBe(1);
    expect(no?.nights).toBe(5);
    expect(stats.unassigned).toBe(0);
  });

  it("gibt Etappen ohne Länder-Hinweis dem Hauptland", () => {
    const stops = new Map([
      [
        1,
        [
          // «Camping Seeblick» nennt kein Land – die Nächte gehören dem
          // geratenen Reiseland (Schweden aus location).
          {
            name: "Camping Seeblick",
            startDate: "2026-07-01",
            endDate: "2026-07-04",
          },
          { name: "Oslo", startDate: "2026-07-04", endDate: "2026-07-10" },
        ],
      ],
    ]);
    const stats = visitedCountryRows([ROUND_TRIP], undefined, stops);
    expect(stats.rows.find(r => r.code === "SE")?.nights).toBe(3);
    expect(stats.rows.find(r => r.code === "NO")?.nights).toBe(6);
  });

  it("verhält sich ohne Etappen wie bisher", () => {
    const stats = visitedCountryRows([ROUND_TRIP]);
    expect(stats.rows).toHaveLength(1);
    expect(stats.rows[0]?.code).toBe("SE");
    expect(stats.rows[0]?.nights).toBe(9);
  });
});

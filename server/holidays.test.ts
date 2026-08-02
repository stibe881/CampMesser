import { describe, expect, it } from "vitest";
import {
  CANTONS,
  holidayDisplayName,
  overlappingHolidays,
  parseHolidaysResponse,
  publicHolidaysUrl,
  schoolHolidaysUrl,
  type Holiday,
} from "../shared/holidays";

/** Kompakter Holiday nur mit deutschem Namen. */
function holiday(start: string, end: string, name: string): Holiday {
  return {
    id: `${start}-${name}`,
    startDate: start,
    endDate: end,
    name: [{ language: "DE", text: name }],
  };
}

describe("CANTONS", () => {
  it("enthält alle 26 Kantone mit eindeutigen Codes", () => {
    expect(CANTONS).toHaveLength(26);
    expect(new Set(CANTONS.map(c => c.code)).size).toBe(26);
    expect(CANTONS.map(c => c.code)).toContain("BE");
    expect(CANTONS.map(c => c.code)).toContain("TI");
  });
});

describe("schoolHolidaysUrl / publicHolidaysUrl", () => {
  it("baut die OpenHolidays-URLs mit CH-Kantonscode und Zeitraum", () => {
    const url = schoolHolidaysUrl("BE", "2026-01-01", "2027-12-31");
    expect(url).toContain("openholidaysapi.org/SchoolHolidays");
    expect(url).toContain("countryIsoCode=CH");
    expect(url).toContain("subdivisionCode=CH-BE");
    expect(url).toContain("validFrom=2026-01-01");
    expect(url).toContain("validTo=2027-12-31");
  });

  it("nutzt für Feiertage denselben Aufbau", () => {
    const url = publicHolidaysUrl("TI", "2026-01-01", "2027-12-31");
    expect(url).toContain("openholidaysapi.org/PublicHolidays");
    expect(url).toContain("subdivisionCode=CH-TI");
  });
});

describe("parseHolidaysResponse", () => {
  it("übernimmt gültige Einträge und verwirft Unbrauchbares", () => {
    const parsed = parseHolidaysResponse([
      {
        id: "abc",
        startDate: "2026-09-19",
        endDate: "2026-10-11",
        name: [
          { language: "DE", text: "Herbstferien" },
          { language: "FR", text: "Vacances d'automne" },
        ],
      },
      // kein Datum → verworfen
      { id: "x", name: [{ language: "DE", text: "Kaputt" }] },
      // kein Name → verworfen
      { id: "y", startDate: "2026-01-01", endDate: "2026-01-02", name: [] },
      null,
      "quatsch",
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      id: "abc",
      startDate: "2026-09-19",
      endDate: "2026-10-11",
    });
  });

  it("liefert bei Nicht-Arrays eine leere Liste", () => {
    expect(parseHolidaysResponse(null)).toEqual([]);
    expect(parseHolidaysResponse({ error: "nope" })).toEqual([]);
  });
});

describe("overlappingHolidays", () => {
  const holidays = [
    holiday("2026-09-19", "2026-10-11", "Herbstferien"),
    holiday("2026-08-01", "2026-08-01", "Bundesfeiertag"),
    holiday("2026-12-24", "2027-01-08", "Weihnachtsferien"),
  ];

  it("findet Ferien, die den Aufenthalt komplett umschliessen", () => {
    const hits = overlappingHolidays("2026-09-25", "2026-09-27", holidays);
    expect(hits.map(h => h.name[0].text)).toEqual(["Herbstferien"]);
  });

  it("findet teilweise Überschneidungen an beiden Rändern", () => {
    expect(
      overlappingHolidays("2026-10-10", "2026-10-20", holidays)
    ).toHaveLength(1);
    expect(
      overlappingHolidays("2026-09-10", "2026-09-19", holidays)
    ).toHaveLength(1);
  });

  it("zählt eintägige Feiertage am Randtag mit (Grenzen inklusive)", () => {
    const hits = overlappingHolidays("2026-08-01", "2026-08-08", holidays);
    expect(hits.map(h => h.name[0].text)).toContain("Bundesfeiertag");
  });

  it("liefert nichts ohne Überschneidung", () => {
    expect(overlappingHolidays("2026-11-02", "2026-11-08", holidays)).toEqual(
      []
    );
  });

  it("funktioniert über den Jahreswechsel", () => {
    const hits = overlappingHolidays("2027-01-01", "2027-01-03", holidays);
    expect(hits.map(h => h.name[0].text)).toEqual(["Weihnachtsferien"]);
  });
});

describe("holidayDisplayName", () => {
  const multi: Holiday = {
    id: "m",
    startDate: "2026-08-01",
    endDate: "2026-08-01",
    name: [
      { language: "DE", text: "Bundesfeiertag" },
      { language: "FR", text: "Fête nationale suisse" },
      { language: "IT", text: "Festa nazionale" },
    ],
  };

  it("wählt den Namen der UI-Sprache (case-insensitiv)", () => {
    expect(holidayDisplayName(multi, "fr")).toBe("Fête nationale suisse");
    expect(holidayDisplayName(multi, "it")).toBe("Festa nazionale");
  });

  it("fällt ohne passende Sprache auf Deutsch zurück", () => {
    expect(holidayDisplayName(multi, "en")).toBe("Bundesfeiertag");
  });

  it("nimmt sonst den ersten vorhandenen Namen", () => {
    const onlyFr: Holiday = {
      ...multi,
      name: [{ language: "FR", text: "Vacances d'été" }],
    };
    expect(holidayDisplayName(onlyFr, "en")).toBe("Vacances d'été");
  });
});

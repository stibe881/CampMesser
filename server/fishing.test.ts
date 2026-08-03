import { describe, expect, it } from "vitest";
import {
  catchStats,
  checkCatch,
  FISHING_DATA_UPDATED,
  FISH_SPECIES,
  filterCatches,
  findFishSpecies,
  inDayWindow,
  inGuideClosedSeason,
  NEAR_MIN_LENGTH_MARGIN_CM,
  type CatchRecord,
} from "@shared/fishing";
import { LANGUAGES, pick } from "@shared/i18n";

/** Kurzschreibweise für ein Datum ohne Zeitzonen-Überraschungen. */
function day(year: number, month: number, date: number): Date {
  return new Date(year, month - 1, date, 12, 0, 0);
}

function record(part: Partial<CatchRecord>): CatchRecord {
  return {
    speciesId: null,
    speciesName: "Egli",
    lengthCm: null,
    weightKg: null,
    water: "Zürichsee",
    caughtAt: "2026-07-01",
    released: false,
    ...part,
  };
}

describe("Fischarten-Datensatz", () => {
  it("hat ein ISO-Stand-Datum", () => {
    expect(FISHING_DATA_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("enthält die wichtigsten Arten mit eindeutigen Ids", () => {
    const ids = FISH_SPECIES.map(s => s.id);
    for (const id of ["bachforelle", "aesche", "felchen", "hecht", "egli"]) {
      expect(ids).toContain(id);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("übersetzt alle sichtbaren Texte in alle vier Sprachen", () => {
    for (const species of FISH_SPECIES) {
      for (const lang of LANGUAGES) {
        expect(pick(species.name, lang).length).toBeGreaterThan(1);
        expect(pick(species.habitat, lang).length).toBeGreaterThan(10);
        expect(pick(species.method, lang).length).toBeGreaterThan(10);
        expect(pick(species.cantonHint, lang).length).toBeGreaterThan(10);
        if (species.federal.note) {
          expect(pick(species.federal.note, lang).length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("gibt die bundesrechtlichen Werte der VBGF wörtlich wieder", () => {
    // VBGF Art. 2 Abs. 1 (Fangmindestmasse) und Art. 1 Abs. 1 (Wochen)
    expect(findFishSpecies("bachforelle")?.federal.minLengthCm).toBe(22);
    expect(findFishSpecies("bachforelle")?.federal.closedWeeks).toBe(16);
    expect(findFishSpecies("seeforelle")?.federal.minLengthCm).toBe(35);
    expect(findFishSpecies("seeforelle")?.federal.closedWeeks).toBe(12);
    expect(findFishSpecies("seesaibling")?.federal.minLengthCm).toBe(22);
    expect(findFishSpecies("seesaibling")?.federal.closedWeeks).toBe(8);
    expect(findFishSpecies("felchen")?.federal.minLengthCm).toBe(25);
    expect(findFishSpecies("felchen")?.federal.closedWeeks).toBe(6);
    expect(findFishSpecies("aesche")?.federal.minLengthCm).toBe(28);
    expect(findFishSpecies("aesche")?.federal.closedWeeks).toBe(10);
    expect(findFishSpecies("alborella")?.federal.closedWeeks).toBe(4);
  });

  it("kennzeichnet rein kantonal geregelte Arten ohne Bundeswerte", () => {
    for (const id of ["hecht", "zander", "egli", "karpfen", "wels"]) {
      const species = findFishSpecies(id);
      expect(species?.federal.minLengthCm).toBeNull();
      expect(species?.federal.closedWeeks).toBeNull();
    }
  });

  it("markiert die Fangverbote nach Art. 2a VBGF", () => {
    expect(findFishSpecies("aal")?.federal.banned).toBe(true);
    expect(findFishSpecies("nase")?.federal.banned).toBe(true);
    expect(findFishSpecies("lachs")?.federal.banned).toBe(true);
    expect(findFishSpecies("lachs")?.federal.reportRequired).toBe(true);
    // Arten mit Schonvorschrift fallen NICHT unter das Fangverbot
    expect(findFishSpecies("aesche")?.federal.banned).toBeUndefined();
  });

  it("hält die Richtwert-Fenster in gültigen Monats- und Tagesgrenzen", () => {
    for (const species of FISH_SPECIES) {
      const window = species.guideClosedSeason;
      if (!window) continue;
      expect(window.fromMonth).toBeGreaterThanOrEqual(1);
      expect(window.fromMonth).toBeLessThanOrEqual(12);
      expect(window.toMonth).toBeGreaterThanOrEqual(1);
      expect(window.toMonth).toBeLessThanOrEqual(12);
      expect(window.fromDay).toBeGreaterThanOrEqual(1);
      expect(window.fromDay).toBeLessThanOrEqual(31);
      expect(window.toDay).toBeGreaterThanOrEqual(1);
      expect(window.toDay).toBeLessThanOrEqual(31);
    }
  });

  it("findFishSpecies verträgt null und unbekannte Ids", () => {
    expect(findFishSpecies(null)).toBeUndefined();
    expect(findFishSpecies("")).toBeUndefined();
    expect(findFishSpecies("goldfisch")).toBeUndefined();
  });
});

describe("inDayWindow", () => {
  const spring = { fromMonth: 3, fromDay: 1, toMonth: 4, toDay: 30 };

  it("ohne Fenster ist nie Schonzeit", () => {
    expect(inDayWindow(null, day(2026, 3, 15))).toBe(false);
    expect(inDayWindow(undefined, day(2026, 3, 15))).toBe(false);
  });

  it("normales Fenster inkl. beider Grenzen", () => {
    expect(inDayWindow(spring, day(2026, 3, 1))).toBe(true);
    expect(inDayWindow(spring, day(2026, 4, 30))).toBe(true);
    expect(inDayWindow(spring, day(2026, 2, 28))).toBe(false);
    expect(inDayWindow(spring, day(2026, 5, 1))).toBe(false);
  });

  it("Fenster über den Jahreswechsel (1.12.–31.1.)", () => {
    const winter = { fromMonth: 12, fromDay: 1, toMonth: 1, toDay: 31 };
    expect(inDayWindow(winter, day(2026, 12, 1))).toBe(true);
    expect(inDayWindow(winter, day(2026, 12, 24))).toBe(true);
    expect(inDayWindow(winter, day(2027, 1, 31))).toBe(true);
    expect(inDayWindow(winter, day(2027, 2, 1))).toBe(false);
    expect(inDayWindow(winter, day(2026, 11, 30))).toBe(false);
  });

  it("taggenaue Grenzen innerhalb eines Monats", () => {
    const window = { fromMonth: 11, fromDay: 20, toMonth: 1, toDay: 15 };
    expect(inDayWindow(window, day(2026, 11, 19))).toBe(false);
    expect(inDayWindow(window, day(2026, 11, 20))).toBe(true);
    expect(inDayWindow(window, day(2027, 1, 15))).toBe(true);
    expect(inDayWindow(window, day(2027, 1, 16))).toBe(false);
  });

  it("Bachforelle: Oktober bis Mitte März, Sommer ist frei", () => {
    const trout = findFishSpecies("bachforelle")!;
    expect(inGuideClosedSeason(trout, day(2026, 10, 1))).toBe(true);
    expect(inGuideClosedSeason(trout, day(2027, 1, 5))).toBe(true);
    expect(inGuideClosedSeason(trout, day(2027, 3, 15))).toBe(true);
    expect(inGuideClosedSeason(trout, day(2027, 3, 16))).toBe(false);
    expect(inGuideClosedSeason(trout, day(2026, 7, 20))).toBe(false);
  });
});

describe("checkCatch", () => {
  const trout = findFishSpecies("bachforelle")!;

  it("ohne Art keine Hinweise", () => {
    expect(checkCatch(undefined, { date: day(2026, 7, 1) })).toEqual([]);
  });

  it("weist immer auf die kantonale Regelung hin", () => {
    const hints = checkCatch(trout, { lengthCm: 40, date: day(2026, 7, 1) });
    expect(hints.map(h => h.code)).toEqual(["cantonal"]);
    expect(hints[0].level).toBe("info");
  });

  it("meldet ein unterschrittenes Fangmindestmass", () => {
    const hints = checkCatch(trout, { lengthCm: 19, date: day(2026, 7, 1) });
    const hint = hints.find(h => h.code === "underMinLength");
    expect(hint?.level).toBe("danger");
    expect(hint?.minLengthCm).toBe(22);
  });

  it("exakt auf dem Mindestmass gilt nicht als unterschritten", () => {
    const codes = checkCatch(trout, {
      lengthCm: 22,
      date: day(2026, 7, 1),
    }).map(h => h.code);
    expect(codes).not.toContain("underMinLength");
    expect(codes).toContain("nearMinLength");
  });

  it("warnt knapp über dem Bundesmass, weil Kantone mehr verlangen", () => {
    const near = checkCatch(trout, {
      lengthCm: 22 + NEAR_MIN_LENGTH_MARGIN_CM - 1,
      date: day(2026, 7, 1),
    }).map(h => h.code);
    expect(near).toContain("nearMinLength");
    const far = checkCatch(trout, {
      lengthCm: 22 + NEAR_MIN_LENGTH_MARGIN_CM,
      date: day(2026, 7, 1),
    }).map(h => h.code);
    expect(far).not.toContain("nearMinLength");
  });

  it("ohne gemessene Länge kommt kein Mass-Hinweis", () => {
    const codes = checkCatch(trout, { date: day(2026, 7, 1) }).map(h => h.code);
    expect(codes).not.toContain("underMinLength");
    expect(codes).not.toContain("nearMinLength");
    const nullLength = checkCatch(trout, {
      lengthCm: null,
      date: day(2026, 7, 1),
    }).map(h => h.code);
    expect(nullLength).toEqual(["cantonal"]);
  });

  it("meldet die Schonzeit und das Mass gleichzeitig", () => {
    const codes = checkCatch(trout, {
      lengthCm: 18,
      date: day(2026, 11, 10),
    }).map(h => h.code);
    expect(codes).toEqual(["closedSeason", "underMinLength", "cantonal"]);
  });

  it("Arten ohne Bundesmass lösen keinen Mass-Hinweis aus", () => {
    const pike = findFishSpecies("hecht")!;
    const codes = checkCatch(pike, {
      lengthCm: 12,
      date: day(2026, 7, 1),
    }).map(h => h.code);
    expect(codes).toEqual(["cantonal"]);
  });

  it("Fangverbot und Meldepflicht stehen zuoberst", () => {
    const salmon = findFishSpecies("lachs")!;
    const codes = checkCatch(salmon, {
      lengthCm: 70,
      date: day(2026, 9, 1),
    }).map(h => h.code);
    expect(codes).toEqual(["ban", "report", "cantonal"]);
    const eel = checkCatch(findFishSpecies("aal")!, {
      date: day(2026, 9, 1),
    });
    expect(eel[0]).toEqual({ code: "ban", level: "danger" });
  });
});

describe("catchStats", () => {
  const catches: CatchRecord[] = [
    record({
      speciesId: "hecht",
      speciesName: "Hecht",
      lengthCm: 78,
      weightKg: 4.2,
      water: "Zürichsee",
      caughtAt: "2026-05-04",
    }),
    record({
      speciesId: "hecht",
      speciesName: "Hecht",
      lengthCm: 61,
      weightKg: 6.1,
      water: "Greifensee",
      caughtAt: "2025-06-11",
      released: true,
    }),
    record({
      speciesId: "bachforelle",
      speciesName: "Bachforelle",
      lengthCm: 31,
      water: "Sihl",
      caughtAt: "2026-04-20",
    }),
    record({
      speciesName: "Egli",
      water: "Zürichsee",
      caughtAt: "2026-04-21",
      released: true,
    }),
  ];

  it("zählt Fänge, Zurückgesetzte und Entnommene", () => {
    const stats = catchStats(catches);
    expect(stats.total).toBe(4);
    expect(stats.released).toBe(2);
    expect(stats.kept).toBe(2);
  });

  it("hält den grössten Fang je Art samt Datum fest", () => {
    const stats = catchStats(catches);
    const pike = stats.records.find(r => r.speciesId === "hecht");
    expect(pike?.count).toBe(2);
    expect(pike?.bestLengthCm).toBe(78);
    expect(pike?.bestOn).toBe("2026-05-04");
    // Schwerster und längster Fisch dürfen auseinanderfallen
    expect(pike?.bestWeightKg).toBe(6.1);
  });

  it("sortiert die Rekorde absteigend, Arten ohne Länge zuletzt", () => {
    const stats = catchStats(catches);
    expect(stats.records.map(r => r.name)).toEqual([
      "Hecht",
      "Bachforelle",
      "Egli",
    ]);
    expect(stats.records[2].bestLengthCm).toBeNull();
    expect(stats.records[2].bestOn).toBeNull();
  });

  it("gruppiert freie Einträge über den Namen", () => {
    const stats = catchStats([
      ...catches,
      record({ speciesName: "egli", caughtAt: "2026-04-22" }),
    ]);
    const free = stats.records.find(r => r.speciesId === null);
    expect(free?.count).toBe(2);
  });

  it("zählt Fänge pro Jahr, neuestes Jahr zuerst", () => {
    const stats = catchStats(catches);
    expect(stats.years).toEqual([
      { year: 2026, count: 3, released: 1 },
      { year: 2025, count: 1, released: 1 },
    ]);
  });

  it("sammelt die Gewässer alphabetisch und ohne Duplikate", () => {
    expect(catchStats(catches).waters).toEqual([
      "Greifensee",
      "Sihl",
      "Zürichsee",
    ]);
  });

  it("verträgt eine leere Liste", () => {
    const stats = catchStats([]);
    expect(stats.total).toBe(0);
    expect(stats.records).toEqual([]);
    expect(stats.years).toEqual([]);
    expect(stats.waters).toEqual([]);
  });
});

describe("filterCatches", () => {
  const catches: CatchRecord[] = [
    record({ speciesId: "hecht", speciesName: "Hecht", water: "Zürichsee" }),
    record({ speciesId: "hecht", speciesName: "Hecht", water: "Sihl" }),
    record({ speciesName: "Egli", water: "Zürichsee" }),
  ];

  it("leerer Filter lässt alles durch", () => {
    expect(filterCatches(catches, {})).toHaveLength(3);
    expect(
      filterCatches(catches, { speciesKey: null, water: null })
    ).toHaveLength(3);
  });

  it("filtert nach Art", () => {
    expect(filterCatches(catches, { speciesKey: "hecht" })).toHaveLength(2);
    expect(filterCatches(catches, { speciesKey: "frei:egli" })).toHaveLength(1);
  });

  it("filtert nach Gewässer ohne Rücksicht auf Gross-/Kleinschreibung", () => {
    expect(filterCatches(catches, { water: " zürichsee " })).toHaveLength(2);
  });

  it("kombiniert beide Filter", () => {
    expect(
      filterCatches(catches, { speciesKey: "hecht", water: "Sihl" })
    ).toHaveLength(1);
  });
});

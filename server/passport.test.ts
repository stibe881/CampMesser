import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import {
  MAX_TILT_DEG,
  PASSPORT_RANKS,
  STAMP_SHAPES,
  buildPassport,
  nextRank,
  passportRank,
  passportSummary,
  stampLook,
  tripCountForTraveller,
  tripsForTraveller,
  wasAlong,
  absenceLookup,
} from "@shared/passport";
import type { PassportTrip } from "@shared/passport";
import type { TripLike } from "@shared/trips";

const trip = (
  placeName: string | null,
  startDate: string,
  endDate: string
): TripLike => ({ placeName, startDate, endDate });

describe("Kinder-Reisepass", () => {
  it("macht aus jeder Reise einen Stempel", () => {
    const stamps = buildPassport([
      trip("Camping Sarnen", "2026-07-01", "2026-07-05"),
      trip("Camping Thun", "2026-08-01", "2026-08-03"),
    ]);
    expect(stamps.map(s => s.place)).toEqual([
      "Camping Sarnen",
      "Camping Thun",
    ]);
    expect(stamps[0].nights).toBe(4);
  });

  it("fasst denselben Platz zu EINEM Stempel zusammen", () => {
    // Wer dreimal am selben See war, hat einen Stempel mit einer Drei
    const stamps = buildPassport([
      trip("Camping Sarnen", "2024-07-01", "2024-07-03"),
      trip("Camping Sarnen", "2025-07-01", "2025-07-04"),
      trip("Camping Sarnen", "2026-07-01", "2026-07-02"),
    ]);
    expect(stamps).toHaveLength(1);
    expect(stamps[0].visits).toBe(3);
    expect(stamps[0].nights).toBe(2 + 3 + 1);
    expect(stamps[0].firstVisit).toBe("2024-07-01");
    expect(stamps[0].lastVisit).toBe("2026-07-01");
  });

  it("merkt sich den ersten Besuch, auch wenn er später eingetragen wurde", () => {
    const stamps = buildPassport([
      trip("Camping Thun", "2026-08-01", "2026-08-02"),
      trip("Camping Thun", "2020-06-01", "2020-06-02"),
    ]);
    expect(stamps[0].firstVisit).toBe("2020-06-01");
    expect(stamps[0].lastVisit).toBe("2026-08-01");
  });

  it("lässt Reisen ohne Platznamen weg", () => {
    // Ein Stempel ohne Ort wäre keiner
    const stamps = buildPassport([
      trip(null, "2026-07-01", "2026-07-03"),
      trip("   ", "2026-07-04", "2026-07-06"),
      trip("Camping Thun", "2026-07-07", "2026-07-08"),
    ]);
    expect(stamps).toHaveLength(1);
    expect(stamps[0].place).toBe("Camping Thun");
  });

  it("sortiert nach dem ersten Besuch", () => {
    const stamps = buildPassport([
      trip("Spät", "2026-08-01", "2026-08-02"),
      trip("Früh", "2020-01-01", "2020-01-02"),
    ]);
    expect(stamps.map(s => s.place)).toEqual(["Früh", "Spät"]);
  });

  it("gibt demselben Platz immer denselben Stempel", () => {
    // Ein Stempel, der bei jedem Öffnen anders aussieht, wäre kein Stempel
    const a = stampLook("Camping Sarnen");
    const b = stampLook("Camping Sarnen");
    expect(a).toEqual(b);
  });

  it("unterscheidet verschiedene Plätze im Aussehen", () => {
    const namen = [
      "Camping Sarnen",
      "Camping Thun",
      "Camping Brienz",
      "Camping Sion",
      "Camping Chur",
      "Camping Bern",
    ];
    const kombinationen = new Set(
      namen.map(n => {
        const look = stampLook(n);
        return `${look.shape}|${look.color}`;
      })
    );
    // Nicht alle gleich – ein Pass aus sechs identischen Stempeln wäre öde
    expect(kombinationen.size).toBeGreaterThan(2);
  });

  it("hält die Schräglage in vernünftigen Grenzen", () => {
    for (let i = 0; i < 200; i++) {
      const look = stampLook(`Platz ${i}`);
      expect(look.tiltDeg).toBeGreaterThanOrEqual(-MAX_TILT_DEG);
      expect(look.tiltDeg).toBeLessThanOrEqual(MAX_TILT_DEG);
      expect(STAMP_SHAPES).toContain(look.shape);
    }
  });

  it("vergibt Titel erst ab dem ersten Stempel", () => {
    expect(passportRank(0)).toBeNull();
    expect(passportRank(1)?.places).toBe(1);
    expect(passportRank(2)?.places).toBe(1);
    expect(passportRank(3)?.places).toBe(3);
    expect(passportRank(100)?.places).toBe(25);
  });

  it("sagt, wie weit es zur nächsten Stufe ist", () => {
    expect(nextRank(0)).toEqual({ rank: PASSPORT_RANKS[0], missing: 1 });
    expect(nextRank(2)?.missing).toBe(1);
    // Auf der höchsten Stufe gibt es keine nächste mehr
    expect(nextRank(25)).toBeNull();
  });

  it("fasst den ganzen Pass zusammen", () => {
    const summary = passportSummary([
      trip("Camping Sarnen", "2024-07-01", "2024-07-03"),
      trip("Camping Thun", "2026-08-01", "2026-08-05"),
    ]);
    expect(summary.places).toBe(2);
    expect(summary.nights).toBe(2 + 4);
    expect(summary.firstVisit).toBe("2024-07-01");
    expect(summary.lastVisit).toBe("2026-08-01");
    expect(summary.rank?.places).toBe(1);
    expect(summary.next?.rank.places).toBe(3);
  });

  it("kommt mit einem leeren Pass zurecht", () => {
    const summary = passportSummary([]);
    expect(summary.places).toBe(0);
    expect(summary.nights).toBe(0);
    expect(summary.firstVisit).toBeNull();
    expect(summary.lastVisit).toBeNull();
    expect(summary.rank).toBeNull();
    expect(summary.next?.missing).toBe(1);
  });

  it("benennt jede Stufe in allen vier Sprachen", () => {
    PASSPORT_RANKS.forEach(rank => {
      LANGUAGES.forEach(lang =>
        expect(
          rank.title[lang]?.trim().length,
          String(rank.places)
        ).toBeGreaterThan(0)
      );
    });
  });

  describe("Ein Pass je Person", () => {
    const reise = (id: number, place: string, year: string): PassportTrip => ({
      id,
      placeName: place,
      startDate: `${year}-07-01`,
      endDate: `${year}-07-08`,
    });
    const reisen = [
      reise(1, "Sarnen", "2023"),
      reise(2, "Lugano", "2024"),
      reise(3, "Chur", "2025"),
    ];

    it("zählt ohne Eintrag jede Reise – alle waren dabei", () => {
      // Der Normalfall braucht keine Zeile: Die Familie fährt zusammen weg
      expect(tripsForTraveller(reisen, [], 7)).toHaveLength(3);
      expect(tripCountForTraveller(reisen, [], 7)).toBe(3);
    });

    it("lässt weg, wo die Person nicht dabei war", () => {
      const ohne = tripsForTraveller(reisen, [{ childId: 7, tripId: 2 }], 7);
      expect(ohne.map(t => t.id)).toEqual([1, 3]);
    });

    it("trennt die Personen sauber", () => {
      // Die Abwesenheit des einen Kindes darf dem anderen nichts wegnehmen
      const absences = [{ childId: 7, tripId: 1 }];
      expect(tripsForTraveller(reisen, absences, 7)).toHaveLength(2);
      expect(tripsForTraveller(reisen, absences, 8)).toHaveLength(3);
    });

    it("nimmt für den Familienpass alles", () => {
      const alles = tripsForTraveller(
        reisen,
        [
          { childId: 7, tripId: 1 },
          { childId: 8, tripId: 2 },
        ],
        null
      );
      expect(alles).toHaveLength(3);
    });

    it("beantwortet «war dabei» einzeln", () => {
      const lookup = absenceLookup([{ childId: 7, tripId: 2 }]);
      expect(wasAlong(lookup, 7, 1)).toBe(true);
      expect(wasAlong(lookup, 7, 2)).toBe(false);
      expect(wasAlong(lookup, 8, 2)).toBe(true);
    });

    it("gibt der Person nur ihre eigenen Stempel", () => {
      // Das Kind, das 2024 bei den Grosseltern blieb, hat keinen
      // Lugano-Stempel – und damit auch einen anderen Rang
      const eigene = tripsForTraveller(reisen, [{ childId: 7, tripId: 2 }], 7);
      const summary = passportSummary(eigene);
      expect(summary.places).toBe(2);
      expect(summary.stamps.map(s => s.place)).toEqual(["Sarnen", "Chur"]);
    });

    it("lässt die Eingabeliste unangetastet", () => {
      const kopie = reisen.slice();
      tripsForTraveller(reisen, [{ childId: 7, tripId: 1 }], 7);
      expect(reisen).toEqual(kopie);
    });
  });
});

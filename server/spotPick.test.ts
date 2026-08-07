import { describe, expect, it } from "vitest";
import {
  CALM_WIND_KMH,
  COMFORT_MAX_C,
  COMFORT_MIN_C,
  PICK_WEIGHTS,
  daysInRange,
  dryScore,
  formatTravel,
  nextWeekend,
  rankSpots,
  scoreDays,
  warmthScore,
  windScore,
  type PickDay,
} from "@shared/spotPick";

const day = (over: Partial<PickDay> = {}): PickDay => ({
  date: "2026-08-08",
  tempMaxC: 24,
  tempMinC: 14,
  precipProbability: 0,
  precipitationMm: 0,
  windMaxKmh: 10,
  ...over,
});

describe("dryScore", () => {
  it("gibt einem trockenen Tag die volle Note", () => {
    expect(dryScore(day())).toBe(100);
  });

  it("unterscheidet Schauer von Dauerregen bei gleicher Wahrscheinlichkeit", () => {
    // Beides 60 % – aber 0,5 mm ist ein Kaffee unterm Vordach und 15 mm
    // ein verlorener Tag. Wer nur die Wahrscheinlichkeit liest, sieht
    // keinen Unterschied.
    const schauer = dryScore(
      day({ precipProbability: 60, precipitationMm: 0.5 })
    );
    const guss = dryScore(day({ precipProbability: 60, precipitationMm: 15 }));
    expect(schauer).toBeGreaterThan(guss);
  });

  it("bleibt bei Wolkenbruch bei 0 statt negativ zu werden", () => {
    expect(dryScore(day({ precipProbability: 100, precipitationMm: 80 }))).toBe(
      0
    );
  });
});

describe("warmthScore", () => {
  it("gibt im Wohlfühlbereich die volle Note", () => {
    expect(warmthScore(day({ tempMaxC: COMFORT_MIN_C }))).toBe(100);
    expect(warmthScore(day({ tempMaxC: COMFORT_MAX_C }))).toBe(100);
  });

  it("straft zu kalt härter als zu warm", () => {
    // Gegen Hitze hilft Schatten und ein See; gegen 12 Grad und
    // Nieselregen hilft nur die Heimfahrt.
    const kalt = warmthScore(day({ tempMaxC: COMFORT_MIN_C - 5 }));
    const warm = warmthScore(day({ tempMaxC: COMFORT_MAX_C + 5 }));
    expect(kalt).toBeLessThan(warm);
  });

  it("zieht kalte Nächte ab", () => {
    expect(warmthScore(day({ tempMinC: 2 }))).toBeLessThan(
      warmthScore(day({ tempMinC: 14 }))
    );
  });
});

describe("windScore", () => {
  it("straft Wind erst über der Schwelle", () => {
    expect(windScore(day({ windMaxKmh: CALM_WIND_KMH }))).toBe(100);
    expect(windScore(day({ windMaxKmh: CALM_WIND_KMH + 10 }))).toBe(70);
  });
});

describe("scoreDays", () => {
  it("gibt ohne Tage null zurück, nicht 0", () => {
    // «Keine Daten» und «schlecht» sind zweierlei – sonst rutscht ein
    // Platz ohne Prognose ans Ende, als wäre er verregnet.
    expect(scoreDays([])).toBeNull();
  });

  it("mittelt über die Tage statt den schlechtesten zu nehmen", () => {
    // Ein verregneter Sonntag macht einen sonnigen Samstag nicht wertlos.
    const gemischt = scoreDays([
      day(),
      day({ date: "2026-08-09", precipProbability: 90, precipitationMm: 20 }),
    ]);
    const nurRegen = scoreDays([
      day({ precipProbability: 90, precipitationMm: 20 }),
    ]);
    expect(gemischt!.total).toBeGreaterThan(nurRegen!.total);
  });

  it("gewichtet Regen am stärksten", () => {
    const nass = scoreDays([
      day({ precipProbability: 100, precipitationMm: 20 }),
    ]);
    const kalt = scoreDays([day({ tempMaxC: 12, tempMinC: 4 })]);
    expect(nass!.total).toBeLessThan(kalt!.total);
  });

  it("hält die Gewichte bei 1", () => {
    const sum = PICK_WEIGHTS.dry + PICK_WEIGHTS.warmth + PICK_WEIGHTS.wind;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("rankSpots", () => {
  const sonnig = { name: "Sonnig" };
  const nass = { name: "Nass" };
  const unbekannt = { name: "Unbekannt" };

  const candidates = [
    { spot: nass, days: [day({ precipProbability: 95, precipitationMm: 20 })] },
    { spot: sonnig, days: [day()] },
    { spot: unbekannt, days: [] },
  ];

  it("sortiert nach der Note, Bestes zuerst", () => {
    expect(rankSpots(candidates).map(r => r.spot.name)).toEqual([
      "Sonnig",
      "Nass",
      "Unbekannt",
    ]);
  });

  it("wirft Plätze ohne Prognose nicht weg, sondern hängt sie hinten an", () => {
    // Sonst verschwindet ein Platz kommentarlos aus der eigenen Liste.
    const ranked = rankSpots(candidates);
    expect(ranked).toHaveLength(3);
    expect(ranked[2].score).toBeNull();
  });

  it("sortiert auf Wunsch nach Fahrzeit; Unbekanntes bleibt hinten", () => {
    const ranked = rankSpots(
      [
        { spot: nass, days: [day()], travelSeconds: 600 },
        { spot: sonnig, days: [day()], travelSeconds: 3600 },
        { spot: unbekannt, days: [day()], travelSeconds: null },
      ],
      "travel"
    );
    expect(ranked.map(r => r.spot.name)).toEqual([
      "Nass",
      "Sonnig",
      "Unbekannt",
    ]);
  });

  it("löst Gleichstand über den Namen auf, damit die Liste ruhig bleibt", () => {
    const ranked = rankSpots([
      { spot: { name: "Zermatt" }, days: [day()] },
      { spot: { name: "Aarau" }, days: [day()] },
    ]);
    expect(ranked.map(r => r.spot.name)).toEqual(["Aarau", "Zermatt"]);
  });
});

describe("nextWeekend", () => {
  it("findet von einem Mittwoch aus den kommenden Samstag", () => {
    expect(nextWeekend("2026-08-05")).toEqual({
      from: "2026-08-08",
      to: "2026-08-09",
    });
  });

  it("meint am Samstag das laufende Wochenende", () => {
    expect(nextWeekend("2026-08-08")).toEqual({
      from: "2026-08-08",
      to: "2026-08-09",
    });
  });

  it("meint am Sonntag noch das laufende und nicht das übernächste", () => {
    // Wer am Sonntagmorgen fragt, will heute weg.
    expect(nextWeekend("2026-08-09")).toEqual({
      from: "2026-08-08",
      to: "2026-08-09",
    });
  });

  it("läuft über den Monatswechsel", () => {
    expect(nextWeekend("2026-08-28")).toEqual({
      from: "2026-08-29",
      to: "2026-08-30",
    });
    expect(nextWeekend("2026-08-31")).toEqual({
      from: "2026-09-05",
      to: "2026-09-06",
    });
  });
});

describe("daysInRange", () => {
  it("grenzt einschliesslich beider Grenzen ein", () => {
    const days = [
      day({ date: "2026-08-07" }),
      day({ date: "2026-08-08" }),
      day({ date: "2026-08-09" }),
      day({ date: "2026-08-10" }),
    ];
    expect(
      daysInRange(days, "2026-08-08", "2026-08-09").map(d => d.date)
    ).toEqual(["2026-08-08", "2026-08-09"]);
  });
});

describe("formatTravel", () => {
  it("schreibt Minuten und Stunden", () => {
    expect(formatTravel(2700)).toBe("45 min");
    expect(formatTravel(4800)).toBe("1 h 20");
    expect(formatTravel(null)).toBeNull();
  });
});

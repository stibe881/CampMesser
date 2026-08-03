import { describe, expect, it } from "vitest";
import {
  anniversaryTrips,
  nightsPerYear,
  computeTripStats,
  computeYearReview,
  currentTripDay,
  daysUntilTrip,
  isUpcomingTrip,
  nightsByYear,
  tripNights,
} from "@shared/trips";

describe("tripNights", () => {
  it("zählt die Nächte zwischen An- und Abreise", () => {
    expect(tripNights("2026-07-10", "2026-07-13")).toBe(3);
    expect(tripNights("2026-07-10", "2026-07-11")).toBe(1);
  });

  it("gibt 0 für gleichen Tag, verdrehte oder ungültige Daten zurück", () => {
    expect(tripNights("2026-07-10", "2026-07-10")).toBe(0);
    expect(tripNights("2026-07-13", "2026-07-10")).toBe(0);
    expect(tripNights("kaputt", "2026-07-10")).toBe(0);
  });

  it("zählt über Monatsgrenzen korrekt", () => {
    expect(tripNights("2026-07-30", "2026-08-02")).toBe(3);
  });
});

describe("nightsByYear", () => {
  it("teilt einen Jahreswechsel-Aufenthalt auf beide Jahre auf", () => {
    // Nächte: 30.12., 31.12. (→ 2025) und 1.1. (→ 2026)
    expect(nightsByYear("2025-12-30", "2026-01-02")).toEqual({
      2025: 2,
      2026: 1,
    });
  });

  it("ordnet einen normalen Aufenthalt einem Jahr zu", () => {
    expect(nightsByYear("2026-07-10", "2026-07-13")).toEqual({ 2026: 3 });
  });
});

describe("computeTripStats", () => {
  const trips = [
    {
      startDate: "2026-07-10",
      endDate: "2026-07-13",
      placeName: "Camping Aareschlucht",
    },
    {
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      placeName: "Camping Aareschlucht",
    },
    {
      startDate: "2025-12-30",
      endDate: "2026-01-02",
      placeName: "Wintercamp Gantrisch",
    },
    {
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      placeName: "Tagesausflug",
    },
  ];

  it("summiert Trips, Nächte und Jahres-Aufteilung", () => {
    const stats = computeTripStats(trips);
    expect(stats.totalTrips).toBe(4);
    expect(stats.totalNights).toBe(3 + 2 + 3);
    expect(stats.nightsByYear).toEqual({ 2025: 2, 2026: 6 });
  });

  it("sortiert die Lieblingsplätze nach Nächten", () => {
    const stats = computeTripStats(trips);
    expect(stats.topPlaces[0]).toEqual({
      name: "Camping Aareschlucht",
      nights: 5,
    });
    expect(stats.topPlaces[1]).toEqual({
      name: "Wintercamp Gantrisch",
      nights: 3,
    });
    // Ort ohne Übernachtung taucht nicht auf
    expect(stats.topPlaces.some(p => p.name === "Tagesausflug")).toBe(false);
  });

  it("liefert leere Statistik ohne Einträge", () => {
    expect(computeTripStats([])).toEqual({
      totalTrips: 0,
      totalNights: 0,
      nightsByYear: {},
      topPlaces: [],
      avgRating: null,
    });
  });

  it("mittelt die Sterne-Bewertungen (unbewertete Einträge zählen nicht)", () => {
    const rated = [
      { ...trips[0], rating: 5 },
      { ...trips[1], rating: 2 },
      { ...trips[2], rating: null },
      trips[3],
    ];
    expect(computeTripStats(rated).avgRating).toBeCloseTo(3.5);
    // Ohne einzige Bewertung bleibt der Schnitt null
    expect(computeTripStats(trips).avgRating).toBeNull();
  });
});

describe("computeYearReview", () => {
  const trips = [
    {
      startDate: "2026-07-10",
      endDate: "2026-07-13",
      placeName: "Camping Aareschlucht",
    },
    {
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      placeName: "Camping Aareschlucht",
    },
    {
      startDate: "2026-06-01",
      endDate: "2026-06-05",
      placeName: "Camping Seefeld",
    },
    {
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      placeName: "Tagesausflug",
    },
    {
      startDate: "2025-12-30",
      endDate: "2026-01-02",
      placeName: "Wintercamp Gantrisch",
    },
  ];

  it("zählt Trips, Nächte und verschiedene Orte des Jahres", () => {
    const review = computeYearReview(trips, 2026);
    expect(review.year).toBe(2026);
    expect(review.trips).toBe(4);
    expect(review.nights).toBe(3 + 2 + 4);
    // Tagesausflug ohne Nacht zählt als Ort mit
    expect(review.places).toBe(3);
  });

  it("kürt Top-Platz (meiste Nächte) und längsten Aufenthalt", () => {
    const review = computeYearReview(trips, 2026);
    // Aareschlucht gesamthaft 5 Nächte, Seefeld nur 4 – aber am Stück
    expect(review.topPlace).toEqual({
      name: "Camping Aareschlucht",
      nights: 5,
    });
    expect(review.longestStay).toEqual({ name: "Camping Seefeld", nights: 4 });
  });

  it("zählt einen Silvester-Trip komplett zum Jahr der Anreise (keine Aufteilung)", () => {
    // Bewusst einfach gehalten: alle 3 Nächte des Wintercamps (30.12.–2.1.)
    // gehören zu 2025, obwohl eine Nacht schon im neuen Jahr liegt.
    const review = computeYearReview(trips, 2025);
    expect(review.trips).toBe(1);
    expect(review.nights).toBe(3);
    expect(review.topPlace).toEqual({
      name: "Wintercamp Gantrisch",
      nights: 3,
    });
    expect(review.longestStay).toEqual({
      name: "Wintercamp Gantrisch",
      nights: 3,
    });
  });

  it("liefert leere Kennzahlen für ein Jahr ohne Trips", () => {
    expect(computeYearReview(trips, 2024)).toEqual({
      year: 2024,
      trips: 0,
      nights: 0,
      places: 0,
      topPlace: null,
      longestStay: null,
      bestRated: null,
    });
  });

  it("kürt den best bewerteten Platz über die Ø-Bewertung", () => {
    const rated = [
      { ...trips[0], rating: 4 }, // Aareschlucht: (4+3)/2 = 3.5
      { ...trips[1], rating: 3 },
      { ...trips[2], rating: 5 }, // Seefeld: 5
      trips[3], // unbewertet – zählt nicht
    ];
    const review = computeYearReview(rated, 2026);
    expect(review.bestRated).toEqual({ name: "Camping Seefeld", rating: 5 });
  });

  it("bestRated bleibt null ohne einzige Bewertung", () => {
    expect(computeYearReview(trips, 2026).bestRated).toBeNull();
  });

  it("bei gleicher Ø-Bewertung gewinnt der Platz mit mehr Bewertungen", () => {
    const rated = [
      { ...trips[0], rating: 4 },
      { ...trips[1], rating: 4 },
      { ...trips[2], rating: 4 },
    ];
    const review = computeYearReview(rated, 2026);
    expect(review.bestRated).toEqual({
      name: "Camping Aareschlucht",
      rating: 4,
    });
  });
});

describe("isUpcomingTrip / daysUntilTrip", () => {
  it("erkennt geplante Aufenthalte (Anreise heute oder später)", () => {
    expect(isUpcomingTrip("2026-08-01", "2026-08-01")).toBe(true);
    expect(isUpcomingTrip("2026-08-15", "2026-08-01")).toBe(true);
    expect(isUpcomingTrip("2026-07-31", "2026-08-01")).toBe(false);
  });

  it("zählt die Tage bis zur Anreise", () => {
    expect(daysUntilTrip("2026-08-12", "2026-08-01")).toBe(11);
    expect(daysUntilTrip("2026-08-01", "2026-08-01")).toBe(0);
    expect(daysUntilTrip("2026-09-01", "2026-08-30")).toBe(2);
  });
});

describe("currentTripDay", () => {
  const trip = { startDate: "2026-08-10", endDate: "2026-08-14" };

  it("liefert Tag 1 am Anreisetag (erste Grenze)", () => {
    expect(currentTripDay(trip, "2026-08-10")).toEqual({ day: 1, total: 5 });
  });

  it("liefert den letzten Tag am Abreisetag (zweite Grenze)", () => {
    expect(currentTripDay(trip, "2026-08-14")).toEqual({ day: 5, total: 5 });
  });

  it("zählt Tage in der Mitte des Aufenthalts", () => {
    expect(currentTripDay(trip, "2026-08-12")).toEqual({ day: 3, total: 5 });
  });

  it("liefert null vor der Anreise und nach der Abreise", () => {
    expect(currentTripDay(trip, "2026-08-09")).toBeNull();
    expect(currentTripDay(trip, "2026-08-15")).toBeNull();
  });

  it("behandelt einen Tagesausflug (Anreise = Abreise) als Tag 1 von 1", () => {
    const dayTrip = { startDate: "2026-08-10", endDate: "2026-08-10" };
    expect(currentTripDay(dayTrip, "2026-08-10")).toEqual({ day: 1, total: 1 });
  });

  it("zählt über Monatsgrenzen korrekt", () => {
    const trip2 = { startDate: "2026-07-30", endDate: "2026-08-02" };
    expect(currentTripDay(trip2, "2026-08-01")).toEqual({ day: 3, total: 4 });
  });

  it("liefert null bei ungültigen oder verdrehten Daten", () => {
    expect(
      currentTripDay(
        { startDate: "kaputt", endDate: "2026-08-14" },
        "2026-08-12"
      )
    ).toBeNull();
    expect(
      currentTripDay(
        { startDate: "2026-08-14", endDate: "2026-08-10" },
        "2026-08-12"
      )
    ).toBeNull();
    expect(currentTripDay(trip, "kaputt")).toBeNull();
  });
});

describe("nightsPerYear", () => {
  it("summiert Nächte pro Startjahr, aufsteigend sortiert", () => {
    const trips = [
      { startDate: "2025-07-01", endDate: "2025-07-05" },
      { startDate: "2026-08-10", endDate: "2026-08-12" },
      { startDate: "2025-09-01", endDate: "2025-09-02" },
    ];
    expect(nightsPerYear(trips)).toEqual([
      { year: 2025, nights: 5 },
      { year: 2026, nights: 2 },
    ]);
  });

  it("zählt Silvester-Trips komplett zum Startjahr", () => {
    expect(
      nightsPerYear([{ startDate: "2025-12-30", endDate: "2026-01-02" }])
    ).toEqual([{ year: 2025, nights: 3 }]);
  });

  it("ignoriert ungültige Zeiträume und liefert sonst leer", () => {
    expect(
      nightsPerYear([{ startDate: "2026-08-10", endDate: "2026-08-10" }])
    ).toEqual([]);
    expect(nightsPerYear([])).toEqual([]);
  });
});

describe("anniversaryTrips", () => {
  it("findet den Aufenthalt von vor genau einem Jahr", () => {
    const trips = [{ startDate: "2025-08-01", endDate: "2025-08-08" }];
    expect(anniversaryTrips(trips, "2026-08-03")).toEqual([
      { trip: trips[0], yearsAgo: 1 },
    ]);
  });

  it("berücksichtigt die Toleranz von ±3 Tagen", () => {
    // Jahrestag 2025-08-03: Aufenthalt endete 3 Tage davor → noch Treffer
    const inside = [{ startDate: "2025-07-28", endDate: "2025-07-31" }];
    expect(anniversaryTrips(inside, "2026-08-03")).toHaveLength(1);
    // 4 Tage davor → kein Treffer mehr
    const outside = [{ startDate: "2025-07-27", endDate: "2025-07-30" }];
    expect(anniversaryTrips(outside, "2026-08-03")).toEqual([]);
  });

  it("liefert mehrere Treffer nach Jahres-Abstand sortiert", () => {
    const trips = [
      { startDate: "2022-08-02", endDate: "2022-08-09" },
      { startDate: "2025-08-02", endDate: "2025-08-09" },
      { startDate: "2024-08-02", endDate: "2024-08-09" },
    ];
    expect(
      anniversaryTrips(trips, "2026-08-03").map(hit => hit.yearsAgo)
    ).toEqual([1, 2, 4]);
  });

  it("zählt einen langen Aufenthalt nur einmal – mit dem kleinsten Abstand", () => {
    const trips = [{ startDate: "2023-08-01", endDate: "2025-08-10" }];
    expect(anniversaryTrips(trips, "2026-08-03")).toEqual([
      { trip: trips[0], yearsAgo: 1 },
    ]);
  });

  it("geht über den Jahreswechsel korrekt zurück", () => {
    const trips = [{ startDate: "2025-12-28", endDate: "2026-01-04" }];
    expect(anniversaryTrips(trips, "2027-01-02")).toEqual([
      { trip: trips[0], yearsAgo: 1 },
    ]);
  });

  it("klemmt den 29. Februar auf den 28. statt in den März zu rutschen", () => {
    // Heute 29.02.2028 → Jahrestag 2027: 28.02. (Toleranz ±3 Tage)
    const trips = [{ startDate: "2027-02-25", endDate: "2027-02-26" }];
    expect(anniversaryTrips(trips, "2028-02-29")).toEqual([
      { trip: trips[0], yearsAgo: 1 },
    ]);
  });

  it("ignoriert Aufenthalte ausserhalb der letzten fünf Jahre", () => {
    const trips = [{ startDate: "2020-08-01", endDate: "2020-08-08" }];
    expect(anniversaryTrips(trips, "2026-08-03")).toEqual([]);
  });

  it("verwirft kaputte Daten und ein kaputtes Heute", () => {
    const trips = [
      { startDate: "kaputt", endDate: "2025-08-08" },
      { startDate: "2025-08-08", endDate: "2025-08-01" },
    ];
    expect(anniversaryTrips(trips, "2026-08-03")).toEqual([]);
    expect(
      anniversaryTrips(
        [{ startDate: "2025-08-01", endDate: "2025-08-08" }],
        "x"
      )
    ).toEqual([]);
  });
});

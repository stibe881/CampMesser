import { describe, expect, it } from "vitest";
import { computeTripStats, nightsByYear, tripNights } from "@shared/trips";

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
    });
  });
});

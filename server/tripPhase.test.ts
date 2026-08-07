import { describe, expect, it } from "vitest";
import {
  localMinutes,
  packingStillMatters,
  parseHhMm,
  tripHasStarted,
} from "@shared/tripPhase";

/**
 * Reise-Phase (#361).
 *
 * WORAUF ES ANKOMMT: Der Anreisetag. Davor und danach ist die Antwort
 * offensichtlich; genau am Tag der Anreise entscheidet die Uhrzeit, und
 * ohne Uhrzeit das Datum allein.
 */
const trip = (startDate: string, arrivalTime: string | null = null) => ({
  startDate,
  arrivalTime,
});

describe("Reise-Phase", () => {
  it("vor dem Anreisetag hat nichts begonnen", () => {
    expect(tripHasStarted(trip("2026-08-10"), "2026-08-06", 720)).toBe(false);
  });

  it("nach dem Anreisetag hat sie begonnen", () => {
    expect(tripHasStarted(trip("2026-08-01"), "2026-08-06", 0)).toBe(true);
  });

  it("am Anreisetag entscheidet die Ankunftszeit", () => {
    const t = trip("2026-08-06", "16:00");
    expect(tripHasStarted(t, "2026-08-06", 15 * 60 + 59)).toBe(false);
    expect(tripHasStarted(t, "2026-08-06", 16 * 60)).toBe(true);
  });

  it("ohne Ankunftszeit zählt am Anreisetag das Datum", () => {
    // Bewusste Wahl: Mehr als den Tag weiss die App dann nicht.
    expect(tripHasStarted(trip("2026-08-06"), "2026-08-06", 5)).toBe(true);
  });

  it("eine kaputte Zeitangabe wirft die Reise nicht aus dem Tritt", () => {
    expect(tripHasStarted(trip("2026-08-06", "25:00"), "2026-08-06", 0)).toBe(
      true
    );
    expect(tripHasStarted(trip("2026-08-06", "abc"), "2026-08-06", 0)).toBe(
      true
    );
  });

  it("Packstand und Vorschlag sind die Umkehrung", () => {
    const t = trip("2026-08-06", "16:00");
    expect(packingStillMatters(t, "2026-08-06", 12 * 60)).toBe(true);
    expect(packingStillMatters(t, "2026-08-06", 17 * 60)).toBe(false);
  });

  it("Zeitangaben werden in Minuten gelesen", () => {
    expect(parseHhMm("00:00")).toBe(0);
    expect(parseHhMm("9:05")).toBe(545);
    expect(parseHhMm("23:59")).toBe(1439);
    expect(parseHhMm(null)).toBeNull();
    expect(parseHhMm("")).toBeNull();
    expect(parseHhMm("12:60")).toBeNull();
  });

  it("die lokale Uhrzeit kommt aus den lokalen Feldern", () => {
    // Nicht über UTC – dieselbe Falle wie beim Datum in #333.
    expect(localMinutes(new Date(2026, 7, 6, 14, 30))).toBe(14 * 60 + 30);
  });
});

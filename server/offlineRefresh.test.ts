import { describe, expect, it } from "vitest";
import {
  OFFLINE_REFRESH_MAX_AGE_MS,
  shouldRefreshOfflinePrep,
} from "@shared/offlineRefresh";

/**
 * Auffrischen des Offline-Pakets (#411): nur kurz vor und während der
 * Reise, nur wenn der letzte Lauf alt genug ist.
 */
describe("shouldRefreshOfflinePrep", () => {
  const trip = { startDate: "2026-08-10", endDate: "2026-08-15" };
  const DAY = 24 * 60 * 60 * 1000;
  const now = 1_000 * DAY;
  const stale = now - OFFLINE_REFRESH_MAX_AGE_MS;

  it("frischt im Vorlauf-Fenster auf (3 Tage vor Anreise)", () => {
    expect(shouldRefreshOfflinePrep(trip, stale, now, "2026-08-07")).toBe(true);
    expect(shouldRefreshOfflinePrep(trip, stale, now, "2026-08-10")).toBe(true);
  });

  it("zu früh ist zu früh", () => {
    expect(shouldRefreshOfflinePrep(trip, stale, now, "2026-08-06")).toBe(
      false
    );
  });

  it("während der Reise weiter, danach nicht mehr", () => {
    // Auf dem Platz ändert der Menüplan noch – nach der Abreise ist das
    // Paket niemandem mehr etwas wert.
    expect(shouldRefreshOfflinePrep(trip, stale, now, "2026-08-13")).toBe(true);
    expect(shouldRefreshOfflinePrep(trip, stale, now, "2026-08-16")).toBe(
      false
    );
  });

  it("frisch bleibt frisch – knapp unter 24 h passiert nichts", () => {
    expect(shouldRefreshOfflinePrep(trip, stale + 1, now, "2026-08-09")).toBe(
      false
    );
  });

  it("ein Zeitstempel aus der Zukunft gilt als frisch", () => {
    expect(shouldRefreshOfflinePrep(trip, now + DAY, now, "2026-08-09")).toBe(
      false
    );
  });

  it("der Fenster-Anfang rechnet über den Monatswechsel", () => {
    const septemberTrip = { startDate: "2026-09-01", endDate: "2026-09-05" };
    expect(
      shouldRefreshOfflinePrep(septemberTrip, stale, now, "2026-08-29")
    ).toBe(true);
    expect(
      shouldRefreshOfflinePrep(septemberTrip, stale, now, "2026-08-28")
    ).toBe(false);
  });
});

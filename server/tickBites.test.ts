import { describe, expect, it } from "vitest";
import {
  TICK_OBSERVATION_DAYS,
  tickObservationStatus,
} from "@shared/tickBites";

describe("tickObservationStatus", () => {
  it("gibt am Tag des Stichs das volle Beobachtungsfenster", () => {
    expect(
      tickObservationStatus({ bitAt: "2026-08-03" }, "2026-08-03")
    ).toEqual({ daysLeft: TICK_OBSERVATION_DAYS, done: false });
  });

  it("zählt die verbleibenden Tage herunter", () => {
    expect(
      tickObservationStatus({ bitAt: "2026-08-03" }, "2026-08-08")
    ).toEqual({ daysLeft: 9, done: false });
    expect(
      tickObservationStatus({ bitAt: "2026-08-03" }, "2026-08-16")
    ).toEqual({ daysLeft: 1, done: false });
  });

  it("gilt nach 14 Tagen als erledigt", () => {
    expect(
      tickObservationStatus({ bitAt: "2026-08-03" }, "2026-08-17")
    ).toEqual({ daysLeft: 0, done: true });
    expect(
      tickObservationStatus({ bitAt: "2026-08-03" }, "2026-09-01")
    ).toEqual({ daysLeft: 0, done: true });
  });

  it("gilt mit resolvedAt sofort als erledigt", () => {
    expect(
      tickObservationStatus(
        { bitAt: "2026-08-03", resolvedAt: "2026-08-05" },
        "2026-08-06"
      )
    ).toEqual({ daysLeft: 0, done: true });
  });

  it("rechnet über einen Monatswechsel korrekt", () => {
    expect(
      tickObservationStatus({ bitAt: "2026-07-28" }, "2026-08-03")
    ).toEqual({ daysLeft: 8, done: false });
  });

  it("behandelt kaputte Daten defensiv als erledigt", () => {
    expect(tickObservationStatus({ bitAt: "kaputt" }, "2026-08-03")).toEqual({
      daysLeft: 0,
      done: true,
    });
    expect(tickObservationStatus({ bitAt: "2026-08-03" }, "morgen")).toEqual({
      daysLeft: 0,
      done: true,
    });
  });

  it("meldet einen in der Zukunft erfassten Stich als offen", () => {
    expect(
      tickObservationStatus({ bitAt: "2026-08-05" }, "2026-08-03")
    ).toEqual({ daysLeft: TICK_OBSERVATION_DAYS + 2, done: false });
  });
});

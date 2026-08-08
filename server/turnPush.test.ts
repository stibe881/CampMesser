import { describe, expect, it } from "vitest";
import { buildWeatherTurnAlert } from "./push";

/** Umschwung-Push (#427): deterministisch, mit Dedup pro Reise und Tag. */
describe("buildWeatherTurnAlert", () => {
  const turnBySpotId = new Map([
    [5, { turn: { kind: "wind" as const, value: 60 }, tomorrow: "2026-08-09" }],
  ]);

  it("baut Meldung und Dedup-Schlüssel für den laufenden Aufenthalt", () => {
    const alert = buildWeatherTurnAlert(
      [{ id: 3, name: "Camping Aare", spotId: 5 }],
      turnBySpotId
    );
    expect(alert?.key).toBe("turn:3:2026-08-09");
    expect(alert?.title).toBe("Morgen kippt das Wetter");
    expect(alert?.body).toContain("60 km/h");
    expect(alert?.body).toContain("Camping Aare");
  });

  it("ohne Umschwung am Platz gibt es keinen Push", () => {
    expect(
      buildWeatherTurnAlert([{ id: 3, name: "X", spotId: 9 }], turnBySpotId)
    ).toBeNull();
  });

  it("bei mehreren Reisen gewinnt deterministisch die kleinste Id", () => {
    const both = new Map([
      [
        5,
        { turn: { kind: "wind" as const, value: 60 }, tomorrow: "2026-08-09" },
      ],
      [
        6,
        { turn: { kind: "rain" as const, value: 20 }, tomorrow: "2026-08-09" },
      ],
    ]);
    const alert = buildWeatherTurnAlert(
      [
        { id: 9, name: "B", spotId: 6 },
        { id: 2, name: "A", spotId: 5 },
      ],
      both
    );
    expect(alert?.key).toBe("turn:2:2026-08-09");
  });
});

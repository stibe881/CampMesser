import { describe, expect, it } from "vitest";
import { currentTripStop, sortTripStops } from "../shared/tripStops";

const STOPS = [
  { id: 2, name: "Bologna", startDate: "2026-08-14", endDate: "2026-08-18" },
  { id: 1, name: "Como", startDate: "2026-08-10", endDate: "2026-08-14" },
  { id: 3, name: "Rimini", startDate: "2026-08-18", endDate: "2026-08-22" },
];

describe("sortTripStops", () => {
  it("sortiert nach Anreisedatum und lässt die Eingabe unangetastet", () => {
    const copy = STOPS.slice();
    const sorted = sortTripStops(STOPS);
    expect(sorted.map(s => s.name)).toEqual(["Como", "Bologna", "Rimini"]);
    expect(STOPS).toEqual(copy);
  });
});

describe("currentTripStop", () => {
  it("findet die Etappe, deren Zeitraum den Tag abdeckt", () => {
    expect(currentTripStop(STOPS, "2026-08-11")?.name).toBe("Como");
    expect(currentTripStop(STOPS, "2026-08-20")?.name).toBe("Rimini");
  });

  it("gibt am Wechseltag die neu angetretene Etappe zurück", () => {
    // 14.08. ist Abreise aus Como UND Ankunft in Bologna – man ist am
    // zuletzt angefahrenen Ort.
    expect(currentTripStop(STOPS, "2026-08-14")?.name).toBe("Bologna");
    expect(currentTripStop(STOPS, "2026-08-18")?.name).toBe("Rimini");
  });

  it("liefert ausserhalb aller Etappen null", () => {
    expect(currentTripStop(STOPS, "2026-08-01")).toBeNull();
    expect(currentTripStop(STOPS, "2026-09-01")).toBeNull();
    expect(currentTripStop([], "2026-08-11")).toBeNull();
  });
});

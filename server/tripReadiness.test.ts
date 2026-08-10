import { describe, it, expect } from "vitest";
import {
  countMainSlots,
  MAIN_MEALS,
  tripReadiness,
  type TripReadinessInput,
  parseReadinessDone,
  serializeReadinessDone,
} from "@shared/tripReadiness";

/** Basis: alles erledigt – einzelne Felder pro Test überschreiben. */
function input(
  overrides: Partial<TripReadinessInput> = {}
): TripReadinessInput {
  return {
    hasSpot: true,
    hasArrivalTime: true,
    packList: { checked: 10, total: 10 },
    menu: { mainSlots: 6, emptySlots: 0 },
    shopping: { open: 0, total: 3 },
    sharedTrip: false,
    ...overrides,
  };
}

describe("countMainSlots", () => {
  it("zählt drei Haupt-Slots pro Tag", () => {
    expect(MAIN_MEALS).toEqual(["breakfast", "lunch", "dinner"]);
    const result = countMainSlots(["2026-08-03", "2026-08-04"], []);
    expect(result).toEqual({ mainSlots: 6, emptySlots: 6 });
  });

  it("zieht belegte Slots ab", () => {
    const result = countMainSlots(
      ["2026-08-03", "2026-08-04"],
      [
        { day: "2026-08-03", meal: "breakfast" },
        { day: "2026-08-04", meal: "dinner" },
      ]
    );
    expect(result.emptySlots).toBe(4);
  });

  it("ignoriert Znüni/Zvieri und Einträge ausserhalb der Tage", () => {
    const result = countMainSlots(
      ["2026-08-03"],
      [
        { day: "2026-08-03", meal: "snack" },
        { day: "2026-08-09", meal: "lunch" },
      ]
    );
    expect(result.emptySlots).toBe(3);
  });

  it("zählt doppelte Einträge für denselben Slot nur einmal", () => {
    const result = countMainSlots(
      ["2026-08-03"],
      [
        { day: "2026-08-03", meal: "lunch" },
        { day: "2026-08-03", meal: "lunch" },
      ]
    );
    expect(result.emptySlots).toBe(2);
  });

  it("liefert ohne Tage keine Slots", () => {
    expect(countMainSlots([], [])).toEqual({ mainSlots: 0, emptySlots: 0 });
  });
});

describe("tripReadiness", () => {
  it("meldet alles erledigt", () => {
    const result = tripReadiness(input());
    expect(result.openCount).toBe(0);
    expect(result.ready).toBe(true);
    expect(result.rows.map(r => r.key)).toEqual([
      "packList",
      "menuPlan",
      "shopping",
      "spot",
      "arrivalTime",
    ]);
  });

  it("wertet die Packliste in Prozent aus", () => {
    const result = tripReadiness(input({ packList: { checked: 3, total: 5 } }));
    const row = result.rows.find(r => r.key === "packList");
    expect(row).toEqual({ key: "packList", status: "open", value: 60 });
    expect(result.ready).toBe(false);
  });

  it("meldet eine fehlende Packliste als offen", () => {
    const result = tripReadiness(input({ packList: null }));
    expect(result.rows.find(r => r.key === "packList")).toEqual({
      key: "packList",
      status: "open",
      value: 0,
    });
  });

  it("meldet eine leere Packliste als offen", () => {
    const result = tripReadiness(input({ packList: { checked: 0, total: 0 } }));
    expect(result.rows.find(r => r.key === "packList")?.status).toBe("open");
  });

  it("zeigt Menüplan-Lücken mit Anzahl", () => {
    const result = tripReadiness(
      input({ menu: { mainSlots: 9, emptySlots: 4 } })
    );
    expect(result.rows.find(r => r.key === "menuPlan")).toEqual({
      key: "menuPlan",
      status: "open",
      value: 4,
    });
  });

  it("lässt den Menüplan ohne auswertbare Slots weg", () => {
    const noData = tripReadiness(input({ menu: null }));
    expect(noData.rows.some(r => r.key === "menuPlan")).toBe(false);
    const noSlots = tripReadiness(
      input({ menu: { mainSlots: 0, emptySlots: 0 } })
    );
    expect(noSlots.rows.some(r => r.key === "menuPlan")).toBe(false);
  });

  it("zeigt Reise-Einkäufe nur bei geteilter Reise oder mit Einträgen", () => {
    const empty = tripReadiness(
      input({ shopping: { open: 0, total: 0 }, sharedTrip: false })
    );
    expect(empty.rows.some(r => r.key === "shopping")).toBe(false);
    const shared = tripReadiness(
      input({ shopping: { open: 0, total: 0 }, sharedTrip: true })
    );
    expect(shared.rows.some(r => r.key === "shopping")).toBe(true);
    const withItems = tripReadiness(
      input({ shopping: { open: 2, total: 5 }, sharedTrip: false })
    );
    expect(withItems.rows.find(r => r.key === "shopping")).toEqual({
      key: "shopping",
      status: "open",
      value: 2,
    });
  });

  it("lässt Reise-Einkäufe ohne geladene Daten weg", () => {
    const result = tripReadiness(input({ shopping: null, sharedTrip: true }));
    expect(result.rows.some(r => r.key === "shopping")).toBe(false);
  });

  it("meldet fehlende Stammdaten", () => {
    const result = tripReadiness(
      input({ hasSpot: false, hasArrivalTime: false })
    );
    expect(result.rows.find(r => r.key === "spot")?.status).toBe("open");
    expect(result.rows.find(r => r.key === "arrivalTime")?.status).toBe("open");
    expect(result.openCount).toBe(2);
    expect(result.ready).toBe(false);
  });
});

describe("Von Hand erledigte Punkte (#667)", () => {
  it("hakt offene Punkte ab und merkt sie als «manuell»", () => {
    const result = tripReadiness(
      input({
        packList: null,
        hasSpot: false,
        manualDone: ["packList", "spot"],
      })
    );
    const pack = result.rows.find(r => r.key === "packList");
    expect(pack?.status).toBe("ok");
    expect(pack?.manual).toBe(true);
    expect(result.rows.find(r => r.key === "spot")?.manual).toBe(true);
    // Beide Punkte zählen nicht mehr als offen
    expect(result.openCount).toBe(0);
    expect(result.ready).toBe(true);
  });

  it("markiert ohnehin erledigte Punkte NICHT als manuell", () => {
    const result = tripReadiness(
      input({ hasArrivalTime: true, manualDone: ["arrivalTime"] })
    );
    const row = result.rows.find(r => r.key === "arrivalTime");
    expect(row?.status).toBe("ok");
    expect(row?.manual).toBeUndefined();
  });

  it("liest und schreibt die gespeicherte Liste defensiv", () => {
    expect(parseReadinessDone('["spot","packList"]')).toEqual([
      "packList",
      "spot",
    ]);
    expect(parseReadinessDone('["spot","quatsch",7]')).toEqual(["spot"]);
    expect(parseReadinessDone("kein json")).toEqual([]);
    expect(parseReadinessDone(null)).toEqual([]);
    expect(serializeReadinessDone(["arrivalTime", "packList", "x"])).toBe(
      '["packList","arrivalTime"]'
    );
  });
});

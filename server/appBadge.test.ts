import { describe, expect, it } from "vitest";
// Reine Zähl-Logik des App-Icon-Badges liegt im Client-Code, ohne DOM.
import { computeBadgeCount } from "../client/src/lib/appBadge";
import type { GearTaskLike } from "../shared/gearTasks";

const TODAY = "2026-08-02";

/** Pflege-Aufgabe mit gewünschter Basis (zuletzt erledigt) bauen. */
function task(lastDoneAt: string | null, intervalMonths = 12): GearTaskLike {
  return { intervalMonths, lastDoneAt, createdAt: "2020-01-01" };
}

describe("computeBadgeCount", () => {
  it("zählt nichts bei leeren Datenquellen", () => {
    expect(
      computeBadgeCount({ foodItems: [], gearTasks: [], today: TODAY })
    ).toBe(0);
  });

  it("zählt Kühlbox-Einträge, die heute oder morgen ablaufen", () => {
    const foodItems = [
      { expiryDate: "2026-08-02" }, // heute
      { expiryDate: "2026-08-03" }, // morgen
      { expiryDate: "2026-08-04" }, // übermorgen – zählt nicht
      { expiryDate: "2026-08-01" }, // bereits abgelaufen – zählt nicht
      { expiryDate: null }, // ohne MHD
      {}, // ohne MHD-Feld
    ];
    expect(computeBadgeCount({ foodItems, gearTasks: [], today: TODAY })).toBe(
      2
    );
  });

  it("zählt fällige Pflege-Aufgaben", () => {
    const gearTasks = [
      task("2025-01-01"), // fällig seit 2026-01-01
      task("2026-08-02", 12), // erst 2027 fällig
      task(null, 1), // Basis createdAt 2020 → längst fällig
    ];
    expect(computeBadgeCount({ foodItems: [], gearTasks, today: TODAY })).toBe(
      2
    );
  });

  it("summiert beide Quellen", () => {
    expect(
      computeBadgeCount({
        foodItems: [{ expiryDate: "2026-08-02" }, { expiryDate: "2026-08-03" }],
        gearTasks: [task("2025-06-01"), task("2026-07-01")],
        today: TODAY,
      })
    ).toBe(3);
  });

  it("ignoriert kaputte Daten defensiv", () => {
    expect(
      computeBadgeCount({
        foodItems: [{ expiryDate: "kaputt" }],
        gearTasks: [
          { intervalMonths: 12, lastDoneAt: "kaputt", createdAt: "kaputt" },
        ],
        today: TODAY,
      })
    ).toBe(0);
  });
});

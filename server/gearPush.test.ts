import { describe, expect, it } from "vitest";
import { buildGearAlert } from "./push";

const created = new Date("2025-01-01T08:00:00Z");

function task(title: string, lastDoneAt: string | null, intervalMonths = 6) {
  return { title, intervalMonths, lastDoneAt, createdAt: created };
}

describe("buildGearAlert", () => {
  it("meldet nichts, wenn keine Aufgabe fällig ist", () => {
    expect(buildGearAlert([], "2026-08-02")).toBeNull();
    expect(
      buildGearAlert(
        [task("Zelt imprägnieren", "2026-07-01", 24)],
        "2026-08-02"
      )
    ).toBeNull();
  });

  it("meldet eine einzelne fällige Aufgabe in der Einzahl", () => {
    const alert = buildGearAlert(
      [task("Zelt imprägnieren", "2025-08-01", 12)],
      "2026-08-02"
    );
    expect(alert).not.toBeNull();
    expect(alert!.title).toContain("Pflege fällig");
    expect(alert!.body).toBe("1 Pflege-Aufgabe ist fällig: Zelt imprägnieren");
    expect(alert!.key).toBe("gear:2026-08");
  });

  it("zählt mehrere fällige Aufgaben und kürzt auf 3 Namen", () => {
    const alert = buildGearAlert(
      [
        task("Dichtung sichten", "2025-01-01"),
        task("Batterien prüfen", "2025-01-01"),
        task("Erste-Hilfe-Set auffrischen", "2025-01-01"),
        task("Wasserkanister reinigen", "2025-01-01"),
        task("Nicht fällig", "2026-07-15", 12),
      ],
      "2026-08-02"
    );
    expect(alert!.body).toBe(
      "4 Pflege-Aufgaben sind fällig: Batterien prüfen, Dichtung sichten, Erste-Hilfe-Set auffrischen und 1 weitere"
    );
  });

  it("nimmt ohne lastDoneAt das Anlage-Datum als Basis", () => {
    // angelegt 01.01.2025, Intervall 12 Monate → fällig ab 01.01.2026
    expect(
      buildGearAlert([task("Schlafsack waschen", null, 12)], "2026-08-02")
    ).not.toBeNull();
    expect(
      buildGearAlert([task("Schlafsack waschen", null, 24)], "2026-08-02")
    ).toBeNull();
  });

  it("bildet den Dedup-Schlüssel pro Monat", () => {
    const tasks = [task("Zelt imprägnieren", "2025-01-01")];
    expect(buildGearAlert(tasks, "2026-08-31")!.key).toBe("gear:2026-08");
    expect(buildGearAlert(tasks, "2026-09-01")!.key).toBe("gear:2026-09");
  });
});

import { describe, expect, it } from "vitest";
import {
  SPOT_SECTION_KEYS,
  spotPhase,
  spotSectionOrder,
} from "@shared/spotSections";

/**
 * Reihenfolge der Dossier-Abschnitte (#371).
 *
 * WORAUF ES ANKOMMT: Jede Reihenfolge muss ALLE fünf Abschnitte
 * enthalten, genau einmal. Ein vergessener Abschnitt verschwindet sonst
 * still von der Seite – und das fällt am Bildschirm erst auf, wenn man
 * genau das sucht, was fehlt.
 */
describe("Dossier-Reihenfolge", () => {
  it("jede Lage zeigt alle Abschnitte, jeden genau einmal", () => {
    for (const phase of ["running", "planned", "none"] as const) {
      const order = spotSectionOrder(phase);
      expect([...order].sort()).toEqual([...SPOT_SECTION_KEYS].sort());
    }
  });

  it("läuft die Reise, steht der Platz zuoberst und die Anreise zuunterst", () => {
    const order = spotSectionOrder("running");
    expect(order[0]).toBe("place");
    expect(order[order.length - 1]).toBe("arrival");
  });

  it("ist eine Reise geplant, kommt die Anreise zuerst", () => {
    expect(spotSectionOrder("planned")[0]).toBe("arrival");
  });

  it("ohne Reise ist die Seite ein Nachschlagewerk", () => {
    const order = spotSectionOrder("none");
    expect(order[0]).toBe("place");
    expect(order[order.length - 1]).toBe("arrival");
  });

  it("eine laufende Reise gewinnt gegen eine geplante", () => {
    const stays = [
      { startDate: "2026-08-05", endDate: "2026-08-08" },
      { startDate: "2026-09-01", endDate: "2026-09-05" },
    ];
    expect(spotPhase(stays, "2026-08-06")).toBe("running");
  });

  it("nur Vergangenes heisst «keine Reise»", () => {
    const stays = [{ startDate: "2025-07-01", endDate: "2025-07-05" }];
    expect(spotPhase(stays, "2026-08-06")).toBe("none");
    expect(spotPhase([], "2026-08-06")).toBe("none");
  });

  it("der An- und der Abreisetag zählen noch als laufend", () => {
    const stays = [{ startDate: "2026-08-06", endDate: "2026-08-08" }];
    expect(spotPhase(stays, "2026-08-06")).toBe("running");
    expect(spotPhase(stays, "2026-08-08")).toBe("running");
    expect(spotPhase(stays, "2026-08-09")).toBe("none");
  });
});

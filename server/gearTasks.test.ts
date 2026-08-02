import { describe, expect, it } from "vitest";
import { pick } from "../shared/i18n";
import {
  addMonthsClamped,
  GEAR_TASK_SUGGESTIONS,
  gearTaskDue,
} from "../shared/gearTasks";

describe("addMonthsClamped", () => {
  it("verschiebt ein Datum um ganze Monate", () => {
    expect(addMonthsClamped("2026-03-15", 6)).toBe("2026-09-15");
    expect(addMonthsClamped("2026-01-01", 24)).toBe("2028-01-01");
  });

  it("klemmt Monats-Überläufe auf den letzten Tag des Ziel-Monats", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2024-01-31", 1)).toBe("2024-02-29"); // Schaltjahr
    expect(addMonthsClamped("2026-08-31", 1)).toBe("2026-09-30");
  });

  it("trägt Jahreswechsel korrekt über", () => {
    expect(addMonthsClamped("2026-11-15", 3)).toBe("2027-02-15");
  });

  it("gibt bei kaputtem Datum null zurück", () => {
    expect(addMonthsClamped("kein datum", 6)).toBeNull();
    expect(addMonthsClamped("", 6)).toBeNull();
  });
});

describe("gearTaskDue", () => {
  const created = new Date("2026-01-10T08:00:00Z");

  it("nimmt lastDoneAt als Basis: fällig genau nach dem Intervall", () => {
    const task = {
      intervalMonths: 6,
      lastDoneAt: "2026-01-15",
      createdAt: created,
    };
    expect(gearTaskDue(task, "2026-07-15")).toEqual({
      due: true,
      dueDate: "2026-07-15",
      daysUntil: 0,
      soon: false,
    });
    expect(gearTaskDue(task, "2026-07-14").due).toBe(false);
    expect(gearTaskDue(task, "2026-08-01").due).toBe(true);
    expect(gearTaskDue(task, "2026-08-01").daysUntil).toBe(-17);
  });

  it("nimmt ohne lastDoneAt das Anlage-Datum als Basis", () => {
    const task = { intervalMonths: 12, lastDoneAt: null, createdAt: created };
    expect(gearTaskDue(task, "2026-12-01")).toMatchObject({
      due: false,
      dueDate: "2027-01-10",
    });
    expect(gearTaskDue(task, "2027-01-10").due).toBe(true);
  });

  it("meldet «bald» innerhalb von 30 Tagen vor der Fälligkeit", () => {
    const task = {
      intervalMonths: 6,
      lastDoneAt: "2026-01-31",
      createdAt: created,
    };
    // Fällig am 31.07. – am 1.7. sind es genau 30 Tage
    expect(gearTaskDue(task, "2026-07-01")).toMatchObject({
      due: false,
      soon: true,
      daysUntil: 30,
    });
    expect(gearTaskDue(task, "2026-06-30")).toMatchObject({
      due: false,
      soon: false,
      daysUntil: 31,
    });
  });

  it("klemmt Monatsende-Basen (31.01. + 1 Monat → Ende Februar)", () => {
    const task = {
      intervalMonths: 1,
      lastDoneAt: "2026-01-31",
      createdAt: created,
    };
    expect(gearTaskDue(task, "2026-02-28")).toMatchObject({
      due: true,
      dueDate: "2026-02-28",
    });
  });

  it("klemmt unsinnige Intervalle in den gültigen Bereich", () => {
    const zero = {
      intervalMonths: 0,
      lastDoneAt: "2026-01-15",
      createdAt: created,
    };
    expect(gearTaskDue(zero, "2026-02-15").due).toBe(true); // min. 1 Monat
    const huge = {
      intervalMonths: 999,
      lastDoneAt: "2026-01-15",
      createdAt: created,
    };
    expect(gearTaskDue(huge, "2026-02-15").dueDate).toBe("2036-01-15"); // max. 120
  });

  it("ist bei kaputten Daten defensiv nicht fällig", () => {
    expect(
      gearTaskDue(
        { intervalMonths: 6, lastDoneAt: "kaputt", createdAt: created },
        "2026-07-15"
      ).due
    ).toBe(false);
    expect(
      gearTaskDue(
        { intervalMonths: 6, lastDoneAt: "2026-01-15", createdAt: created },
        "kein datum"
      ).due
    ).toBe(false);
  });
});

describe("GEAR_TASK_SUGGESTIONS", () => {
  it("enthält die 6 Katalog-Vorschläge mit sinnvollen Intervallen", () => {
    expect(GEAR_TASK_SUGGESTIONS).toHaveLength(6);
    const byTitle = new Map(
      GEAR_TASK_SUGGESTIONS.map(s => [pick(s.title, "de"), s.intervalMonths])
    );
    expect(byTitle.get("Zelt imprägnieren")).toBe(24);
    expect(byTitle.get("Erste-Hilfe-Set auffrischen")).toBe(12);
    expect(byTitle.get("Batterien & Lampen prüfen")).toBe(6);
    expect(byTitle.get("Wasserkanister reinigen")).toBe(6);
  });

  it("hat für jeden Vorschlag alle vier Sprachfassungen", () => {
    for (const s of GEAR_TASK_SUGGESTIONS) {
      for (const lang of ["de", "fr", "it", "en"] as const) {
        expect(pick(s.title, lang).length).toBeGreaterThan(0);
      }
    }
  });
});

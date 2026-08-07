import { describe, expect, it } from "vitest";
import {
  localDay,
  msUntilNextLocalDay,
  shiftIsoDay,
  todayIso,
} from "@shared/localDate";

/**
 * Diese Tests laufen mit der Zeitzone der Testumgebung. Damit sie den
 * eigentlichen Fehler zeigen, arbeiten sie mit `new Date(Jahr, Monat, Tag,
 * Stunde)` – das erzeugt einen LOKALEN Zeitpunkt, egal wo der Rechner
 * steht. Ein fester UTC-String wäre je nach Zeitzone ein anderer Tag und
 * würde nur beweisen, dass die Testumgebung in Zürich steht.
 */
describe("Lokaler Tag statt UTC", () => {
  it("halb eins nachts gehört zum NEUEN Tag", () => {
    // Das ist der Fehler, um den es geht: `toISOString()` liefert hier in
    // jeder Zeitzone östlich von Greenwich noch den Vortag.
    expect(localDay(new Date(2026, 7, 7, 0, 30))).toBe("2026-08-07");
  });

  it("kurz vor Mitternacht gehört zum ALTEN Tag", () => {
    // Die Gegenprobe: westlich von Greenwich kippt `toISOString()` hier.
    expect(localDay(new Date(2026, 7, 6, 23, 30))).toBe("2026-08-06");
  });

  it("Monat und Tag sind zweistellig", () => {
    expect(localDay(new Date(2026, 0, 3, 12))).toBe("2026-01-03");
  });

  it("nimmt auch Millisekunden", () => {
    const at = new Date(2026, 7, 7, 9, 0);
    expect(localDay(at.getTime())).toBe("2026-08-07");
  });

  it("todayIso() ist der heutige lokale Tag", () => {
    expect(todayIso()).toBe(localDay(new Date()));
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("Tage verschieben", () => {
  it("morgen und gestern", () => {
    expect(shiftIsoDay("2026-08-06", 1)).toBe("2026-08-07");
    expect(shiftIsoDay("2026-08-06", -1)).toBe("2026-08-05");
  });

  it("über den Monatsende hinweg", () => {
    expect(shiftIsoDay("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftIsoDay("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("über den Jahreswechsel", () => {
    expect(shiftIsoDay("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("Schaltjahr", () => {
    expect(shiftIsoDay("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("Unsinn bleibt unverändert, statt NaN zu erzeugen", () => {
    expect(shiftIsoDay("kaputt", 1)).toBe("kaputt");
  });
});

/**
 * Der Wecker auf den Tageswechsel (#373). Gerechnet wird über die
 * Kalenderfelder – ein fester Abstand von 24 Stunden wäre an den
 * Umstellungstagen der Sommerzeit um eine Stunde daneben.
 */
describe("msUntilNextLocalDay", () => {
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;

  it("morgens früh bleibt fast der ganze Tag", () => {
    expect(msUntilNextLocalDay(new Date(2026, 7, 7, 0, 30))).toBe(
      23 * HOUR + 30 * MINUTE
    );
  });

  it("kurz vor Mitternacht bleiben Minuten", () => {
    expect(msUntilNextLocalDay(new Date(2026, 7, 7, 23, 50))).toBe(10 * MINUTE);
  });

  it("landet wirklich auf dem nächsten lokalen Tag", () => {
    const at = new Date(2026, 7, 7, 17, 12, 34, 567);
    const next = new Date(at.getTime() + msUntilNextLocalDay(at));
    expect(localDay(next)).toBe("2026-08-08");
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
  });

  it("über den Monats- und Jahreswechsel hinweg", () => {
    const silvester = new Date(2026, 11, 31, 22, 0);
    const next = new Date(silvester.getTime() + msUntilNextLocalDay(silvester));
    expect(localDay(next)).toBe("2027-01-01");
  });

  it("wartet mindestens eine Sekunde, statt sich im Kreis zu drehen", () => {
    // Punkt Mitternacht: ohne Untergrenze käme hier ein Wecker auf 0 ms
    // heraus, der sich sofort wieder selbst stellt.
    expect(
      msUntilNextLocalDay(new Date(2026, 7, 7, 0, 0, 0, 0))
    ).toBeGreaterThanOrEqual(1000);
  });
});

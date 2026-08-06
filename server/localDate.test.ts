import { describe, expect, it } from "vitest";
import { localDay, shiftIsoDay, todayIso } from "@shared/localDate";

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

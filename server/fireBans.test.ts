import { describe, expect, it } from "vitest";
import {
  BAN_LIKELY_FROM_LEVEL,
  banLikely,
  CANTONS,
  findCanton,
  FIRE_BAN_PORTAL,
  sortByDanger,
} from "@shared/fireBans";

describe("CANTONS", () => {
  it("führt alle 26 Kantone", () => {
    expect(CANTONS.length).toBe(26);
  });

  it("hat eindeutige Kürzel", () => {
    const codes = new Set(CANTONS.map(c => c.code));
    expect(codes.size).toBe(CANTONS.length);
  });

  it("liegt mit allen Punkten in der Schweiz", () => {
    CANTONS.forEach(canton => {
      expect(canton.latitude).toBeGreaterThan(45.8);
      expect(canton.latitude).toBeLessThan(47.9);
      expect(canton.longitude).toBeGreaterThan(5.9);
      expect(canton.longitude).toBeLessThan(10.6);
    });
  });

  it("nennt zu jedem Kanton Name und Hauptort", () => {
    CANTONS.forEach(canton => {
      expect(canton.name.length).toBeGreaterThan(1);
      expect(canton.capital.length).toBeGreaterThan(1);
    });
  });

  it("ist alphabetisch nach Kürzel sortiert", () => {
    const codes = CANTONS.map(c => c.code);
    expect(codes).toEqual([...codes].sort());
  });
});

describe("findCanton", () => {
  it("findet unabhängig von der Schreibweise", () => {
    expect(findCanton("be")?.name).toBe("Bern");
    expect(findCanton(" TI ")?.name).toBe("Ticino");
  });

  it("gibt null zurück für Unbekanntes", () => {
    expect(findCanton("XX")).toBeNull();
    expect(findCanton("")).toBeNull();
  });
});

describe("sortByDanger", () => {
  it("stellt die höchste Stufe nach vorn", () => {
    const sorted = sortByDanger([
      { code: "ZH", level: 2 },
      { code: "TI", level: 5 },
      { code: "BE", level: 3 },
    ]);
    expect(sorted.map(r => r.code)).toEqual(["TI", "BE", "ZH"]);
  });

  it("sortiert bei gleicher Stufe alphabetisch", () => {
    const sorted = sortByDanger([
      { code: "ZH", level: 3 },
      { code: "AG", level: 3 },
    ]);
    expect(sorted.map(r => r.code)).toEqual(["AG", "ZH"]);
  });

  it("schiebt Kantone ohne Stufe ans Ende", () => {
    const sorted = sortByDanger([
      { code: "AG", level: null },
      { code: "ZH", level: 1 },
    ]);
    expect(sorted.map(r => r.code)).toEqual(["ZH", "AG"]);
  });

  it("lässt die Eingabe unangetastet", () => {
    const input = [{ code: "ZH", level: 1 }];
    sortByDanger(input);
    expect(input[0].code).toBe("ZH");
  });
});

describe("banLikely", () => {
  it("greift ab der Faustregel-Stufe", () => {
    expect(banLikely(BAN_LIKELY_FROM_LEVEL)).toBe(true);
    expect(banLikely(5)).toBe(true);
  });

  it("gilt darunter nicht", () => {
    expect(banLikely(3)).toBe(false);
    expect(banLikely(null)).toBe(false);
  });
});

describe("FIRE_BAN_PORTAL", () => {
  it("zeigt auf die offizielle Übersicht", () => {
    expect(FIRE_BAN_PORTAL.startsWith("https://")).toBe(true);
  });
});

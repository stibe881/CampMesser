import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import {
  ACTION_LABELS,
  AREA_LABELS,
  BURST_MS,
  CHANGE_ACTIONS,
  CHANGE_AREAS,
  HISTORY_LIMIT,
  MAX_SHOWN_LABELS,
  bundleChanges,
  groupByDay,
  isChangeAction,
  isChangeArea,
  localDay,
  shownLabels,
  type ChangeLike,
} from "@shared/tripHistory";

const MINUTE = 60000;
const base = new Date(2026, 7, 4, 18, 0, 0).getTime();

let nextId = 1;
const change = (
  userId: number,
  area: string,
  action: string,
  minutesAgo: number,
  label: string | null = null
): ChangeLike => ({
  id: nextId++,
  userId,
  area,
  action,
  label,
  at: new Date(base - minutesAgo * MINUTE),
});

describe("Änderungsverlauf pro Reise", () => {
  it("stellt die jüngste Änderung zuoberst", () => {
    const groups = bundleChanges([
      change(1, "expense", "add", 60, "Alt"),
      change(1, "board", "add", 5, "Neu"),
    ]);
    expect(groups[0].labels).toEqual(["Neu"]);
    expect(groups).toHaveLength(2);
  });

  it("bündelt, was dieselbe Person kurz nacheinander tut", () => {
    // Zwölf Posten auf der Einkaufsliste sind eine Zeile, nicht zwölf
    const entries = [];
    for (let i = 0; i < 12; i++) {
      entries.push(change(1, "shopping", "add", i, `Posten ${i}`));
    }
    const groups = bundleChanges(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(12);
  });

  it("trennt zwei Sitzungen mit Pause dazwischen", () => {
    const groups = bundleChanges([
      change(1, "shopping", "add", 0, "Abends"),
      change(1, "shopping", "add", 60, "Morgens"),
    ]);
    expect(groups).toHaveLength(2);
  });

  it("bündelt eine lange Serie kleiner Schritte durch", () => {
    // Abstand zur letzten Änderung zählt, nicht zum Bündelbeginn – sonst
    // reisst eine halbe Stunde Einkaufsliste künstlich ab
    const entries = [];
    for (let i = 0; i < 10; i++) {
      entries.push(change(1, "shopping", "add", i * 5, `Posten ${i}`));
    }
    const groups = bundleChanges(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(10);
  });

  it("bündelt nicht über Personen hinweg", () => {
    const groups = bundleChanges([
      change(1, "expense", "add", 0, "Anna"),
      change(2, "expense", "add", 1, "Beat"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.map(g => g.userId)).toEqual([1, 2]);
  });

  it("bündelt nicht über Bereiche oder Aktionen hinweg", () => {
    const groups = bundleChanges([
      change(1, "expense", "add", 0),
      change(1, "expense", "remove", 1),
      change(1, "board", "add", 2),
    ]);
    expect(groups).toHaveLength(3);
  });

  it("nimmt den Zeitpunkt der jüngsten Änderung des Bündels", () => {
    const groups = bundleChanges([
      change(1, "menu", "edit", 0),
      change(1, "menu", "edit", 3),
    ]);
    expect(groups[0].at).toBe(base);
    expect(groups[0].count).toBe(2);
  });

  it("hält die Bündel-Grenze bei zehn Minuten", () => {
    const inside = bundleChanges([
      change(1, "menu", "edit", 0),
      change(1, "menu", "edit", BURST_MS / MINUTE),
    ]);
    expect(inside).toHaveLength(1);
    const outside = bundleChanges([
      change(1, "menu", "edit", 0),
      change(1, "menu", "edit", BURST_MS / MINUTE + 1),
    ]);
    expect(outside).toHaveLength(2);
  });

  it("kommt mit einem leeren Verlauf zurecht", () => {
    expect(bundleChanges([])).toEqual([]);
    expect(groupByDay([])).toEqual([]);
  });

  describe("Beschriftungen", () => {
    it("zeigt höchstens drei Namen und zählt den Rest", () => {
      const groups = bundleChanges([
        change(1, "shopping", "add", 0, "Brot"),
        change(1, "shopping", "add", 1, "Käse"),
        change(1, "shopping", "add", 2, "Milch"),
        change(1, "shopping", "add", 3, "Butter"),
        change(1, "shopping", "add", 4, "Salz"),
      ]);
      const { shown, more } = shownLabels(groups[0]);
      expect(shown).toHaveLength(MAX_SHOWN_LABELS);
      expect(shown[0]).toBe("Brot");
      expect(more).toBe(2);
      // Die Anzahl bleibt vollständig, nur die Aufzählung ist kurz
      expect(groups[0].count).toBe(5);
    });

    it("nennt denselben Namen nicht doppelt", () => {
      const groups = bundleChanges([
        change(1, "menu", "edit", 0, "Montag"),
        change(1, "menu", "edit", 1, "Montag"),
      ]);
      expect(shownLabels(groups[0]).shown).toEqual(["Montag"]);
      expect(groups[0].count).toBe(2);
    });

    it("kommt ohne Namen aus", () => {
      const groups = bundleChanges([change(1, "trip", "edit", 0)]);
      expect(shownLabels(groups[0])).toEqual({ shown: [], more: 0 });
    });
  });

  describe("Tagesgruppen", () => {
    it("fasst einen Tag zusammen und stellt den jüngsten zuoberst", () => {
      const groups = bundleChanges([
        change(1, "board", "add", 0),
        change(2, "expense", "add", 30),
        // Am Vortag, weit vor der Bündel-Grenze
        change(1, "journal", "edit", 24 * 60),
      ]);
      const days = groupByDay(groups);
      expect(days).toHaveLength(2);
      expect(days[0].groups).toHaveLength(2);
      expect(days[1].groups).toHaveLength(1);
    });

    it("rechnet den Tag lokal, nicht über UTC", () => {
      // 23:30 lokal gehört zu diesem Tag, auch wenn es in UTC schon
      // der nächste ist
      const at = new Date(2026, 7, 4, 23, 30).getTime();
      expect(localDay(at)).toBe("2026-08-04");
    });
  });

  it("kennt jeden Bereich und jede Aktion und weist Fremdes ab", () => {
    CHANGE_AREAS.forEach(area => expect(isChangeArea(area)).toBe(true));
    CHANGE_ACTIONS.forEach(action => expect(isChangeAction(action)).toBe(true));
    expect(isChangeArea("wetter")).toBe(false);
    expect(isChangeAction("verschoben")).toBe(false);
  });

  it("benennt jeden Bereich und jede Aktion in allen vier Sprachen", () => {
    CHANGE_AREAS.forEach(area => {
      LANGUAGES.forEach(lang =>
        expect(AREA_LABELS[area][lang]?.trim().length, area).toBeGreaterThan(0)
      );
    });
    CHANGE_ACTIONS.forEach(action => {
      LANGUAGES.forEach(lang =>
        expect(
          ACTION_LABELS[action][lang]?.trim().length,
          action
        ).toBeGreaterThan(0)
      );
    });
  });

  it("begrenzt den Verlauf auf eine vernünftige Länge", () => {
    // Ein Verlauf, der ewig wächst, ist irgendwann nur noch Ballast
    expect(HISTORY_LIMIT).toBeGreaterThan(50);
    expect(HISTORY_LIMIT).toBeLessThanOrEqual(1000);
  });
});

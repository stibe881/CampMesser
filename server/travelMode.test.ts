import { describe, expect, it } from "vitest";
import {
  isOnSite,
  orderGroups,
  ON_SITE_GROUP_ORDER,
} from "../client/src/lib/travelMode";
import { groups } from "../client/src/data/modules";

describe("orderGroups", () => {
  it("lässt die Reihenfolge ohne Unterwegs-Modus unverändert", () => {
    expect(orderGroups(groups, false)).toEqual([...groups]);
  });

  it("stellt die Vor-Ort-Werkzeuge nach vorne und die Planung nach hinten", () => {
    const ordered = orderGroups(groups, true);
    expect(ordered[0]).toBe("vorOrt");
    expect(ordered[ordered.length - 1]).toBe("reise");
  });

  it("verliert keine Gruppe", () => {
    const ordered = orderGroups(groups, true);
    expect([...ordered].sort()).toEqual([...groups].sort());
  });

  it("hängt unbekannte Gruppen hinten an, statt sie zu verschlucken", () => {
    const ordered = orderGroups(["reise", "neuling", "vorOrt"], true);
    expect(ordered).toEqual(["vorOrt", "reise", "neuling"]);
  });

  it("deckt alle bestehenden Gruppen ab", () => {
    // Wäre eine Gruppe vergessen, landete sie im Unterwegs-Modus zuunterst.
    for (const group of groups) {
      expect(ON_SITE_GROUP_ORDER).toContain(group);
    }
  });
});

describe("isOnSite", () => {
  it("folgt im Automatik-Modus dem laufenden Aufenthalt", () => {
    expect(isOnSite("auto", true)).toBe(true);
    expect(isOnSite("auto", false)).toBe(false);
  });

  it("lässt die Wahl von Hand gewinnen", () => {
    expect(isOnSite("onSite", false)).toBe(true);
    expect(isOnSite("planning", true)).toBe(false);
  });
});

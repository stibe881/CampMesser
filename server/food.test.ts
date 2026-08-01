import { describe, expect, it } from "vitest";
import { expiryInfo, expirySortKey } from "@shared/food";

const TODAY = "2026-08-01";

describe("expiryInfo", () => {
  it("gibt null ohne Datum zurück", () => {
    expect(expiryInfo(null, TODAY)).toBeNull();
    expect(expiryInfo(undefined, TODAY)).toBeNull();
    expect(expiryInfo("kaputt", TODAY)).toBeNull();
  });

  it("erkennt abgelaufene Lebensmittel", () => {
    expect(expiryInfo("2026-07-31", TODAY)).toEqual({
      state: "expired",
      daysLeft: -1,
      label: "seit gestern abgelaufen",
    });
    expect(expiryInfo("2026-07-27", TODAY)?.label).toBe(
      "seit 5 Tagen abgelaufen"
    );
  });

  it("erkennt heute und bald ablaufende Lebensmittel", () => {
    expect(expiryInfo("2026-08-01", TODAY)).toMatchObject({
      state: "today",
      label: "läuft heute ab",
    });
    expect(expiryInfo("2026-08-02", TODAY)).toMatchObject({
      state: "soon",
      label: "läuft morgen ab",
    });
    expect(expiryInfo("2026-08-04", TODAY)).toMatchObject({
      state: "soon",
      label: "noch 3 Tage",
    });
  });

  it("markiert länger haltbare Lebensmittel als ok", () => {
    expect(expiryInfo("2026-08-05", TODAY)).toMatchObject({
      state: "ok",
      daysLeft: 4,
    });
    expect(expiryInfo("2026-09-01", TODAY)?.state).toBe("ok");
  });

  it("rechnet über Monatsgrenzen korrekt", () => {
    expect(expiryInfo("2026-09-01", "2026-08-30")?.daysLeft).toBe(2);
  });
});

describe("expirySortKey", () => {
  it("sortiert früheste Daten zuerst und Einträge ohne Datum ans Ende", () => {
    const items = [
      { name: "Ohne", expiryDate: null },
      { name: "Später", expiryDate: "2026-08-10" },
      { name: "Zuerst", expiryDate: "2026-08-02" },
    ];
    const sorted = [...items].sort(
      (a, b) => expirySortKey(a.expiryDate) - expirySortKey(b.expiryDate)
    );
    expect(sorted.map(i => i.name)).toEqual(["Zuerst", "Später", "Ohne"]);
  });
});

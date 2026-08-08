/**
 * Platz-Vergleich (#440): wer bei einer Vergleichszeile «gewinnt» und
 * welche Eigenschafts-Zeilen angezeigt werden.
 */
import { describe, expect, it } from "vitest";
import { attributeCompareRows, compareAdvantage } from "@shared/spotCompare";

describe("compareAdvantage", () => {
  it("kürt bei «lower» den kleineren Wert", () => {
    expect(compareAdvantage(4500, 6200, "lower")).toBe("a");
    expect(compareAdvantage(6200, 4500, "lower")).toBe("b");
  });

  it("kürt bei «higher» den grösseren Wert", () => {
    expect(compareAdvantage(4.5, 3.0, "higher")).toBe("a");
    expect(compareAdvantage(3.0, 4.5, "higher")).toBe("b");
  });

  it("meldet Gleichstand als tie", () => {
    expect(compareAdvantage(4500, 4500, "lower")).toBe("tie");
  });

  it("vergleicht nicht, sobald eine Seite keinen Wert hat", () => {
    expect(compareAdvantage(null, 4500, "lower")).toBe("none");
    expect(compareAdvantage(4500, null, "higher")).toBe("none");
    expect(compareAdvantage(null, null, "lower")).toBe("none");
    expect(compareAdvantage(Number.NaN, 4500, "lower")).toBe("none");
  });
});

describe("attributeCompareRows", () => {
  it("liefert nur Zeilen mit mindestens einem erfassten Wert", () => {
    const rows = attributeCompareRows(
      { shade: "much", wifi: "yes" },
      { shade: "none" }
    );
    expect(rows.map(r => r.def.key)).toEqual(["shade", "wifi"]);
    const shade = rows[0];
    expect(shade.a?.value).toBe("much");
    expect(shade.b?.value).toBe("none");
    // WLAN nur auf Seite A erfasst – Seite B bleibt Lücke, nicht «nein»
    expect(rows[1].a?.value).toBe("yes");
    expect(rows[1].b).toBeNull();
  });

  it("hält die Katalog-Reihenfolge ein", () => {
    const rows = attributeCompareRows(
      { shop: "yes", shade: "some" },
      { noise: "quiet" }
    );
    expect(rows.map(r => r.def.key)).toEqual(["shade", "noise", "shop"]);
  });

  it("bleibt bei leeren Eigenschaften leer", () => {
    expect(attributeCompareRows({}, {})).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  listSpotAttributes,
  parseSpotAttributes,
  sanitizeSpotAttributes,
  SPOT_ATTRIBUTES,
} from "../shared/spotAttributes";

describe("sanitizeSpotAttributes", () => {
  it("übernimmt gültige Schlüssel/Wert-Paare", () => {
    expect(
      sanitizeSpotAttributes({ shade: "much", wifi: "yes", noise: "quiet" })
    ).toEqual({ shade: "much", wifi: "yes", noise: "quiet" });
  });

  it("verwirft unbekannte Schlüssel und ungültige Werte", () => {
    expect(
      sanitizeSpotAttributes({
        shade: "extrem",
        pool: "yes",
        wifi: "maybe",
        dogs: "yes",
        kids: 1,
        power: null,
      })
    ).toEqual({ dogs: "yes" });
  });

  it("verwirft Nicht-Objekte", () => {
    expect(sanitizeSpotAttributes(null)).toEqual({});
    expect(sanitizeSpotAttributes(["shade"])).toEqual({});
    expect(sanitizeSpotAttributes("shade")).toEqual({});
    expect(sanitizeSpotAttributes(42)).toEqual({});
  });
});

describe("parseSpotAttributes", () => {
  it("liest gültiges JSON und normalisiert dabei", () => {
    expect(
      parseSpotAttributes('{"sanitary":"2","shop":"no","invalid":"x"}')
    ).toEqual({ sanitary: "2", shop: "no" });
  });

  it("liefert {} bei kaputtem JSON, null und leerem String", () => {
    expect(parseSpotAttributes("{kaputt")).toEqual({});
    expect(parseSpotAttributes("[1,2]")).toEqual({});
    expect(parseSpotAttributes(null)).toEqual({});
    expect(parseSpotAttributes(undefined)).toEqual({});
    expect(parseSpotAttributes("")).toEqual({});
  });
});

describe("listSpotAttributes", () => {
  it("löst gesetzte Attribute in Katalog-Reihenfolge auf", () => {
    const entries = listSpotAttributes({ wifi: "yes", shade: "some" });
    expect(entries.map(e => e.def.key)).toEqual(["shade", "wifi"]);
    expect(entries[0].value.value).toBe("some");
    expect(entries[1].value.label.de).toBe("ja");
  });

  it("überspringt Werte ausserhalb des Katalogs", () => {
    expect(
      listSpotAttributes({ noise: "sehr-laut" as unknown as string })
    ).toEqual([]);
  });
});

describe("Katalog", () => {
  it("hat pro Attribut mindestens zwei Werte und einen Icon-Namen", () => {
    for (const def of SPOT_ATTRIBUTES) {
      expect(def.values.length).toBeGreaterThanOrEqual(2);
      expect(def.icon.length).toBeGreaterThan(0);
      // Werte pro Attribut eindeutig
      const values = def.values.map(v => v.value);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIP_KIND,
  normalizeTripKind,
  TRIP_KINDS,
  TRIP_KIND_PRESETS,
  tripKindLabel,
  tripKindPreset,
} from "../shared/tripKind";

describe("Reise-Art (#460)", () => {
  it("kennt die acht Arten, Camping zuerst", () => {
    expect(TRIP_KINDS).toEqual([
      "camping",
      "strand",
      "hotel",
      "staedte",
      "wandern",
      "velo",
      "wintersport",
      "tagesausflug",
    ]);
    expect(DEFAULT_TRIP_KIND).toBe("camping");
  });

  it("bringt Unbekanntes auf Camping (Zeilen von vor der Spalte)", () => {
    expect(normalizeTripKind("strand")).toBe("strand");
    expect(normalizeTripKind("beach")).toBe("camping");
    expect(normalizeTripKind(null)).toBe("camping");
    expect(normalizeTripKind(undefined)).toBe("camping");
    expect(normalizeTripKind(42)).toBe("camping");
  });

  it("übersetzt die Anzeigenamen, Deutsch als Default", () => {
    expect(tripKindLabel("strand")).toBe("Strandferien");
    expect(tripKindLabel("hotel", "fr")).toBe("Vacances à l'hôtel");
    expect(tripKindLabel("staedte", "it")).toBe("Viaggio in città");
    expect(tripKindLabel("tagesausflug", "en")).toBe("Day trip");
  });

  it("hat für jede Art ein Preset – Camping bleibt das heutige Verhalten", () => {
    TRIP_KINDS.forEach(kind => {
      expect(TRIP_KIND_PRESETS[kind]).toBeDefined();
    });
    expect(TRIP_KIND_PRESETS.camping).toEqual({
      quickModules: [],
      campfire: true,
      bathing: false,
    });
    // Nur am Strand steht die Badewasser-Karte in der Heute-Ansicht
    TRIP_KINDS.filter(kind => kind !== "strand").forEach(kind => {
      expect(TRIP_KIND_PRESETS[kind].bathing).toBe(false);
    });
    expect(TRIP_KIND_PRESETS.strand.bathing).toBe(true);
  });

  it("liefert das Preset auch für kaputte Werte (nie undefined)", () => {
    expect(tripKindPreset("strand").bathing).toBe(true);
    expect(tripKindPreset("kaputt")).toEqual(TRIP_KIND_PRESETS.camping);
  });
});

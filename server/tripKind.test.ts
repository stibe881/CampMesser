import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRIP_KIND,
  normalizeTripKind,
  TRIP_KINDS,
  TRIP_KIND_FORMS,
  TRIP_KIND_PRESETS,
  tripKindForm,
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
      tentGear: true,
      winter: false,
      sights: false,
      beaches: false,
      transit: false,
      excursions: false,
      bike: false,
    });
    // Nur am Strand steht die Badewasser-Karte in der Heute-Ansicht
    TRIP_KINDS.filter(kind => kind !== "strand").forEach(kind => {
      expect(TRIP_KIND_PRESETS[kind].bathing).toBe(false);
    });
    expect(TRIP_KIND_PRESETS.strand.bathing).toBe(true);
    // Nur beim Wintersport steht die Schneehöhe in der Heute-Ansicht (#470)
    TRIP_KINDS.filter(kind => kind !== "wintersport").forEach(kind => {
      expect(TRIP_KIND_PRESETS[kind].winter).toBe(false);
    });
    expect(TRIP_KIND_PRESETS.wintersport.winter).toBe(true);
    // Stadt & Hotel bekommen Sehenswürdigkeiten und ÖV (#486/#488),
    // der Strand seine Strände (#487), der Tagesausflug die kuratierten
    // Ausflüge samt ÖV (#489)
    expect(TRIP_KIND_PRESETS.staedte.sights).toBe(true);
    expect(TRIP_KIND_PRESETS.hotel.sights).toBe(true);
    expect(TRIP_KIND_PRESETS.camping.sights).toBe(false);
    TRIP_KINDS.filter(kind => kind !== "strand").forEach(kind => {
      expect(TRIP_KIND_PRESETS[kind].beaches).toBe(false);
    });
    expect(TRIP_KIND_PRESETS.strand.beaches).toBe(true);
    expect(TRIP_KIND_PRESETS.staedte.transit).toBe(true);
    expect(TRIP_KIND_PRESETS.hotel.transit).toBe(true);
    expect(TRIP_KIND_PRESETS.tagesausflug.transit).toBe(true);
    expect(TRIP_KIND_PRESETS.camping.transit).toBe(false);
    TRIP_KINDS.filter(kind => kind !== "tagesausflug").forEach(kind => {
      expect(TRIP_KIND_PRESETS[kind].excursions).toBe(false);
    });
    expect(TRIP_KIND_PRESETS.tagesausflug.excursions).toBe(true);
    // Velo-Läden (#527) zeigt nur die Velotour
    for (const kind of TRIP_KINDS.filter(k => k !== "velo")) {
      expect(TRIP_KIND_PRESETS[kind].bike).toBe(false);
    }
    expect(TRIP_KIND_PRESETS.velo.bike).toBe(true);
  });

  it("liefert das Preset auch für kaputte Werte (nie undefined)", () => {
    expect(tripKindPreset("strand").bathing).toBe(true);
    expect(tripKindPreset("kaputt")).toEqual(TRIP_KIND_PRESETS.camping);
  });
});

describe("Formular-Felder pro Reise-Art (#485)", () => {
  it("hat für jede Art ein Formular-Preset", () => {
    TRIP_KINDS.forEach(kind => {
      expect(TRIP_KIND_FORMS[kind], kind).toBeDefined();
    });
  });

  it("bietet die Zeltplatz-Auswahl nur Arten an, die dort schlafen", () => {
    expect(TRIP_KIND_FORMS.camping.spotSelect).toBe(true);
    expect(TRIP_KIND_FORMS.wandern.spotSelect).toBe(true);
    expect(TRIP_KIND_FORMS.velo.spotSelect).toBe(true);
    expect(TRIP_KIND_FORMS.hotel.spotSelect).toBe(false);
    expect(TRIP_KIND_FORMS.staedte.spotSelect).toBe(false);
    expect(TRIP_KIND_FORMS.strand.spotSelect).toBe(false);
    // Stellplatz-Details gehen mit der Zeltplatz-Auswahl einher
    TRIP_KINDS.forEach(kind => {
      expect(TRIP_KIND_FORMS[kind].pitchDetails, kind).toBe(
        TRIP_KIND_FORMS[kind].spotSelect
      );
    });
  });

  it("fragt nur beim Tagesausflug ein einzelnes Datum ab", () => {
    TRIP_KINDS.forEach(kind => {
      expect(TRIP_KIND_FORMS[kind].singleDay, kind).toBe(
        kind === "tagesausflug"
      );
    });
  });

  it("liefert das Formular-Preset auch für kaputte Werte", () => {
    expect(tripKindForm("kaputt")).toEqual(TRIP_KIND_FORMS.camping);
    expect(tripKindForm("tagesausflug").singleDay).toBe(true);
  });
});

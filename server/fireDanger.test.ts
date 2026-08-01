import { describe, expect, it } from "vitest";
import {
  dangerLevelFromTitle,
  FIRE_DANGER_LEVELS,
  fireDangerRequestUrl,
  parseFireDangerResponse,
} from "@shared/fireDanger";

// Reale Antwortstruktur der GeoAdmin-Identify-API (gekürzt)
const sampleResponse = {
  results: [
    {
      layerBodId: "ch.bafu.gefahren-waldbrand_warnung",
      featureId: 313,
      attributes: {
        name_de: "Region Bern (BE)",
        title_de: "Grosse Gefahr",
        title_fr: "Danger fort",
        valid_from: "30.07.2026",
        canton: "BE",
      },
    },
  ],
};

describe("dangerLevelFromTitle", () => {
  it("übersetzt alle offiziellen Stufentitel", () => {
    expect(dangerLevelFromTitle("Keine oder geringe Gefahr")).toBe(1);
    expect(dangerLevelFromTitle("Mässige Gefahr")).toBe(2);
    expect(dangerLevelFromTitle("Erhebliche Gefahr")).toBe(3);
    expect(dangerLevelFromTitle("Grosse Gefahr")).toBe(4);
    expect(dangerLevelFromTitle("Sehr grosse Gefahr")).toBe(5);
  });

  it("verkraftet Umlaut-Ersatzschreibweise und Grossschreibung", () => {
    expect(dangerLevelFromTitle("MAESSIGE GEFAHR")).toBe(2);
    expect(dangerLevelFromTitle("geringe Gefahr")).toBe(1);
  });

  it("gibt null für unbekannte Titel zurück", () => {
    expect(dangerLevelFromTitle("Sturmwarnung")).toBeNull();
    expect(dangerLevelFromTitle("")).toBeNull();
  });
});

describe("parseFireDangerResponse", () => {
  it("liest Stufe, Region und Gültigkeit aus einer echten Antwort", () => {
    const info = parseFireDangerResponse(sampleResponse);
    expect(info).not.toBeNull();
    expect(info!.level).toBe(4);
    expect(info!.title).toBe("Grosse Gefahr");
    expect(info!.regionName).toBe("Region Bern (BE)");
    expect(info!.validFrom).toBe("30.07.2026");
  });

  it("gibt null zurück, wenn keine Region gefunden wurde", () => {
    expect(parseFireDangerResponse({ results: [] })).toBeNull();
  });

  it("gibt null bei kaputtem oder fremdem Format zurück", () => {
    expect(parseFireDangerResponse(null)).toBeNull();
    expect(parseFireDangerResponse("fehler")).toBeNull();
    expect(
      parseFireDangerResponse({ detail: "No GeoTable", status: "error" })
    ).toBeNull();
    expect(
      parseFireDangerResponse({ results: [{ attributes: { title_de: 42 } }] })
    ).toBeNull();
    expect(
      parseFireDangerResponse({
        results: [{ attributes: { title_de: "Unbekannt" } }],
      })
    ).toBeNull();
  });
});

describe("FIRE_DANGER_LEVELS", () => {
  it("liefert für jede Stufe Titel und Feuerregeln", () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      expect(FIRE_DANGER_LEVELS[level].title.length).toBeGreaterThan(0);
      expect(FIRE_DANGER_LEVELS[level].advice.length).toBeGreaterThan(20);
    }
  });
});

describe("fireDangerRequestUrl", () => {
  it("baut eine Identify-URL mit LV95-Koordinaten und BAFU-Layer", () => {
    const url = fireDangerRequestUrl(2600000, 1199000);
    expect(url).toContain("api3.geo.admin.ch");
    expect(url).toContain("2600000%2C1199000");
    expect(url).toContain("ch.bafu.gefahren-waldbrand_warnung");
    expect(url).toContain("sr=2056");
  });
});

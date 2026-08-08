import { describe, expect, it } from "vitest";
import {
  describePollenLevel,
  parsePollenResponse,
  pollenLevel,
  pollenRequestUrl,
  pollenTypeName,
  relevantPollenForBriefing,
  POLLEN_TYPES,
  type PollenReading,
} from "../shared/pollen";

describe("pollenLevel", () => {
  it("ordnet die Schwellen korrekt zu", () => {
    expect(pollenLevel(0)).toBe("keine");
    expect(pollenLevel(-1)).toBe("keine");
    expect(pollenLevel(0.5)).toBe("gering");
    expect(pollenLevel(9.9)).toBe("gering");
    expect(pollenLevel(10)).toBe("maessig");
    expect(pollenLevel(49.9)).toBe("maessig");
    expect(pollenLevel(50)).toBe("hoch");
    expect(pollenLevel(99.9)).toBe("hoch");
    expect(pollenLevel(100)).toBe("sehrHoch");
    expect(pollenLevel(500)).toBe("sehrHoch");
  });
});

describe("pollenTypeName / describePollenLevel", () => {
  it("liefert deutsche Namen als Default und Übersetzungen per lang", () => {
    expect(pollenTypeName("grass")).toBe("Gräser");
    expect(pollenTypeName("alder", "fr")).toBe("Aulne");
    expect(pollenTypeName("birch", "it")).toBe("Betulla");
    expect(pollenTypeName("ragweed", "en")).toBe("Ragweed");
    expect(pollenTypeName("mugwort", "fr")).toBe("Armoise");
  });

  it("übersetzt die Stufen-Labels", () => {
    expect(describePollenLevel("maessig")).toBe("mässig");
    expect(describePollenLevel("sehrHoch", "fr")).toBe("très forte");
    expect(describePollenLevel("keine", "en")).toBe("none");
  });
});

describe("pollenRequestUrl", () => {
  it("fragt alle sechs Pollenarten stündlich an", () => {
    const url = pollenRequestUrl(46.9481, 7.4474);
    expect(url).toContain("air-quality-api.open-meteo.com/v1/air-quality");
    expect(url).toContain("latitude=46.9481");
    for (const field of [
      "alder_pollen",
      "birch_pollen",
      "grass_pollen",
      "mugwort_pollen",
      "olive_pollen",
      "ragweed_pollen",
    ]) {
      expect(decodeURIComponent(url)).toContain(field);
    }
  });
});

/** Lokale ISO-Stunde im API-Format (YYYY-MM-DDTHH:00) für einen Zeitpunkt */
function localHourIso(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

describe("parsePollenResponse", () => {
  const now = new Date("2026-08-02T14:30:00").getTime();
  const times = [-2, -1, 0, 1].map(h => localHourIso(now + h * 3600000));

  it("gibt null bei unbrauchbaren Antworten zurück", () => {
    expect(parsePollenResponse(null)).toBeNull();
    expect(parsePollenResponse("x")).toBeNull();
    expect(parsePollenResponse({})).toBeNull();
    expect(parsePollenResponse({ hourly: { time: [] } })).toBeNull();
  });

  it("wählt die aktuelle Stunde (letzte nicht in der Zukunft)", () => {
    const json = {
      hourly: {
        time: times,
        grass_pollen: [5, 12, 60, 200],
      },
    };
    const readings = parsePollenResponse(json, now);
    expect(readings).toHaveLength(1);
    expect(readings![0]).toEqual({ type: "grass", value: 60, level: "hoch" });
  });

  it("überspringt Arten ohne Zahlenwert und klemmt negative Werte", () => {
    const json = {
      hourly: {
        time: times,
        grass_pollen: [0, 0, -3, 0],
        birch_pollen: [null, null, null, null],
        alder_pollen: [1, 1, 25, 1],
      },
    };
    const readings = parsePollenResponse(json, now)!;
    expect(readings.map(r => r.type)).toEqual(["alder", "grass"]);
    expect(readings.find(r => r.type === "grass")).toEqual({
      type: "grass",
      value: 0,
      level: "keine",
    });
    expect(readings.find(r => r.type === "alder")!.level).toBe("maessig");
  });

  it("gibt null zurück, wenn keine Art einen Wert liefert («keine Daten»)", () => {
    const json = {
      hourly: {
        time: times,
        grass_pollen: [null, null, null, null],
      },
    };
    expect(parsePollenResponse(json, now)).toBeNull();
  });

  it("kennt alle sechs Arten", () => {
    expect(POLLEN_TYPES).toEqual([
      "alder",
      "birch",
      "grass",
      "mugwort",
      "olive",
      "ragweed",
    ]);
  });
});

describe("relevantPollenForBriefing (#456)", () => {
  const reading = (
    type: PollenReading["type"],
    level: PollenReading["level"]
  ): PollenReading => ({ type, value: 1, level });

  it("filtert auf die eigenen Allergene und wirft «keine» raus", () => {
    const readings = [
      reading("alder", "hoch"),
      reading("birch", "keine"),
      reading("grass", "gering"),
      reading("ragweed", "sehrHoch"),
    ];
    const result = relevantPollenForBriefing(readings, ["birch", "grass"]);
    expect(result.map(r => r.type)).toEqual(["grass"]);
  });

  it("sortiert nach Belastung, stärkste zuerst", () => {
    const readings = [
      reading("alder", "gering"),
      reading("birch", "sehrHoch"),
      reading("grass", "maessig"),
    ];
    const result = relevantPollenForBriefing(readings, [
      "alder",
      "birch",
      "grass",
    ]);
    expect(result.map(r => r.type)).toEqual(["birch", "grass", "alder"]);
  });

  it("bleibt leer ohne Profil oder ohne Messwerte", () => {
    expect(relevantPollenForBriefing(null, ["grass"])).toEqual([]);
    expect(relevantPollenForBriefing([reading("grass", "hoch")], [])).toEqual(
      []
    );
  });

  it("verändert die Eingabeliste nicht", () => {
    const readings = [reading("grass", "gering"), reading("birch", "hoch")];
    relevantPollenForBriefing(readings, ["grass", "birch"]);
    expect(readings.map(r => r.type)).toEqual(["grass", "birch"]);
  });
});

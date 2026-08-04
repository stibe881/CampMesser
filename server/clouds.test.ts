import { describe, expect, it } from "vitest";
import {
  cloudBandLabels,
  cloudBandOrder,
  cloudEntries,
  cloudsInBand,
  type CloudBand,
} from "../client/src/data/clouds";
import { LANGUAGES, pick } from "@shared/i18n";

describe("Wolken-Lexikon (#264)", () => {
  it("führt die zehn Grundformen mit den campingrelevanten Sonderfällen", () => {
    const ids = cloudEntries.map(e => e.id);
    for (const id of [
      "cirrus",
      "cirrostratus",
      "cirrocumulus",
      "altocumulus",
      "altostratus",
      "lenticularis",
      "nimbostratus",
      "stratus",
      "stratocumulus",
      "cumulus-humilis",
      "cumulus-congestus",
      "cumulonimbus",
    ]) {
      expect(ids).toContain(id);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("jeder Eintrag beschreibt Aussehen, Bedeutung und Tipp in vier Sprachen", () => {
    for (const entry of cloudEntries) {
      expect(entry.latin.length).toBeGreaterThan(5);
      for (const lang of LANGUAGES) {
        expect(pick(entry.name, lang).length).toBeGreaterThan(2);
        // Das Aussehen muss zum Vergleichen mit dem Himmel taugen, nicht nur
        // ein Schlagwort sein – deshalb eine spürbare Mindestlänge
        expect(pick(entry.appearance, lang).length).toBeGreaterThan(60);
        expect(pick(entry.meaning, lang).length).toBeGreaterThan(60);
        expect(pick(entry.campTip, lang).length).toBeGreaterThan(30);
      }
    }
  });

  it("jedes Stockwerk ist besetzt und hat ein Label in vier Sprachen", () => {
    for (const band of cloudBandOrder) {
      expect(cloudsInBand(band).length).toBeGreaterThanOrEqual(2);
      for (const lang of LANGUAGES) {
        expect(pick(cloudBandLabels[band], lang).length).toBeGreaterThan(5);
      }
    }
    // Kein Eintrag fällt aus der Anzeige heraus
    const grouped = cloudBandOrder.flatMap(band => cloudsInBand(band));
    expect(grouped.length).toBe(cloudEntries.length);
  });

  it("die Gewitterwolke ist die einzige Warnung", () => {
    const warnings = cloudEntries.filter(e => e.urgency === "warnung");
    expect(warnings.map(e => e.id)).toEqual(["cumulonimbus"]);
    // Ihr Camp-Tipp muss die Blitzregel nennen, sonst nützt die Warnung nichts
    expect(pick(warnings[0].campTip, "de")).toContain("Blitz");
  });

  it("Schönwetterzeichen kündigen nichts an, Fronten dagegen schon", () => {
    for (const entry of cloudEntries) {
      if (entry.urgency === "gut") {
        expect(entry.leadHours).toBeNull();
      }
    }
    // Halo-Wolke: das zuverlässigste Vorzeichen, mit Vorwarnzeit unter einem Tag
    const cirrostratus = cloudEntries.find(e => e.id === "cirrostratus")!;
    expect(cirrostratus.leadHours).toEqual([8, 16]);
  });

  it("die Vorwarnzeit ist immer eine aufsteigende Spanne", () => {
    for (const entry of cloudEntries) {
      if (entry.leadHours === null) continue;
      const [from, to] = entry.leadHours;
      expect(from).toBeGreaterThanOrEqual(0);
      expect(to).toBeGreaterThan(from);
      expect(to).toBeLessThanOrEqual(24);
    }
  });

  it("je näher das Wetter, desto kürzer die Vorwarnzeit", () => {
    const lead = (id: string) =>
      cloudEntries.find(e => e.id === id)!.leadHours!;
    // Warmfront-Kette: Federwolke → Halo → graue Schicht
    expect(lead("cirrus")[0]).toBeGreaterThan(lead("cirrostratus")[0]);
    expect(lead("cirrostratus")[0]).toBeGreaterThan(lead("altostratus")[0]);
    // Quellwolken-Kette: Türmchen → Gewitter
    expect(lead("cumulus-congestus")[0]).toBeGreaterThan(
      lead("cumulonimbus")[0]
    );
  });

  it("das Stockwerk eines Eintrags stimmt mit seiner Gruppierung überein", () => {
    for (const band of cloudBandOrder) {
      for (const entry of cloudsInBand(band)) {
        expect(entry.band).toBe<CloudBand>(band);
      }
    }
  });
});

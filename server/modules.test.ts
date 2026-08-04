import { describe, expect, it } from "vitest";
import { groupLabels, groups, modules } from "@/data/modules";
import { LANGUAGES } from "@shared/i18n";

/**
 * Wächter für den Modul-Katalog.
 *
 * Die Gruppen-Schlüssel waren einmal auseinandergelaufen: «Erste Hilfe»
 * hiess die Gruppe, in der Rezepte, Knoten und der Familien-Modus lagen –
 * während die Kachel «Erste Hilfe» unter «Sicherheit» stand. Solche
 * Verschiebungen passieren beim Anbauen still. Diese Tests halten fest,
 * dass jede Gruppe existiert, benannt ist und auch wirklich etwas enthält.
 */
describe("Modul-Katalog", () => {
  it("hat für jede Gruppe eine Beschriftung in allen vier Sprachen", () => {
    groups.forEach(group => {
      const label = groupLabels[group];
      expect(label, `Beschriftung fehlt: ${group}`).toBeTruthy();
      LANGUAGES.forEach(lang => {
        expect(label[lang]?.trim().length, `${group}/${lang}`).toBeGreaterThan(
          0
        );
      });
    });
  });

  it("steckt jede Kachel in eine Gruppe, die es gibt", () => {
    modules.forEach(m => {
      expect(groups, `unbekannte Gruppe bei ${m.path}`).toContain(m.group);
    });
  });

  it("lässt keine Gruppe leer – eine leere Überschrift wäre nur Lärm", () => {
    groups.forEach(group => {
      const count = modules.filter(m => m.group === group).length;
      expect(count, `Gruppe ohne Kacheln: ${group}`).toBeGreaterThan(0);
    });
  });

  it("hält Gruppen beisammen, statt sie zu zersplittern", () => {
    // Eine Überschrift für ein, zwei Kacheln ist mehr Aufwand als Nutzen –
    // so entstand seinerzeit «Energie & Wasser» mit genau zwei Einträgen
    groups.forEach(group => {
      const count = modules.filter(m => m.group === group).length;
      expect(count, `zu kleine Gruppe: ${group}`).toBeGreaterThanOrEqual(3);
    });
  });

  it("vergibt jeden Pfad nur einmal", () => {
    const paths = modules.map(m => m.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("beschreibt jede Kachel in allen vier Sprachen", () => {
    modules.forEach(m => {
      LANGUAGES.forEach(lang => {
        expect(
          m.title[lang]?.trim().length,
          `${m.path}/${lang}`
        ).toBeGreaterThan(0);
        expect(
          m.description[lang]?.trim().length,
          `${m.path}/${lang}`
        ).toBeGreaterThan(0);
      });
    });
  });
});

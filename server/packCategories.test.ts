import { describe, expect, it } from "vitest";
import {
  comparePackCategories,
  sortPackCategories,
  sortPackCategoryGroups,
} from "@shared/packCategories";

describe("sortPackCategories", () => {
  it("sortiert alphabetisch statt nach Eingabereihenfolge", () => {
    expect(sortPackCategories(["Küche", "Bad", "Schlafen"], "de")).toEqual([
      "Bad",
      "Küche",
      "Schlafen",
    ]);
  });

  it("stellt eine neu angelegte Kategorie an ihren Platz", () => {
    const bestand = ["Bad", "Küche", "Schlafen"];
    expect(sortPackCategories([...bestand, "Camping"], "de")).toEqual([
      "Bad",
      "Camping",
      "Küche",
      "Schlafen",
    ]);
  });

  it("ignoriert Gross-/Kleinschreibung", () => {
    expect(sortPackCategories(["zelt", "Bad", "apotheke"], "de")).toEqual([
      "apotheke",
      "Bad",
      "zelt",
    ]);
  });

  it("sortiert Umlaute wie den Grundbuchstaben", () => {
    // «Ö» zählt wie «O», also entscheidet der zweite Buchstabe (l vor r)
    expect(sortPackCategories(["Zelt", "Öl", "Ordner"], "de")).toEqual([
      "Öl",
      "Ordner",
      "Zelt",
    ]);
  });

  it("vergleicht Zahlen als Zahlen", () => {
    expect(sortPackCategories(["Tag 10", "Tag 2", "Tag 1"], "de")).toEqual([
      "Tag 1",
      "Tag 2",
      "Tag 10",
    ]);
  });

  it("lässt die Eingabe unverändert", () => {
    const input = ["Küche", "Bad"];
    sortPackCategories(input, "de");
    expect(input).toEqual(["Küche", "Bad"]);
  });

  it("kommt mit leerer Liste und einem Eintrag klar", () => {
    expect(sortPackCategories([], "de")).toEqual([]);
    expect(sortPackCategories(["Bad"], "de")).toEqual(["Bad"]);
  });

  it("sortiert in den anderen Sprachen ebenso", () => {
    expect(sortPackCategories(["Cuisine", "Bain", "Étanchéité"], "fr")).toEqual(
      ["Bain", "Cuisine", "Étanchéité"]
    );
    expect(sortPackCategories(["Cucina", "Bagno"], "it")).toEqual([
      "Bagno",
      "Cucina",
    ]);
    expect(sortPackCategories(["Kitchen", "Bathroom"], "en")).toEqual([
      "Bathroom",
      "Kitchen",
    ]);
  });
});

describe("comparePackCategories", () => {
  it("gibt 0 für gleichwertige Namen", () => {
    expect(comparePackCategories("Bad", "bad", "de")).toBe(0);
  });

  it("ordnet vorwärts und rückwärts gegenläufig", () => {
    expect(comparePackCategories("Bad", "Küche", "de")).toBeLessThan(0);
    expect(comparePackCategories("Küche", "Bad", "de")).toBeGreaterThan(0);
  });
});

describe("sortPackCategoryGroups", () => {
  it("sortiert die Gruppen nach Kategorie", () => {
    const groups: [string, string[]][] = [
      ["Küche", ["Pfanne", "Topf"]],
      ["Bad", ["Zahnbürste"]],
    ];
    expect(sortPackCategoryGroups(groups, "de").map(([c]) => c)).toEqual([
      "Bad",
      "Küche",
    ]);
  });

  it("lässt die Einträge innerhalb einer Gruppe in Ruhe", () => {
    const groups: [string, string[]][] = [["Küche", ["Pfanne", "Topf"]]];
    expect(sortPackCategoryGroups(groups, "de")[0][1]).toEqual([
      "Pfanne",
      "Topf",
    ]);
  });

  it("lässt die Eingabe unverändert", () => {
    const groups: [string, string[]][] = [
      ["Küche", ["Pfanne"]],
      ["Bad", ["Seife"]],
    ];
    sortPackCategoryGroups(groups, "de");
    expect(groups.map(([c]) => c)).toEqual(["Küche", "Bad"]);
  });
});

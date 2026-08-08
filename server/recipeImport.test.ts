/**
 * Rezept aus Text übernehmen (#444): die Heuristik, die kopierten Text
 * in Name/Zutaten/Schritte zerlegt.
 */
import { describe, expect, it } from "vitest";
import {
  IMPORT_MAX_INGREDIENTS,
  IMPORT_MAX_STEPS,
  parseRecipeText,
  startsWithQuantity,
} from "@shared/recipeImport";

describe("parseRecipeText mit Abschnitts-Titeln", () => {
  it("zerlegt ein deutsches Rezept mit «Zutaten»/«Zubereitung»", () => {
    const parsed = parseRecipeText(
      [
        "Älplermagronen",
        "",
        "Zutaten:",
        "- 250 g Magronen",
        "- 200 g Kartoffeln",
        "- 1 Zwiebel",
        "",
        "Zubereitung",
        "1. Kartoffeln würfeln und kochen.",
        "2. Magronen dazugeben.",
        "Schritt 3: Mit Käse mischen.",
      ].join("\n")
    );
    expect(parsed.name).toBe("Älplermagronen");
    expect(parsed.ingredients).toEqual([
      "250 g Magronen",
      "200 g Kartoffeln",
      "1 Zwiebel",
    ]);
    expect(parsed.steps).toEqual([
      "Kartoffeln würfeln und kochen.",
      "Magronen dazugeben.",
      "Mit Käse mischen.",
    ]);
  });

  it("versteht englische Titel", () => {
    const parsed = parseRecipeText(
      "One-pot pasta\nIngredients\n400 g pasta\nInstructions\nBoil everything."
    );
    expect(parsed.name).toBe("One-pot pasta");
    expect(parsed.ingredients).toEqual(["400 g pasta"]);
    expect(parsed.steps).toEqual(["Boil everything."]);
  });
});

describe("parseRecipeText ohne Titel", () => {
  it("nimmt Mengen-Zeilen als Zutaten, Prosa als Schritte", () => {
    const parsed = parseRecipeText(
      [
        "Schnelle Rösti",
        "500 g Kartoffeln",
        "½ Zwiebel",
        "1-2 EL Butter",
        "Kartoffeln reiben und würzen.",
        "In der Pfanne goldbraun braten.",
      ].join("\n")
    );
    expect(parsed.name).toBe("Schnelle Rösti");
    expect(parsed.ingredients).toEqual([
      "500 g Kartoffeln",
      "½ Zwiebel",
      "1-2 EL Butter",
    ]);
    expect(parsed.steps).toEqual([
      "Kartoffeln reiben und würzen.",
      "In der Pfanne goldbraun braten.",
    ]);
  });

  it("erkennt nummerierte Schritte auch ohne Titel", () => {
    const parsed = parseRecipeText(
      "1. Wasser kochen.\n2) Beutel hineinhängen."
    );
    expect(parsed.name).toBeNull();
    expect(parsed.steps).toEqual(["Wasser kochen.", "Beutel hineinhängen."]);
    expect(parsed.ingredients).toEqual([]);
  });

  it("liefert bei leerem Text leere Felder", () => {
    expect(parseRecipeText("  \n\n  ")).toEqual({
      name: null,
      ingredients: [],
      steps: [],
    });
  });

  it("kappt auf die Editor-Obergrenzen", () => {
    const many = Array.from({ length: 60 }, (_, i) => `${i + 1} g Zutat`).join(
      "\n"
    );
    const parsed = parseRecipeText(`Name\n${many}`);
    expect(parsed.ingredients).toHaveLength(IMPORT_MAX_INGREDIENTS);
    const prose = Array.from({ length: 40 }, () => "Rühren und würzen.").join(
      "\n"
    );
    expect(parseRecipeText(`Zubereitung:\n${prose}`).steps).toHaveLength(
      IMPORT_MAX_STEPS
    );
  });
});

describe("startsWithQuantity", () => {
  it("erkennt Zahlen, Brüche und Bereiche", () => {
    expect(startsWithQuantity("200 g Reis")).toBe(true);
    expect(startsWithQuantity("½ Zwiebel")).toBe(true);
    expect(startsWithQuantity("3/4 Tasse Milch")).toBe(true);
    expect(startsWithQuantity("1-2 EL Öl")).toBe(true);
    expect(startsWithQuantity("Salz und Pfeffer")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  extractJsonLdBlocks,
  isAllowedImportUrl,
  parseRecipeFromHtml,
} from "@shared/recipeJsonLd";

/** Rezept aus Web-Link (#501): URL-Wache und JSON-LD-Parser. */
describe("isAllowedImportUrl", () => {
  it("erlaubt echte Web-Adressen und sperrt das eigene Netz (SSRF)", () => {
    expect(isAllowedImportUrl("https://www.bettybossi.ch/rezept/1")).toBe(true);
    expect(isAllowedImportUrl("http://example.com/x")).toBe(true);
    expect(isAllowedImportUrl("ftp://example.com/x")).toBe(false);
    expect(isAllowedImportUrl("https://localhost/admin")).toBe(false);
    expect(isAllowedImportUrl("https://127.0.0.1/x")).toBe(false);
    expect(isAllowedImportUrl("https://10.0.0.5/x")).toBe(false);
    expect(isAllowedImportUrl("https://192.168.1.1/x")).toBe(false);
    expect(isAllowedImportUrl("https://172.20.0.1/x")).toBe(false);
    expect(isAllowedImportUrl("https://169.254.169.254/meta")).toBe(false);
    expect(isAllowedImportUrl("https://server.internal/x")).toBe(false);
    expect(isAllowedImportUrl("kein-link")).toBe(false);
  });
});

describe("parseRecipeFromHtml", () => {
  const wrap = (json: unknown) =>
    `<html><head><script type="application/ld+json">${JSON.stringify(
      json
    )}</script></head><body></body></html>`;

  it("liest Name, Zutaten und HowToStep-Schritte", () => {
    const html = wrap({
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: "Älplermagronen",
      recipeIngredient: ["250 g Magronen", "150 g Bergkäse"],
      recipeInstructions: [
        { "@type": "HowToStep", text: "Magronen <b>kochen</b>." },
        { "@type": "HowToStep", text: "Käse daruntermischen." },
      ],
    });
    expect(parseRecipeFromHtml(html)).toEqual({
      name: "Älplermagronen",
      ingredients: ["250 g Magronen", "150 g Bergkäse"],
      steps: ["Magronen kochen.", "Käse daruntermischen."],
    });
  });

  it("findet das Rezept auch im @graph und bei String-Schritten", () => {
    const html = wrap({
      "@graph": [
        { "@type": "WebSite", name: "Seite" },
        {
          "@type": ["Recipe", "Thing"],
          name: "Risotto",
          recipeIngredient: ["Reis"],
          recipeInstructions: "Alles rühren.",
        },
      ],
    });
    expect(parseRecipeFromHtml(html)).toEqual({
      name: "Risotto",
      ingredients: ["Reis"],
      steps: ["Alles rühren."],
    });
  });

  it("gibt null ohne Recipe und überspringt kaputtes JSON-LD", () => {
    expect(
      parseRecipeFromHtml("<html><body>nur Text</body></html>")
    ).toBeNull();
    const broken =
      '<script type="application/ld+json">{kaputt</script>' +
      wrap({ "@type": "Recipe", name: "Suppe", recipeIngredient: ["Wasser"] });
    expect(parseRecipeFromHtml(broken)?.name).toBe("Suppe");
    expect(extractJsonLdBlocks(broken)).toHaveLength(1);
  });
});

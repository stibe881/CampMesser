import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility-Checks mit axe-core gegen den Produktions-Build:
 * prüft zentrale Seiten auf WCAG-Verstösse (Kontraste, Labels, Rollen).
 * Farb-Kontrast-Regeln laufen auf dem hellen Standard-Design.
 */

async function expectNoViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const summary = results.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    help: v.help,
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

test("Startseite ohne A11y-Verstösse", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /SOS & Notfall öffnen/ }).waitFor();
  await expectNoViolations(page);
});

test("Anmelde-Seite ohne A11y-Verstösse", async ({ page }) => {
  await page.goto("/anmelden");
  await page.getByText(/E-Mail/i).first().waitFor();
  await expectNoViolations(page);
});

test("Erste-Hilfe-Modul ohne A11y-Verstösse", async ({ page }) => {
  await page.goto("/erste-hilfe");
  await page.getByText("Zeckenbiss").first().waitFor();
  await expectNoViolations(page);
});

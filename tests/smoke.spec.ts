import { expect, test } from "@playwright/test";

/**
 * Smoke-Test: Der Produktions-Build startet und liefert eine funktionierende
 * App aus. Fängt «Build grün, aber Seite weiss»-Fehler, die Unit-Tests nicht
 * sehen (kaputte Chunks, Rendering-Absturz, fehlende Assets).
 */

test("Startseite rendert das Modul-Grid", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CampMesser/);
  // Hero und mindestens eine bekannte Modul-Kachel sichtbar
  await expect(
    page.getByRole("link", { name: /SOS & Notfall öffnen/ })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Packlisten öffnen/ })
  ).toBeVisible();
});

test("Anmelde-Seite ist erreichbar", async ({ page }) => {
  await page.goto("/anmelden");
  await expect(page.getByText(/E-Mail/i).first()).toBeVisible();
});

test("Offline-Wissensmodul lädt (Code-Splitting funktioniert)", async ({
  page,
}) => {
  await page.goto("/erste-hilfe");
  await expect(page.getByText("Zeckenbiss").first()).toBeVisible();
});

test("Health-Endpoint antwortet mit Versionsangabe", async ({ request }) => {
  // Ohne Datenbank meldet der Endpoint 503/degraded – Version muss trotzdem da sein
  const res = await request.get("/api/health");
  const body = (await res.json()) as { status: string; version: string };
  expect(["ok", "degraded"]).toContain(body.status);
  expect(body.version).toBeTruthy();
});

import { expect, test } from "@playwright/test";

/**
 * Smoke-Test: Der Produktions-Build startet und liefert eine funktionierende
 * App aus. Fängt «Build grün, aber Seite weiss»-Fehler, die Unit-Tests nicht
 * sehen (kaputte Chunks, Rendering-Absturz, fehlende Assets).
 */

test("Startseite rendert das Modul-Grid", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ReiseKompass/);
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

/**
 * Druckseiten (#555): Jede der neun Druck-Routen muss abgemeldet sauber
 * rendern – also den Anmelde-Hinweis (bzw. «nicht gefunden») zeigen statt
 * einer weissen Seite. Genau diese Routen brachen in der Vergangenheit
 * still (kaputte Chunks, Routen-Reihenfolge «/:id fängt drucken ab»,
 * PWA-Druckknopf) – Unit-Tests sehen davon nichts.
 */
const PRINT_ROUTES: { path: string; loginPrompt: boolean }[] = [
  { path: "/packlisten/1/drucken", loginPrompt: true },
  { path: "/aemtli/drucken", loginPrompt: true },
  { path: "/einkauf/drucken", loginPrompt: true },
  { path: "/zeltplaetze/1/drucken", loginPrompt: true },
  { path: "/tagebuch/1/drucken", loginPrompt: true },
  { path: "/menueplan/1/drucken", loginPrompt: true },
  { path: "/reisepass", loginPrompt: true },
  // Eigene Schnitzeljagd: abgemeldet gibt es keine Daten → «nicht gefunden»
  { path: "/familie/drucken/1", loginPrompt: false },
  { path: "/familie/urkunde/1", loginPrompt: true },
];

for (const route of PRINT_ROUTES) {
  test(`Druckseite ${route.path} rendert ohne Absturz`, async ({ page }) => {
    // Ein Rendering-Absturz landet als pageerror – weisse Seite sichtbar machen
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(String(error)));
    await page.goto(route.path);
    if (route.loginPrompt) {
      await expect(page.getByText("Anmeldung erforderlich")).toBeVisible();
    } else {
      // Kein Anmelde-Hinweis auf dieser Seite – aber sichtbarer Inhalt
      await expect(page.locator("#root")).not.toBeEmpty();
    }
    expect(errors).toEqual([]);
  });
}

test("Health-Endpoint antwortet mit Versionsangabe", async ({ request }) => {
  // Ohne Datenbank meldet der Endpoint 503/degraded – Version muss trotzdem da sein
  const res = await request.get("/api/health");
  const body = (await res.json()) as { status: string; version: string };
  expect(["ok", "degraded"]).toContain(body.status);
  expect(body.version).toBeTruthy();
});

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Die Startseite (#378).
 *
 * WARUM AUSGERECHNET SIE: Sie ist die erste Seite nach dem Öffnen und
 * die einzige, die JEDER sieht – angemeldet wie nicht. Und sie ist ein
 * Sammelpunkt: Modul-Kacheln, Wetter, Tipp des Tages, laufender
 * Aufenthalt, Suche. Fällt einer dieser Bausteine beim Umbau aus, merkt
 * man es hier als Erstes – wenn jemand hinschaut.
 *
 * GEPRÜFT WIRD ÜBER ADRESSEN, NICHT ÜBER TEXT: Welche Sprache die App im
 * Test wählt, hängt an der Spracheinstellung der Testumgebung. Ein Test,
 * der auf «Wetter» besteht, prüft am Ende die Sprachwahl und nicht die
 * Seite – und bricht, sobald jemand eine Beschriftung schöner formuliert.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock() };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, loading: false }),
}));

async function renderHome() {
  const { default: Home } = await import("./Home");
  return renderWithI18n(<Home />, { trpc: false });
}

/** Alle Ziele, die die Seite gerade anbietet. */
async function hrefs(): Promise<string[]> {
  const links = await screen.findAllByRole("link");
  return links.map(link => link.getAttribute("href") ?? "");
}

describe("Startseite", () => {
  it("zeigt die Modul-Kacheln", async () => {
    await renderHome();
    const targets = await hrefs();
    // Ein Querschnitt durch die Gruppen: Wissen, Werkzeug, Planung.
    expect(targets).toContain("/wetter");
    expect(targets).toContain("/sos");
    expect(targets).toContain("/erste-hilfe");
  });

  it("führt zu den Werkzeugen, die es nur hier gibt", async () => {
    await renderHome();
    const targets = await hrefs();
    expect(targets).toContain("/wasserwaage");
    expect(targets).toContain("/kuehlbox");
  });

  it("zeigt auch ohne Anmeldung etwas – keine leere Seite", async () => {
    // Wer die App zum ersten Mal öffnet, ist nicht angemeldet. Eine
    // Startseite, die dann nichts zeigt, ist der schlechteste erste
    // Eindruck, den es gibt.
    await renderHome();
    expect((await hrefs()).length).toBeGreaterThan(10);
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderHome();
    await screen.findAllByRole("link");
    await expectNoA11yViolations(container);
  });
});

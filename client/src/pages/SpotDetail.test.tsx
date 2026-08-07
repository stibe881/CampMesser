import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Das Platz-Dossier (#378).
 *
 * WARUM DIESE SEITE: Sie hat als einzige eine BERECHNETE Reihenfolge
 * (#371) – fünf Abschnitte, drei Lagen. Dass jede Lage alle fünf zeigt,
 * prüft `server/spotSections.test.ts` an der reinen Funktion; ob die
 * Seite sie dann auch WIRKLICH rendert, prüft niemand. Genau in dieser
 * Lücke sass der Fehler aus #358: Ein Abschnitt war da, die Karte darin
 * blieb leer.
 *
 * Die Karte selbst bleibt draussen – Leaflet braucht Layout, das jsdom
 * nicht hat. Für sie ist der Playwright-Test zuständig.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "spots.list": [
        {
          id: 7,
          userId: 1,
          name: "Camping Thun",
          latitude: 46.75,
          longitude: 7.63,
          notes: null,
          elevationM: 560,
          pricePerNightRappen: 3200,
          extraPerNightRappen: null,
          tariffsJson: null,
          attributesJson: null,
          contactJson: null,
          ratingJson: null,
          createdAt: new Date("2026-01-01T10:00:00Z"),
        },
      ],
      "trips.list": [],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Test", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("wouter", async importOriginal => {
  const actual = await importOriginal<typeof import("wouter")>();
  return { ...actual, useParams: () => ({ id: "7" }) };
});

async function renderDossier() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: SpotDetail } = await import("./SpotDetail");
  return renderWithI18n(
    <ConfirmProvider>
      <SpotDetail />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Platz-Dossier", () => {
  it("nennt den Platz", async () => {
    await renderDossier();
    expect((await screen.findAllByText(/Camping Thun/)).length).toBeGreaterThan(
      0
    );
  });

  it("zeigt die Sprungleiste über alle fünf Abschnitte", async () => {
    // Die Leiste folgt seit #371 derselben berechneten Ordnung wie die
    // Seite. Fehlt ein Eintrag, führt die Leiste ins Leere – schlimmer
    // als gar keine Leiste.
    await renderDossier();
    await screen.findAllByText(/Camping Thun/);
    const anchors = screen
      .getAllByRole("link")
      .map(link => link.getAttribute("href") ?? "")
      .filter(href => href.startsWith("#"));
    expect(new Set(anchors).size).toBeGreaterThanOrEqual(5);
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderDossier();
    await screen.findAllByText(/Camping Thun/);
    await expectNoA11yViolations(container);
  });
});

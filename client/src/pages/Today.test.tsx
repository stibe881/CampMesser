import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Die «Heute»-Ansicht (#378).
 *
 * WARUM SIE: Sie ist die Seite, mit der die App während einer Reise
 * startet (#298) – für alle, die unterwegs sind, IST sie die App. Und
 * sie besteht ausschliesslich aus Karten anderer Module (Menü, Ämtli,
 * Wetter, Packliste, Pinnwand); jede davon kann beim Umbau ihres Moduls
 * still ausfallen, ohne dass die Seite abstürzt. Genau das war der
 * Befund von #330: eine Karte ohne Weg dorthin, gesehen von einem
 * Menschen auf einem Bildschirmfoto.
 */
const TODAY = "2026-08-07";

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "trips.list": [
        {
          id: 1,
          userId: 1,
          title: "Thun",
          location: "Thun",
          spotId: null,
          packListId: null,
          startDate: "2026-08-05",
          endDate: "2026-08-10",
          arrivalTime: null,
          departureTime: null,
          notes: null,
          rating: null,
          budgetRappen: null,
          photoFileName: null,
          reservationFileName: null,
          weatherJson: null,
          createdAt: new Date("2026-08-01T10:00:00Z"),
        },
      ],
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

vi.mock("@shared/localDate", async importOriginal => {
  const actual = await importOriginal<typeof import("@shared/localDate")>();
  return { ...actual, todayIso: () => TODAY };
});

async function renderToday() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: Today } = await import("./Today");
  return renderWithI18n(
    <ConfirmProvider>
      <Today />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Heute-Ansicht", () => {
  it("nennt die laufende Reise", async () => {
    await renderToday();
    expect((await screen.findAllByText(/Thun/)).length).toBeGreaterThan(0);
  });

  it("führt in die Module, aus denen sie besteht", async () => {
    await renderToday();
    await screen.findAllByText(/Thun/);
    const targets = screen
      .getAllByRole("link")
      .map(link => link.getAttribute("href") ?? "");
    // Die Karten sind Zusammenfassungen; ohne Weg ins Modul kann man
    // nichts davon ändern – das war der Befund aus #330.
    expect(targets.some(href => href.startsWith("/menueplan"))).toBe(true);
    expect(targets.some(href => href.startsWith("/aemtli"))).toBe(true);
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderToday();
    await screen.findAllByText(/Thun/);
    await expectNoA11yViolations(container);
  });
});

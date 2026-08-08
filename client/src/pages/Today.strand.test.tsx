import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Heute-Ansicht bei Strandferien (#460/#473, UI-Test #484).
 *
 * WARUM EIN EIGENES TESTFILE: Die Reise-Art steckt im Modul-weiten
 * trpc-Mock – Today.test.tsx prüft «Wandern», hier kommt «Strand» dran.
 * Strand heisst: die Baderegeln (#473) und die Badewasser-Karte gehören
 * in den Schnellzugriff, die Lagerfeuer-Ampel nicht. Kippt das Preset,
 * zeigt die Reise-App am Meer Camping-Karten – der Kern von #460 wäre
 * still verloren.
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
          title: "Ligurien",
          location: "Ligurien",
          kind: "strand",
          spotId: null,
          packListId: null,
          startDate: "2026-08-05",
          endDate: "2026-08-14",
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

describe("Heute-Ansicht bei Strandferien", () => {
  it("führt zu Baderegeln und Badewasser statt zu Camping-Zielen", async () => {
    await renderToday();
    await screen.findAllByText(/Ligurien/);
    const targets = screen
      .getAllByRole("link")
      .map(link => link.getAttribute("href") ?? "");
    // Die Strand-Schnellzugriffe aus dem Preset (#473)
    expect(targets).toContain("/baderegeln");
    expect(targets).toContain("/wasser");
    // Wandern-Schnellzugriff gehört NICHT zum Strand
    expect(targets).not.toContain("/wanderung");
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderToday();
    await screen.findAllByText(/Ligurien/);
    await expectNoA11yViolations(container);
  });
});

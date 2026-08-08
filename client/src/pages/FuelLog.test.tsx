import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Tankbuch (#443/#477, UI-Test #484).
 *
 * WARUM ES EINEN TEST BEKOMMT: Der Durchschnittsverbrauch ist DIE Zahl
 * der Seite – sie fliesst in den Fahrtkosten-Rechner. Rechnet die
 * Anzeige nach einem Umbau mit den falschen Feldern (liters10 sind
 * ZEHNTELliter), steht dort der zehnfache Verbrauch, und niemand merkt
 * es ohne diesen Test. Dazu der CSV-Knopf (#477), der nur mit Daten
 * erscheinen darf.
 */
const TODAY = "2026-08-07";

vi.mock("@shared/localDate", async importOriginal => {
  const actual = await importOriginal<typeof import("@shared/localDate")>();
  return { ...actual, todayIso: () => TODAY };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Test", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "fuelLog.list": [
        {
          id: 1,
          day: "2026-07-01",
          odometerKm: 84000,
          liters10: 400,
          priceRappen: null,
        },
        // 500 km mit 42,5 l → 8,5 l/100 km, plausibel
        {
          id: 2,
          day: "2026-08-01",
          odometerKm: 84500,
          liters10: 425,
          priceRappen: 7490,
        },
      ],
    }),
  };
});

async function renderPage() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: FuelLogPage } = await import("./FuelLog");
  return renderWithI18n(
    <ConfirmProvider>
      <FuelLogPage />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Tankbuch", () => {
  it("rechnet den Durchschnitt aus dem Abschnitt zwischen zwei Füllungen", async () => {
    await renderPage();
    expect(await screen.findByText("Average consumption")).toBeVisible();
    // 42,5 l ÷ 500 km × 100 – NICHT 85: liters10 sind Zehntelliter
    expect(screen.getByText("8.5")).toBeVisible();
    expect(
      screen.getByText(/500 km since last fill-up · 8\.5 l\/100 km/)
    ).toBeVisible();
  });

  it("bietet den CSV-Export an, sobald Füllungen da sind (#477)", async () => {
    await renderPage();
    expect(
      await screen.findByRole("button", { name: /Export as CSV/ })
    ).toBeVisible();
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderPage();
    await screen.findByText("Average consumption");
    await expectNoA11yViolations(container);
  });
});

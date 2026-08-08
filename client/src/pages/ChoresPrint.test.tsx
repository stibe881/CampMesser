import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Ämtli-Wochenplan zum Ausdrucken (#430, UI-Test #459).
 *
 * WARUM ES EINEN TEST BEKOMMT: Die Druckseite baut ihre Tabelle selbst –
 * Rotation, Wochentage (#447) und «–»-Zellen für Tage, an denen ein
 * Ämtli gar nicht anfällt. Genau diese Rechnung kippt beim Umbau leise:
 * Auf dem Bildschirm des Entwicklers sieht die Tabelle immer irgendwie
 * voll aus.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "chores.list": [
        { id: 1, title: "Abwasch", points: 2, weekdaysJson: null },
        // Nur montags (#447): an den übrigen sechs Tagen steht «–»
        { id: 2, title: "Wasser holen", points: 1, weekdaysJson: "[1]" },
      ],
      "family.children.list": [
        { id: 1, name: "Anna" },
        { id: 2, name: "Ben" },
      ],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: null, loading: false }),
}));

// Fester Montag, damit die Wochen-Spalten in jedem Testlauf gleich stehen
vi.mock("@/lib/useTodayIso", () => ({
  useTodayIso: () => "2026-08-03",
}));

async function renderPrint() {
  const { default: ChoresPrintPage } = await import("./ChoresPrint");
  return renderWithI18n(<ChoresPrintPage />, { trpc: false });
}

describe("Ämtli-Wochenplan drucken", () => {
  it("zeigt sieben Tage, die Rotation und «–» an Tagen ohne das Ämtli", async () => {
    await renderPrint();
    expect(
      await screen.findByRole("heading", { name: "Weekly chore plan" })
    ).toBeVisible();
    // Ämtli-Spalte plus sieben Tage
    expect(screen.getAllByRole("columnheader")).toHaveLength(8);
    expect(screen.getByText("Abwasch")).toBeVisible();
    expect(screen.getByText("Wasser holen")).toBeVisible();
    // Das Montag-Ämtli fällt an sechs Tagen aus → sechs «–»-Zellen (#447)
    expect(screen.getAllByText("–")).toHaveLength(6);
    // Die Rotation teilt beide Kinder ein
    expect(screen.getAllByText("Anna").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ben").length).toBeGreaterThan(0);
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderPrint();
    await screen.findByRole("heading", { name: "Weekly chore plan" });
    await expectNoA11yViolations(container);
  });
});

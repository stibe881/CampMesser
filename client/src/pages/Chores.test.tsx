import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Ämtli-Plan (#270) mit Punkte-Verlauf (#431, UI-Test #459).
 *
 * WARUM ES EINEN TEST BEKOMMT: Der Verlauf erscheint NUR, wenn es
 * abgehakte Zuteilungen mit Punkten gibt – die Bedingung dafür steht in
 * `weeklyPointsHistory` und kippt beim Umbau leise auf «nie». Wer
 * nachmittags mit leerer Datenbank entwickelt, sieht den Unterschied
 * nicht.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  const { todayIso: nowIso } = await import("@shared/localDate");
  return {
    trpc: trpcMock({
      "chores.list": [
        { id: 1, title: "Abwasch", points: 2, weekdaysJson: null },
      ],
      "family.children.list": [
        { id: 1, name: "Anna", earnsPoints: true },
        { id: 2, name: "Ben", earnsPoints: true },
      ],
      // Beide Abfragen (Tag + gesamt) bekommen dieselbe Liste – für den
      // Verlauf zählt nur, dass Abgehaktes in den letzten Wochen liegt.
      "chores.assignments": [
        {
          id: 1,
          choreId: 1,
          childId: 1,
          day: nowIso(),
          doneAt: new Date().toISOString(),
        },
      ],
      "rewards.list": [],
      "rewards.redemptions": [],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: null, loading: false }),
}));

async function renderChores() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: ChoresPage } = await import("./Chores");
  return renderWithI18n(
    <ConfirmProvider>
      <ChoresPage />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Ämtli-Plan", () => {
  it("zeigt den Punkte-Verlauf, sobald Abgehaktes Punkte gebracht hat (#431)", async () => {
    await renderChores();
    expect(await screen.findByText("Points per week")).toBeVisible();
    // Vier Wochenbalken pro Kind, als beschriftete Grafiken
    const bars = screen.getAllByRole("img", { name: /^Week of / });
    expect(bars.length).toBeGreaterThanOrEqual(4);
    // Die laufende Woche trägt die 2 Punkte des abgehakten Ämtlis
    expect(
      bars.some(bar => /2 points$/.test(bar.getAttribute("aria-label") ?? ""))
    ).toBe(true);
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderChores();
    await screen.findByText("Points per week");
    await expectNoA11yViolations(container);
  });
});

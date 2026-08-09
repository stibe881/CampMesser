import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Die Reisekasse als Anzeige (#575): Beleg-Foto in der Liste (#540),
 * Beleg-Galerie (#566) und Tagesbudget-Zeile (#567).
 *
 * Die Rechnungen (Summen, Schulden, Tagesbudget) sind in
 * server/expenses.test.ts abgedeckt – hier zählt, dass die Abschnitte
 * beim Aufklappen WIRKLICH erscheinen: Wer ein Foto am Beleg hat, sieht
 * die Galerie; wer ein Budget gesetzt hat, sieht mitten in der Reise die
 * Tageszeile.
 */
const TODAY = "2026-08-07";

const expenses: unknown[] = [];

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock(
      new Proxy(
        {},
        {
          get(_t, key) {
            if (key === "trips.expenses.list") return expenses;
            return undefined;
          },
          has: () => true,
        }
      ) as Record<string, unknown>
    ),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Stefan", email: "s@example.com" },
    loading: false,
  }),
}));

vi.mock("@shared/localDate", async importOriginal => {
  const actual = await importOriginal<typeof import("@shared/localDate")>();
  return { ...actual, todayIso: () => TODAY };
});

const EXPENSE = {
  id: 1,
  tripId: 7,
  userId: 1,
  amountRappen: 2500,
  category: "essen",
  description: "Znacht Migros",
  currency: "CHF",
  day: "2026-08-06",
  paidBy: "Stefan",
  photoFileName: null as string | null,
  createdAt: new Date("2026-08-06T18:00:00Z"),
  updatedAt: new Date("2026-08-06T18:00:00Z"),
};

async function renderExpenses(budgetRappen: number | null) {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: TripExpenses } = await import("./TripExpenses");
  return renderWithI18n(
    <ConfirmProvider>
      <TripExpenses
        tripId={7}
        tripName="Tessin"
        defaultDay={TODAY}
        shared={false}
        budgetRappen={budgetRappen}
        eurRateX10000={null}
        spotId={null}
        startDate="2026-08-05"
        endDate="2026-08-10"
      />
    </ConfirmProvider>,
    { trpc: false }
  );
}

async function openSection() {
  const toggle = await screen.findByRole("button", { name: /Tessin/ });
  await userEvent.click(toggle);
}

describe("TripExpenses", () => {
  it("zeigt den erfassten Beleg nach dem Aufklappen", async () => {
    expenses.length = 0;
    expenses.push(EXPENSE);
    await renderExpenses(null);
    await openSection();
    expect(await screen.findByText(/Znacht Migros/)).toBeInTheDocument();
  });

  it("zeigt die Beleg-Galerie nur, wenn ein Foto da ist", async () => {
    expenses.length = 0;
    expenses.push({ ...EXPENSE, photoFileName: "beleg-1.webp" });
    await renderExpenses(null);
    await openSection();
    await screen.findByText(/Znacht Migros/);
    // Galerie-Bild hängt am Beleg-Foto-Endpunkt – EIN Bild, EIN Beleg.
    const links = Array.from(
      document.querySelectorAll('a[href*="/api/trips/expenses/photos/"]')
    );
    expect(links.length).toBeGreaterThan(0);
  });

  it("zeigt mitten in der Reise die Tagesbudget-Zeile (#567)", async () => {
    expenses.length = 0;
    expenses.push(EXPENSE);
    await renderExpenses(100_000);
    await openSection();
    await screen.findByText(/Znacht Migros/);
    expect(screen.getByText(/per day left/)).toBeInTheDocument();
  });

  it("hat aufgeklappt keine A11y-Verstösse", async () => {
    expenses.length = 0;
    expenses.push({ ...EXPENSE, photoFileName: "beleg-1.webp" });
    const { container } = await renderExpenses(100_000);
    await openSection();
    await screen.findByText(/Znacht Migros/);
    await expectNoA11yViolations(container);
  });
});

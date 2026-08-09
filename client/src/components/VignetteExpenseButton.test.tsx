import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Vignetten-Knopf (#604, UI-Test aus #644): Der Richtpreis von der
 * Länder-Seite wandert per Dialog als Ausgabe in die Reisekasse. Die
 * neuste Reise ist vorgewählt; geprüft wird, WAS gespeichert wird.
 */
const { addSpy } = vi.hoisted(() => ({ addSpy: vi.fn() }));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock(
      {
        "trips.list": [
          {
            id: 7,
            userId: 1,
            title: "Südfrankreich",
            location: "Ardèche",
            spotId: null,
            startDate: "2026-08-20",
            endDate: "2026-08-30",
            archivedAt: null,
          },
        ],
      },
      { "trips.expenses.add": addSpy }
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

const VIGNETTE = {
  amountRappen: 4000,
  currency: "CHF" as const,
  label: {
    de: "Jahresvignette",
    fr: "Vignette annuelle",
    it: "Vignetta annuale",
    en: "Annual vignette",
  },
};

async function renderButton() {
  const { default: VignetteExpenseButton } =
    await import("./VignetteExpenseButton");
  return renderWithI18n(
    <VignetteExpenseButton vignette={VIGNETTE} countryName="Switzerland" />,
    { trpc: false }
  );
}

describe("VignetteExpenseButton (#604)", () => {
  it("trägt den Richtpreis in die Reisekasse der vorgewählten Reise ein", async () => {
    addSpy.mockClear();
    await renderButton();
    await userEvent.click(screen.getByRole("button", { name: /travel fund/i }));
    // Dialog offen: Reise ist vorgewählt, «Record» speichert
    const save = await screen.findByRole("button", { name: /Record/ });
    await userEvent.click(save);
    expect(addSpy).toHaveBeenCalledTimes(1);
    const input = addSpy.mock.calls[0][0] as {
      tripId: number;
      amountRappen: number;
      category: string;
    };
    expect(input.tripId).toBe(7);
    expect(input.amountRappen).toBe(4000);
  });

  it("hat keine A11y-Verstösse (Dialog offen)", async () => {
    const { container } = await renderButton();
    await userEvent.click(screen.getByRole("button", { name: /travel fund/i }));
    await screen.findByRole("button", { name: /Record/ });
    await expectNoA11yViolations(container);
  });
});

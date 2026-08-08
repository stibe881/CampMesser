import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Der Platzkosten-Schätzer (#386) – die Anzeige, nicht die Rechnung (#392).
 *
 * Die Rechnung steht in server/pitchCostEstimate.test.ts. Hier zählt:
 * Ohne Platz erscheint NICHTS (keine leere Hülle), mit dem einen Preis
 * pro Nacht (#243) erscheint ein Betrag, und der stimmt – zwei Nächte à
 * 42.– sind 84.–, nicht drei Tage à 42.–.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "spots.list": [
        {
          id: 5,
          name: "Camping Thun",
          latitude: 46.75,
          longitude: 7.62,
          pricePerNightRappen: 4200,
          extraPerNightRappen: null,
          tariffsJson: null,
        },
      ],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: "Stefan" },
    loading: false,
  }),
}));

async function renderEstimator(spotId: number | null) {
  const { default: PitchCostEstimator } = await import("./PitchCostEstimator");
  return renderWithI18n(
    <PitchCostEstimator
      tripId={7}
      spotId={spotId}
      startDate="2026-08-07"
      endDate="2026-08-09"
      onAdded={() => {}}
    />,
    { trpc: false }
  );
}

describe("PitchCostEstimator", () => {
  it("bleibt ohne verknüpften Platz ganz weg", async () => {
    const { container } = await renderEstimator(null);
    // Eine leere Hülle wäre ein grauer Balken ohne Aussage.
    expect(container.querySelector("button")).toBeNull();
  });

  it("rechnet NÄCHTE, nicht Tage: 2 × 42.– sind 84.–", async () => {
    await renderEstimator(5);
    await userEvent.click(
      await screen.findByRole("button", { expanded: false })
    );
    // Freitag bis Sonntag = zwei Nächte; 126.– (drei Tage) wäre der
    // Kopfrechen-Fehler, den die Karte gerade verhindern soll.
    expect(await screen.findByText(/84/)).toBeInTheDocument();
    expect(screen.queryByText(/126/)).toBeNull();
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = await renderEstimator(5);
    await userEvent.click(
      await screen.findByRole("button", { expanded: false })
    );
    await screen.findByText(/84/);
    await expectNoA11yViolations(container);
  });
});

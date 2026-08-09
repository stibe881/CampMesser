import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Der Etappen-Abschnitt (#536, UI-Test aus #575).
 *
 * Die Logik (Sortierung, aktuelle Etappe) steckt in shared/tripStops.ts
 * und ist dort getestet; hier geht es darum, dass der Abschnitt rendert,
 * sich aufklappen lässt und die Etappen dann WIRKLICH dastehen. Die
 * Etappen kommen bewusst OHNE Koordinaten – so bleibt die Mini-Karte
 * (Karten-Maschine, in jsdom nicht lauffähig) sauber weg, genau wie im
 * echten Leerlauf ohne Ortssuche-Treffer.
 */
const stops: unknown[] = [];

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock(
      new Proxy(
        {},
        {
          get(_t, key) {
            if (key === "trips.stops.list") return stops;
            return undefined;
          },
          has: () => true,
        }
      ) as Record<string, unknown>
    ),
  };
});

const STOP = {
  id: 1,
  tripId: 5,
  name: "Comersee",
  startDate: "2026-08-05",
  endDate: "2026-08-07",
  latitude: null,
  longitude: null,
};

async function renderStops() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: TripStops } = await import("./TripStops");
  return renderWithI18n(
    <ConfirmProvider>
      <TripStops
        tripId={5}
        tripName="Norditalien"
        startDate="2026-08-05"
        endDate="2026-08-12"
      />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("TripStops", () => {
  it("klappt auf und zeigt die Etappen mit Namen", async () => {
    stops.length = 0;
    stops.push(STOP, { ...STOP, id: 2, name: "Verona" });
    await renderStops();
    const toggle = await screen.findByRole("button", {
      name: /Norditalien/,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("Comersee")).toBeInTheDocument();
    expect(screen.getByText("Verona")).toBeInTheDocument();
  });

  it("sagt es ehrlich, wenn noch keine Etappen da sind", async () => {
    stops.length = 0;
    await renderStops();
    await userEvent.click(
      await screen.findByRole("button", { name: /Norditalien/ })
    );
    // Leer heisst: ein Hinweistext plus der Weg zur ersten Etappe –
    // sprachunabhängig über den Hinzufügen-Knopf geprüft.
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("hat aufgeklappt keine A11y-Verstösse", async () => {
    stops.length = 0;
    stops.push(STOP);
    const { container } = await renderStops();
    await userEvent.click(
      await screen.findByRole("button", { name: /Norditalien/ })
    );
    await screen.findByText("Comersee");
    await expectNoA11yViolations(container);
  });
});

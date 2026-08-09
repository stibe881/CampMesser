import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Die Karten-Seite nach der Aufteilung (#574) – geprüft wird die
 * Merkorte-Verwaltungsliste (#563), nicht die Karte selbst: Die
 * Karten-Maschine läuft in jsdom nicht, deshalb steht hier eine
 * Attrappe an ihrer Stelle. Genau das macht die Liste erst testbar –
 * vor der Aufteilung hing sie untrennbar an der Karte.
 */
const { savedPlaces, removeSpy } = vi.hoisted(() => ({
  savedPlaces: [] as unknown[],
  removeSpy: vi.fn(),
}));

vi.mock("@/components/map/SpotsMap", () => ({
  default: () => <div data-testid="map-stub" />,
}));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock(
      new Proxy(
        {},
        {
          get(_t, key) {
            if (key === "savedPlaces.list") return savedPlaces;
            if (key === "home.get") return { latitude: 46.75, longitude: 7.63 };
            return undefined;
          },
          has: () => true,
        }
      ) as Record<string, unknown>,
      { "savedPlaces.remove": removeSpy }
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

const PLACE = {
  id: 1,
  userId: 1,
  name: "Seealpsee",
  latitude: 47.268,
  longitude: 9.401,
  note: "Wanderung mit Bad",
  color: "red",
  createdAt: new Date("2026-08-01T10:00:00Z"),
};

async function renderMapView() {
  const { default: MapView } = await import("./MapView");
  return renderWithI18n(<MapView />, { trpc: false });
}

describe("Karten-Seite", () => {
  it("zeigt die Merkorte-Liste mit Name, Notiz und Distanz", async () => {
    savedPlaces.length = 0;
    savedPlaces.push(PLACE);
    await renderMapView();
    expect(await screen.findByText("Seealpsee")).toBeInTheDocument();
    expect(screen.getByText(/Wanderung mit Bad/)).toBeInTheDocument();
    // Distanz von zuhause (#563) – die Zahl hängt an den Koordinaten,
    // geprüft wird nur, dass eine Kilometer-Angabe dasteht.
    expect(screen.getByText(/km/)).toBeInTheDocument();
  });

  it("löscht einen Merkort über den Papierkorb-Knopf", async () => {
    savedPlaces.length = 0;
    savedPlaces.push(PLACE);
    removeSpy.mockClear();
    await renderMapView();
    await screen.findByText("Seealpsee");
    const buttons = screen.getAllByRole("button");
    const del = buttons.find(b =>
      (b.getAttribute("aria-label") ?? "").match(/Remove|entfernen/)
    );
    expect(del).toBeDefined();
    await userEvent.click(del!);
    expect(removeSpy).toHaveBeenCalledWith({ id: 1 });
  });

  it("lässt die Liste ohne Merkorte ganz weg", async () => {
    savedPlaces.length = 0;
    await renderMapView();
    await screen.findByTestId("map-stub");
    expect(screen.queryByText("Seealpsee")).toBeNull();
  });

  it("hat keine A11y-Verstösse", async () => {
    savedPlaces.length = 0;
    savedPlaces.push(PLACE);
    const { container } = await renderMapView();
    await screen.findByText("Seealpsee");
    await expectNoA11yViolations(container);
  });
});

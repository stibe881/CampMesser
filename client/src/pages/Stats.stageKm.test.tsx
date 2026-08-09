import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Rundreise-Kilometer über die Strasse (#580/#592, UI-Test aus #614) und
 * Rekorde-Karte (#612): Die Statistik routet die Etappen-Ketten über den
 * OSRM-Tabellendienst. Der Test gibt dem fetch eine feste Antwort und
 * prüft, dass daraus die Jahres-Kilometer UND die Rekorde entstehen –
 * bricht der Antwort-Parser oder die Ketten-Bildung, bleibt die Karte
 * sonst einfach leer, und niemand merkt es.
 */
const { TRIPS, STOPS } = vi.hoisted(() => ({
  TRIPS: [
    {
      id: 1,
      userId: 1,
      title: "Rundreise Jura",
      location: "Jura",
      spotId: null,
      packListId: null,
      startDate: "2026-07-01",
      endDate: "2026-07-08",
      arrivalTime: null,
      departureTime: null,
      notes: null,
      rating: null,
      budgetRappen: null,
      eurRateX10000: null,
      weatherJson: null,
      archivedAt: null,
      createdAt: new Date("2026-06-01T10:00:00Z"),
    },
  ],
  STOPS: [
    {
      id: 11,
      tripId: 1,
      name: "Neuenburg",
      latitude: 46.99,
      longitude: 6.93,
      startDate: "2026-07-01",
      endDate: "2026-07-04",
    },
    {
      id: 12,
      tripId: 1,
      name: "Delsberg",
      latitude: 47.36,
      longitude: 7.34,
      startDate: "2026-07-04",
      endDate: "2026-07-08",
    },
  ],
}));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "trips.list": TRIPS,
      "trips.stops.listAll": STOPS,
      "spots.list": [],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Stefan", email: "s@example.com" },
    loading: false,
  }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderStats() {
  // OSRM-Tabellendienst: 12 km zwischen den beiden Etappen; alles andere
  // (falls eine Seite sonst noch fetcht) bekommt eine leere Antwort.
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/table/")) {
        return {
          ok: true,
          json: async () => ({
            code: "Ok",
            distances: [
              [0, 12_000],
              [12_000, 0],
            ],
          }),
        } as Response;
      }
      return { ok: false, json: async () => ({}) } as Response;
    })
  );
  const { default: Stats } = await import("./Stats");
  return renderWithI18n(<Stats />, { trpc: false });
}

describe("Statistik – Rundreise-Kilometer & Rekorde", () => {
  it("routet die Etappen und zeigt die Jahres-Kilometer", async () => {
    const { container } = await renderStats();
    await screen.findByText(/Round-trip kilometres/i);
    // 12 000 m → «≈ 12 km» – beim Jahr 2026 UND als Rekord «weiteste
    // Rundreise», darum mehrere Treffer
    expect((await screen.findAllByText(/≈ 12 km/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
    await expectNoA11yViolations(container);
  });

  it("füllt die Rekorde-Karte (#612) aus denselben Daten", async () => {
    await renderStats();
    await screen.findByText(/Records/i);
    // Meiste Nächte am Stück: die 7-Nächte-Reise
    expect(screen.getByText(/Most nights in a row/i)).toBeTruthy();
    // Längste Etappe: Delsberg mit 4 Nächten
    expect(screen.getByText(/Longest stage/i)).toBeTruthy();
    expect(screen.getAllByText(/Delsberg/).length).toBeGreaterThan(0);
    // Weiteste Rundreise aus den gerouteten Kilometern
    expect(await screen.findByText(/Longest road trip/i)).toBeTruthy();
  });
});

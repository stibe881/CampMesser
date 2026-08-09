import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * «Meine Reisen» (#378).
 *
 * WARUM DIESE SEITE EINEN TEST BRAUCHT: Sie ist in den letzten Runden am
 * häufigsten umgebaut worden – #322 (aufgeteilt), #357 (Abschnitte hinter
 * einen Schalter), #359 (Liste entrümpelt), #361/#363 (Packstand und
 * Einordnung nach Reisephase), #362 (Bereitschaft zugeklappt). Jeder
 * dieser Umbauten hat Karten verschoben, und jeder wurde von Hand
 * geprüft. Was dabei still verschwindet, sieht man erst, wenn man es
 * sucht.
 *
 * DREI ZUSTÄNDE, weil sie sich grundlegend unterscheiden: leer,
 * geplante Reise, laufende Reise. Der Fehler aus #363 – eine begonnene
 * Reise steht weiter unter «geplant» – wäre nur im dritten aufgefallen.
 */
const TODAY = "2026-08-07";

const PLANNED = {
  id: 1,
  userId: 1,
  title: "Lugano",
  location: "Lugano",
  spotId: null,
  packListId: null,
  startDate: "2026-09-01",
  endDate: "2026-09-05",
  arrivalTime: null,
  departureTime: null,
  notes: null,
  rating: null,
  budgetRappen: null,
  photoFileName: null,
  reservationFileName: null,
  weatherJson: null,
  createdAt: new Date("2026-08-01T10:00:00Z"),
};

const RUNNING = {
  ...PLANNED,
  id: 2,
  title: "Thun",
  location: "Thun",
  startDate: "2026-08-05",
  endDate: "2026-08-10",
};

const trips: unknown[] = [];

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  // Die Liste wird pro Test gesetzt; der Proxy liest sie bei jedem
  // Aufruf frisch, damit `vi.mock` nichts von aussen braucht.
  return {
    trpc: trpcMock(
      new Proxy(
        {},
        {
          get(_t, key) {
            if (key === "trips.list") return trips;
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
    user: { id: 1, name: "Test", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("@shared/localDate", async importOriginal => {
  const actual = await importOriginal<typeof import("@shared/localDate")>();
  return { ...actual, todayIso: () => TODAY };
});

async function renderTrips() {
  // Der Bestätigungs-Dialog (#317) hängt an einem Provider, den in der
  // echten App `App.tsx` setzt. Ohne ihn wirft `useConfirm` – deshalb
  // gehört er hier dazu und nicht in `renderWithI18n`: Nur Seiten mit
  // Löschfunktion brauchen ihn.
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: Trips } = await import("./Trips");
  return renderWithI18n(
    <ConfirmProvider>
      <Trips />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Meine Reisen", () => {
  it("zeigt ohne Reisen einen Weg, eine anzulegen", async () => {
    trips.length = 0;
    await renderTrips();
    // Eine leere Seite ohne Knopf wäre eine Sackgasse – und der erste
    // Eindruck für alle, die das Modul zum ersten Mal öffnen.
    const buttons = await screen.findAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("zeigt eine geplante Reise mit ihrem Namen", async () => {
    trips.length = 0;
    trips.push(PLANNED);
    await renderTrips();
    // Mehrfach ist in Ordnung – Titel und Ortsangabe nennen beide den
    // Namen. Entscheidend ist, dass die Reise überhaupt dasteht.
    expect((await screen.findAllByText(/Lugano/)).length).toBeGreaterThan(0);
  });

  it("zeigt eine laufende Reise – und verliert sie nicht", async () => {
    // Der Fehler aus #363: Eine begonnene Reise stand unter «geplant».
    // Wo sie steht, prüft die Logik (shared/tripPhase.ts); hier zählt,
    // dass sie überhaupt noch auf der Seite ist.
    trips.length = 0;
    trips.push(RUNNING);
    await renderTrips();
    expect((await screen.findAllByText(/Thun/)).length).toBeGreaterThan(0);
  });

  it("räumt archivierte Reisen in den Archiv-Abschnitt (#614)", async () => {
    // Runde 56: Archivierte Aufenthalte verschwinden aus der Liste und
    // stehen unten im eingeklappten Archiv – beides muss stimmen, sonst
    // ist eine Reise «weg», obwohl sie nur archiviert ist.
    trips.length = 0;
    trips.push({
      ...PLANNED,
      id: 3,
      title: "Elba",
      location: "Elba",
      startDate: "2026-07-01",
      endDate: "2026-07-05",
      archivedAt: new Date("2026-08-01T10:00:00Z"),
    });
    const user = (await import("@testing-library/user-event")).default;
    await renderTrips();
    const toggle = await screen.findByRole("button", {
      name: /Archive \(1\)/,
    });
    // Zugeklappt gibt es noch keinen Archiv-Link zur Reise
    expect(screen.queryAllByRole("link", { name: /Elba/ })).toHaveLength(0);
    await user.click(toggle);
    // Aufgeklappt führt ein Link zur archivierten Reise (/tagebuch/3)
    expect(
      (await screen.findAllByRole("link", { name: /Elba/ })).length
    ).toBeGreaterThan(0);
  });

  it("ist barrierefrei, auch mit Reisen darin", async () => {
    trips.length = 0;
    trips.push(PLANNED, RUNNING);
    const { container } = await renderTrips();
    await screen.findAllByText(/Lugano/);
    await expectNoA11yViolations(container);
  });

  /**
   * Jahr-Filter (#617, UI-Test aus #644): Ab zwei Jahren mit vergangenen
   * Reisen erscheinen die Jahres-Chips; ein Jahr wählen blendet die
   * Reisen der anderen Jahre aus.
   */
  it("filtert vergangene Reisen nach Jahr (#617)", async () => {
    trips.length = 0;
    trips.push(
      {
        ...PLANNED,
        id: 10,
        title: "Elba",
        location: "Elba",
        startDate: "2025-07-01",
        endDate: "2025-07-08",
      },
      {
        ...PLANNED,
        id: 11,
        title: "Ardèche",
        location: "Ardèche",
        startDate: "2024-07-01",
        endDate: "2024-07-08",
      }
    );
    const user = (await import("@testing-library/user-event")).default;
    const { container } = await renderTrips();
    const group = await screen.findByRole("group", {
      name: /Filter trips by year/,
    });
    expect(group).toBeInTheDocument();
    // Vorher stehen beide Reisen in der Liste (Links auf /tagebuch/<id>)
    expect(
      screen.getAllByRole("link", { name: /Elba/ }).length
    ).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "2024" }));
    // Nur 2024 bleibt: Ardèche ja, Elba (2025) verschwindet aus der
    // Liste – der Name darf anderswo (Statistik) weiterhin auftauchen.
    expect(
      screen.getAllByRole("link", { name: /Ardèche/ }).length
    ).toBeGreaterThan(0);
    expect(screen.queryAllByRole("link", { name: /Elba/ })).toHaveLength(0);
    await expectNoA11yViolations(container);
  });
});

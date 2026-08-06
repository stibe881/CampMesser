import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";

/**
 * Das Morgen-Briefing (#255, ergänzt in #328).
 *
 * WARUM GERADE DAS: Der fehlende Weg zur Heute-Ansicht ist einem
 * Menschen auf einem Bildschirmfoto aufgefallen, keinem Test. Und die
 * Karte ist heikler, als sie aussieht – sie zeigt sich NUR morgens und
 * nur, wenn wenigstens eine Zeile Inhalt hat. Beide Bedingungen kann man
 * beim nächsten Umbau versehentlich umdrehen, ohne dass etwas auffällt:
 * Wer nachmittags entwickelt, sieht die Karte ohnehin nie.
 */
/**
 * Die Attrappen stehen IM Fabrik-Rumpf, nicht darüber: `vi.mock` wird an
 * den Anfang der Datei gezogen, und eine Konstante von weiter oben gibt
 * es zu diesem Zeitpunkt noch nicht.
 */
vi.mock("@/lib/trpc", () => {
  const query = (data: unknown) => ({
    data,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: () => Promise.resolve(),
  });
  const mutation = () => ({ mutate: () => {}, isPending: false });
  return {
    trpc: {
      useUtils: () => ({}),
      auth: {
        me: { useQuery: () => query(null) },
        logout: { useMutation: mutation },
      },
      settings: {
        all: { useQuery: () => query([]) },
        set: { useMutation: mutation },
      },
      menu: { listByTrip: { useQuery: () => query({ entries: [] }) } },
      trips: { board: { list: { useQuery: () => query([]) } } },
      recipes: { list: { useQuery: () => query([]) } },
    },
  };
});

const props = {
  tripId: 1,
  latitude: 46.9,
  longitude: 7.4,
  today: "2026-08-07",
};

async function renderBriefing() {
  const { default: MorningBriefing } = await import("./MorningBriefing");
  return renderWithI18n(<MorningBriefing {...props} />, { trpc: false });
}

describe("Morgen-Briefing", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("morgens sichtbar, mit Weg zur Heute-Ansicht", async () => {
    // 8 Uhr: innerhalb des Fensters (4–12).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 7, 8, 0));
    await renderBriefing();
    vi.useRealTimers();

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/heute");
  });

  it("am Abend gar nicht", async () => {
    // Ein «Morgen-Briefing» um 20 Uhr ist keins. Ohne diesen Test wäre
    // eine umgedrehte Bedingung nur jemandem aufgefallen, der abends
    // hinschaut.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 7, 20, 0));
    const { container } = await renderBriefing();
    vi.useRealTimers();

    expect(container).toBeEmptyDOMElement();
  });
});

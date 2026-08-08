import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import { nextWeekend } from "@shared/spotPick";
import { todayIso } from "@shared/localDate";

/**
 * «Wohin am Wochenende?» (#383) – die Anzeige, nicht die Note (#392).
 *
 * Die Note steht in server/spotPick.test.ts. Hier zählt: Unter zwei
 * Plätzen erscheint nichts (es gibt nichts zu vergleichen), zugeklappt
 * wird kein Wetterdienst behelligt, und nach dem Aufklappen führt die
 * Rangliste zu den Dossiers.
 *
 * DER WETTERDIENST IST EINE ATTRAPPE: Der Test baut die Antwort so, wie
 * Open-Meteo sie bei MEHREREN Koordinaten liefert – als Feld. Genau
 * diese Form war die Falle beim Bauen (#383) und soll es hier bleiben.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock() };
});

const SPOTS = [
  { id: 1, name: "Camping Aare", latitude: 46.9, longitude: 7.4 },
  { id: 2, name: "Camping Thun", latitude: 46.75, longitude: 7.62 },
];

/** Eine Open-Meteo-Antwort für die beiden Wochenend-Tage. */
function forecastBlock() {
  const weekend = nextWeekend(todayIso());
  return {
    daily: {
      time: [weekend.from, weekend.to],
      temperature_2m_max: [24, 25],
      temperature_2m_min: [14, 15],
      precipitation_probability_max: [10, 20],
      precipitation_sum: [0, 0.4],
      wind_speed_10m_max: [12, 14],
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function renderPicker(spots = SPOTS) {
  const { default: WeekendPicker } = await import("./WeekendPicker");
  return renderWithI18n(<WeekendPicker spots={spots} />, { trpc: false });
}

describe("WeekendPicker", () => {
  it("bleibt unter zwei Plätzen ganz weg", async () => {
    const { container } = await renderPicker([SPOTS[0]]);
    // Ein Vergleich mit einem Teilnehmer ist keiner.
    expect(container.querySelector("button")).toBeNull();
  });

  it("behelligt zugeklappt keinen Wetterdienst", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await renderPicker();
    expect(await screen.findByRole("button")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("zeigt nach dem Aufklappen die Rangliste mit Links zu den Dossiers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        // Mehrere Koordinaten → ein FELD von Blöcken. Bei einer einzigen
        // wäre es ein Objekt – die Falle aus #383.
        json: () => Promise.resolve([forecastBlock(), forecastBlock()]),
      })
    );
    await renderPicker();
    await userEvent.click(await screen.findByRole("button"));
    const links = await screen.findAllByRole("link");
    const targets = links.map(link => link.getAttribute("href"));
    expect(targets).toContain("/zeltplaetze/1");
    expect(targets).toContain("/zeltplaetze/2");
  });

  it("hat keine A11y-Verstösse", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([forecastBlock(), forecastBlock()]),
      })
    );
    const { container } = await renderPicker();
    await userEvent.click(await screen.findByRole("button"));
    await screen.findAllByRole("link");
    await expectNoA11yViolations(container);
  });
});

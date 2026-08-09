import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Luftqualitäts-Karte (#565, UI-Test #595): Sie holt ihre Daten selbst
 * per fetch von Open-Meteo – ohne Antwort verschwindet sie komplett.
 * Geprüft wird beides: Mit Daten stehen Ampel, Index und Werte da, ohne
 * Daten bleibt der Baum leer statt eine leere Hülle zu zeigen.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock({}) };
});

function stubAirQuality(current: Record<string, number> | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: current !== null,
        json: () => Promise.resolve({ current }),
      })
    )
  );
}

async function renderCard() {
  const { default: AirQualityCard } = await import("./AirQualityCard");
  return renderWithI18n(<AirQualityCard latitude={46.9} longitude={7.4} />, {
    trpc: false,
  });
}

describe("AirQualityCard", () => {
  it("zeigt Index, Feinstaub und Ozon aus der Antwort", async () => {
    stubAirQuality({ european_aqi: 72, pm2_5: 18.4, ozone: 90.2 });
    await renderCard();
    expect(await screen.findByText(/Air quality/)).toBeInTheDocument();
    expect(screen.getByText(/EU index 72/)).toBeInTheDocument();
    expect(screen.getByText(/PM2\.5: 18 µg\/m³/)).toBeInTheDocument();
    expect(screen.getByText(/Ozone: 90 µg\/m³/)).toBeInTheDocument();
  });

  it("verschwindet ohne Antwort, statt leer dazustehen", async () => {
    stubAirQuality(null);
    const { container } = await renderCard();
    // Kein Zwischenzustand zu erwarten – die Karte liefert schlicht nichts
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.querySelector(".py-4")).toBeNull();
    expect(screen.queryByText(/Air quality/)).toBeNull();
  });

  it("ist barrierefrei", async () => {
    stubAirQuality({ european_aqi: 35, pm2_5: 8, ozone: 60 });
    const { container } = await renderCard();
    await screen.findByText(/Air quality/);
    await expectNoA11yViolations(container);
  });
});

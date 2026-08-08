import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import type { WeatherTurn } from "@shared/weatherTurn";

/**
 * Wetterumschwung-Karte (#417) – die Anzeige, nicht die Erkennung.
 *
 * Die Schwellen und die Priorität wind > rain > cold sind in
 * server/weatherTurn.test.ts abgedeckt; hier geht es darum, dass die
 * Karte pro Art rendert, den Wert zeigt und ohne Umschwung ganz
 * wegbleibt. Geprüft wird über die Zahl im Text, nicht über
 * Beschriftungen – die wechseln mit der Sprache.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock() };
});

async function renderCard(turn: WeatherTurn | null) {
  const { default: WeatherTurnCard } = await import("./WeatherTurnCard");
  return renderWithI18n(<WeatherTurnCard turn={turn} />, { trpc: false });
}

describe("WeatherTurnCard", () => {
  it("zeigt den Wind-Umschwung mit der Böenspitze", async () => {
    await renderCard({ kind: "wind", value: 68 });
    expect(await screen.findByText(/68/)).toBeInTheDocument();
  });

  it("zeigt den Regen-Umschwung mit der Menge", async () => {
    await renderCard({ kind: "rain", value: 24 });
    expect(await screen.findByText(/24/)).toBeInTheDocument();
  });

  it("zeigt den Kälte-Sturz mit den Grad", async () => {
    await renderCard({ kind: "cold", value: 9 });
    expect(await screen.findByText(/9/)).toBeInTheDocument();
  });

  it("bleibt ohne Umschwung ganz weg", async () => {
    const { container } = await renderCard(null);
    expect(container.querySelector("p")).toBeNull();
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = await renderCard({ kind: "wind", value: 68 });
    await screen.findByText(/68/);
    await expectNoA11yViolations(container);
  });
});

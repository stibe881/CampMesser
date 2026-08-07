import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import type { DryHour } from "@shared/dryWindow";

/**
 * Das Trockenfenster (#384) – die Anzeige, nicht die Rechnung (#392).
 *
 * Die Rechnung ist in server/dryWindow.test.ts abgedeckt; hier geht es
 * darum, dass die Karte ÜBERHAUPT rendert, ihre Uhrzeiten zeigt und
 * bedienbar bleibt. Geprüft wird über Uhrzeiten und Rollen, nicht über
 * Beschriftungen – ein Test, der auf «Stunden» besteht, prüft die
 * Sprachwahl und nicht die Karte.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock() };
});

const hour = (time: string, over: Partial<DryHour> = {}): DryHour => ({
  time,
  precipitationMm: 0,
  precipitationProbability: 0,
  windSpeedKmh: 8,
  windGustsKmh: 15,
  ...over,
});

const CALM = [
  hour("2026-08-08T06:00"),
  hour("2026-08-08T07:00"),
  hour("2026-08-08T08:00"),
  hour("2026-08-08T09:00"),
];

async function renderCard(hours: DryHour[]) {
  const { default: DryWindowCard } = await import("./DryWindowCard");
  return renderWithI18n(<DryWindowCard hours={hours} />, { trpc: false });
}

describe("DryWindowCard", () => {
  it("zeigt das gefundene Fenster als Uhrzeit", async () => {
    await renderCard(CALM);
    // 2-Stunden-Fenster ab der ersten ruhigen Stunde, Ende am ENDE der
    // letzten Stunde – sprachunabhängig prüfbar.
    expect(await screen.findByText("06:00 – 08:00")).toBeInTheDocument();
  });

  it("bietet die Fensterlängen als gedrückte Knöpfe an", async () => {
    await renderCard(CALM);
    const group = await screen.findByRole("group");
    const buttons = group.querySelectorAll("button[aria-pressed]");
    expect(buttons.length).toBe(3);
    const pressed = group.querySelectorAll('button[aria-pressed="true"]');
    expect(pressed.length).toBe(1);
  });

  it("rechnet beim Wechsel der Länge neu", async () => {
    await renderCard(CALM);
    const group = await screen.findByRole("group");
    const buttons = Array.from(
      group.querySelectorAll("button[aria-pressed]")
    ) as HTMLButtonElement[];
    await userEvent.click(buttons[2]); // 3 Stunden
    expect(await screen.findByText("06:00 – 09:00")).toBeInTheDocument();
  });

  it("bleibt ohne Stunden ganz weg", async () => {
    const { container } = await renderCard([]);
    // Eine leere Karte wäre ein grauer Balken ohne Aussage.
    expect(container.querySelector('[role="group"]')).toBeNull();
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = await renderCard(CALM);
    await screen.findByText("06:00 – 08:00");
    await expectNoA11yViolations(container);
  });
});

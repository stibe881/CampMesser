import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Der Offline-Knopf (#387) – die Schrittliste, nicht die Downloads (#392).
 *
 * WAS HIER GEPRÜFT WIRD: dass der Knopf da ist, dass nach dem Drücken
 * VIER Schritte mit eigenem Zustand erscheinen und dass Übersprungenes
 * («keine Packliste verknüpft») sichtbar bleibt statt still zu
 * verschwinden. Genau diese Ehrlichkeit ist das Versprechen der Karte –
 * «fertig» über einem halben Paket wäre ihre gefährlichste Anzeige.
 *
 * Die Kachel-Downloads selbst laufen hier nicht: ohne Platz wird der
 * Karten-Schritt übersprungen, und das ist ein Zustand, den es auch in
 * echt gibt (geteilte Reise ohne eigenen Platz).
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock() };
});

async function renderPrep() {
  const { default: TripOfflinePrep } = await import("./TripOfflinePrep");
  return renderWithI18n(
    <TripOfflinePrep tripId={7} spotId={null} packListId={null} />,
    { trpc: false }
  );
}

describe("TripOfflinePrep", () => {
  it("zeigt vor dem Start nur den Knopf, keine Schrittliste", async () => {
    await renderPrep();
    expect(await screen.findByRole("button")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("zeigt nach dem Start vier Schritte und lässt Übersprungenes stehen", async () => {
    await renderPrep();
    await userEvent.click(await screen.findByRole("button"));
    const items = await screen.findAllByRole("listitem");
    // Reise, Packliste, Menüplan, Karte – auch die übersprungenen
    // Schritte bleiben sichtbar, sonst liest sich das Paket als komplett.
    expect(items).toHaveLength(4);
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = await renderPrep();
    await userEvent.click(await screen.findByRole("button"));
    await screen.findAllByRole("listitem");
    await expectNoA11yViolations(container);
  });
});

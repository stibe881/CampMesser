import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";

/**
 * Lawinengefahr-Zeile (#471/#490, UI-Test #515): Die Zeile darf nur
 * innerhalb der Abdeckung erscheinen und muss die richtige Quellzeile
 * tragen – SLF für die Schweiz, Euregio für Tirol/Südtirol/Trentino.
 */
const loadMock = vi.hoisted(() =>
  vi.fn<() => Promise<{ level: number; source: string } | null>>()
);

vi.mock("@/lib/avalanche", () => ({
  loadAvalancheDanger: loadMock,
}));

async function renderCard(latitude: number, longitude: number) {
  const { default: AvalancheDanger } = await import("./AvalancheDanger");
  return renderWithI18n(
    <AvalancheDanger latitude={latitude} longitude={longitude} />
  );
}

describe("Lawinengefahr-Zeile", () => {
  it("zeigt Stufe und Euregio-Quellzeile für Tirol (#490)", async () => {
    loadMock.mockResolvedValue({ level: 3, source: "euregio" });
    await renderCard(47.26, 11.39);
    expect(await screen.findByText(/Avalanche danger: level 3/)).toBeVisible();
    expect(screen.getByText(/avalanche\.report/)).toBeVisible();
  });

  it("fragt ausserhalb der Abdeckung gar nicht erst an", async () => {
    loadMock.mockClear();
    const { container } = await renderCard(52.52, 13.4); // Berlin
    // Kein Abruf, keine Zeile – ehrlich leer statt fremder Skala
    expect(loadMock).not.toHaveBeenCalled();
    expect(container.textContent).toBe("");
  });
});

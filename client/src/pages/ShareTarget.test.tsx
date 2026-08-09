import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Geteilter Ort im Share-Ziel (#584, UI-Test aus #614): Ein aus einer
 * Karten-App geteilter geo:-Link muss als Merkort-Karte erscheinen und
 * sich mit dem erkannten Namen speichern lassen. Der Weg ist der einzige
 * Einstieg für «Ort teilen» – bricht er still, merkt es niemand im Test,
 * nur die Person, deren geteilter Ort einfach verschwindet.
 */
const { addSpy } = vi.hoisted(() => ({ addSpy: vi.fn() }));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock({}, { "savedPlaces.add": addSpy }) };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Stefan", email: "s@example.com" },
    loading: false,
  }),
}));

/** Cache-Attrappe: genau ein geteilter Text, keine Fotos. */
function stubShareCache(sharedUrl: string | null) {
  const cache = {
    keys: async () => [],
    match: async (key: string) =>
      sharedUrl !== null && key === "/teilen/share-text"
        ? { json: async () => ({ url: sharedUrl }) }
        : undefined,
    delete: async () => true,
  };
  Object.defineProperty(window, "caches", {
    value: { open: async () => cache },
    configurable: true,
  });
}

async function renderShareTarget() {
  const { default: ShareTarget } = await import("./ShareTarget");
  return renderWithI18n(<ShareTarget />, { trpc: false });
}

describe("ShareTarget – geteilter Ort", () => {
  it("erkennt einen geo:-Link und speichert ihn als Merkort", async () => {
    addSpy.mockClear();
    stubShareCache("geo:0,0?q=47.05,8.31(Rigi)");
    await renderShareTarget();
    // Erkannte Koordinaten und der Name aus dem Label stehen in der Karte
    const nameInput = await screen.findByDisplayValue("Rigi");
    expect(nameInput).toBeTruthy();
    expect((await screen.findAllByText(/47\.05/)).length).toBeGreaterThan(0);
    await userEvent.click(
      screen.getByRole("button", { name: /Save as a place/i })
    );
    expect(addSpy).toHaveBeenCalledTimes(1);
    const input = addSpy.mock.calls[0][0] as {
      name: string;
      latitude: number;
      longitude: number;
    };
    expect(input.name).toBe("Rigi");
    expect(input.latitude).toBeCloseTo(47.05);
    expect(input.longitude).toBeCloseTo(8.31);
  });

  it("zeigt ohne geteilten Inhalt den leeren Zustand – und bleibt zugänglich", async () => {
    addSpy.mockClear();
    stubShareCache(null);
    const { container } = await renderShareTarget();
    // Leerer Zustand statt Absturz oder ewigem Spinner
    await screen.findByText(/Shared photos/i);
    expect(screen.queryByDisplayValue("Rigi")).toBeNull();
    await expectNoA11yViolations(container);
  });

  it("ist mit erkannter Ort-Karte barrierefrei", async () => {
    stubShareCache("geo:0,0?q=46.80,9.83(Flueela)");
    const { container } = await renderShareTarget();
    await screen.findByDisplayValue("Flueela");
    await expectNoA11yViolations(container);
  });
});

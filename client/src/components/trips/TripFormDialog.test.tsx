import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Reise-Erfassungs-Dialog (#483/#485, UI-Test #515).
 *
 * WARUM ES EINEN TEST BEKOMMT: Der Dialog ist nach dem Herauslösen aus
 * Trips.tsx der wichtigste unbewachte Baustein – ER legt Reisen an. Und
 * die Formular-nach-Art-Regel (#485) ist reine Anzeige-Logik: Kippt sie,
 * fragt der Hotel-Dialog nach der Parzellennummer oder versteckt die
 * Zeltplatz-Auswahl beim Camping.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock({}) };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Test", email: "test@example.com" },
    loading: false,
  }),
}));

async function renderDialog() {
  const { default: TripFormDialog } = await import("./TripFormDialog");
  return renderWithI18n(
    <TripFormDialog
      open
      editing={null}
      spots={[
        {
          id: 1,
          name: "Camping Waldheim",
          latitude: 46.8,
          longitude: 8.2,
        } as never,
      ]}
      packLists={[]}
      onClose={() => {}}
    />,
    { trpc: false }
  );
}

describe("Reise-Erfassungs-Dialog", () => {
  it("zeigt die Reiseart-Chips und startet mit Camping", async () => {
    await renderDialog();
    expect(await screen.findByText("New trip")).toBeVisible();
    const camping = screen.getByRole("button", { name: "Camping" });
    expect(camping).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Beach holiday" })).toBeVisible();
  });

  it("blendet die Zeltplatz-Auswahl bei platzlosen Arten aus (#485)", async () => {
    await renderDialog();
    await screen.findByText("New trip");
    // Camping: Zeltplatz-Auswahl da
    expect(screen.getByLabelText("Place")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "City trip" }));
    // Städtereise: Auswahl weg, nur der Freitext-Ort – und ein Datum
    // bleibt zweigeteilt (Abreise da, kein Ein-Tages-Formular)
    expect(screen.getByLabelText("Departure")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Day trip" }));
    // Tagesausflug: die getrennte Abreise verschwindet (singleDay)
    expect(screen.queryByLabelText("Departure")).toBeNull();
  });

  it("ist barrierefrei", async () => {
    const { baseElement } = await renderDialog();
    await screen.findByText("New trip");
    await expectNoA11yViolations(baseElement as HTMLElement);
  });
});

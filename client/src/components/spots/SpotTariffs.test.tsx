import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";

/**
 * Der Tarif-Editor (#369, #394, #395) – die gemeldeten Wege, nicht die
 * Parser-Regeln (die stehen in server/spotTariffs.test.ts).
 *
 * DER GEMELDETE FEHLER: «wenn man einen tarif bearbeitet, kann man keine
 * zusätzlichen untertarife mehr hinzufügen.» Die Zeile kam an, fiel aber
 * beim Speichern stumm weg, sobald der Betrag «12.–» hiess. Deshalb
 * stehen hier drei Dinge fest: Hinzufügen zeigt sofort eine neue Zeile,
 * «12.–» überlebt das Speichern, und eine wirklich unlesbare Zeile
 * blockiert das Speichern LAUT statt still zu verschwinden.
 */
const { updateMutate } = vi.hoisted(() => ({ updateMutate: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({}, { "spots.update": updateMutate }),
  };
});

const TARIFFS_JSON = JSON.stringify([
  {
    name: "Hauptsaison",
    rows: [{ label: "Erwachsene", priceRappen: 1200 }],
    currency: "CHF",
  },
]);

async function renderTariffs() {
  const { default: SpotTariffs } = await import("./SpotTariffs");
  const view = renderWithI18n(
    <SpotTariffs spotId={5} tariffsJson={TARIFFS_JSON} />,
    { trpc: false }
  );
  await userEvent.click(screen.getByRole("button", { name: "Edit rates" }));
  await screen.findByRole("dialog");
  return view;
}

describe("SpotTariffs-Editor", () => {
  beforeEach(() => updateMutate.mockClear());

  it("«Zeile hinzufügen» zeigt beim Bearbeiten sofort eine neue Zeile", async () => {
    await renderTariffs();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByLabelText("e.g. adults")).toHaveLength(1);
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Add row" })
    );
    expect(within(dialog).getAllByLabelText("e.g. adults")).toHaveLength(2);
  });

  it("«12.–» ist ein Betrag und überlebt das Speichern", async () => {
    await renderTariffs();
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Add row" })
    );
    const labels = within(dialog).getAllByLabelText("e.g. adults");
    await userEvent.type(labels[1], "Hund");
    const prices = within(dialog).getAllByLabelText("Price per night");
    await userEvent.type(prices[1], "4.–");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(updateMutate.mock.calls[0][0].tariffsJson);
    expect(saved[0].rows).toEqual([
      { label: "Erwachsene", priceRappen: 1200 },
      { label: "Hund", priceRappen: 400 },
    ]);
  });

  it("eine unlesbare Zeile blockiert das Speichern LAUT statt still zu verschwinden", async () => {
    const { toast } = await import("sonner");
    await renderTariffs();
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Add row" })
    );
    const labels = within(dialog).getAllByLabelText("e.g. adults");
    await userEvent.type(labels[1], "Hund");
    const prices = within(dialog).getAllByLabelText("Price per night");
    await userEvent.type(prices[1], "gratis");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(updateMutate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it("Duplizieren kopiert den Tarif samt Untertarifen", async () => {
    await renderTariffs();
    const dialog = screen.getByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", {
        name: "Duplicate tariff Hauptsaison",
      })
    );
    // Die Kopie steht direkt darunter, heisst «… (Kopie)» und bringt
    // ihre Zeile mit – abtippen war genau die Arbeit, die wegfallen soll.
    expect(
      within(dialog).getByDisplayValue("Hauptsaison (copy)")
    ).toBeInTheDocument();
    expect(within(dialog).getAllByLabelText("e.g. adults")).toHaveLength(2);
    expect(within(dialog).getAllByDisplayValue("12.00")).toHaveLength(2);
  });
});

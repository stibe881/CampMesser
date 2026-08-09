import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Schnell-Ausgabe in der Heute-Ansicht (#547, UI-Test aus #575).
 *
 * Der Weg vom Knopf zum gespeicherten Beleg ist kurz – genau deshalb
 * muss er sitzen: Dialog öffnet, Betrag mit Komma wird verstanden, die
 * Mutation bekommt Rappen. Formatiert wird nichts geprüft, nur was
 * tatsächlich gespeichert würde.
 */
const { addSpy } = vi.hoisted(() => ({ addSpy: vi.fn() }));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock({}, { "trips.expenses.add": addSpy }) };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Stefan", email: "s@example.com" },
    loading: false,
  }),
}));

async function renderQuickExpense() {
  const { default: QuickExpense } = await import("./QuickExpense");
  return renderWithI18n(<QuickExpense tripId={7} />, { trpc: false });
}

describe("QuickExpense", () => {
  it("öffnet den Dialog und speichert den Betrag in Rappen", async () => {
    addSpy.mockClear();
    await renderQuickExpense();
    const buttons = await screen.findAllByRole("button");
    await userEvent.click(buttons[0]);
    const dialog = await screen.findByRole("dialog");
    const amount = dialog.querySelector(
      'input[inputmode="decimal"]'
    ) as HTMLInputElement;
    expect(amount).not.toBeNull();
    await userEvent.type(amount, "12,50");
    const submit = dialog.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    await userEvent.click(submit);
    expect(addSpy).toHaveBeenCalledTimes(1);
    const input = addSpy.mock.calls[0][0] as {
      tripId: number;
      amountRappen: number;
      currency: string;
      paidBy: string;
    };
    expect(input.tripId).toBe(7);
    expect(input.amountRappen).toBe(1250);
    expect(input.currency).toBe("CHF");
    expect(input.paidBy).toBe("Stefan");
  });

  it("speichert nichts ohne gültigen Betrag", async () => {
    addSpy.mockClear();
    await renderQuickExpense();
    const buttons = await screen.findAllByRole("button");
    await userEvent.click(buttons[0]);
    const dialog = await screen.findByRole("dialog");
    const submit = dialog.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    // Ohne Betrag ist Speichern gesperrt – ein leerer Beleg wäre Müll.
    expect(submit.disabled).toBe(true);
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("hat im offenen Dialog keine A11y-Verstösse", async () => {
    await renderQuickExpense();
    const buttons = await screen.findAllByRole("button");
    await userEvent.click(buttons[0]);
    const dialog = await screen.findByRole("dialog");
    await expectNoA11yViolations(dialog);
  });
});

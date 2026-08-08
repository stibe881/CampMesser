import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Zwei-Faktor per TOTP (#453, UI-Test #484).
 *
 * WARUM ES EINEN TEST BEKOMMT: Die Karte hat DREI Gesichter (aus, in
 * Einrichtung, an) und entscheidet über den Zugang zum Konto. Zeigt sie
 * nach einem Umbau den Ausschalt-Block, obwohl Zwei-Faktor aus ist –
 * oder umgekehrt –, sperrt sich jemand aus oder wähnt sich geschützt,
 * ohne es zu sein.
 */
const status = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      get "auth.twoFactor.status"() {
        return { enabled: status.enabled };
      },
    }),
  };
});

async function renderCard() {
  const { default: TwoFactorCard } = await import("./TwoFactorCard");
  return renderWithI18n(<TwoFactorCard />, { trpc: false });
}

describe("Zwei-Faktor-Karte", () => {
  it("bietet die Einrichtung an, solange Zwei-Faktor aus ist", async () => {
    status.enabled = false;
    await renderCard();
    await userEvent.click(
      await screen.findByRole("button", { name: /Two-factor sign-in/ })
    );
    expect(
      await screen.findByRole("button", { name: "Set up two-factor" })
    ).toBeVisible();
    // Der Ausschalt-Block gehört NUR in den eingeschalteten Zustand
    expect(screen.queryByText("Two-factor is switched on.")).toBeNull();
  });

  it("verlangt zum Ausschalten einen Code, wenn Zwei-Faktor an ist", async () => {
    status.enabled = true;
    await renderCard();
    await userEvent.click(
      await screen.findByRole("button", { name: /Two-factor sign-in/ })
    );
    expect(await screen.findByText("Two-factor is switched on.")).toBeVisible();
    const disable = screen.getByRole("button", { name: "Switch off" });
    // Ohne Code bleibt der Knopf gesperrt – ein Fehlklick allein darf
    // den zweiten Faktor nicht entfernen.
    expect(disable).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/To switch off/), "123456");
    expect(disable).toBeEnabled();
  });

  it("ist barrierefrei – aufgeklappt", async () => {
    status.enabled = false;
    const { container } = await renderCard();
    await userEvent.click(
      await screen.findByRole("button", { name: /Two-factor sign-in/ })
    );
    await screen.findByRole("button", { name: "Set up two-factor" });
    await expectNoA11yViolations(container);
  });
});

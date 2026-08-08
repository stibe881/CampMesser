import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Teil-Link-Übersicht (#422, UI-Test #459).
 *
 * WARUM ES EINEN TEST BEKOMMT: Die Karte ist die einzige Gesamtsicht auf
 * alles, was per Link offen ist – neun Link-Arten aus neun Ecken der App.
 * Fällt die Art-Beschriftung oder der Widerrufen-Knopf beim Umbau weg,
 * bleibt ein Link ewig offen, ohne dass es jemand sieht.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "shares.list": [
        {
          kind: "spot",
          id: 1,
          token: "V1StGXR8_Z5jdHi6B",
          label: "Camping Aare",
          expiresAt: null,
        },
        {
          kind: "shopping",
          id: 7,
          token: "aaaaaaaaaaaaaaaaa",
          label: "",
          expiresAt: "2026-08-20T00:00:00.000Z",
        },
      ],
    }),
  };
});

async function renderCard() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: ShareLinksCard } = await import("./ShareLinksCard");
  return renderWithI18n(
    <ConfirmProvider>
      <ShareLinksCard />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Teil-Link-Übersicht", () => {
  it("zeigt Art, Namen und Ablauf jedes Links mit Kopieren und Widerrufen", async () => {
    await renderCard();
    await userEvent.click(
      await screen.findByRole("button", { name: /Active share links/ })
    );
    expect(await screen.findByText("Spot dossier")).toBeVisible();
    expect(screen.getByText("Camping Aare")).toBeVisible();
    // Ein Link ohne Namen bekommt ein ehrliches «Unbenannt» statt Lücke
    expect(screen.getByText("Unnamed")).toBeVisible();
    expect(screen.getByText(/expires on/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Copy link to Camping Aare" })
    ).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Revoke" })).toHaveLength(2);
  });

  it("ist barrierefrei – zugeklappt und aufgeklappt", async () => {
    const { container } = await renderCard();
    const toggle = await screen.findByRole("button", {
      name: /Active share links/,
    });
    await expectNoA11yViolations(container);
    await userEvent.click(toggle);
    await screen.findByText("Camping Aare");
    await expectNoA11yViolations(container);
  });
});

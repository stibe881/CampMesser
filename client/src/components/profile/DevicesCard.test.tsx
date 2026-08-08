import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Angemeldete Geräte (#423, UI-Test #459).
 *
 * WARUM ES EINEN TEST BEKOMMT: Die Karte ist der einzige Ort, an dem man
 * ein verlorenes Handy aussperren kann. Verschwindet der «Abmelden»-Knopf
 * beim Umbau oder klebt das «Dieses Gerät»-Etikett am falschen Eintrag,
 * merkt es niemand – bis es darauf ankommt.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "devices.list": [
        {
          id: 1,
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
          current: true,
          lastSeenAt: "2026-08-07T10:00:00.000Z",
          createdAt: "2026-08-01T08:00:00.000Z",
        },
        {
          id: 2,
          userAgent: null,
          current: false,
          lastSeenAt: "2026-08-05T18:30:00.000Z",
          createdAt: "2026-07-20T12:00:00.000Z",
        },
      ],
    }),
  };
});

async function renderCard() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: DevicesCard } = await import("./DevicesCard");
  return renderWithI18n(
    <ConfirmProvider>
      <DevicesCard />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Angemeldete Geräte", () => {
  it("markiert das eigene Gerät und bietet Abmelden nur für die anderen", async () => {
    await renderCard();
    await userEvent.click(
      await screen.findByRole("button", { name: /Signed-in devices/ })
    );
    // Das eigene Gerät trägt das Etikett – und KEINEN Abmelden-Knopf,
    // sonst sperrte man sich mit einem Fehlklick selbst aus.
    expect(await screen.findByText("This device")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Sign out" })).toHaveLength(1);
    // Ohne erkennbaren User-Agent bleibt ein ehrliches «Unbekannt» statt Lücke
    expect(screen.getByText("Unknown device")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Sign out all other devices" })
    ).toBeVisible();
  });

  it("ist barrierefrei – zugeklappt und aufgeklappt", async () => {
    const { container } = await renderCard();
    const toggle = await screen.findByRole("button", {
      name: /Signed-in devices/,
    });
    await expectNoA11yViolations(container);
    await userEvent.click(toggle);
    await screen.findByText("This device");
    await expectNoA11yViolations(container);
  });
});

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Karten & Ausweise (#454/#476, UI-Test #484).
 *
 * WARUM ES EINEN TEST BEKOMMT: Der Ablauf-Hinweis (#476) ist der ganze
 * Witz des Ablaufdatums – wer an der Rezeption steht, muss VORHER lesen
 * können, dass die ACSI-Card seit Juli abgelaufen ist. Rutscht die
 * Einstufung beim Umbau auf die falsche Karte, warnt die App vor der
 * gültigen Karte und schweigt zur abgelaufenen.
 */
const TODAY = "2026-08-07";

vi.mock("@shared/localDate", async importOriginal => {
  const actual = await importOriginal<typeof import("@shared/localDate")>();
  return { ...actual, todayIso: () => TODAY };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Test", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "documents.list": [
        // Abgelaufen: vor dem Stichtag
        {
          id: 1,
          title: "ACSI card 2025",
          fileName: null,
          expiresOn: "2026-07-01",
        },
        // Läuft bald ab: innerhalb der 30 Warn-Tage
        {
          id: 2,
          title: "TCS membership",
          fileName: null,
          expiresOn: "2026-08-20",
        },
        // Ohne Datum: kein Hinweis
        { id: 3, title: "Camping Key", fileName: null, expiresOn: null },
      ],
    }),
  };
});

async function renderPage() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: DocumentsPage } = await import("./Documents");
  return renderWithI18n(
    <ConfirmProvider>
      <DocumentsPage />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Karten & Ausweise", () => {
  it("stuft Ablaufdaten richtig ein (#476)", async () => {
    await renderPage();
    expect(await screen.findByText("ACSI card 2025")).toBeVisible();
    // Genau EIN «abgelaufen» und EIN «läuft bald ab» – je an der
    // richtigen Karte; die Karte ohne Datum bleibt ohne Hinweis.
    expect(screen.getByText(/Expired since/)).toBeVisible();
    expect(screen.getByText(/Expires on/)).toBeVisible();
    expect(
      screen.getAllByText(/Expired since|Expires on|Valid until/)
    ).toHaveLength(2);
  });

  it("bietet Anlegen mit optionalem Ablaufdatum an", async () => {
    await renderPage();
    expect(await screen.findByLabelText("New card")).toBeVisible();
    expect(screen.getByLabelText("Expiry date (optional)")).toBeVisible();
    // Ohne Titel bleibt «Create» gesperrt – leere Karten wären Müll
    expect(screen.getByRole("button", { name: /Create/ })).toBeDisabled();
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderPage();
    await screen.findByText("ACSI card 2025");
    await expectNoA11yViolations(container);
  });
});

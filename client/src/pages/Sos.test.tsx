import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * SOS-Seite (#4, Ausland-Notrufnummern #432, UI-Test #459).
 *
 * WARUM ES EINEN TEST BEKOMMT: Die Seite ist der Ort, den man im
 * Ernstfall aufreisst – ohne Netzprobe vorher. In jsdom gibt es keine
 * Ortung (navigator.geolocation fehlt), und genau so muss die Seite
 * trotzdem stehen: Nummern zuerst, Fehlerhinweis statt Absturz.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return { trpc: trpcMock({}) };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, loading: false }),
}));

async function renderSos() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: SosPage } = await import("./Sos");
  return renderWithI18n(
    <ConfirmProvider>
      <SosPage />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("SOS", () => {
  it("zeigt die Schweizer Notrufnummern auch ohne Ortung", async () => {
    await renderSos();
    // 112 steht oben bei den Schweizer Nummern UND bei den Ländern (#432)
    expect((await screen.findAllByText("112")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("144").length).toBeGreaterThan(0);
  });

  it("führt die Notrufnummern der Nachbarländer auf (#432)", async () => {
    await renderSos();
    expect(
      await screen.findByRole("heading", { name: "Emergency numbers abroad" })
    ).toBeVisible();
    // Die Schweiz steht schon oben und fehlt deshalb in der Länderliste
    const germany = await screen.findByText("Germany");
    expect(screen.queryByText("Switzerland")).not.toBeInTheDocument();
    // Aufklappen zeigt die Nummern als tel:-Links
    await userEvent.click(germany);
    const links = screen.getAllByRole("link");
    expect(links.some(l => l.getAttribute("href") === "tel:112")).toBe(true);
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderSos();
    await screen.findByRole("heading", { name: "Emergency numbers abroad" });
    await expectNoA11yViolations(container);
  });
});

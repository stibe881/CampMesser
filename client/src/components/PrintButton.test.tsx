import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Druck-Knopf (vierter Anlauf «Pass drucken», 09.08.2026): Der Knopf hat
 * DREI Wege, und der Fehler sass jedes Mal im nicht geprüften – deshalb
 * prüft dieser Test alle drei ausdrücklich:
 *  - Browser: window.print();
 *  - installierte PWA (Standalone): target="_blank"-Link mit Druck-Ticket;
 *  - NATIVE App (Expo-WebView): OPEN_EXTERNAL_URL über die Brücke, damit
 *    Safari die Ticket-Adresse öffnet – window.print() und same-origin-
 *    Links tun im WebView beide nichts.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({ "auth.printTicket": { ticket: "u1.9999999999.sig" } }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Stefan", email: "s@example.com" },
    loading: false,
  }),
}));

/** matchMedia-Attrappe: nur «display-mode: standalone» trifft. */
function fakeStandalone() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("display-mode: standalone"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

async function renderButton() {
  const { default: PrintButton } = await import("./PrintButton");
  return renderWithI18n(<PrintButton label="Print" />, { trpc: false });
}

const realMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = realMatchMedia;
  delete (window as { ReactNativeWebView?: unknown }).ReactNativeWebView;
});

describe("PrintButton", () => {
  it("Browser: ruft window.print() auf", async () => {
    const printSpy = vi.fn();
    window.print = printSpy;
    await renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Print/ }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("PWA (Standalone): öffnet die Ticket-Adresse als _blank-Link", async () => {
    fakeStandalone();
    await renderButton();
    const link = screen.getByRole("link", { name: /Print/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("href")).toContain("/api/print-login?ticket=");
  });

  it("native App: schickt OPEN_EXTERNAL_URL mit absoluter Ticket-Adresse", async () => {
    const postSpy = vi.fn();
    (window as { ReactNativeWebView?: unknown }).ReactNativeWebView = {
      postMessage: postSpy,
    };
    await renderButton();
    await userEvent.click(screen.getByRole("button", { name: /Print/ }));
    expect(postSpy).toHaveBeenCalledTimes(1);
    const message = JSON.parse(postSpy.mock.calls[0][0] as string) as {
      type: string;
      url: string;
    };
    expect(message.type).toBe("OPEN_EXTERNAL_URL");
    // Absolute Adresse – Safari kann mit einem Pfad allein nichts anfangen.
    expect(message.url).toMatch(/^http/);
    expect(message.url).toContain("/api/print-login?ticket=");
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = await renderButton();
    await expectNoA11yViolations(container);
  });
});

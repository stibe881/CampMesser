import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientErrorLog from "./ClientErrorLog";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Die Absturzmeldungen im Profil (#352, geprüft in #355).
 *
 * WARUM AUSGERECHNET HIER EIN TEST: Diese Karte zeigt Pfade und
 * Stapelspuren FREMDER Geräte. Wer sie sehen darf, ist keine
 * Geschmacksfrage, sondern eine Zusage – und eine, die man einer
 * Komponente nicht ansieht. Der Endpunkt ist zwar eine `adminProcedure`,
 * aber wenn die Karte auch nur erscheint, verspricht sie etwas, das sie
 * nicht halten kann.
 *
 * KEIN `vi.resetModules()` + dynamischer Import: Das gäbe der Komponente
 * einen ZWEITEN Modulgraphen und damit einen anderen Sprach-Kontext als
 * dem Test-Gerüst – die Übersetzungen wären leer, und der Test schlüge
 * aus einem Grund fehl, der mit der Sache nichts zu tun hat.
 */
vi.mock("@/_core/hooks/useAuth", () => {
  // Der Zustand lebt IM Factory-Rumpf: `vi.mock` wird nach oben gezogen
  // und dürfte auf nichts zugreifen, was weiter unten steht.
  const state: { user: { id: number; name: string; role: string } | null } = {
    user: null,
  };
  return {
    useAuth: () => ({
      user: state.user,
      loading: false,
      error: null,
      isAuthenticated: state.user !== null,
      logout: vi.fn(),
    }),
    __setRole: (role: string | null) => {
      state.user = role === null ? null : { id: 1, name: "Test", role };
    },
  };
});

import * as authModule from "@/_core/hooks/useAuth";

const setRole = (role: string | null) =>
  (
    authModule as unknown as { __setRole: (r: string | null) => void }
  ).__setRole(role);

describe("Absturzmeldungen im Profil", () => {
  it("ohne Admin-Rolle erscheint gar nichts", async () => {
    setRole("user");
    const { container } = renderWithI18n(<ClientErrorLog />);
    expect(container).toBeEmptyDOMElement();
  });

  it("abgemeldet erscheint gar nichts", async () => {
    setRole(null);
    const { container } = renderWithI18n(<ClientErrorLog />);
    expect(container).toBeEmptyDOMElement();
  });

  it("als Admin gibt es den Abschnitt – zugeklappt", async () => {
    setRole("admin");
    renderWithI18n(<ClientErrorLog />);
    const toggle = await screen.findByRole("button");
    // Zugeklappt heisst: nichts geladen. Das Profil ist keine Werkstatt.
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("aufklappen macht den Inhalt auf", async () => {
    setRole("admin");
    renderWithI18n(<ClientErrorLog />);
    const toggle = await screen.findByRole("button");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("ohne Zugänglichkeits-Verstösse", async () => {
    setRole("admin");
    const { container } = renderWithI18n(<ClientErrorLog />);
    await screen.findByRole("button");
    await expectNoA11yViolations(container);
  });
});

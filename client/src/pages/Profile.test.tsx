import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Das Profil (#378).
 *
 * WARUM ES EINEN TEST BEKOMMT: Hier hängt alles, was man EINMAL
 * einstellt und dann nie wieder anschaut – Design, Sprache, Push, Zahl
 * am App-Icon, Kalender-Abo, Schnellzugriff, Heim-Standort, Passkeys,
 * Konto löschen. Fällt eine dieser Karten beim Umbau weg, merkt es
 * niemand, bis jemand die Einstellung sucht. In dieser Runde sind allein
 * drei Karten dazugekommen bzw. umgezogen (#373, #374, #377).
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "calendar.feed": { token: "V1StGXR8_Z5jdHi6B-myT" },
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: 1,
      name: "Test",
      email: "test@example.com",
      emailVerified: true,
      verifyMailEnabled: false,
    },
    loading: false,
    logout: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
  }),
}));

async function renderProfile() {
  // Zwei Provider, die in der echten App in `App.tsx` stehen: der
  // Bestätigungs-Dialog (#317) und das Design (#63). Beide werfen ohne
  // Provider – und beide gehören zum Profil, nicht in `renderWithI18n`.
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { ThemeProvider } = await import("@/contexts/ThemeContext");
  const { default: Profile } = await import("./Profile");
  return renderWithI18n(
    <ThemeProvider>
      <ConfirmProvider>
        <Profile />
      </ConfirmProvider>
    </ThemeProvider>,
    { trpc: false }
  );
}

describe("Profil", () => {
  // Seit #408 sind alle Karten standardmässig eingeklappt – die Tests
  // klappen die gesuchte Karte deshalb zuerst über ihren Titel auf.
  it("bietet die Sprachwahl an – seit #374 lebt sie hier", async () => {
    await renderProfile();
    await userEvent.click(
      await screen.findByRole("button", { name: /Language/ })
    );
    // Die Sprachnamen stehen in ihrer eigenen Sprache und ändern sich
    // deshalb nicht mit der Anzeigesprache des Tests.
    expect(
      await screen.findByRole("button", { name: "Deutsch" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Français" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Italiano" })).toBeVisible();
    expect(screen.getByRole("button", { name: "English" })).toBeVisible();
  });

  it("zeigt die Adresse des Kalender-Abos zum Kopieren", async () => {
    await renderProfile();
    await userEvent.click(
      await screen.findByRole("button", { name: /Calendar subscription/ })
    );
    // Ohne sichtbare Adresse ist das Abo (#377) unbrauchbar: Wer nicht
    // auf «abonnieren» tippen kann, braucht sie zum Einfügen.
    expect(
      await screen.findByText(/V1StGXR8_Z5jdHi6B-myT\.ics/)
    ).toBeInTheDocument();
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderProfile();
    await screen.findByRole("button", { name: /Language/ });
    // Erst zugeklappt prüfen, dann ALLE Karten öffnen und nochmals –
    // sonst testete axe nur die Titelzeilen statt der Inhalte.
    await expectNoA11yViolations(container);
    for (const toggle of screen.getAllByRole("button", { expanded: false })) {
      await userEvent.click(toggle);
    }
    await expectNoA11yViolations(container);
  });
});

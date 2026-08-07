import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import { PUSH_SEEN_KEY } from "@/lib/pushSeen";

/**
 * Die Glocke in der Kopfzeile (#374).
 *
 * WARUM GERADE HIER EIN TEST: Die Glocke ist der einzige Weg zu den
 * Mitteilungen, seit der Verlauf aus dem Profil verschwunden ist. Bleibt
 * sie leer oder taucht sie für Abgemeldete auf, ist eine ganze Funktion
 * unerreichbar bzw. kaputt – und beides sieht man nur, wenn man in genau
 * diesem Zustand hinschaut.
 */
const LOG = [
  {
    id: 2,
    kind: "board",
    title: "Neuer Zettel",
    body: "Camping Thun · Brot ist alle",
    url: "/tagebuch/7#pinnwand",
    sentAt: new Date("2026-08-07T10:00:00.000Z"),
  },
  {
    id: 1,
    kind: "weather",
    title: "Sturmwarnung",
    body: "Camping Thun · Böen bis 95 km/h",
    url: null,
    sentAt: new Date("2026-08-06T18:00:00.000Z"),
  },
];

const authState = { isAuthenticated: true };

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: authState.isAuthenticated,
    user: null,
    loading: false,
  }),
}));

vi.mock("@/lib/trpc", () => {
  const query = (data: unknown) => ({
    data,
    isLoading: false,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: () => Promise.resolve(),
  });
  const mutation = () => ({ mutate: () => {}, isPending: false });
  return {
    trpc: {
      useUtils: () => ({}),
      auth: {
        me: { useQuery: () => query(null) },
        logout: { useMutation: mutation },
      },
      settings: {
        all: { useQuery: () => query([]) },
        set: { useMutation: mutation },
      },
      push: { log: { useQuery: () => query(LOG) } },
    },
  };
});

async function renderBell() {
  const { default: NotificationBell } = await import("./NotificationBell");
  return renderWithI18n(<NotificationBell />, { trpc: false });
}

describe("Benachrichtigungs-Glocke", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    localStorage.removeItem(PUSH_SEEN_KEY);
  });

  it("zeigt die Zahl der neuen Meldungen an der Glocke", async () => {
    await renderBell();
    // Ohne gemerkten Zeitpunkt sind beide neu.
    expect(
      await screen.findByRole("button", { name: /2/ })
    ).toBeInTheDocument();
  });

  it("öffnet die Liste und merkt sich, dass alles gesehen ist", async () => {
    await renderBell();
    await userEvent.click(await screen.findByRole("button", { name: /2/ }));
    expect(await screen.findByText("Neuer Zettel")).toBeInTheDocument();
    expect(screen.getByText("Sturmwarnung")).toBeInTheDocument();
    // Der jüngste Zeitpunkt der Liste, nicht «jetzt» – siehe pushInbox.ts.
    expect(localStorage.getItem(PUSH_SEEN_KEY)).toBe(
      "2026-08-07T10:00:00.000Z"
    );
  });

  it("meldet nichts Neues, wenn schon alles gesehen war", async () => {
    localStorage.setItem(PUSH_SEEN_KEY, "2026-08-07T10:00:00.000Z");
    await renderBell();
    const bell = await screen.findByRole("button");
    expect(bell.textContent).toBe("");
  });

  it("bleibt für Abgemeldete ganz weg", async () => {
    // Ohne Konto gibt es keinen Verlauf – eine Glocke, die dann ins Leere
    // zeigt, wäre ein Versprechen ohne Deckung.
    authState.isAuthenticated = false;
    await renderBell();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderBell();
    await screen.findByRole("button");
    await expectNoA11yViolations(container);
  });
});

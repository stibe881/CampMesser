import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Heimkehr-Karte (#410): erscheint nach der Abreise, führt die Schritte,
 * und der Zelt-Haken lässt sich direkt abhaken. UI-Tests rendern auf
 * Englisch.
 */
function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "trips.list": [
        {
          id: 3,
          title: "Aare weekend",
          location: null,
          spotName: null,
          startDate: "2026-01-01",
          endDate: "__END__",
          spotId: 5,
        },
      ],
      "packing.feedback.list": [],
      "spots.list": [
        {
          id: 5,
          name: "Camping Aare",
          nextTimeJson: null,
        },
      ],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1 },
    loading: false,
    logout: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
  }),
}));

async function renderCard() {
  // Das Abreisedatum muss relativ zu HEUTE liegen – die Attrappe wird
  // deshalb nach dem Laden auf «gestern» gepatcht.
  const { trpc } = await import("@/lib/trpc");
  const rows = (
    trpc as unknown as {
      trips: { list: { useQuery: () => { data: { endDate: string }[] } } };
    }
  ).trips.list.useQuery().data;
  rows[0].endDate = isoDaysAgo(1);
  const { default: HomecomingCard } = await import("./HomecomingCard");
  return renderWithI18n(<HomecomingCard />, { trpc: false });
}

describe("HomecomingCard", () => {
  beforeEach(() => {
    localStorage.removeItem("campmesser.homecomingDismissed");
    localStorage.removeItem("campmesser.reviewPromptDismissed");
    localStorage.removeItem("campmesser.homecomingTent");
  });

  it("zeigt Titel und alle drei Schritte", async () => {
    await renderCard();
    expect(
      await screen.findByText('Back from "Aare weekend"?')
    ).toBeInTheDocument();
    expect(screen.getByText("Dry the tent & tarps")).toBeInTheDocument();
    expect(screen.getByText(/Fill in the review/)).toBeInTheDocument();
    expect(screen.getByText(/Note “next time” reminders/)).toBeInTheDocument();
  });

  it("der Zelt-Schritt lässt sich abhaken und bleibt gemerkt", async () => {
    await renderCard();
    const toggle = await screen.findByRole("button", {
      name: "Mark tent drying as done",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("campmesser.homecomingTent")).toBe("[3]");
  });

  it("wegklicken gilt je Reise – die Karte verschwindet", async () => {
    await renderCard();
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Hide the homecoming reminder for this trip",
      })
    );
    expect(screen.queryByText('Back from "Aare weekend"?')).toBeNull();
    expect(localStorage.getItem("campmesser.homecomingDismissed")).toBe("[3]");
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderCard();
    await screen.findByText('Back from "Aare weekend"?');
    await expectNoA11yViolations(container);
  });
});

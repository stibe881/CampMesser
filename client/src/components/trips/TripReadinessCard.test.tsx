import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Bereitschafts-Karte (#173) mit manuellem Häkchen (#667, Nutzerwunsch
 * 10.08.2026): Wer ohne Packliste und Menüplan unterwegs ist, hakt die
 * Punkte selbst ab. Geprüft wird, WAS gespeichert wird – und dass ein
 * ohnehin erledigter Punkt kein Schalter ist (die eigenen Daten lassen
 * sich nicht von Hand verleugnen).
 */
const { doneSpy } = vi.hoisted(() => ({ doneSpy: vi.fn() }));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock(
      {
        "menu.listByTrip": { entries: [], dayNotes: [] },
        "tripShopping.listByTrip": { items: [] },
      },
      { "trips.setReadinessDone": doneSpy }
    ),
  };
});

vi.mock("@/hooks/useTripReadinessCounts", () => ({
  useTripReadinessCounts: () => undefined,
}));

const TRIP = {
  id: 7,
  startDate: "2026-08-11",
  endDate: "2026-08-12",
  packListId: null,
  spotId: 3,
  arrivalTime: "11:00",
  readinessDoneJson: null as string | null,
};

async function renderCard(readinessDoneJson: string | null = null) {
  const { default: TripReadinessCard } = await import("./TripReadinessCard");
  const view = renderWithI18n(
    <TripReadinessCard
      trip={{ ...TRIP, readinessDoneJson }}
      tripName="Huttu Berg"
      onEdit={() => {}}
    />,
    { trpc: false }
  );
  await userEvent.click(
    screen.getByRole("button", {
      name: /Show or hide readiness for Huttu Berg/i,
    })
  );
  return view;
}

describe("TripReadinessCard – manuelles Erledigt (#667)", () => {
  it("hakt einen offenen Punkt von Hand ab", async () => {
    doneSpy.mockClear();
    await renderCard();
    await userEvent.click(
      screen.getByRole("button", {
        name: /^Mark Packing list as done manually$/,
      })
    );
    expect(doneSpy).toHaveBeenCalledWith({
      tripId: 7,
      key: "packList",
      done: true,
    });
  });

  it("nimmt ein von Hand gesetztes Häkchen wieder weg", async () => {
    doneSpy.mockClear();
    await renderCard('["packList"]');
    const toggle = screen.getByRole("button", {
      name: /^Mark Packing list as open again$/,
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(toggle);
    expect(doneSpy).toHaveBeenCalledWith({
      tripId: 7,
      key: "packList",
      done: false,
    });
  });

  it("lässt aus den Daten erledigte Punkte unantastbar", async () => {
    await renderCard();
    // Zeltplatz ist verknüpft – kein Schalter, nur ein Status
    expect(screen.queryByRole("button", { name: /^Mark Pitch as/ })).toBeNull();
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = await renderCard();
    await expectNoA11yViolations(container);
  });
});

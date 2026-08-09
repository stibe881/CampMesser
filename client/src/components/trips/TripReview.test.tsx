import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Rückblick nach der Reise (#381) mit Personen-Filter und
 * Kategorien-Gruppen (Nutzerwunsch 09.08.2026, UI-Test #595): Wer den
 * eigenen Rucksack durchgeht, soll nicht durch fremde Zeilen scrollen –
 * der Filter muss also WIRKLICH ausblenden, nicht nur hübsch aussehen.
 */
vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "packing.items": {
        items: [
          {
            id: 1,
            listId: 5,
            name: "Tent",
            category: "Camp",
            assignee: null,
            checked: true,
            quantity: 1,
          },
          {
            id: 2,
            listId: 5,
            name: "Kids sleeping bag",
            category: "Sleeping",
            assignee: "Mia",
            checked: true,
            quantity: 1,
          },
        ],
      },
      "packing.feedback.list": [],
    }),
  };
});

async function renderReview() {
  const { default: TripReview } = await import("./TripReview");
  return renderWithI18n(
    <TripReview tripId={7} packListId={5} tripName="Tessin" initialOpen />,
    { trpc: false }
  );
}

describe("TripReview", () => {
  it("gruppiert nach Kategorien und zeigt die Personen-Chips", async () => {
    await renderReview();
    expect(await screen.findByText("Tent")).toBeInTheDocument();
    expect(screen.getByText("Camp")).toBeInTheDocument();
    expect(screen.getByText("Sleeping")).toBeInTheDocument();
    const filter = screen.getByRole("group", {
      name: "Filter review by person",
    });
    expect(filter).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mia" })).toBeInTheDocument();
  });

  it("blendet mit dem Personen-Filter fremde Zeilen aus", async () => {
    await renderReview();
    await screen.findByText("Tent");
    await userEvent.click(screen.getByRole("button", { name: "Mia" }));
    expect(screen.queryByText("Tent")).toBeNull();
    expect(screen.getByText("Kids sleeping bag")).toBeInTheDocument();
    // «Allgemein» zeigt nur die Einträge ohne Person
    await userEvent.click(screen.getByRole("button", { name: "General" }));
    expect(screen.getByText("Tent")).toBeInTheDocument();
    expect(screen.queryByText("Kids sleeping bag")).toBeNull();
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderReview();
    await screen.findByText("Tent");
    await expectNoA11yViolations(container);
  });
});

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import { ConfirmProvider } from "@/components/ConfirmDialog";

/**
 * Tagesplan (#666): pro Reisetag eintragen, was ansteht. Geprüft wird,
 * WAS gespeichert wird (Tag, Titel, Zeit) und dass Abhaken den richtigen
 * Eintrag trifft – die Tage kommen aus dem Reisezeitraum, nicht vom
 * Server.
 */
const { addSpy, toggleSpy } = vi.hoisted(() => ({
  addSpy: vi.fn(),
  toggleSpy: vi.fn(),
}));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock(
      {
        "trips.plan.list": [
          {
            id: 5,
            tripId: 7,
            day: "2026-08-11",
            title: "Wanderung Seealpsee",
            timeAt: "09:30",
            done: false,
            createdByUserId: 1,
            createdAt: new Date("2026-08-01T10:00:00Z"),
          },
          {
            id: 6,
            tripId: 7,
            day: "2026-08-11",
            title: "Glacé am Hafen",
            timeAt: null,
            done: true,
            createdByUserId: 1,
            createdAt: new Date("2026-08-01T10:05:00Z"),
          },
        ],
      },
      { "trips.plan.add": addSpy, "trips.plan.toggle": toggleSpy }
    ),
  };
});

async function renderPlan() {
  const { default: TripPlan } = await import("./TripPlan");
  const view = renderWithI18n(
    <ConfirmProvider>
      <TripPlan
        tripId={7}
        tripName="Appenzell"
        startDate="2026-08-10"
        endDate="2026-08-12"
        today="2026-08-11"
      />
    </ConfirmProvider>,
    { trpc: false }
  );
  // Abschnitt aufklappen – geladen wird erst dann
  await userEvent.click(
    screen.getByRole("button", { name: /day plan of Appenzell/i })
  );
  return view;
}

describe("TripPlan (#666)", () => {
  it("zeigt alle Reisetage und die Einträge mit Zeit und Fortschritt", async () => {
    await renderPlan();
    // Drei Reisetage als Überschriften, der Fortschritt zählt 1/2
    expect(screen.getByText("1/2 done")).toBeInTheDocument();
    expect(screen.getByText("Wanderung Seealpsee")).toBeInTheDocument();
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getByText("Glacé am Hafen")).toBeInTheDocument();
    // Erledigtes ist als abgehakt markiert
    expect(
      screen.getByRole("checkbox", { name: /Glacé am Hafen/ })
    ).toBeChecked();
  });

  it("speichert einen neuen Eintrag mit Tag, Titel und Zeit", async () => {
    addSpy.mockClear();
    await renderPlan();
    // Plus beim ersten Reisetag (10.08.) öffnet das Formular
    const addButtons = screen.getAllByRole("button", {
      name: /Add an entry for/i,
    });
    await userEvent.click(addButtons[0]);
    await userEvent.type(
      screen.getByPlaceholderText(/What's planned/i),
      "Zoo Zürich"
    );
    await userEvent.type(screen.getByLabelText(/Time \(optional\)/i), "10:15");
    await userEvent.click(screen.getByRole("button", { name: /^Add$/ }));
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(addSpy.mock.calls[0][0]).toMatchObject({
      tripId: 7,
      day: "2026-08-10",
      title: "Zoo Zürich",
      timeAt: "10:15",
    });
  });

  it("hakt den richtigen Eintrag ab", async () => {
    toggleSpy.mockClear();
    await renderPlan();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /Wanderung Seealpsee/ })
    );
    expect(toggleSpy).toHaveBeenCalledWith({ id: 5, done: true });
  });

  it("hat keine A11y-Verstösse", async () => {
    const { container } = await renderPlan();
    await expectNoA11yViolations(container);
  });
});

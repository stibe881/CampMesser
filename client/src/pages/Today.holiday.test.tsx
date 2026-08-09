import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Feiertags-Warnung in der «Heute»-Ansicht (#569, UI-Test #595): Ist die
 * laufende Reise im Ausland und dort Feiertag, muss die Kopfzeile es
 * sagen – Läden zu, der Einkauf will vorher erledigt sein. Das Land wird
 * aus dem Reise-Ort geraten («Italien» → IT), die Feiertage kommen über
 * trips.holidaysAbroad.
 */
// vi.hoisted: die trpc-Attrappe braucht das Datum schon beim Hochziehen
const TODAY = vi.hoisted(() => "2026-08-07");

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "trips.list": [
        {
          id: 1,
          userId: 1,
          title: "Gardasee",
          location: "Gardasee, Italien",
          kind: "camping",
          spotId: null,
          packListId: null,
          startDate: "2026-08-05",
          endDate: "2026-08-10",
          arrivalTime: null,
          departureTime: null,
          notes: null,
          rating: null,
          budgetRappen: null,
          photoFileName: null,
          reservationFileName: null,
          weatherJson: null,
          createdAt: new Date("2026-08-01T10:00:00Z"),
        },
      ],
      "trips.holidaysAbroad": [
        { date: TODAY, localName: "Ferragosto", name: "Assumption Day" },
      ],
    }),
  };
});

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, name: "Test", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("@shared/localDate", async importOriginal => {
  const actual = await importOriginal<typeof import("@shared/localDate")>();
  return { ...actual, todayIso: () => TODAY };
});

async function renderToday() {
  const { ConfirmProvider } = await import("@/components/ConfirmDialog");
  const { default: Today } = await import("./Today");
  return renderWithI18n(
    <ConfirmProvider>
      <Today />
    </ConfirmProvider>,
    { trpc: false }
  );
}

describe("Heute-Ansicht: Feiertag im Reiseland", () => {
  it("warnt mit Landesname und lokalem Feiertagsnamen", async () => {
    await renderToday();
    expect(await screen.findByText(/Ferragosto/)).toBeInTheDocument();
    expect(screen.getByText(/public holiday/)).toBeInTheDocument();
    expect(screen.getByText(/Today is a public holiday/)).toBeInTheDocument();
  });

  it("verlinkt direkt zur Einkaufsliste", async () => {
    await renderToday();
    await screen.findByText(/Ferragosto/);
    const targets = screen
      .getAllByRole("link")
      .map(link => link.getAttribute("href") ?? "");
    expect(targets).toContain("/einkauf");
  });

  it("ist barrierefrei", async () => {
    const { container } = await renderToday();
    await screen.findByText(/Ferragosto/);
    await expectNoA11yViolations(container);
  });
});

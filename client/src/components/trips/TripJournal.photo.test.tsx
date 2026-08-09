import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";

/**
 * Tages-Foto im Journal (#590, UI-Test aus #614) und archiviertes
 * Tages-Wetter (#608): Ein Eintrag mit Foto zeigt das Bild samt
 * Entfernen-Knopf, ein Eintrag ohne Foto den Kamera-Knopf – und wenn das
 * Wetterarchiv Tageszeilen trägt, steht das Wetter neben dem Datum.
 */
const { JOURNAL } = vi.hoisted(() => ({
  JOURNAL: [
    {
      id: 5,
      tripId: 1,
      day: "2026-08-05",
      text: "Regentag, Museum",
      createdByName: null,
      photoFileName: "tag-eins.jpg",
    },
    {
      id: 6,
      tripId: 1,
      day: "2026-08-06",
      text: "Sonne am See",
      createdByName: null,
      photoFileName: null,
    },
  ],
}));

vi.mock("@/lib/trpc", async () => {
  const { trpcMock } = await import("@/test/trpcMock");
  return {
    trpc: trpcMock({
      "trips.journal.list": JOURNAL,
      "trips.stops.list": [],
    }),
  };
});

async function renderJournal() {
  const { default: TripJournal } = await import("./TripJournal");
  return renderWithI18n(
    <TripJournal
      tripId={1}
      tripName="Thun"
      startDate="2026-08-05"
      endDate="2026-08-06"
      shared={false}
      weatherJson={JSON.stringify({
        tMax: 24,
        tMin: 9,
        rainDays: 1,
        totalPrecip: 12,
        days: [
          { date: "2026-08-05", tMax: 12.4, tMin: 9.1, precip: 12 },
          { date: "2026-08-06", tMax: 24.2, tMin: 14.8, precip: 0 },
        ],
      })}
    />,
    { trpc: false }
  );
}

describe("TripJournal – Tages-Foto & Tages-Wetter", () => {
  it("zeigt das Foto des Tages und den Entfernen-Knopf", async () => {
    await renderJournal();
    await userEvent.click(
      await screen.findByRole("button", { name: /Trip journal/i })
    );
    await screen.findByText("Regentag, Museum");
    const img = document.querySelector(
      'img[src="/api/trips/journal/photos/tag-eins.jpg"]'
    );
    expect(img).not.toBeNull();
    expect(screen.getByRole("button", { name: /Remove photo/i })).toBeTruthy();
    // Der Eintrag OHNE Foto bietet den Kamera-Knopf an
    expect(
      screen.getByRole("button", { name: /Add a photo of the day/i })
    ).toBeTruthy();
  });

  it("zeigt das archivierte Tages-Wetter neben dem Datum (#608)", async () => {
    await renderJournal();
    await userEvent.click(
      await screen.findByRole("button", { name: /Trip journal/i })
    );
    await screen.findByText("Regentag, Museum");
    // Gerundete Werte des Regentags: 12° / 9° und 12 mm
    expect(screen.getByText(/12° \/ 9°/)).toBeTruthy();
    expect(screen.getByText(/12 mm/)).toBeTruthy();
    // Der trockene Tag zeigt keine Millimeter
    expect(screen.getByText(/24° \/ 15°/)).toBeTruthy();
  });

  it("hat aufgeklappt keine A11y-Verstösse", async () => {
    const { container } = await renderJournal();
    await userEvent.click(
      await screen.findByRole("button", { name: /Trip journal/i })
    );
    await screen.findByText("Regentag, Museum");
    await expectNoA11yViolations(container);
  });
});

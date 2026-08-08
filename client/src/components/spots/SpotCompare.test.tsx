import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import SpotCompare, {
  type CompareSpotLike,
} from "@/components/spots/SpotCompare";

/**
 * Platz-Vergleich (#440, UI-Test #484).
 *
 * WARUM ES EINEN TEST BEKOMMT: Die Tabelle entsteht erst, wenn BEIDE
 * Seiten gewählt sind – genau dieser Aufbau (zwei Selects, dann die
 * Zeilen) ist beim Umbau am zerbrechlichsten. Und die Distanz-Zeile
 * hängt am Heim-Standort; fällt die Bedingung falsch herum, vergleicht
 * die Tabelle Distanzen, die es nicht gibt.
 */
const SPOTS: CompareSpotLike[] = [
  {
    id: 1,
    name: "Aare-Camping",
    latitude: 46.75,
    longitude: 7.62,
    elevationM: 560,
    attributesJson: null,
    pricePerNightRappen: 4500,
    extraPerNightRappen: null,
    ratingSanitary: 4,
    ratingQuiet: 4,
    ratingShade: 3,
    ratingKids: 5,
  },
  {
    id: 2,
    name: "Brienz-Camping",
    latitude: 46.76,
    longitude: 8.03,
    elevationM: null,
    attributesJson: null,
    pricePerNightRappen: 5200,
    extraPerNightRappen: null,
    ratingSanitary: null,
    ratingQuiet: null,
    ratingShade: null,
    ratingKids: null,
  },
];

const HOME = { latitude: 47.0, longitude: 7.45 };

describe("Platz-Vergleich", () => {
  it("zeigt die Tabelle erst, wenn beide Seiten gewählt sind", async () => {
    renderWithI18n(<SpotCompare spots={SPOTS} home={HOME} />);
    expect(
      await screen.findByText(
        "Pick a site on each side and the comparison appears."
      )
    ).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Site A"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Site B"), "2");
    expect(screen.getByText("Price per night")).toBeVisible();
    // Heim-Standort vorhanden → Distanz-Zeile gehört in die Tabelle
    expect(screen.getByText("Distance from home")).toBeVisible();
    expect(screen.getByText("Your rating")).toBeVisible();
    // Ohne Bewertung ehrlicher Strich statt erfundener Zahl
    expect(screen.getByText("4.0 ★ (4 criteria)")).toBeVisible();
  });

  it("lässt die Distanz-Zeile ohne Heim-Standort weg", async () => {
    renderWithI18n(<SpotCompare spots={SPOTS} home={null} />);
    await userEvent.selectOptions(await screen.findByLabelText("Site A"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Site B"), "2");
    expect(screen.getByText("Price per night")).toBeVisible();
    expect(screen.queryByText("Distance from home")).toBeNull();
  });

  it("ist barrierefrei – mit aufgebauter Tabelle", async () => {
    const { container } = renderWithI18n(
      <SpotCompare spots={SPOTS} home={HOME} />
    );
    await userEvent.selectOptions(await screen.findByLabelText("Site A"), "1");
    await userEvent.selectOptions(screen.getByLabelText("Site B"), "2");
    await expectNoA11yViolations(container);
  });
});

import { describe, expect, it } from "vitest";
import { homecomingDone, homecomingSteps } from "@shared/homecoming";

/**
 * Heimkehr-Karte (#410): drei Schritte, der Merker nur mit Platz, und
 * die Karte schweigt erst, wenn wirklich alles erledigt ist.
 */
describe("homecomingSteps", () => {
  it("führt alle drei Schritte, wenn ein Platz verknüpft ist", () => {
    const steps = homecomingSteps({
      tentDone: false,
      hasReview: false,
      spotId: 5,
      nextTimeCount: 0,
    });
    expect(steps.map(s => s.key)).toEqual(["tent", "review", "nextTime"]);
    expect(homecomingDone(steps)).toBe(false);
  });

  it("lässt den Merker-Schritt ohne Platz weg", () => {
    // Ein Schritt, der nirgends hinführt, wäre eine Aufgabe ohne Tür.
    const steps = homecomingSteps({
      tentDone: false,
      hasReview: false,
      spotId: null,
      nextTimeCount: 0,
    });
    expect(steps.map(s => s.key)).toEqual(["tent", "review"]);
  });

  it("Notizen am Platz zählen als erledigter Merker-Schritt", () => {
    const steps = homecomingSteps({
      tentDone: true,
      hasReview: true,
      spotId: 5,
      nextTimeCount: 2,
    });
    expect(homecomingDone(steps)).toBe(true);
  });

  it("ohne Platz genügen Zelt und Rückblick", () => {
    const steps = homecomingSteps({
      tentDone: true,
      hasReview: true,
      spotId: null,
      nextTimeCount: 0,
    });
    expect(homecomingDone(steps)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithI18n } from "@/test/render";
import { expectNoA11yViolations } from "@/test/a11y";
import WinterKnowledgePage from "./WinterKnowledge";
import WaterSafetyPage from "./WaterSafety";
import GrillingPage from "./Grilling";
import FireGuidePage from "./FireGuide";
import EtiquettePage from "./Etiquette";

/**
 * Die statischen Wissensseiten der Runden 51/52 (UI-Test #515):
 * Pisten & Lawinen (#472), Baderegeln (#473), Grill & Garzeiten (#502),
 * Feuer-Ratgeber (#507) und Camping-Knigge (#508).
 *
 * WARUM EIN SAMMEL-TEST: Alle fünf sind reine Daten-Seiten ohne Zustand
 * – kaputtgehen können sie nur gemeinsam (i18n-Umbau, Karten-Layout).
 * Geprüft wird pro Seite, dass sie rendert, ihr Kerninhalt da ist und
 * axe nichts findet.
 */
const PAGES = [
  {
    name: "Pisten & Lawinen",
    Component: WinterKnowledgePage,
    probe: /FIS/,
  },
  {
    name: "Baderegeln & Flaggen",
    Component: WaterSafetyPage,
    probe: /bathing rules/i,
  },
  {
    name: "Grill & Garzeiten",
    Component: GrillingPage,
    probe: /Core temperatures/,
  },
  { name: "Feuer-Ratgeber", Component: FireGuidePage, probe: /tinder/i },
  {
    name: "Camping-Knigge",
    Component: EtiquettePage,
    probe: /Quiet hours|quiet hours/,
  },
] as const;

describe("Wissensseiten", () => {
  for (const page of PAGES) {
    it(`${page.name}: rendert und ist barrierefrei`, async () => {
      const { container, unmount } = renderWithI18n(<page.Component />);
      expect((await screen.findAllByText(page.probe)).length).toBeGreaterThan(
        0
      );
      await expectNoA11yViolations(container);
      unmount();
    });
  }
});

import axe from "axe-core";
import { expect } from "vitest";

/**
 * Zugänglichkeit an der KOMPONENTE prüfen, nicht nur an drei Seiten (#341).
 *
 * WAS VORHER GEPRÜFT WURDE: `tests/a11y.spec.ts` fährt axe über Startseite,
 * Anmeldung und Erste-Hilfe – alle drei ohne Anmeldung. Der eigentliche
 * Werkzeugkasten (Reisen, Heute, Packlisten, Ämtli, Kühlbox, Karte) war
 * nie dabei. Genau dort entstehen aber die Formulare, Dialoge und Listen,
 * bei denen Beschriftungen fehlen.
 *
 * WARUM HIER UND NICHT IM BROWSER-TEST: Um eine angemeldete Seite zu
 * prüfen, bräuchte Playwright eine Datenbank, ein Konto und Testdaten –
 * viel Gerüst für einen Bereich, der ohnehin nur einmal am Ende läuft.
 * In jsdom kostet dieselbe Prüfung Millisekunden und geht bei jedem
 * Testlauf mit.
 *
 * WAS DAS NICHT ERSETZT, ehrlich gesagt: FARBKONTRASTE. Die braucht
 * echtes Layout, und jsdom rechnet keines. Dafür bleibt die
 * Playwright-Prüfung zuständig. Alles Übrige – fehlende Beschriftungen,
 * falsche Rollen, kaputte ARIA-Bezüge, doppelte Ids – findet axe auch
 * hier, und das sind die Fehler, die tatsächlich passieren.
 */
export async function expectNoA11yViolations(
  container: HTMLElement
): Promise<void> {
  const results = await axe.run(container, {
    // Kontrast braucht Layout, das jsdom nicht hat – die Regel würde
    // entweder falsch anschlagen oder gar nichts sagen.
    rules: { "color-contrast": { enabled: false } },
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
  });
  const summary = results.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    help: v.help,
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

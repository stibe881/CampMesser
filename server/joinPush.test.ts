import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import { tripJoinAlertText } from "@shared/pushTexts";

/**
 * «X ist deiner Reise beigetreten» (#376).
 *
 * WARUM ES DIESE MELDUNG GIBT: Eine Einladung geht als Link raus – per
 * Nachricht, mündlich, wie auch immer. Ob sie angenommen wurde, sah bis
 * jetzt nur, wer von sich aus den Mitreisenden-Dialog öffnete. Wer plant,
 * wartet aber genau darauf.
 *
 * WORAUF ES BEIM TEXT ANKOMMT: Person UND Reise müssen drinstehen. Wer
 * drei Reisen offen hat, kann mit «Jemand ist beigetreten» nichts
 * anfangen – und eine Meldung, die zum Nachschauen zwingt, hätte man
 * sich sparen können.
 */
describe("Beitritts-Meldung", () => {
  it("nennt Person und Reise", () => {
    const alert = tripJoinAlertText(
      { person: "Ruth", tripName: "Lugano" },
      "de"
    );
    expect(alert.title).toContain("Ruth");
    expect(alert.body).toContain("Ruth");
    expect(alert.body).toContain("Lugano");
  });

  it("gibt es in allen vier Sprachen, und sie sind verschieden", () => {
    const bodies = LANGUAGES.map(
      lang =>
        tripJoinAlertText({ person: "Ruth", tripName: "Lugano" }, lang).body
    );
    // Jede Sprache nennt beides …
    bodies.forEach(body => {
      expect(body).toContain("Ruth");
      expect(body).toContain("Lugano");
    });
    // … und keine ist eine Kopie der deutschen (vergessene Übersetzung).
    expect(new Set(bodies).size).toBe(LANGUAGES.length);
  });

  it("verträgt einen Namen, den es nicht gibt", () => {
    // `getUserDisplayNames` liefert «?», wenn ein Konto keinen Namen hat –
    // die Meldung muss trotzdem lesbar bleiben.
    const alert = tripJoinAlertText({ person: "?", tripName: "Lugano" }, "de");
    expect(alert.body).toContain("Lugano");
    expect(alert.title.length).toBeGreaterThan(2);
  });
});

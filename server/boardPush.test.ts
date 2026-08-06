import { describe, expect, it } from "vitest";
import { boardAlertText } from "@shared/pushTexts";

/**
 * Die Push-Meldung zu einem neuen Pinnwand-Zettel (#367).
 *
 * WORAUF ES ANKOMMT: Der Text muss AM SPERRBILDSCHIRM etwas sagen. Eine
 * Meldung «Neuer Eintrag an der Pinnwand» zwingt zum Nachschauen und ist
 * damit so gut wie keine – wer am Feuer sitzt, soll lesen können, worum
 * es geht, und selbst entscheiden, ob es warten kann.
 */
describe("Pinnwand-Meldung", () => {
  it("nennt Person und Reise, und der Text steht drin", () => {
    const alert = boardAlertText(
      {
        author: "Ruth",
        tripName: "Lugano",
        text: "Brot ist alle",
        isTask: false,
      },
      "de"
    );
    expect(alert.title).toContain("Ruth");
    expect(alert.body).toContain("Lugano");
    expect(alert.body).toContain("Brot ist alle");
  });

  it("eine Aufgabe heisst anders als eine Nachricht", () => {
    const base = { author: "Ruth", tripName: "Lugano", text: "Holz holen" };
    const task = boardAlertText({ ...base, isTask: true }, "de");
    const message = boardAlertText({ ...base, isTask: false }, "de");
    expect(task.title).not.toBe(message.title);
    expect(task.title).toContain("Aufgabe");
  });

  it("übersetzt den Titel, nicht aber den geschriebenen Text", () => {
    // Der Zettel ist so geschrieben worden – übersetzen wäre gelogen.
    const alert = boardAlertText(
      {
        author: "Ruth",
        tripName: "Lugano",
        text: "Brot ist alle",
        isTask: false,
      },
      "fr"
    );
    expect(alert.title).toContain("tableau");
    expect(alert.body).toContain("Brot ist alle");
  });
});

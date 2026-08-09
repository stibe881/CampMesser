import { describe, expect, it } from "vitest";
import {
  cleanFeedbackName,
  isFeedbackKind,
  MIN_UNUSED_HINTS,
  missingSuggestions,
  summarizeFeedback,
  unusedHints,
  type FeedbackRow,
} from "@shared/packFeedback";

/**
 * Der Rückblick nach der Reise (#381).
 *
 * WORAUF ES ANKOMMT: Die Rückmeldung darf NICHT beim ersten Mal
 * zuschlagen. Die Sonnencreme, die im verregneten Juli im Sack blieb,
 * kommt nächstes Jahr wieder mit – ein Hinweis darauf wäre falsch und
 * würde dazu führen, dass man die Hinweise abschaltet. Genau diese
 * Zurückhaltung lässt sich am Bildschirm nicht prüfen: Dafür bräuchte
 * man zwei Reisen und ein Jahr Geduld.
 */
const rows = (...entries: FeedbackRow[]) => entries;

describe("Zusammenzählen", () => {
  it("zählt je Gegenstand und je REISE", () => {
    // Derselbe Gegenstand zweimal auf DERSELBEN Reise ist eine
    // Erfahrung, nicht zwei – wie beim Packvorschlag (#277).
    const summary = summarizeFeedback(
      rows(
        { tripId: 1, kind: "unused", name: "Rechaud" },
        { tripId: 1, kind: "unused", name: "rechaud " },
        { tripId: 2, kind: "unused", name: "Rechaud" }
      )
    );
    expect(summary.get("rechaud")?.unusedTrips).toBe(2);
  });

  it("hält «nicht gebraucht» und «hat gefehlt» auseinander", () => {
    const summary = summarizeFeedback(
      rows(
        { tripId: 1, kind: "unused", name: "Regenhose" },
        { tripId: 2, kind: "missing", name: "Regenhose" }
      )
    );
    expect(summary.get("regenhose")).toEqual({
      label: "Regenhose",
      unusedTrips: 1,
      missingTrips: 1,
      category: null,
      person: null,
    });
  });

  it("die zuletzt gesehene Schreibweise gewinnt", () => {
    const summary = summarizeFeedback(
      rows(
        { tripId: 1, kind: "missing", name: "waescheklammern" },
        { tripId: 2, kind: "missing", name: "Wäscheklammern" }
      )
    );
    // Die Umlaut-Faltung aus #277: «ä» wird zu «ae», beide Zeilen
    // landen also im selben Eintrag.
    expect(summary.get("waescheklammern")?.label).toBe("Wäscheklammern");
  });

  it("übergeht leere Namen, statt sie zu zählen", () => {
    const summary = summarizeFeedback(
      rows({ tripId: 1, kind: "unused", name: "   " })
    );
    expect(summary.size).toBe(0);
  });
});

describe("Nicht Gebrauchtes", () => {
  const list = [{ name: "Rechaud" }, { name: "Zelt" }];

  it("meldet sich NICHT beim ersten Mal", () => {
    const summary = summarizeFeedback(
      rows({ tripId: 1, kind: "unused", name: "Rechaud" })
    );
    expect(unusedHints(list, summary)).toEqual([]);
  });

  it("ab dem zweiten Mal ist es ein Muster", () => {
    const summary = summarizeFeedback(
      rows(
        { tripId: 1, kind: "unused", name: "Rechaud" },
        { tripId: 2, kind: "unused", name: "Rechaud" }
      )
    );
    expect(unusedHints(list, summary)).toEqual([
      { name: "Rechaud", unusedTrips: MIN_UNUSED_HINTS },
    ]);
  });

  it("das Häufigste zuerst", () => {
    const summary = summarizeFeedback(
      rows(
        { tripId: 1, kind: "unused", name: "Rechaud" },
        { tripId: 2, kind: "unused", name: "Rechaud" },
        { tripId: 3, kind: "unused", name: "Rechaud" },
        { tripId: 1, kind: "unused", name: "Zelt" },
        { tripId: 2, kind: "unused", name: "Zelt" }
      )
    );
    expect(unusedHints(list, summary).map(h => h.name)).toEqual([
      "Rechaud",
      "Zelt",
    ]);
  });

  it("was nicht auf der Liste steht, kann auch nicht auffallen", () => {
    const summary = summarizeFeedback(
      rows(
        { tripId: 1, kind: "unused", name: "Gitarre" },
        { tripId: 2, kind: "unused", name: "Gitarre" }
      )
    );
    expect(unusedHints(list, summary)).toEqual([]);
  });
});

describe("Gefehltes", () => {
  it("reicht die Kategorie an den Vorschlag weiter", () => {
    const summary = summarizeFeedback([
      { tripId: 1, kind: "missing", name: "Wäscheklammern", category: null },
      { tripId: 2, kind: "missing", name: "Wäscheklammern", category: "Küche" },
    ]);
    const suggestions = missingSuggestions([], summary);
    expect(suggestions).toEqual([
      {
        name: "Wäscheklammern",
        missingTrips: 2,
        category: "Küche",
        person: null,
      },
    ]);
  });

  it("reicht die Person an den Vorschlag weiter (Nutzerwunsch 09.08.2026)", () => {
    const summary = summarizeFeedback([
      { tripId: 1, kind: "missing", name: "Badehose", person: "Luca" },
      { tripId: 2, kind: "unused", name: "Regenhose", person: "Mia" },
    ]);
    expect(missingSuggestions([], summary)).toEqual([
      { name: "Badehose", missingTrips: 1, category: null, person: "Luca" },
    ]);
    expect(summary.get("regenhose")?.person).toBe("Mia");
  });

  it("reicht EINMAL – Vergessen ist teurer als ein zweiter Blick", () => {
    const summary = summarizeFeedback(
      rows({ tripId: 1, kind: "missing", name: "Wäscheklammern" })
    );
    expect(missingSuggestions([{ name: "Zelt" }], summary)).toEqual([
      {
        name: "Wäscheklammern",
        missingTrips: 1,
        category: null,
        person: null,
      },
    ]);
  });

  it("wird nicht vorgeschlagen, wenn es schon auf der Liste steht", () => {
    const summary = summarizeFeedback(
      rows({ tripId: 1, kind: "missing", name: "Wäscheklammern" })
    );
    expect(missingSuggestions([{ name: "wäscheklammern " }], summary)).toEqual(
      []
    );
  });

  it("was öfter gefehlt hat, steht oben", () => {
    const summary = summarizeFeedback(
      rows(
        { tripId: 1, kind: "missing", name: "Klammern" },
        { tripId: 2, kind: "missing", name: "Klammern" },
        { tripId: 1, kind: "missing", name: "Zündhölzer" }
      )
    );
    expect(missingSuggestions([], summary).map(s => s.name)).toEqual([
      "Klammern",
      "Zündhölzer",
    ]);
  });
});

describe("Eingaben säubern", () => {
  it("kürzt und normalisiert Leerzeichen", () => {
    expect(cleanFeedbackName("  zwei   Wörter ")).toBe("zwei Wörter");
    expect(cleanFeedbackName("x".repeat(300)).length).toBe(160);
  });

  it("kennt nur die zwei erlaubten Arten", () => {
    expect(isFeedbackKind("unused")).toBe(true);
    expect(isFeedbackKind("missing")).toBe(true);
    expect(isFeedbackKind("kaputt")).toBe(false);
    expect(isFeedbackKind(null)).toBe(false);
  });
});

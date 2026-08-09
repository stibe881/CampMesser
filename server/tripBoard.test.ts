import { describe, expect, it } from "vitest";
import {
  TRIP_BOARD_KINDS,
  TRIP_BOARD_KIND_LABELS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  canRemoveTripBoardEntry,
  isTripBoardDone,
  isValidTripBoardText,
  normalizeTripBoardKind,
  normalizeTripBoardText,
  sortTripBoardEntries,
  tripBoardCounts,
} from "@shared/tripBoard";
import { LANGUAGES } from "@shared/i18n";

/** Kurzform für Sortier- und Zähl-Tests. */
function entry(
  id: number,
  createdAt: string,
  kind: "message" | "task" = "message",
  done = false
) {
  return { id, createdAt, kind, done };
}

describe("normalizeTripBoardKind", () => {
  it("lässt bekannte Arten durch", () => {
    expect(normalizeTripBoardKind("message")).toBe("message");
    expect(normalizeTripBoardKind("task")).toBe("task");
  });

  it("führt Unbekanntes auf «message» zurück", () => {
    expect(normalizeTripBoardKind("Aufgabe")).toBe("message");
    expect(normalizeTripBoardKind("")).toBe("message");
    expect(normalizeTripBoardKind(null)).toBe("message");
    expect(normalizeTripBoardKind(undefined)).toBe("message");
    expect(normalizeTripBoardKind(42)).toBe("message");
  });

  it("hat für jede Art ein Label in allen vier Sprachen", () => {
    TRIP_BOARD_KINDS.forEach(kind => {
      LANGUAGES.forEach(lang => {
        expect(TRIP_BOARD_KIND_LABELS[kind][lang].length).toBeGreaterThan(0);
      });
    });
  });
});

describe("normalizeTripBoardText", () => {
  it("entfernt Leerraum am Rand", () => {
    expect(normalizeTripBoardText("  Bringe Holzkohle mit  ")).toBe(
      "Bringe Holzkohle mit"
    );
  });

  it("vereinheitlicht Zeilenenden", () => {
    expect(normalizeTripBoardText("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("zieht mehr als zwei Leerzeilen zusammen", () => {
    expect(normalizeTripBoardText("oben\n\n\n\n\nunten")).toBe("oben\n\nunten");
    // Genau eine Leerzeile bleibt erhalten
    expect(normalizeTripBoardText("oben\n\nunten")).toBe("oben\n\nunten");
  });

  it("kürzt auf die Datenbank-Länge", () => {
    const long = "x".repeat(TRIP_BOARD_TEXT_MAX_LENGTH + 50);
    expect(normalizeTripBoardText(long).length).toBe(
      TRIP_BOARD_TEXT_MAX_LENGTH
    );
  });

  it("schneidet nur zwischen ganzen Code Points", () => {
    // Ein Emoji besteht aus zwei UTF-16-Einheiten – es darf nicht halbiert
    // werden, sonst entsteht ein defektes Ersatzzeichen.
    const text = "a".repeat(TRIP_BOARD_TEXT_MAX_LENGTH - 1) + "🔥b";
    const cut = normalizeTripBoardText(text);
    expect(Array.from(cut).length).toBe(TRIP_BOARD_TEXT_MAX_LENGTH);
    expect(cut.endsWith("🔥")).toBe(true);
    expect(cut.includes("�")).toBe(false);
  });

  it("macht aus reinem Leerraum einen leeren Text", () => {
    expect(normalizeTripBoardText("   \n\n  ")).toBe("");
  });
});

describe("isValidTripBoardText", () => {
  it("verlangt sichtbaren Inhalt", () => {
    expect(isValidTripBoardText("Treffen um 18 Uhr")).toBe(true);
    expect(isValidTripBoardText("  ")).toBe(false);
    expect(isValidTripBoardText("")).toBe(false);
    expect(isValidTripBoardText("\n\n")).toBe(false);
  });
});

describe("isTripBoardDone", () => {
  it("gilt nur für abgehakte Aufgaben", () => {
    expect(isTripBoardDone(entry(1, "2026-08-03", "task", true))).toBe(true);
    expect(isTripBoardDone(entry(1, "2026-08-03", "task", false))).toBe(false);
  });

  it("ignoriert ein done-Flag an einer Nachricht", () => {
    expect(isTripBoardDone(entry(1, "2026-08-03", "message", true))).toBe(
      false
    );
  });
});

describe("sortTripBoardEntries", () => {
  it("stellt die neusten Zettel zuoberst", () => {
    const sorted = sortTripBoardEntries([
      entry(1, "2026-08-01T10:00:00Z"),
      entry(2, "2026-08-03T10:00:00Z"),
      entry(3, "2026-08-02T10:00:00Z"),
    ]);
    expect(sorted.map(e => e.id)).toEqual([2, 3, 1]);
  });

  it("schiebt erledigte Aufgaben ans Ende, auch wenn sie neu sind", () => {
    const sorted = sortTripBoardEntries([
      entry(1, "2026-08-03T12:00:00Z", "task", true),
      entry(2, "2026-08-01T10:00:00Z", "message"),
      entry(3, "2026-08-02T10:00:00Z", "task", false),
    ]);
    expect(sorted.map(e => e.id)).toEqual([3, 2, 1]);
  });

  it("entscheidet bei gleichem Zeitstempel über die höhere Id", () => {
    const sorted = sortTripBoardEntries([
      entry(7, "2026-08-03T10:00:00Z"),
      entry(9, "2026-08-03T10:00:00Z"),
      entry(8, "2026-08-03T10:00:00Z"),
    ]);
    expect(sorted.map(e => e.id)).toEqual([9, 8, 7]);
  });

  it("behandelt kaputte Zeitstempel als uralt", () => {
    const sorted = sortTripBoardEntries([
      entry(1, "irgendwann"),
      entry(2, "2026-08-01T10:00:00Z"),
    ]);
    expect(sorted.map(e => e.id)).toEqual([2, 1]);
  });

  it("lässt die Eingabe unangetastet", () => {
    const input = [
      entry(1, "2026-08-01T10:00:00Z"),
      entry(2, "2026-08-03T10:00:00Z"),
    ];
    sortTripBoardEntries(input);
    expect(input.map(e => e.id)).toEqual([1, 2]);
  });

  it("kommt mit Date-Objekten genauso zurecht wie mit Strings", () => {
    const sorted = sortTripBoardEntries([
      { id: 1, kind: "message", done: false, createdAt: new Date(1000) },
      { id: 2, kind: "message", done: false, createdAt: new Date(5000) },
    ]);
    expect(sorted.map(e => e.id)).toEqual([2, 1]);
  });

  it("liefert bei leerer Pinnwand eine leere Liste", () => {
    expect(sortTripBoardEntries([])).toEqual([]);
  });
});

describe("tripBoardCounts", () => {
  it("zählt Nachrichten, offene und erledigte Aufgaben getrennt", () => {
    expect(
      tripBoardCounts([
        entry(1, "2026-08-01T10:00:00Z", "message"),
        entry(2, "2026-08-01T10:00:00Z", "message"),
        entry(3, "2026-08-01T10:00:00Z", "task", false),
        entry(4, "2026-08-01T10:00:00Z", "task", true),
        entry(5, "2026-08-01T10:00:00Z", "task", true),
      ])
    ).toEqual({ messages: 2, openTasks: 1, doneTasks: 2 });
  });

  it("zählt unbekannte Arten als Nachricht", () => {
    expect(tripBoardCounts([{ kind: "quatsch", done: true }])).toEqual({
      messages: 1,
      openTasks: 0,
      doneTasks: 0,
    });
  });

  it("liefert für eine leere Pinnwand lauter Nullen", () => {
    expect(tripBoardCounts([])).toEqual({
      messages: 0,
      openTasks: 0,
      doneTasks: 0,
    });
  });
});

describe("canRemoveTripBoardEntry", () => {
  it("erlaubt es dem Urheber", () => {
    expect(canRemoveTripBoardEntry(5, 1, 5)).toBe(true);
  });

  it("erlaubt es der Besitzerin/dem Besitzer der Reise", () => {
    expect(canRemoveTripBoardEntry(5, 1, 1)).toBe(true);
  });

  it("verbietet es anderen Mitreisenden", () => {
    expect(canRemoveTripBoardEntry(5, 1, 9)).toBe(false);
  });

  it("erlaubt es, wenn Urheber und Besitzer dieselbe Person sind", () => {
    expect(canRemoveTripBoardEntry(3, 3, 3)).toBe(true);
  });
});

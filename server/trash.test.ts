import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@shared/i18n";
import {
  MAX_LABEL_LENGTH,
  RETENTION_DAYS,
  TRASH_KINDS,
  TRASH_KIND_LABELS,
  countByKind,
  daysLeft,
  expiredEntries,
  expiresAt,
  isExpired,
  isTrashKind,
  trimLabel,
  visibleTrash,
  type TrashEntryLike,
} from "@shared/trash";

const DAY = 86400000;
const NOW = new Date("2026-08-04T12:00:00Z").getTime();

const entry = (
  id: number,
  kind: string,
  agoDays: number,
  label = `Eintrag ${id}`
): TrashEntryLike => ({
  id,
  kind,
  label,
  detail: null,
  deletedAt: new Date(NOW - agoDays * DAY),
});

describe("Papierkorb", () => {
  it("hebt Gelöschtes 30 Tage auf", () => {
    expect(RETENTION_DAYS).toBe(30);
    expect(expiresAt(NOW)).toBe(NOW + 30 * DAY);
  });

  it("zählt die verbleibenden Tage aufgerundet", () => {
    // «Noch 1 Tag» soll bis zur letzten Stunde stehen bleiben
    expect(daysLeft(NOW, NOW)).toBe(30);
    expect(daysLeft(NOW - 29 * DAY, NOW)).toBe(1);
    expect(daysLeft(NOW - 29.5 * DAY, NOW)).toBe(1);
    expect(daysLeft(NOW - 30 * DAY, NOW)).toBe(0);
    expect(daysLeft(NOW - 40 * DAY, NOW)).toBe(0);
  });

  it("erklärt einen Eintrag ab dem 30. Tag für abgelaufen", () => {
    expect(isExpired(NOW - 29 * DAY, NOW)).toBe(false);
    expect(isExpired(NOW - 30 * DAY, NOW)).toBe(true);
  });

  it("zeigt abgelaufene Einträge nicht mehr an", () => {
    // Ein Eintrag mit «noch 0 Tage», der sich nicht wiederherstellen lässt,
    // wäre ein Versprechen, das die App nicht hält
    const visible = visibleTrash(
      [entry(1, "trip", 5), entry(2, "note", 31), entry(3, "spot", 30)],
      NOW
    );
    expect(visible.map(e => e.id)).toEqual([1]);
  });

  it("stellt das zuletzt Gelöschte zuoberst", () => {
    const visible = visibleTrash(
      [entry(1, "trip", 10), entry(2, "note", 1), entry(3, "spot", 5)],
      NOW
    );
    expect(visible.map(e => e.id)).toEqual([2, 3, 1]);
  });

  it("kommt mit ISO-Strings statt Date-Objekten zurecht", () => {
    const iso: TrashEntryLike = {
      id: 9,
      kind: "note",
      label: "x",
      detail: null,
      deletedAt: new Date(NOW - DAY).toISOString(),
    };
    expect(visibleTrash([iso], NOW)).toHaveLength(1);
    expect(daysLeft(iso.deletedAt, NOW)).toBe(29);
  });

  it("zählt nur Sichtbares je Art", () => {
    const counts = countByKind(
      [
        entry(1, "trip", 1),
        entry(2, "trip", 2),
        entry(3, "note", 3),
        entry(4, "note", 44),
      ],
      NOW
    );
    expect(counts).toEqual({ trip: 2, note: 1 });
  });

  it("gibt dem Aufräum-Job genau die Einträge, die die Ansicht verbirgt", () => {
    const all = [
      entry(1, "trip", 5),
      entry(2, "note", 31),
      entry(3, "spot", 30),
    ];
    const visible = visibleTrash(all, NOW).map(e => e.id);
    const expired = expiredEntries(all, NOW).map(e => e.id);
    expect(expired).toEqual([2, 3]);
    // Keine Überschneidung und zusammen alles – nichts fällt zwischen Stuhl und Bank
    expect(visible.concat(expired).sort()).toEqual([1, 2, 3]);
  });

  it("kennt jede Art und weist Fremdes ab", () => {
    TRASH_KINDS.forEach(kind => expect(isTrashKind(kind)).toBe(true));
    expect(isTrashKind("kaffeemaschine")).toBe(false);
  });

  it("benennt jede Art in allen vier Sprachen", () => {
    TRASH_KINDS.forEach(kind => {
      LANGUAGES.forEach(lang =>
        expect(
          TRASH_KIND_LABELS[kind][lang]?.trim().length,
          kind
        ).toBeGreaterThan(0)
      );
    });
  });

  describe("Beschriftung", () => {
    it("nimmt den Namen, wenn es einen gibt", () => {
      expect(trimLabel("  Camping Sarnen ", "ohne Namen")).toBe(
        "Camping Sarnen"
      );
    });

    it("fällt auf den Ersatztext zurück", () => {
      expect(trimLabel("   ", "Ohne Titel")).toBe("Ohne Titel");
      expect(trimLabel("", "Ohne Titel")).toBe("Ohne Titel");
    });

    it("kürzt lange Texte", () => {
      const long = "a".repeat(500);
      const label = trimLabel(long, "x");
      expect(label).toHaveLength(MAX_LABEL_LENGTH);
      expect(label.endsWith("…")).toBe(true);
    });

    it("macht aus Zeilenumbrüchen eine Zeile", () => {
      // Eine Notiz ohne Titel trägt ihren Text als Beschriftung
      expect(trimLabel("Erste Zeile\nzweite  Zeile", "x")).toBe(
        "Erste Zeile zweite Zeile"
      );
    });
  });
});

/**
 * Der Schnappschuss geht durch JSON, und dabei werden aus Zeitstempeln
 * Strings. Beim Wiederherstellen müssen genau die richtigen Felder wieder
 * zu Date-Objekten werden – und die anderen eben nicht. Diese Tests
 * brauchen keine Datenbank; den vollen Umlauf prüft
 * server/dbIntegration.test.ts gegen echtes MySQL.
 */
describe("Wiederherstellen: Werte aus dem JSON", () => {
  it("macht aus Zeitstempeln wieder Date-Objekte", async () => {
    const { reviveRow } = await import("./trash");
    const { userNotes } = await import("../drizzle/schema");
    const row = reviveRow(userNotes, {
      id: 7,
      userId: 1,
      title: "Notiz",
      text: "Text",
      tags: "",
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-02T11:30:00.000Z",
    });
    expect(row.createdAt).toBeInstanceOf(Date);
    expect((row.createdAt as Date).toISOString()).toBe(
      "2026-08-01T10:00:00.000Z"
    );
    expect(row.updatedAt).toBeInstanceOf(Date);
    // Die Id bleibt, wie sie war – daran hängen geteilte Links
    expect(row.id).toBe(7);
  });

  it("lässt Datums-Spalten im String-Modus in Ruhe", async () => {
    // tripLogs.startDate ist ein reines Datum («2026-07-01») und kein
    // Zeitstempel – ein Date-Objekt daraus wäre falsch
    const { reviveRow } = await import("./trash");
    const { tripLogs } = await import("../drizzle/schema");
    const row = reviveRow(tripLogs, {
      id: 3,
      userId: 1,
      startDate: "2026-07-01",
      endDate: "2026-07-08",
      createdAt: "2026-06-01T08:00:00.000Z",
    });
    expect(row.startDate).toBe("2026-07-01");
    expect(row.endDate).toBe("2026-07-08");
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("fasst Textfelder nicht an, auch wenn Datum drinsteht", async () => {
    const { reviveRow } = await import("./trash");
    const { userNotes } = await import("../drizzle/schema");
    const row = reviveRow(userNotes, {
      id: 1,
      userId: 1,
      title: "2026-08-01T10:00:00.000Z",
      text: "Abfahrt 2026-08-01T10:00:00.000Z",
      tags: "",
    });
    expect(row.title).toBe("2026-08-01T10:00:00.000Z");
    expect(typeof row.text).toBe("string");
  });

  it("liest die Dateiliste und wirft Unsinn weg", async () => {
    const { parseFiles } = await import("./trash");
    expect(
      parseFiles('[{"storage":"trips","fileName":"a.webp"},{"storage":1}]')
    ).toEqual([{ storage: "trips", fileName: "a.webp" }]);
    expect(parseFiles("kein json")).toEqual([]);
    expect(parseFiles("{}")).toEqual([]);
  });
});

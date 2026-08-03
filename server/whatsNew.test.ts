import { describe, expect, it } from "vitest";
import { latestBlockId, unseenBlocks } from "../client/src/lib/whatsNew";
import { changelog, type ChangelogBlock } from "../client/src/data/changelog";

/** Testdaten: drei Blöcke, neuester zuoberst (wie die echte Liste). */
const blocks: ChangelogBlock[] = [
  { id: "2026-08-03.1", date: "2026-08-03", entries: [] },
  { id: "2026-07-20.2", date: "2026-07-20", entries: [] },
  { id: "2026-07-20.1", date: "2026-07-20", entries: [] },
];

describe("latestBlockId", () => {
  it("liefert die Id des obersten (neuesten) Blocks", () => {
    expect(latestBlockId(blocks)).toBe("2026-08-03.1");
  });

  it("liefert null bei leerer Liste", () => {
    expect(latestBlockId([])).toBeNull();
  });
});

describe("unseenBlocks", () => {
  it("Erstbesuch (null) zeigt bewusst NICHTS – keine alte Historie", () => {
    expect(unseenBlocks(blocks, null)).toEqual([]);
  });

  it("neueste Id gesehen → nichts Neues", () => {
    expect(unseenBlocks(blocks, "2026-08-03.1")).toEqual([]);
  });

  it("ältere Id gesehen → alle neueren Blöcke, neuester zuerst", () => {
    expect(unseenBlocks(blocks, "2026-07-20.1")).toEqual([
      blocks[0],
      blocks[1],
    ]);
  });

  it("mittlere Id gesehen → nur der neueste Block", () => {
    expect(unseenBlocks(blocks, "2026-07-20.2")).toEqual([blocks[0]]);
  });

  it("unbekannte Id fällt auf den aufsteigenden Id-Vergleich zurück", () => {
    // Block wurde z. B. aufgeräumt: alles Neuere trotzdem zeigen …
    expect(unseenBlocks(blocks, "2026-07-01.1")).toEqual(blocks);
    // … und eine Id aus der Zukunft (Rollback) zeigt nichts doppelt
    expect(unseenBlocks(blocks, "2026-09-01.1")).toEqual([]);
  });

  it("leere Liste bleibt leer", () => {
    expect(unseenBlocks([], "2026-08-03.1")).toEqual([]);
  });
});

describe("changelog-Daten", () => {
  it("Blöcke sind neuester-zuoberst und Ids beginnen mit dem ISO-Datum", () => {
    for (const block of changelog) {
      expect(block.id.startsWith(block.date)).toBe(true);
      expect(block.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(block.entries.length).toBeGreaterThan(0);
    }
    const ids = changelog.map(block => block.id);
    const sorted = [...ids].sort((a, b) => b.localeCompare(a));
    expect(ids).toEqual(sorted);
  });
});

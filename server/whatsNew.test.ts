import { describe, expect, it } from "vitest";
import {
  blocksToShowOnStartup,
  CHANGELOG_SEEN_KEY,
  hasExistingAppData,
  latestBlockId,
  unseenBlocks,
} from "../client/src/lib/whatsNew";
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

describe("hasExistingAppData / blocksToShowOnStartup", () => {
  const blocks = [
    { id: "2026-08-03.1", date: "2026-08-03", entries: [] },
    { id: "2026-07-01.1", date: "2026-07-01", entries: [] },
  ];

  it("erkennt eine bestehende Installation an anderen App-Schlüsseln", () => {
    expect(hasExistingAppData(["campmesser.language"])).toBe(true);
    expect(hasExistingAppData(["campmesser.recentModules", "theme"])).toBe(
      true
    );
  });

  it("wertet den Gesehen-Marker allein NICHT als bestehende Installation", () => {
    expect(hasExistingAppData([CHANGELOG_SEEN_KEY])).toBe(false);
    expect(hasExistingAppData([])).toBe(false);
    expect(hasExistingAppData(["fremd.key"])).toBe(false);
  });

  it("zeigt bestehenden Installationen ohne Marker den neuesten Block", () => {
    expect(blocksToShowOnStartup(blocks, null, true)).toEqual([blocks[0]]);
  });

  it("zeigt echten Erstbesuchern nichts", () => {
    expect(blocksToShowOnStartup(blocks, null, false)).toEqual([]);
  });

  it("nutzt mit Marker weiterhin die ungesehenen Blöcke", () => {
    expect(blocksToShowOnStartup(blocks, "2026-07-01.1", true)).toEqual([
      blocks[0],
    ]);
    expect(blocksToShowOnStartup(blocks, "2026-08-03.1", true)).toEqual([]);
  });
});

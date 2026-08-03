import { describe, expect, it } from "vitest";
import {
  collectionProgress,
  type CollectionSighting,
} from "../client/src/lib/natureCollection";
import { natureEntries } from "../client/src/data/nature";
import { l4 } from "@shared/i18n";
import type { NatureEntry } from "../client/src/data/nature";

/** Minimaler Test-Eintrag – nur die Felder, die das Album braucht. */
function entry(id: string): NatureEntry {
  return {
    id,
    name: l4(id, id, id, id),
    category: "tierspuren",
    description: l4("", "", "", ""),
    funFact: l4("", "", "", ""),
    kidQuestion: l4("", "", "", ""),
    features: [],
  };
}

const sighting = (
  entryId: string | null,
  sightedAt: string
): CollectionSighting => ({ entryId, sightedAt });

describe("collectionProgress", () => {
  it("zählt beobachtete Arten und behält die Lexikon-Reihenfolge", () => {
    const entries = [entry("a"), entry("b"), entry("c")];
    const result = collectionProgress(entries, [
      sighting("a", "2026-07-01"),
      sighting("c", "2026-08-02"),
    ]);
    expect(result.total).toBe(3);
    expect(result.seenCount).toBe(2);
    expect(result.ratio).toBeCloseTo(2 / 3);
    expect(result.items.map(i => i.entry.id)).toEqual(["a", "b", "c"]);
    expect(result.items.map(i => i.firstSeen)).toEqual([
      "2026-07-01",
      null,
      "2026-08-02",
    ]);
  });

  it("nimmt bei mehreren Sichtungen die früheste – unabhängig von der Reihenfolge", () => {
    const result = collectionProgress(
      [entry("a")],
      [
        sighting("a", "2026-08-20"),
        sighting("a", "2025-05-04"),
        sighting("a", "2026-01-11"),
      ]
    );
    expect(result.items[0].firstSeen).toBe("2025-05-04");
    expect(result.items[0].count).toBe(3);
    expect(result.seenCount).toBe(1);
  });

  it("ignoriert Beobachtungen ohne oder mit unbekannter Verknüpfung", () => {
    const result = collectionProgress(
      [entry("a"), entry("b")],
      [
        sighting(null, "2026-07-01"),
        sighting("gibtsnicht", "2026-07-02"),
        sighting("b", "2026-07-03"),
      ]
    );
    expect(result.seenCount).toBe(1);
    expect(result.items[0].count).toBe(0);
    expect(result.items[1].firstSeen).toBe("2026-07-03");
  });

  it("kommt ohne Beobachtungen und ohne Einträge klar", () => {
    const empty = collectionProgress([entry("a")], []);
    expect(empty.seenCount).toBe(0);
    expect(empty.ratio).toBe(0);
    expect(empty.items[0].firstSeen).toBeNull();

    const nothing = collectionProgress([], [sighting("a", "2026-07-01")]);
    expect(nothing).toEqual({ items: [], seenCount: 0, total: 0, ratio: 0 });
  });

  it("arbeitet mit dem echten Lexikon", () => {
    const result = collectionProgress(natureEntries, [
      sighting("reh", "2026-06-01"),
      sighting("fuchs", "2026-06-02"),
    ]);
    expect(result.total).toBe(natureEntries.length);
    expect(result.seenCount).toBe(2);
    expect(result.items.find(i => i.entry.id === "reh")?.firstSeen).toBe(
      "2026-06-01"
    );
    expect(
      result.items.find(i => i.entry.id === "birke")?.firstSeen
    ).toBeNull();
  });
});

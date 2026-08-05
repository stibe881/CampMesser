import { describe, expect, it } from "vitest";
import {
  mergeToggle,
  toggleId,
  QUEUE_LIMIT,
  type QueuedToggle,
} from "../client/src/lib/offlineQueue";

/** Kurzform für einen Warteschlangen-Eintrag in den Tests. */
function entry(
  kind: "packing" | "shopping",
  itemId: number,
  checked: boolean,
  at: number
): QueuedToggle {
  return { id: toggleId(kind, itemId), kind, itemId, checked, at, tries: 0 };
}

describe("mergeToggle", () => {
  it("nimmt einen neuen Eintrag auf", () => {
    const queue = mergeToggle([], entry("packing", 1, true, 1000));
    expect(queue).toHaveLength(1);
    expect(queue[0].itemId).toBe(1);
    expect(queue[0].checked).toBe(true);
  });

  it("ersetzt denselben Eintrag statt ihn zu doppeln", () => {
    // Dreimal hin und her tippen darf nicht drei Anfragen ergeben.
    let queue = mergeToggle([], entry("packing", 1, true, 1000));
    queue = mergeToggle(queue, entry("packing", 1, false, 2000));
    queue = mergeToggle(queue, entry("packing", 1, true, 3000));
    expect(queue).toHaveLength(1);
    expect(queue[0].checked).toBe(true);
    expect(queue[0].at).toBe(3000);
  });

  it("hält Pack- und Einkaufsliste auseinander", () => {
    let queue = mergeToggle([], entry("packing", 7, true, 1000));
    queue = mergeToggle(queue, entry("shopping", 7, false, 1001));
    expect(queue).toHaveLength(2);
    expect(queue.map(e => e.kind).sort()).toEqual(["packing", "shopping"]);
  });

  it("setzt den Fehlerzähler bei neuer Absicht zurück", () => {
    const stale: QueuedToggle = {
      ...entry("packing", 3, true, 1000),
      tries: 2,
    };
    const queue = mergeToggle([stale], entry("packing", 3, false, 2000));
    expect(queue).toHaveLength(1);
    expect(queue[0].tries).toBe(0);
  });

  it("begrenzt die Länge und wirft die ältesten weg", () => {
    let queue: QueuedToggle[] = [];
    for (let i = 0; i < QUEUE_LIMIT + 10; i++) {
      queue = mergeToggle(queue, entry("packing", i, true, 1000 + i));
    }
    expect(queue).toHaveLength(QUEUE_LIMIT);
    // Die zuletzt eingereihten bleiben – die sind am ehesten noch gewollt.
    expect(queue[queue.length - 1].itemId).toBe(QUEUE_LIMIT + 9);
  });
});

import { describe, expect, it } from "vitest";
import {
  addPending,
  mergePending,
  parsePending,
  PENDING_LIMIT,
  pendingKey,
  type PendingAction,
  type WidgetTask,
} from "@shared/widgetActions";

const task = (
  id: number,
  checked: boolean,
  kind: "packing" | "chore" = "packing"
): WidgetTask => ({ id, kind, title: `Nr. ${id}`, checked });

const action = (
  id: number,
  checked: boolean,
  at = 1,
  kind: "packing" | "chore" = "packing"
): PendingAction => ({ kind, itemId: id, checked, at });

describe("Vorgemerkte Häkchen", () => {
  it("mehrfaches Umschalten ergibt einen Eintrag mit dem letzten Wert", () => {
    // Wer zweimal tippt, soll nicht zwei Anfragen auslösen.
    let queue: PendingAction[] = [];
    queue = addPending(queue, action(7, true, 1));
    queue = addPending(queue, action(7, false, 2));
    expect(queue).toHaveLength(1);
    expect(queue[0].checked).toBe(false);
  });

  it("Packliste und Ämtli mit derselben Id kollidieren nicht", () => {
    expect(pendingKey("packing", 7)).not.toBe(pendingKey("chore", 7));
    const queue = addPending([action(7, true)], action(7, false, 2, "chore"));
    expect(queue).toHaveLength(2);
  });

  it("die Warteschlange wächst nicht unbegrenzt", () => {
    let queue: PendingAction[] = [];
    for (let i = 0; i < PENDING_LIMIT + 25; i++) {
      queue = addPending(queue, action(i, true, i));
    }
    expect(queue).toHaveLength(PENDING_LIMIT);
    // Die ältesten fallen weg, die jüngsten bleiben.
    expect(queue[queue.length - 1].itemId).toBe(PENDING_LIMIT + 24);
  });
});

describe("Überlagern beim Zeichnen", () => {
  it("ohne Vormerkung bleibt alles, wie es die App geschickt hat", () => {
    const tasks = [task(1, false), task(2, true)];
    expect(mergePending(tasks, [])).toEqual(tasks);
  });

  it("das vorgemerkte Häkchen gewinnt", () => {
    // Ohne das springt der Schalter zurück, sobald das Widget neu
    // zeichnet – und nichts wirkt kaputter als ein Schalter, der nicht
    // bleibt.
    const merged = mergePending([task(1, false)], [action(1, true)]);
    expect(merged[0].checked).toBe(true);
  });

  it("bei mehreren Vormerkungen zählt die jüngste", () => {
    const merged = mergePending(
      [task(1, false)],
      [action(1, true, 200), action(1, false, 100)]
    );
    expect(merged[0].checked).toBe(true);
  });

  it("Vormerkungen für andere Einträge lassen die Liste unberührt", () => {
    const merged = mergePending([task(1, false)], [action(99, true)]);
    expect(merged[0].checked).toBe(false);
  });
});

describe("Lesen aus dem gemeinsamen Ordner", () => {
  it("nimmt gültige Einträge", () => {
    expect(parsePending([action(1, true, 5)])).toHaveLength(1);
  });

  it("verwirft Unsinn, statt daran zu scheitern", () => {
    // Der Ordner wird von zwei Prozessen beschrieben; ein halb
    // geschriebener Eintrag darf das Widget nicht zum Absturz bringen –
    // ein Absturz kostet das Aktualisierungs-Budget der ganzen App.
    expect(parsePending(null)).toEqual([]);
    expect(parsePending("kaputt")).toEqual([]);
    expect(
      parsePending([{ kind: "menu", itemId: 1, checked: true, at: 1 }])
    ).toEqual([]);
    expect(
      parsePending([{ kind: "packing", itemId: "1", checked: true, at: 1 }])
    ).toEqual([]);
    expect(parsePending([null, undefined, 42])).toEqual([]);
  });
});

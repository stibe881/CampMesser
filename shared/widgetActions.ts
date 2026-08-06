/**
 * Häkchen, die IM WIDGET gesetzt wurden (#327).
 *
 * SEIT iOS 17 kann ein Widget etwas tun, statt nur die App zu öffnen: Ein
 * `AppIntent` hinter einem Schalter läuft in der Widget-Erweiterung, ohne
 * dass die App startet. Genau das macht ein Packlisten-Widget erst
 * brauchbar – man steht vor dem Schrank, hakt ab, fertig. Ein Widget, das
 * nur die App aufmacht, ist eine Verknüpfung mit Zwischenschritt.
 *
 * DAS PROBLEM DAHINTER: Die Erweiterung hat die Sitzung der App nicht.
 * Sie kann den Server also nicht fragen und ihm auch nichts sagen. Die
 * naheliegende Lösung – Zugangsdaten in den gemeinsamen Ordner legen –
 * wäre ein zweiter Anmeldeweg, den niemand sieht und den man beim
 * Abmelden vergisst.
 *
 * DER WEG STATTDESSEN ist derselbe, den die App im Funkloch geht (#303):
 * Das Häkchen wird gemerkt und später nachgeschickt. Die Erweiterung legt
 * es im gemeinsamen Ordner ab, die App liest es beim nächsten Start aus
 * und schiebt es in die bestehende Warteschlange
 * (`client/src/lib/offlineQueue.ts`), die es an den Server bringt.
 *
 * WAS DAS KOSTET, offen gesagt: Zwischen dem Häkchen im Widget und dem
 * Häkchen auf dem Server liegt die Zeit bis zum nächsten App-Start. Auf
 * einem zweiten Gerät taucht es erst dann auf. Für Packlisten und Ämtli
 * ist das verkraftbar – beides erledigt man alleine und schaut selten
 * gleichzeitig woanders hin.
 *
 * DASS DAS WIDGET TROTZDEM SOFORT REAGIERT, liegt an `mergePending`: Beim
 * Zeichnen werden die gemerkten Häkchen über den Stand aus der App
 * gelegt. Ohne das würde der Schalter zurückspringen, sobald das Widget
 * das nächste Mal zeichnet – und nichts wirkt kaputter als ein Schalter,
 * der nicht bleibt.
 */

/** Welche Liste ein Häkchen betrifft – wie `ToggleKind` im Offline-Puffer. */
export type WidgetTaskKind = "packing" | "chore";

/** Ein Eintrag, wie ihn das Widget anzeigt. */
export interface WidgetTask {
  id: number;
  kind: WidgetTaskKind;
  title: string;
  checked: boolean;
}

/** Ein im Widget gesetztes Häkchen, das noch nicht beim Server ist. */
export interface PendingAction {
  kind: WidgetTaskKind;
  itemId: number;
  checked: boolean;
  /** Millisekunden seit 1970 – entscheidet, welcher Wert gewinnt. */
  at: number;
}

/**
 * Mehr wird nicht gesammelt. Wer so viele Häkchen setzt, ohne die App
 * einmal zu öffnen, hat ein anderes Problem – und ein unbegrenzter
 * Speicher im gemeinsamen Ordner wäre eines mehr.
 */
export const PENDING_LIMIT = 100;

/** Schlüssel eines Eintrags: eine Zeile pro Listeneintrag. */
export function pendingKey(kind: WidgetTaskKind, itemId: number): string {
  return `${kind}:${itemId}`;
}

export function isWidgetTaskKind(value: unknown): value is WidgetTaskKind {
  return value === "packing" || value === "chore";
}

/**
 * Ein Häkchen vormerken.
 *
 * Mehrfaches Umschalten desselben Eintrags ergibt EINEN Eintrag mit dem
 * zuletzt gewählten Wert – wer zweimal tippt, soll nicht zwei Anfragen
 * auslösen, und der Server soll am Ende den Zustand sehen, den die Person
 * vor sich hat.
 */
export function addPending(
  queue: readonly PendingAction[],
  action: PendingAction
): PendingAction[] {
  const key = pendingKey(action.kind, action.itemId);
  const without = queue.filter(
    entry => pendingKey(entry.kind, entry.itemId) !== key
  );
  const next = [...without, action];
  return next.length > PENDING_LIMIT
    ? next.slice(next.length - PENDING_LIMIT)
    : next;
}

/**
 * Den Stand aus der App mit den gemerkten Häkchen überlagern.
 *
 * Bei mehreren Einträgen zum selben Ziel gewinnt der jüngste – deshalb
 * wird nach `at` sortiert und nicht nach Reihenfolge im Speicher.
 */
export function mergePending(
  tasks: readonly WidgetTask[],
  pending: readonly PendingAction[]
): WidgetTask[] {
  if (pending.length === 0) return [...tasks];
  const latest = new Map<string, PendingAction>();
  for (const entry of [...pending].sort((a, b) => a.at - b.at)) {
    latest.set(pendingKey(entry.kind, entry.itemId), entry);
  }
  return tasks.map(task => {
    const hit = latest.get(pendingKey(task.kind, task.id));
    return hit ? { ...task, checked: hit.checked } : task;
  });
}

/** Aus dem gemeinsamen Ordner gelesenes JSON prüfen (Unsinn zählt als leer). */
export function parsePending(raw: unknown): PendingAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is PendingAction =>
      entry !== null &&
      typeof entry === "object" &&
      isWidgetTaskKind((entry as PendingAction).kind) &&
      typeof (entry as PendingAction).itemId === "number" &&
      typeof (entry as PendingAction).checked === "boolean" &&
      typeof (entry as PendingAction).at === "number"
  );
}

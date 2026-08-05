/**
 * Offline gesetzte Häkchen zwischenspeichern und später nachschicken.
 *
 * WARUM ES DAS BRAUCHT: Ohne Verbindung hält TanStack Query eine Mutation
 * an und schickt sie nach, sobald wieder Empfang da ist – aber nur, solange
 * die Seite offen bleibt. Auf dem Handy ist genau das nicht der Fall: Man
 * hakt die Packliste im Funkloch ab, sperrt das Gerät, und am nächsten Tag
 * startet die App neu. Die angehaltene Mutation ist dann weg, während die
 * Anzeige dank Offline-Speicher weiterhin den Haken zeigt – bis die erste
 * frische Antwort vom Server ihn stillschweigend wieder entfernt. Genau
 * dieser stille Verlust ist schlimmer als eine Fehlermeldung.
 *
 * WAS HIER LIEGT: Nur Häkchen von Pack- und Einkaufsliste. Das sind die
 * Handgriffe, die man tatsächlich ohne Empfang macht, und sie sind
 * IDEMPOTENT – nachgeschickt wird «Eintrag 42 ist abgehakt», nicht «schalte
 * um». Doppelt ausgeführt schadet also nichts, und der letzte Stand
 * gewinnt. Neue Einträge, Löschungen oder Umsortierungen bleiben bewusst
 * draussen: Dort bräuchte es echte Konfliktauflösung.
 *
 * SPEICHERORT localStorage (nicht IndexedDB wie der Abfrage-Speicher): Die
 * Warteschlange ist winzig, und beim Schliessen der Seite muss sie sicher
 * geschrieben sein – synchron ist hier ein Vorteil.
 */

/** Welche Liste ein Häkchen betrifft. */
export type ToggleKind = "packing" | "shopping";

export interface QueuedToggle {
  /** Eindeutig pro Eintrag: mehrfaches Umschalten ersetzt sich selbst. */
  id: string;
  kind: ToggleKind;
  itemId: number;
  checked: boolean;
  /** Zeitpunkt der letzten Änderung (für die Reihenfolge beim Senden). */
  at: number;
  /** Fehlversuche – nach zu vielen wird aufgegeben statt ewig zu drehen. */
  tries: number;
}

const STORAGE_KEY = "campmesser.offlineQueue";

/** Mehr als das wird nicht gesammelt – dann stimmt etwas anderes nicht. */
export const QUEUE_LIMIT = 500;

/** So oft wird ein Eintrag höchstens erneut versucht. */
export const MAX_TRIES = 3;

/** Schlüssel eines Eintrags: eine Zeile pro Listeneintrag. */
export function toggleId(kind: ToggleKind, itemId: number): string {
  return `${kind}:${itemId}`;
}

/**
 * Einen Eintrag einreihen – reine Funktion, damit sie prüfbar bleibt.
 *
 * Mehrfaches Umschalten desselben Eintrags ergibt EINEN Eintrag mit dem
 * zuletzt gewählten Wert: Wer dreimal hin und her tippt, soll nicht drei
 * Anfragen auslösen. Der Zählerstand der Fehlversuche beginnt dabei von
 * vorn, denn es ist eine neue Absicht.
 */
export function mergeToggle(
  queue: QueuedToggle[],
  entry: QueuedToggle
): QueuedToggle[] {
  const without = queue.filter(item => item.id !== entry.id);
  const next = [...without, entry];
  return next.length > QUEUE_LIMIT
    ? next.slice(next.length - QUEUE_LIMIT)
    : next;
}

/** Warteschlange lesen (defensiv: kaputter Inhalt gilt als leer). */
export function loadQueue(): QueuedToggle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is QueuedToggle =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as QueuedToggle).id === "string" &&
        typeof (item as QueuedToggle).itemId === "number" &&
        typeof (item as QueuedToggle).checked === "boolean" &&
        ((item as QueuedToggle).kind === "packing" ||
          (item as QueuedToggle).kind === "shopping")
    );
  } catch {
    return [];
  }
}

/** Warteschlange schreiben (Fehler enden still – lieber ohne als kaputt). */
export function saveQueue(queue: QueuedToggle[]): void {
  try {
    if (queue.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    /* voller oder gesperrter Speicher: dann eben nicht */
  }
}

/** Ein Häkchen zum Nachschicken vormerken. */
export function enqueueToggle(
  kind: ToggleKind,
  itemId: number,
  checked: boolean
): void {
  const entry: QueuedToggle = {
    id: toggleId(kind, itemId),
    kind,
    itemId,
    checked,
    at: Date.now(),
    tries: 0,
  };
  saveQueue(mergeToggle(loadQueue(), entry));
}

/** Wie viele Änderungen warten gerade? */
export function queueLength(): number {
  return loadQueue().length;
}

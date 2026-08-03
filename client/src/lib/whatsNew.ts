import type { ChangelogBlock } from "@/data/changelog";

/**
 * «Was ist neu» beim App-Start: reine Logik rund um den Gesehen-Marker.
 * Gespeichert wird nur die Id des neuesten gesehenen Changelog-Blocks –
 * beim Start zeigen wir alle Blöcke, die danach dazugekommen sind.
 *
 * Zusammenspiel mit dem UpdatePrompt: Der Update-Hinweis greift nur, wenn
 * eine neue Service-Worker-Version WARTET. Startet die App nach einem
 * Deployment frisch, aktualisiert sie sich still – genau dann (und nach dem
 * Klick auf «Aktualisieren», der die Seite neu lädt) zeigt der Start-Dialog
 * die neuen Einträge automatisch. Es braucht keinen Extra-Code im UpdatePrompt.
 */

/** localStorage-Schlüssel: Id des neuesten gesehenen Changelog-Blocks. */
export const CHANGELOG_SEEN_KEY = "campmesser.changelogSeen";

/** Id des neuesten Blocks (die Liste ist neuester-zuoberst) – null bei leer. */
export function latestBlockId(blocks: ChangelogBlock[]): string | null {
  return blocks.length > 0 ? blocks[0].id : null;
}

/**
 * Noch nicht gesehene Blöcke ermitteln (neuester zuerst, wie die Liste).
 * lastSeenId null = Erstbesuch/Neuinstallation → bewusst NICHTS zeigen,
 * der Aufrufer setzt nur den Marker (niemand will beim ersten Start mit
 * alter Historie begrüsst werden). Eine unbekannte Id (z. B. Block wurde
 * aufgeräumt) fällt auf den Id-Vergleich zurück – die Ids sind aufsteigend
 * aufgebaut (ISO-Datum + Nummer), Zeichenkettenvergleich genügt.
 */
export function unseenBlocks(
  blocks: ChangelogBlock[],
  lastSeenId: string | null
): ChangelogBlock[] {
  if (lastSeenId === null) return [];
  const index = blocks.findIndex(block => block.id === lastSeenId);
  if (index >= 0) return blocks.slice(0, index);
  return blocks.filter(block => block.id > lastSeenId);
}

/** Gesehen-Marker lesen (defensiv – ohne/kaputter Wert ergibt null). */
export function loadLastSeenId(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHANGELOG_SEEN_KEY);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

/** Gesehen-Marker schreiben (Fehler wie volle Quota ignorieren). */
export function storeLastSeenId(id: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CHANGELOG_SEEN_KEY, id);
  } catch {
    /* Quota voll o. Ä. – dann erscheint der Hinweis beim nächsten Start erneut */
  }
}

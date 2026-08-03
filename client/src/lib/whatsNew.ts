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

/**
 * Liegt bereits eine benutzte Installation vor? Erkennungsmerkmal: irgendein
 * anderer `campmesser.`-Schlüssel im localStorage (Sprache, Design, Kachel-
 * Reihenfolge, zuletzt genutzte Module …). Wichtig für den Rollout: Wer die
 * App schon nutzt, hat beim ERSTEN Start nach dem Update naturgemäss noch
 * keinen Gesehen-Marker – ohne diese Unterscheidung würde er als Neuling
 * behandelt und bekäme die Neuerungen nie zu sehen.
 */
export function hasExistingAppData(keys: readonly string[]): boolean {
  return keys.some(
    key => key.startsWith("campmesser.") && key !== CHANGELOG_SEEN_KEY
  );
}

/** localStorage-Schlüssel dieser Installation (defensiv, leer bei Fehler). */
export function loadStorageKeys(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

/**
 * Was beim App-Start gezeigt wird:
 * - Marker vorhanden → alle seither dazugekommenen Blöcke.
 * - Kein Marker, aber bestehende Installation → nur der NEUESTE Block
 *   (die volle Historie wäre beim Umstieg zu viel des Guten).
 * - Kein Marker und keine App-Daten → echter Erstbesuch, nichts zeigen.
 */
export function blocksToShowOnStartup(
  blocks: ChangelogBlock[],
  lastSeenId: string | null,
  isExistingInstall: boolean
): ChangelogBlock[] {
  if (lastSeenId !== null) return unseenBlocks(blocks, lastSeenId);
  if (!isExistingInstall) return [];
  return blocks.slice(0, 1);
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

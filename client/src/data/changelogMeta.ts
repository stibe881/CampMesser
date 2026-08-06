/**
 * Kopfdaten des Changelogs – absichtlich winzig und OHNE die Einträge.
 *
 * Warum getrennt: `changelog.ts` ist mit vier Sprachen gegen 280 kB gross.
 * Der Start-Dialog («Was ist neu») muss bei JEDEM App-Start bloss eine Frage
 * beantworten – «gibt es etwas Neues seit meinem letzten Besuch?» – und dafür
 * genügt die Id des neuesten Blocks. Lag der Vergleich in der grossen Datei,
 * hing sie am Haupt-Bundle und wurde bei jedem Erstaufruf mitgeladen, auch
 * wenn es gar nichts zu zeigen gab.
 *
 * Pflegepflicht: Wer oben in `changelog.ts` einen neuen Block einfügt, trägt
 * dessen Id hier nach. Der Test `server/changelogMeta.test.ts` schlägt sonst
 * fehl – vergessen kann man es also nicht.
 */
import type { L4 } from "@shared/i18n";

export interface ChangelogBlock {
  /** Aufsteigend vergleichbare Id: ISO-Datum + ".n" (z. B. "2026-08-03.1"). */
  id: string;
  /** Veröffentlichungs-Datum als ISO-String (YYYY-MM-DD). */
  date: string;
  /** Kurze, nutzersichtbare Neuerungen – die wichtigsten zuerst. */
  entries: L4[];
}

/** Id des obersten (neuesten) Blocks in `changelog.ts`. */
export const LATEST_CHANGELOG_ID = "2026-08-06.1";

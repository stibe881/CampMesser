/**
 * Die Glocke in der Kopfzeile: was ist neu? (#374)
 *
 * DER ANLASS: Der Benachrichtigungs-Verlauf (#201) lag im Profil, ganz
 * unten in der Mitteilungs-Karte, hinter einem Aufklapper. Dorthin geht
 * man, um Einstellungen zu ändern – nicht, um zu SCHAUEN, was gemeldet
 * wurde. Wer den Push auf dem Sperrbildschirm weggewischt hat, findet ihn
 * so praktisch nicht wieder.
 *
 * WAS «UNGELESEN» HIER HEISST: Es gibt keine Lese-Spalte in der
 * Datenbank, und es soll auch keine geben – der Verlauf ist eine Kopie,
 * kein Postfach. Gemerkt wird stattdessen EIN Zeitpunkt pro Gerät: wann
 * die Glocke zuletzt offen war. Alles, was danach kam, ist neu.
 *
 * Das ist bewusst geräteweise und nicht kontoweit. Ein zweites Handy
 * zeigt denselben Punkt noch einmal – das ist richtig so, denn gesehen
 * hat man ihn dort ja nicht. Und es kostet keine Tabelle, keinen
 * Schreibzugriff und keine Mutation, die beim Öffnen einer Klappe feuert.
 *
 * Reine Funktionen, damit die Zählung prüfbar bleibt: Am Bildschirm sieht
 * man nur, dass «irgendwo eine 3 steht».
 */

/** Ein Verlaufseintrag, soweit die Glocke ihn braucht. */
export interface PushInboxEntry {
  /** Zeitpunkt des Versands – als Date (superjson) oder ISO-Text. */
  sentAt: Date | string;
}

/** Ab dieser Zahl steht «9+» statt einer Zahl – mehr passt nicht ins Pünktchen. */
export const PUSH_UNREAD_MAX = 9;

/**
 * Zeitpunkt als Millisekunden; `null` bei unbrauchbarer Angabe. Der Wert
 * kommt einmal als Date (über superjson) und einmal als Text (aus dem
 * localStorage) – beides muss hier durch.
 */
function toMillis(value: Date | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const millis = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

/**
 * Wie viele Einträge sind NEUER als der zuletzt gesehene Zeitpunkt?
 *
 * Ohne gemerkten Zeitpunkt (erstes Öffnen der App auf diesem Gerät) gilt
 * alles als neu – das ist der ehrlichere Startwert: «nichts ist neu»
 * würde eine Meldung verschlucken, die man noch nie gesehen hat.
 */
export function unreadPushCount(
  entries: readonly PushInboxEntry[],
  seenAt: string | null
): number {
  const seen = toMillis(seenAt);
  if (seen === null) return entries.length;
  return entries.filter(entry => {
    const at = toMillis(entry.sentAt);
    return at !== null && at > seen;
  }).length;
}

/**
 * Der jüngste Zeitpunkt der Liste als ISO-Text – das ist es, was beim
 * Öffnen der Glocke gemerkt wird. `null` bei leerer Liste, damit ein
 * leerer Verlauf nicht «jetzt» festschreibt: Käme unmittelbar danach eine
 * ältere Meldung nach, wäre sie sonst schon abgehakt.
 */
export function newestSentAt(
  entries: readonly PushInboxEntry[]
): string | null {
  let newest: number | null = null;
  for (const entry of entries) {
    const at = toMillis(entry.sentAt);
    if (at === null) continue;
    if (newest === null || at > newest) newest = at;
  }
  return newest === null ? null : new Date(newest).toISOString();
}

/** Beschriftung des Pünktchens: «3», ab zehn «9+», bei nichts leer. */
export function unreadBadgeLabel(count: number): string {
  if (count <= 0) return "";
  return count > PUSH_UNREAD_MAX ? `${PUSH_UNREAD_MAX}+` : String(count);
}

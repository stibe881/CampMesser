/**
 * Gästebuch pro Reise (#254): Wer die Reise sieht, darf einen Gruss
 * hinterlassen – Mitreisende aus der App heraus, Bekannte über den
 * Teil-Link der Reise.
 *
 * Das ist der einzige Ort in ReiseKompass, an dem jemand OHNE Konto etwas
 * schreiben kann. Darum zwei Entscheidungen, die hier in der Logik
 * stecken statt in der Ansicht:
 *
 *  - Ein Gast trägt einen Namen ein, aber der Name beweist nichts. Deshalb
 *    wird die Herkunft eines Eintrags getrennt geführt (`userId` gesetzt =
 *    aus dem Konto, sonst Gast) und in der Anzeige unterschieden – sonst
 *    könnte sich jeder als «Mama» ausgeben und es sähe echt aus.
 *  - Ein Foto darf nur anhängen, wer angemeldet ist, und auch dann nur
 *    eines, das schon zur Reise gehört. Anonyme Uploads wären eine
 *    offene Tür; die Auswahl aus der bestehenden Galerie ist keine.
 *
 * Reine Rechnerei auf Zeichenketten – Client, Server und Tests teilen sie.
 */

/** Höchstlänge des Gast-Namens (DB: varchar(60)). */
export const MAX_GUEST_NAME_LENGTH = 60;

/** Höchstlänge einer Gästebuch-Nachricht (DB: varchar(500)). */
export const MAX_GUESTBOOK_MESSAGE_LENGTH = 500;

/** Mehr Einträge zeigt die Karte nicht auf einmal – der Rest klappt auf. */
export const GUESTBOOK_PREVIEW_COUNT = 3;

/**
 * Namen säubern: Zeilenumbrüche und Mehrfach-Leerzeichen fallen weg, damit
 * niemand mit einem «Namen» über zehn Zeilen die Karte sprengt.
 */
export function normalizeGuestName(value: string): string {
  return (value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_GUEST_NAME_LENGTH);
}

/**
 * Nachricht säubern: aussen trimmen, mehr als zwei leere Zeilen am Stück
 * zusammenfassen. Absätze bleiben erhalten – ein Gruss darf Absätze haben.
 */
export function normalizeGuestbookMessage(value: string): string {
  return (value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_GUESTBOOK_MESSAGE_LENGTH);
}

/** Taugt die Nachricht? Leer oder nur Leerzeichen zählt nicht. */
export function isValidGuestbookMessage(value: string): boolean {
  return normalizeGuestbookMessage(value).length > 0;
}

/** Ein Gästebuch-Eintrag, so weit Anzeige und Auswertung ihn brauchen. */
export interface GuestbookEntryLike {
  id: number;
  /** Konto der Verfasserin/des Verfassers; null = Gast über den Teil-Link */
  userId?: number | null;
  authorName: string;
  message: string;
  /** Angehängtes Reise-Foto (tripPhotos.id); null = ohne Bild */
  photoId?: number | null;
  createdAt: Date | string;
}

/**
 * Anzeigename eines Eintrags. Ein Gast ohne Namen bleibt «Gast» – lieber
 * ehrlich anonym als ein erfundener Name.
 */
export function guestbookAuthorLabel(
  entry: Pick<GuestbookEntryLike, "authorName">,
  fallback: string
): string {
  const name = normalizeGuestName(entry.authorName);
  return name.length > 0 ? name : fallback;
}

/** Stammt der Eintrag aus einem angemeldeten Konto? */
export function isMemberEntry(
  entry: Pick<GuestbookEntryLike, "userId">
): boolean {
  return entry.userId != null;
}

/** Zeitstempel als Zahl – Date oder ISO-String, sonst 0. */
function timeOf(value: Date | string): number {
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Neuste zuoberst. Bei gleichem Zeitstempel entscheidet die Id – zwei
 * Einträge in derselben Sekunde sollen nicht bei jedem Laden die Plätze
 * tauschen.
 */
export function sortGuestbookEntries<T extends GuestbookEntryLike>(
  entries: readonly T[]
): T[] {
  return entries.slice().sort((a, b) => {
    const diff = timeOf(b.createdAt) - timeOf(a.createdAt);
    return diff !== 0 ? diff : b.id - a.id;
  });
}

/** Zahlen fürs Kopfzeilen-Abzeichen: wie viele, davon wie viele Gäste. */
export function guestbookSummary(entries: readonly GuestbookEntryLike[]): {
  total: number;
  fromGuests: number;
  fromMembers: number;
  withPhoto: number;
} {
  let fromMembers = 0;
  let withPhoto = 0;
  entries.forEach(entry => {
    if (isMemberEntry(entry)) fromMembers++;
    if (entry.photoId != null) withPhoto++;
  });
  return {
    total: entries.length,
    fromGuests: entries.length - fromMembers,
    fromMembers,
    withPhoto,
  };
}

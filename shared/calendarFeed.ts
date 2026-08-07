/**
 * Kalender-Abo statt Kalender-Datei (#377).
 *
 * WAS DER EXPORT NICHT KONNTE: `.ics` herunterladen und importieren
 * (#244) macht aus einer Reise einen EINMALIGEN Eintrag. Verschiebt sich
 * die Anreise um einen Tag, steht im Handy-Kalender weiterhin der alte –
 * und niemand denkt daran, die Datei noch einmal zu holen. Der falsche
 * Termin ist schlimmer als gar keiner.
 *
 * WIE EIN ABO STATTDESSEN FUNKTIONIERT: Der Kalender holt sich eine
 * Adresse in regelmässigen Abständen selbst. Was dort steht, gilt. Eine
 * verschobene Reise ist nach dem nächsten Abgleich überall richtig.
 *
 * DER SCHLÜSSEL IN DER ADRESSE IST DAS PASSWORT. Kalender-Programme
 * können sich nicht anmelden – sie kennen kein Konto, keine Sitzung, sie
 * holen eine Adresse. Deshalb steckt die Berechtigung im Link, und
 * deshalb lässt er sich im Profil neu erzeugen: Ein weitergegebener Link
 * ist damit sofort wertlos. Genau dasselbe Muster wie bei den geteilten
 * Packlisten (#1) und dem Platz-Dossier (#45).
 *
 * WAS IM KALENDER LANDET, ist bewusst wenig: Ort, Zeitraum, Ankunfts-
 * und Abreisezeit. Keine Notizen, keine Fotos, keine Mitreisenden – wer
 * über die Schulter auf den Kalender schaut, sieht nicht mehr als «Ferien
 * in Lugano».
 */

/** Länge des Schlüssels (nanoid) – dieselbe wie bei Reise-Einladungen. */
export const CALENDAR_TOKEN_LENGTH = 24;

/** Zeichen, die nanoid benutzt. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,32}$/;

/**
 * Sieht das nach einem Schlüssel aus? Die Prüfung steht VOR der
 * Datenbank-Abfrage: Ein Endpunkt ohne Anmeldung soll nicht bei jedem
 * Unsinn in der Adresszeile die Datenbank beschäftigen.
 */
export function isCalendarToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

/** Pfad des Abos auf dem Server. */
export function calendarFeedPath(token: string): string {
  return `/api/kalender/${token}.ics`;
}

/** Vollständige https-Adresse – zum Kopieren und Weitergeben. */
export function calendarFeedUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}${calendarFeedPath(token)}`;
}

/**
 * Dieselbe Adresse als `webcal://`.
 *
 * WARUM ZWEI SCHREIBWEISEN: `webcal://` ist kein echtes Protokoll,
 * sondern ein Wink an das Betriebssystem – ein Klick öffnet damit die
 * Kalender-App und fragt «abonnieren?», statt die Datei herunterzuladen.
 * Wo das nicht greift (viele Desktop-Kalender), braucht es die
 * https-Adresse zum Einfügen. Darum stehen im Profil beide.
 */
export function calendarWebcalUrl(origin: string, token: string): string {
  return calendarFeedUrl(origin, token).replace(/^https?:\/\//, "webcal://");
}

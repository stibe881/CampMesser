/**
 * Wann das Offline-Paket einer Reise von selbst aufgefrischt wird (#411).
 *
 * DER EIN-KNOPF-DOWNLOAD (#387) IST EINE MOMENTAUFNAHME: Wer ihn eine
 * Woche vor der Reise drückt, fährt mit einem alten Menüplan und einer
 * alten Packliste los. Neu frischt die App die DATEN beim Öffnen kurz
 * vor Reisebeginn selbst auf – aber nur für Reisen, deren Paket schon
 * einmal von Hand geholt wurde. Das erste Holen bleibt eine
 * Entscheidung (Roaming!), das Frischhalten ist dann nur noch Pflege.
 *
 * NUR DATEN, KEINE KARTENKACHELN: Die Kacheln sind die Megabyte und
 * veralten nicht – die Strasse liegt nächste Woche noch am selben Ort.
 * Was veraltet, sind Menüplan, Packliste und Mitreisende, und die sind
 * ein paar Kilobyte.
 */

/** So viele Tage vor der Anreise beginnt das Frischhalten. */
export const OFFLINE_REFRESH_LEAD_DAYS = 3;

/** Jünger als das gilt als frisch – öfter bringt nichts. */
export const OFFLINE_REFRESH_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface RefreshableTrip {
  startDate: string;
  endDate: string;
}

/** ISO-Tag um Tage verschieben – ohne Zeitzonen-Umweg (#333). */
function shiftIsoDay(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Soll das Paket dieser Reise jetzt aufgefrischt werden?
 *
 * Ja, wenn (a) der Reisebeginn höchstens OFFLINE_REFRESH_LEAD_DAYS
 * entfernt ist und die Reise noch nicht vorbei ist – während der Reise
 * lohnt es weiter, da ändert der Menüplan noch – und (b) der letzte
 * Lauf älter als OFFLINE_REFRESH_MAX_AGE_MS ist. Ein Zeitstempel aus
 * der Zukunft (verstellte Uhr) gilt als frisch, nicht als kaputt.
 */
export function shouldRefreshOfflinePrep(
  trip: RefreshableTrip,
  savedAtMs: number,
  nowMs: number,
  todayIso: string
): boolean {
  if (todayIso < shiftIsoDay(trip.startDate, -OFFLINE_REFRESH_LEAD_DAYS)) {
    return false;
  }
  if (todayIso > trip.endDate) return false;
  const age = nowMs - savedAtMs;
  return age >= OFFLINE_REFRESH_MAX_AGE_MS;
}

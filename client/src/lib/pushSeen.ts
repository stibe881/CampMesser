/**
 * «Bis hierher habe ich die Glocke gesehen» (#374).
 *
 * Ein einziger Zeitpunkt im localStorage – bewusst NICHT am Konto:
 * Gesehen hat man die Meldung auf DIESEM Gerät. Auf dem Tablet daneben
 * soll der Punkt noch stehen.
 */
export const PUSH_SEEN_KEY = "campmesser.pushSeenAt";

export function loadPushSeenAt(): string | null {
  try {
    return localStorage.getItem(PUSH_SEEN_KEY);
  } catch {
    return null;
  }
}

export function savePushSeenAt(iso: string): void {
  try {
    localStorage.setItem(PUSH_SEEN_KEY, iso);
  } catch {
    /* Sitzung reicht */
  }
}

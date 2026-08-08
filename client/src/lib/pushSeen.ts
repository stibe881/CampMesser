/**
 * «Bis hierher habe ich die Glocke gesehen» (#374, #393).
 *
 * Ein einziger Zeitpunkt im localStorage. Die Entscheidung aus #374
 * («bewusst nicht am Konto») hat der Alltag gekippt: Wer die Meldungen
 * am Telefon gelesen hat, will den Punkt am Tablet nicht noch einmal
 * wegdrücken. Seit #393 gleicht die Glocke den Zeitpunkt deshalb über
 * den Geräte-Sync (#7) ab – localStorage bleibt die schnelle,
 * offlinefähige Quelle, das Konto der Abgleich dahinter.
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

/**
 * Dezentes haptisches Feedback beim Abhaken von Listen-Einträgen.
 * Nutzt die Vibrations-API, wo vorhanden (Android/Chrome); auf iOS und am
 * Desktop ist der Aufruf ein No-op. Bewusst sehr kurz (10 ms), damit es
 * sich wie ein «Tick» anfühlt und nicht stört.
 */
export function hapticTick(): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(10);
    }
  } catch {
    /* egal – rein kosmetisch */
  }
}

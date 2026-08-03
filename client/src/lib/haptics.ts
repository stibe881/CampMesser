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

/**
 * Feier-Muster für einen Erfolg (Bingo, Meilenstein): drei kurze Stösse mit
 * Pausen – deutlich als «geschafft!» erkennbar, aber kurz genug fürs Auto.
 * Wie hapticTick() auf iOS und am Desktop ein No-op.
 */
export function hapticCelebrate(): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([60, 60, 60, 60, 160]);
    }
  } catch {
    /* egal – rein kosmetisch */
  }
}

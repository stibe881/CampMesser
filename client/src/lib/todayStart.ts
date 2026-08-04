/**
 * «Heute»-Ansicht (#298): Einstellung und Sitzungs-Merker für den Sprung
 * beim App-Start.
 *
 * VORGABE IST EIN: Wer eine Reise laufen hat, will beim Öffnen den Tag
 * sehen und nicht vierzig Kacheln. Wer das anders will, schaltet es auf
 * der Seite selbst um – dort, wo es wirkt.
 *
 * DER SPRUNG PASSIERT EINMAL PRO SITZUNG. Deshalb sessionStorage und
 * nicht localStorage: Beim nächsten Öffnen der App soll es wieder
 * passieren, beim Antippen von «Start» in derselben Sitzung nicht.
 */
export const TODAY_START_KEY = "campmesser.todayStart";
const JUMPED_KEY = "campmesser.todayJumped";

export function loadTodayStart(): boolean {
  try {
    const raw = localStorage.getItem(TODAY_START_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export function saveTodayStart(enabled: boolean): void {
  try {
    localStorage.setItem(TODAY_START_KEY, String(enabled));
  } catch {
    /* Sitzung reicht */
  }
}

export function hasJumpedToday(): boolean {
  try {
    return sessionStorage.getItem(JUMPED_KEY) === "1";
  } catch {
    // Ohne sessionStorage lieber gar nicht springen als in einer Schleife
    return true;
  }
}

export function markJumpedToday(): void {
  try {
    sessionStorage.setItem(JUMPED_KEY, "1");
  } catch {
    /* dann eben nicht */
  }
}

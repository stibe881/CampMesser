/**
 * Erkennung des installierten PWA-Modus (Standalone).
 *
 * In der installierten App ist window.print() auf Android und iOS
 * wirkungslos – Druckseiten öffnen sich dort stattdessen in einem echten
 * Browser-Tab, wo der Druckdialog («Als PDF sichern») funktioniert.
 */
import { isNativeApp } from "@/lib/nativeBridge";

export function isStandaloneApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Braucht Drucken einen echten Browser-Tab? (Vierter Anlauf «Pass
 * drucken», 09.08.2026.)
 *
 * JA in zwei Fällen, die sich fürs Drucken gleich verhalten:
 *  - installierte PWA (Standalone): window.print() ist wirkungslos;
 *  - NATIVE App (WKWebView der Expo-Hülle): window.print() ist dort
 *    ebenso wirkungslos – und dieser Fall war von den bisherigen
 *    Anläufen NIE abgedeckt, weil isStandaloneApp() im WebView false
 *    ist (kein display-mode: standalone, kein navigator.standalone).
 *
 * Wer diesen Helfer benutzt, deckt beide Fälle ab; die native App
 * öffnet Safari über die Brücke (openExternalUrl), die PWA über einen
 * target="_blank"-Link – beide mit Druck-Ticket zur Anmeldung.
 */
export function printNeedsBrowserTab(): boolean {
  return isStandaloneApp() || isNativeApp();
}

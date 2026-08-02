/**
 * Erkennung des installierten PWA-Modus (Standalone).
 *
 * In der installierten App ist window.print() auf Android und iOS
 * wirkungslos – Druckseiten öffnen sich dort stattdessen in einem echten
 * Browser-Tab, wo der Druckdialog («Als PDF sichern») funktioniert.
 */
export function isStandaloneApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

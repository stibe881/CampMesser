/**
 * Schnellzugriff-Leiste frei belegen (#297).
 *
 * Die Leiste am unteren Rand ist der einzige Teil der App, den man ohne
 * Hinschauen bedient – der Daumen weiss nach zwei Reisen, wo er hin muss.
 * Genau deshalb gehört sie der Person und nicht der Vorgabe: Wer nie
 * Erste Hilfe braucht, aber jeden Abend die Reisekasse führt, soll den
 * Platz tauschen können.
 *
 * ZWEI PLÄTZE SIND FEST, und das ist kein Versehen:
 *
 * «Start» bleibt links, weil es der Rückweg zu allem anderen ist. Eine
 * Leiste, aus der man nicht mehr herausfindet, wäre keine Erleichterung.
 *
 * «SOS» bleibt rechts, weil man den Knopf genau dann sucht, wenn man
 * nicht nachdenken kann. Wer ihn wegkonfiguriert, merkt es in dem
 * Moment, in dem er zählt – das ist eine Entscheidung, die eine App
 * einem nicht anbieten sollte.
 *
 * Dazwischen sind vier Plätze frei.
 */

/** Fest ganz links: der Weg zurück zu allem. */
export const QUICK_BAR_START = "/";

/** Fest ganz rechts: der Knopf, den man nicht sucht, wenn man ihn braucht. */
export const QUICK_BAR_SOS = "/sos";

/** So viele Plätze sind frei belegbar. */
export const QUICK_BAR_SLOTS = 4;

/**
 * Vorbelegung – die bisherige Leiste, damit nach dem Update niemand vor
 * einer fremden App steht.
 */
export const DEFAULT_QUICK_BAR = [
  "/packlisten",
  "/sonne",
  "/wetter",
  "/erste-hilfe",
] as const;

/**
 * Eine gespeicherte Belegung in eine brauchbare bringen.
 *
 * Robust gegen alles, was aus localStorage oder dem Geräte-Sync kommt:
 * Unbekannte Pfade (ein Modul wurde umbenannt oder entfernt), Duplikate
 * und die beiden festen Plätze fliegen raus; fehlt danach etwas, wird aus
 * der Vorbelegung aufgefüllt. Das Ergebnis hat IMMER genau
 * `QUICK_BAR_SLOTS` Einträge – eine halb leere Leiste wäre schlimmer als
 * eine falsch belegte.
 */
export function sanitizeQuickBar(
  value: unknown,
  knownPaths: readonly string[]
): string[] {
  const known = (path: unknown): path is string =>
    typeof path === "string" &&
    path !== QUICK_BAR_START &&
    path !== QUICK_BAR_SOS &&
    knownPaths.indexOf(path) >= 0;

  const clean: string[] = [];
  const push = (path: string) => {
    if (clean.length >= QUICK_BAR_SLOTS) return;
    if (clean.indexOf(path) >= 0) return;
    clean.push(path);
  };

  if (Array.isArray(value)) value.forEach(entry => known(entry) && push(entry));
  // Auffüllen: zuerst aus der Vorbelegung, dann aus dem, was es gibt
  DEFAULT_QUICK_BAR.forEach(path => known(path) && push(path));
  knownPaths.forEach(path => known(path) && push(path));
  return clean;
}

/** Die vollständige Leiste inklusive der festen Plätze. */
export function quickBarPaths(custom: readonly string[]): string[] {
  return [QUICK_BAR_START, ...custom, QUICK_BAR_SOS];
}

/**
 * Einen Platz neu belegen. Steht das Modul schon auf einem anderen Platz,
 * TAUSCHEN die beiden – sonst stünde dasselbe zweimal in der Leiste, und
 * ein Platz wäre verloren.
 */
export function setQuickBarSlot(
  current: readonly string[],
  index: number,
  path: string
): string[] {
  if (index < 0 || index >= current.length) return current.slice();
  const next = current.slice();
  const existing = next.indexOf(path);
  if (existing >= 0 && existing !== index) next[existing] = next[index];
  next[index] = path;
  return next;
}

/** Ist die Belegung die Vorbelegung? (für «Zurücksetzen» im Menü) */
export function isDefaultQuickBar(custom: readonly string[]): boolean {
  return (
    custom.length === DEFAULT_QUICK_BAR.length &&
    custom.every((path, i) => path === DEFAULT_QUICK_BAR[i])
  );
}

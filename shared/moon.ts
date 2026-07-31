/**
 * Mondphasen-Berechnung für den Mondkalender im Natur-Modul.
 * Basiert auf dem synodischen Monat (29.530588853 Tage) ab einer bekannten
 * Neumond-Referenz (6. Januar 2000, 18:14 UTC). Genauigkeit ±1 Tag –
 * völlig ausreichend für Nachtwanderungen und Sternbeobachtung.
 */

export const SYNODIC_MONTH_DAYS = 29.530588853;
/** Referenz-Neumond: 6. Januar 2000, 18:14 UTC */
const NEW_MOON_REF_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const DAY_MS = 86400000;

export type MoonPhaseId =
  | "neumond"
  | "zunehmende-sichel"
  | "erstes-viertel"
  | "zunehmender-mond"
  | "vollmond"
  | "abnehmender-mond"
  | "letztes-viertel"
  | "abnehmende-sichel";

export interface MoonInfo {
  /** Alter des Mondes in Tagen seit Neumond (0 bis ~29.53) */
  ageDays: number;
  /** Beleuchteter Anteil 0–1 */
  illumination: number;
  phase: MoonPhaseId;
  phaseLabel: string;
  /** Emoji-Symbol der Phase */
  symbol: string;
}

const PHASES: { id: MoonPhaseId; label: string; symbol: string }[] = [
  { id: "neumond", label: "Neumond", symbol: "🌑" },
  { id: "zunehmende-sichel", label: "Zunehmende Sichel", symbol: "🌒" },
  { id: "erstes-viertel", label: "Erstes Viertel (Halbmond)", symbol: "🌓" },
  { id: "zunehmender-mond", label: "Zunehmender Mond", symbol: "🌔" },
  { id: "vollmond", label: "Vollmond", symbol: "🌕" },
  { id: "abnehmender-mond", label: "Abnehmender Mond", symbol: "🌖" },
  { id: "letztes-viertel", label: "Letztes Viertel (Halbmond)", symbol: "🌗" },
  { id: "abnehmende-sichel", label: "Abnehmende Sichel", symbol: "🌘" },
];

/** Mond-Alter in Tagen seit dem letzten Neumond. */
export function moonAge(date: Date): number {
  const days = (date.getTime() - NEW_MOON_REF_MS) / DAY_MS;
  return ((days % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
}

/** Mondphase und Beleuchtung für ein Datum. */
export function getMoonInfo(date: Date): MoonInfo {
  const age = moonAge(date);
  // Beleuchtung: 0 bei Neumond, 1 bei Vollmond (Kosinus-Näherung)
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH_DAYS)) / 2;
  // Phase in 8 Segmente teilen; Segmentgrenzen um ein halbes Segment verschoben,
  // damit «Neumond» das Fenster um Alter 0 abdeckt
  const segment = Math.floor(((age + SYNODIC_MONTH_DAYS / 16) / SYNODIC_MONTH_DAYS) * 8) % 8;
  const def = PHASES[segment];
  return {
    ageDays: age,
    illumination,
    phase: def.id,
    phaseLabel: def.label,
    symbol: def.symbol,
  };
}

/** Die nächsten n Vollmonde ab einem Datum (Datum jeweils auf den Tag genau). */
export function nextFullMoons(from: Date, count: number): Date[] {
  const halfMonth = SYNODIC_MONTH_DAYS / 2;
  const age = moonAge(from);
  // Tage bis zum nächsten Vollmond (Alter = halber synodischer Monat)
  let toFull = halfMonth - age;
  if (toFull < 0) toFull += SYNODIC_MONTH_DAYS;
  const result: Date[] = [];
  for (let i = 0; i < count; i++) {
    result.push(new Date(from.getTime() + (toFull + i * SYNODIC_MONTH_DAYS) * DAY_MS));
  }
  return result;
}

/** Die nächsten n Neumonde ab einem Datum. */
export function nextNewMoons(from: Date, count: number): Date[] {
  const age = moonAge(from);
  let toNew = SYNODIC_MONTH_DAYS - age;
  if (toNew >= SYNODIC_MONTH_DAYS) toNew -= SYNODIC_MONTH_DAYS;
  const result: Date[] = [];
  for (let i = 0; i < count; i++) {
    result.push(new Date(from.getTime() + (toNew + i * SYNODIC_MONTH_DAYS) * DAY_MS));
  }
  return result;
}

/** Wie gut eignet sich die Nacht zur Sternbeobachtung? (je dunkler, desto besser) */
export function stargazingQuality(illumination: number): {
  score: "hervorragend" | "gut" | "mittel" | "schlecht";
  note: string;
} {
  if (illumination < 0.15)
    return {
      score: "hervorragend",
      note: "Fast kein Mondlicht – perfekte Nacht für Milchstrasse und schwache Sterne.",
    };
  if (illumination < 0.45)
    return {
      score: "gut",
      note: "Wenig Mondlicht – die meisten Sternbilder sind gut sichtbar.",
    };
  if (illumination < 0.8)
    return {
      score: "mittel",
      note: "Deutliches Mondlicht – helle Sternbilder gehen, schwache Objekte verblassen.",
    };
  return {
    score: "schlecht",
    note: "Heller Mond überstrahlt viele Sterne – dafür ideal für eine Nachtwanderung ohne Lampe.",
  };
}

/**
 * Mondphasen-Berechnung für den Mondkalender im Natur-Modul.
 * Basiert auf dem synodischen Monat (29.530588853 Tage) ab einer bekannten
 * Neumond-Referenz (6. Januar 2000, 18:14 UTC). Genauigkeit ±1 Tag –
 * völlig ausreichend für Nachtwanderungen und Sternbeobachtung.
 * Anzeigetexte sind vollständig übersetzt (L4); Default-Sprache bleibt Deutsch.
 */

import { monthGrid, type MonthGridDay } from "./calendar";
import { l4, pick, type L4, type Language } from "./i18n";

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

const PHASES: { id: MoonPhaseId; label: L4; symbol: string }[] = [
  {
    id: "neumond",
    label: l4("Neumond", "Nouvelle lune", "Luna nuova", "New moon"),
    symbol: "🌑",
  },
  {
    id: "zunehmende-sichel",
    label: l4(
      "Zunehmende Sichel",
      "Premier croissant",
      "Falce crescente",
      "Waxing crescent"
    ),
    symbol: "🌒",
  },
  {
    id: "erstes-viertel",
    label: l4(
      "Erstes Viertel (Halbmond)",
      "Premier quartier (demi-lune)",
      "Primo quarto (mezzaluna)",
      "First quarter (half moon)"
    ),
    symbol: "🌓",
  },
  {
    id: "zunehmender-mond",
    label: l4(
      "Zunehmender Mond",
      "Lune gibbeuse croissante",
      "Luna gibbosa crescente",
      "Waxing gibbous"
    ),
    symbol: "🌔",
  },
  {
    id: "vollmond",
    label: l4("Vollmond", "Pleine lune", "Luna piena", "Full moon"),
    symbol: "🌕",
  },
  {
    id: "abnehmender-mond",
    label: l4(
      "Abnehmender Mond",
      "Lune gibbeuse décroissante",
      "Luna gibbosa calante",
      "Waning gibbous"
    ),
    symbol: "🌖",
  },
  {
    id: "letztes-viertel",
    label: l4(
      "Letztes Viertel (Halbmond)",
      "Dernier quartier (demi-lune)",
      "Ultimo quarto (mezzaluna)",
      "Last quarter (half moon)"
    ),
    symbol: "🌗",
  },
  {
    id: "abnehmende-sichel",
    label: l4(
      "Abnehmende Sichel",
      "Dernier croissant",
      "Falce calante",
      "Waning crescent"
    ),
    symbol: "🌘",
  },
];

/** Mond-Alter in Tagen seit dem letzten Neumond. */
export function moonAge(date: Date): number {
  const days = (date.getTime() - NEW_MOON_REF_MS) / DAY_MS;
  return (
    ((days % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS
  );
}

/** Mondphase und Beleuchtung für ein Datum. */
export function getMoonInfo(date: Date, lang: Language = "de"): MoonInfo {
  const age = moonAge(date);
  // Beleuchtung: 0 bei Neumond, 1 bei Vollmond (Kosinus-Näherung)
  const illumination =
    (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH_DAYS)) / 2;
  // Phase in 8 Segmente teilen; Segmentgrenzen um ein halbes Segment verschoben,
  // damit «Neumond» das Fenster um Alter 0 abdeckt
  const segment =
    Math.floor(((age + SYNODIC_MONTH_DAYS / 16) / SYNODIC_MONTH_DAYS) * 8) % 8;
  const def = PHASES[segment];
  return {
    ageDays: age,
    illumination,
    phase: def.id,
    phaseLabel: pick(def.label, lang),
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
    result.push(
      new Date(from.getTime() + (toFull + i * SYNODIC_MONTH_DAYS) * DAY_MS)
    );
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
    result.push(
      new Date(from.getTime() + (toNew + i * SYNODIC_MONTH_DAYS) * DAY_MS)
    );
  }
  return result;
}

/** Eine Tages-Zelle der Mondkalender-Monatsansicht. */
export interface MoonMonthDay extends MonthGridDay {
  /** Beleuchteter Anteil 0–1 (berechnet für 12 Uhr UTC des Tages) */
  illumination: number;
  phase: MoonPhaseId;
  phaseLabel: string;
  symbol: string;
  /** Tag des Neumonds dieser Lunation */
  isNewMoon: boolean;
  /** Tag des Vollmonds dieser Lunation */
  isFullMoon: boolean;
}

/**
 * Monatsgitter (Wochen ab Montag, inkl. Überhang) mit Mondphase pro Tag.
 * Bezugszeitpunkt ist jeweils 12 Uhr UTC – so bleibt das Ergebnis unabhängig
 * von der Zeitzone des Geräts. Da das Mondalter von Mittag zu Mittag um genau
 * einen Tag wächst, fällt pro Lunation genau ein Tag ins Fenster [0, 1) bzw.
 * [halber Monat, halber Monat + 1) – das sind die Neu- und Vollmond-Tage.
 */
export function moonMonth(
  year: number,
  month: number,
  lang: Language = "de"
): MoonMonthDay[][] {
  const halfMonth = SYNODIC_MONTH_DAYS / 2;
  return monthGrid(year, month).map(week =>
    week.map(day => {
      const info = getMoonInfo(new Date(`${day.iso}T12:00:00Z`), lang);
      return {
        ...day,
        illumination: info.illumination,
        phase: info.phase,
        phaseLabel: info.phaseLabel,
        symbol: info.symbol,
        isNewMoon: info.ageDays < 1,
        isFullMoon: info.ageDays >= halfMonth && info.ageDays < halfMonth + 1,
      };
    })
  );
}

const STARGAZING_NOTES: Record<
  "hervorragend" | "gut" | "mittel" | "schlecht",
  L4
> = {
  hervorragend: l4(
    "Fast kein Mondlicht – perfekte Nacht für Milchstrasse und schwache Sterne.",
    "Presque pas de clair de lune – nuit parfaite pour la Voie lactée et les étoiles faibles.",
    "Quasi nessuna luce lunare – notte perfetta per la Via Lattea e le stelle deboli.",
    "Almost no moonlight – a perfect night for the Milky Way and faint stars."
  ),
  gut: l4(
    "Wenig Mondlicht – die meisten Sternbilder sind gut sichtbar.",
    "Peu de clair de lune – la plupart des constellations sont bien visibles.",
    "Poca luce lunare – la maggior parte delle costellazioni è ben visibile.",
    "Little moonlight – most constellations are clearly visible."
  ),
  mittel: l4(
    "Deutliches Mondlicht – helle Sternbilder gehen, schwache Objekte verblassen.",
    "Clair de lune marqué – les constellations brillantes restent visibles, les objets faibles s'estompent.",
    "Luce lunare marcata – le costellazioni luminose si vedono, gli oggetti deboli sbiadiscono.",
    "Noticeable moonlight – bright constellations still work, faint objects fade."
  ),
  schlecht: l4(
    "Heller Mond überstrahlt viele Sterne – dafür ideal für eine Nachtwanderung ohne Lampe.",
    "La lune brillante éclipse beaucoup d'étoiles – en revanche, c'est idéal pour une randonnée nocturne sans lampe.",
    "La luna luminosa copre molte stelle – in compenso è ideale per un'escursione notturna senza lampada.",
    "The bright moon outshines many stars – but it is ideal for a night walk without a lamp."
  ),
};

/** Wie gut eignet sich die Nacht zur Sternbeobachtung? (je dunkler, desto besser) */
export function stargazingQuality(
  illumination: number,
  lang: Language = "de"
): {
  score: "hervorragend" | "gut" | "mittel" | "schlecht";
  note: string;
} {
  const score =
    illumination < 0.15
      ? "hervorragend"
      : illumination < 0.45
        ? "gut"
        : illumination < 0.8
          ? "mittel"
          : "schlecht";
  return { score, note: pick(STARGAZING_NOTES[score], lang) };
}

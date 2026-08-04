/**
 * Feuerverbots-Übersicht nach Kanton (#263): Ergänzung zur Waldbrandgefahr
 * am eigenen Standort.
 *
 * WICHTIGE UNTERSCHEIDUNG, die dieses Modul überhaupt erst nötig macht:
 * Die Waldbrand-GEFAHRENSTUFE ist eine Einschätzung des Bundes (BAFU) und
 * gilt für Warnregionen. Das FEUERVERBOT ist dagegen eine Verfügung –
 * erlassen vom Kanton oder von der Gemeinde, oft mit eigenen Grenzen und
 * eigenem Zeitpunkt. Die Stufe ist ein guter Anhaltspunkt, aber sie IST
 * nicht das Verbot. Genau deshalb nennt jede Zeile die Stufe und verweist
 * für das rechtlich Verbindliche auf die offizielle Seite.
 *
 * Es gibt keine öffentliche Schnittstelle, die alle kantonalen Verfügungen
 * maschinenlesbar führt. Statt eine zu erfinden, holt die Ansicht die
 * amtliche Gefahrenstufe für jeden Kanton (Koordinaten des Hauptorts) über
 * dieselbe GeoAdmin-Abfrage wie der Standort-Wert – und sagt dazu ehrlich,
 * was das heisst und was nicht.
 *
 * Die Kantonsnamen stehen in ihrer AMTLICHEN Sprache («Genève», «Ticino»,
 * «Graubünden») und werden nicht übersetzt. Das ist in der Schweiz üblich,
 * steht auf jedem Ortsschild und erspart vier Namenslisten, die niemand
 * pflegen will.
 */

/** Ein Kanton mit dem Punkt, an dem die Gefahrenstufe geholt wird. */
export interface CantonPoint {
  /** Amtliches Kürzel, z. B. «BE». */
  code: string;
  /** Amtlicher Name in der Sprache des Kantons. */
  name: string;
  /** Hauptort – repräsentativ, aber NICHT für den ganzen Kanton gültig. */
  capital: string;
  latitude: number;
  longitude: number;
}

/**
 * Alle 26 Kantone, alphabetisch nach Kürzel. Der Punkt ist jeweils der
 * Hauptort: Ein Kanton kann mehrere Warnregionen umfassen (Graubünden und
 * Wallis besonders), deshalb steht der Hauptort in der Ansicht dabei –
 * damit klar ist, worauf sich die Stufe bezieht.
 */
export const CANTONS: CantonPoint[] = [
  {
    code: "AG",
    name: "Aargau",
    capital: "Aarau",
    latitude: 47.3903,
    longitude: 8.0457,
  },
  {
    code: "AI",
    name: "Appenzell Innerrhoden",
    capital: "Appenzell",
    latitude: 47.33,
    longitude: 9.409,
  },
  {
    code: "AR",
    name: "Appenzell Ausserrhoden",
    capital: "Herisau",
    latitude: 47.3861,
    longitude: 9.2794,
  },
  {
    code: "BE",
    name: "Bern",
    capital: "Bern",
    latitude: 46.948,
    longitude: 7.4474,
  },
  {
    code: "BL",
    name: "Basel-Landschaft",
    capital: "Liestal",
    latitude: 47.484,
    longitude: 7.735,
  },
  {
    code: "BS",
    name: "Basel-Stadt",
    capital: "Basel",
    latitude: 47.5596,
    longitude: 7.5886,
  },
  {
    code: "FR",
    name: "Fribourg",
    capital: "Fribourg",
    latitude: 46.8065,
    longitude: 7.1615,
  },
  {
    code: "GE",
    name: "Genève",
    capital: "Genève",
    latitude: 46.2044,
    longitude: 6.1432,
  },
  {
    code: "GL",
    name: "Glarus",
    capital: "Glarus",
    latitude: 47.0404,
    longitude: 9.068,
  },
  {
    code: "GR",
    name: "Graubünden",
    capital: "Chur",
    latitude: 46.8508,
    longitude: 9.532,
  },
  {
    code: "JU",
    name: "Jura",
    capital: "Delémont",
    latitude: 47.3644,
    longitude: 7.345,
  },
  {
    code: "LU",
    name: "Luzern",
    capital: "Luzern",
    latitude: 47.0502,
    longitude: 8.3093,
  },
  {
    code: "NE",
    name: "Neuchâtel",
    capital: "Neuchâtel",
    latitude: 46.99,
    longitude: 6.9293,
  },
  {
    code: "NW",
    name: "Nidwalden",
    capital: "Stans",
    latitude: 46.958,
    longitude: 8.366,
  },
  {
    code: "OW",
    name: "Obwalden",
    capital: "Sarnen",
    latitude: 46.8959,
    longitude: 8.2456,
  },
  {
    code: "SG",
    name: "St. Gallen",
    capital: "St. Gallen",
    latitude: 47.4245,
    longitude: 9.3767,
  },
  {
    code: "SH",
    name: "Schaffhausen",
    capital: "Schaffhausen",
    latitude: 47.697,
    longitude: 8.6349,
  },
  {
    code: "SO",
    name: "Solothurn",
    capital: "Solothurn",
    latitude: 47.2088,
    longitude: 7.5323,
  },
  {
    code: "SZ",
    name: "Schwyz",
    capital: "Schwyz",
    latitude: 47.0207,
    longitude: 8.653,
  },
  {
    code: "TG",
    name: "Thurgau",
    capital: "Frauenfeld",
    latitude: 47.5536,
    longitude: 8.8987,
  },
  {
    code: "TI",
    name: "Ticino",
    capital: "Bellinzona",
    latitude: 46.1944,
    longitude: 9.0175,
  },
  {
    code: "UR",
    name: "Uri",
    capital: "Altdorf",
    latitude: 46.8803,
    longitude: 8.6444,
  },
  {
    code: "VD",
    name: "Vaud",
    capital: "Lausanne",
    latitude: 46.5197,
    longitude: 6.6323,
  },
  {
    code: "VS",
    name: "Valais",
    capital: "Sion",
    latitude: 46.2331,
    longitude: 7.3606,
  },
  {
    code: "ZG",
    name: "Zug",
    capital: "Zug",
    latitude: 47.1662,
    longitude: 8.5155,
  },
  {
    code: "ZH",
    name: "Zürich",
    capital: "Zürich",
    latitude: 47.3769,
    longitude: 8.5417,
  },
];

/**
 * Offizielle Übersicht der Kantone und des Bundes. Bewusst EIN Link statt
 * 26 einzelner: Kantonale Adressen ändern sich, ein toter Link zu einem
 * Feuerverbot ist schlimmer als ein Klick mehr.
 */
export const FIRE_BAN_PORTAL = "https://www.waldbrandgefahr.ch/";

/** Kanton anhand des Kürzels finden (Gross-/Kleinschreibung egal). */
export function findCanton(code: string): CantonPoint | null {
  const wanted = (code || "").trim().toUpperCase();
  return CANTONS.find(canton => canton.code === wanted) ?? null;
}

/**
 * Kantone nach Gefahrenstufe ordnen: die heikelsten zuerst, danach
 * alphabetisch. Wer die Übersicht öffnet, will wissen, wo es brennt –
 * nicht, wo das Alphabet beginnt. Kantone ohne geladene Stufe wandern ans
 * Ende, statt eine Null vorzutäuschen.
 */
export function sortByDanger<T extends { code: string; level: number | null }>(
  rows: readonly T[]
): T[] {
  return rows.slice().sort((a, b) => {
    if (a.level === null && b.level === null)
      return a.code.localeCompare(b.code);
    if (a.level === null) return 1;
    if (b.level === null) return -1;
    if (a.level !== b.level) return b.level - a.level;
    return a.code.localeCompare(b.code);
  });
}

/**
 * Ab dieser Stufe verhängen die Kantone erfahrungsgemäss Feuerverbote.
 * Das ist eine FAUSTREGEL für den Hinweistext, keine Rechtsauskunft – die
 * Ansicht sagt das auch so.
 */
export const BAN_LIKELY_FROM_LEVEL = 4;

/** Ist bei dieser Stufe mit einem Verbot zu rechnen? */
export function banLikely(level: number | null): boolean {
  return level !== null && level >= BAN_LIKELY_FROM_LEVEL;
}

/**
 * Zecken-Risiko nach Region (#224): eine ORIENTIERUNGSHILFE, kein
 * medizinischer Rat. Zwei Fragen werden getrennt beantwortet:
 *
 * 1. Gilt der Ort als FSME-Risikogebiet? Das ist eine BEHÖRDLICHE Einstufung
 *    und steht als gepflegter Datensatz hier im Repo – keine externe Abfrage.
 * 2. Wie aktiv sind Zecken gerade? Das hängt an Monat und Höhenlage und wird
 *    gerechnet.
 *
 * Alles reine Logik ohne Netz und ohne DOM, testbar in server/tickRisk.test.ts.
 * Anzeigetexte stehen im Wörterbuch, hier nur die Namen der Kantone.
 */
import { l4, type L4 } from "./i18n";

/**
 * Stand der FSME-Einstufung des BAG: Seit dem 1. Februar 2019 gilt die
 * gesamte Schweiz als FSME-Risikogebiet – mit Ausnahme der Kantone Genf und
 * Tessin. Diese Einstufung ist seither unverändert. Beim Nachführen des
 * Datensatzes dieses Datum mitziehen.
 */
export const FSME_DATA_AS_OF = "2019-02-01";

/** Eine Region der Einstufung – in der Schweiz sind das die Kantone. */
export interface FsmeRegion {
  /** Kantonskürzel (ZH, BE, …) */
  code: string;
  name: L4;
  /** Vom BAG als FSME-Risikogebiet eingestuft? */
  riskArea: boolean;
}

/**
 * Alle 26 Kantone mit ihrer FSME-Einstufung nach BAG (Stand FSME_DATA_AS_OF).
 * Risikogebiet ist alles ausser Genf und Tessin.
 */
export const fsmeRegions: FsmeRegion[] = [
  {
    code: "ZH",
    name: l4("Zürich", "Zurich", "Zurigo", "Zurich"),
    riskArea: true,
  },
  { code: "BE", name: l4("Bern", "Berne", "Berna", "Bern"), riskArea: true },
  {
    code: "LU",
    name: l4("Luzern", "Lucerne", "Lucerna", "Lucerne"),
    riskArea: true,
  },
  { code: "UR", name: l4("Uri", "Uri", "Uri", "Uri"), riskArea: true },
  {
    code: "SZ",
    name: l4("Schwyz", "Schwyz", "Svitto", "Schwyz"),
    riskArea: true,
  },
  {
    code: "OW",
    name: l4("Obwalden", "Obwald", "Obvaldo", "Obwalden"),
    riskArea: true,
  },
  {
    code: "NW",
    name: l4("Nidwalden", "Nidwald", "Nidvaldo", "Nidwalden"),
    riskArea: true,
  },
  {
    code: "GL",
    name: l4("Glarus", "Glaris", "Glarona", "Glarus"),
    riskArea: true,
  },
  { code: "ZG", name: l4("Zug", "Zoug", "Zugo", "Zug"), riskArea: true },
  {
    code: "FR",
    name: l4("Freiburg", "Fribourg", "Friburgo", "Fribourg"),
    riskArea: true,
  },
  {
    code: "SO",
    name: l4("Solothurn", "Soleure", "Soletta", "Solothurn"),
    riskArea: true,
  },
  {
    code: "BS",
    name: l4("Basel-Stadt", "Bâle-Ville", "Basilea Città", "Basel-Stadt"),
    riskArea: true,
  },
  {
    code: "BL",
    name: l4(
      "Basel-Landschaft",
      "Bâle-Campagne",
      "Basilea Campagna",
      "Basel-Landschaft"
    ),
    riskArea: true,
  },
  {
    code: "SH",
    name: l4("Schaffhausen", "Schaffhouse", "Sciaffusa", "Schaffhausen"),
    riskArea: true,
  },
  {
    code: "AR",
    name: l4(
      "Appenzell Ausserrhoden",
      "Appenzell Rhodes-Extérieures",
      "Appenzello Esterno",
      "Appenzell Outer Rhodes"
    ),
    riskArea: true,
  },
  {
    code: "AI",
    name: l4(
      "Appenzell Innerrhoden",
      "Appenzell Rhodes-Intérieures",
      "Appenzello Interno",
      "Appenzell Inner Rhodes"
    ),
    riskArea: true,
  },
  {
    code: "SG",
    name: l4("St. Gallen", "Saint-Gall", "San Gallo", "St Gallen"),
    riskArea: true,
  },
  {
    code: "GR",
    name: l4("Graubünden", "Grisons", "Grigioni", "Grisons"),
    riskArea: true,
  },
  {
    code: "AG",
    name: l4("Aargau", "Argovie", "Argovia", "Aargau"),
    riskArea: true,
  },
  {
    code: "TG",
    name: l4("Thurgau", "Thurgovie", "Turgovia", "Thurgau"),
    riskArea: true,
  },
  {
    code: "TI",
    name: l4("Tessin", "Tessin", "Ticino", "Ticino"),
    riskArea: false,
  },
  { code: "VD", name: l4("Waadt", "Vaud", "Vaud", "Vaud"), riskArea: true },
  {
    code: "VS",
    name: l4("Wallis", "Valais", "Vallese", "Valais"),
    riskArea: true,
  },
  {
    code: "NE",
    name: l4("Neuenburg", "Neuchâtel", "Neuchâtel", "Neuchâtel"),
    riskArea: true,
  },
  {
    code: "GE",
    name: l4("Genf", "Genève", "Ginevra", "Geneva"),
    riskArea: false,
  },
  { code: "JU", name: l4("Jura", "Jura", "Giura", "Jura"), riskArea: true },
];

/** Kanton anhand seines Kürzels (Gross-/Kleinschreibung egal); null = unbekannt. */
export function fsmeRegionByCode(code: string): FsmeRegion | null {
  const wanted = code.trim().toUpperCase();
  return fsmeRegions.find(region => region.code === wanted) ?? null;
}

/** Ein Umriss als Liste von [Länge, Breite]-Paaren. */
type Ring = [number, number][];

/**
 * Grober Umriss der Schweiz. Bewusst vereinfacht (rund 30 Stützpunkte): er
 * soll «ist das überhaupt die Schweiz?» beantworten, nicht Grenzsteine
 * setzen. Direkt an der Grenze kann er danebenliegen – deshalb sagt die
 * Anzeige ausserhalb der Schweiz lieber gar nichts.
 */
const SWITZERLAND: Ring = [
  [7.42, 47.49],
  [7.62, 47.57],
  [8.23, 47.62],
  [8.42, 47.58],
  [8.56, 47.81],
  [8.87, 47.71],
  [9.2, 47.66],
  [9.49, 47.48],
  [9.63, 47.45],
  [9.55, 47.06],
  [9.6, 46.93],
  [10.1, 46.85],
  [10.49, 46.85],
  [10.45, 46.53],
  [10.05, 46.47],
  [10.15, 46.23],
  [9.25, 46.15],
  [9.07, 45.82],
  [8.92, 45.85],
  [8.62, 46.12],
  [8.1, 46.09],
  [7.85, 45.92],
  [7.05, 45.86],
  [6.8, 46.05],
  [6.8, 46.39],
  [6.3, 46.26],
  [6.05, 46.13],
  [5.96, 46.15],
  [5.96, 46.28],
  [6.1, 46.46],
  [6.3, 46.63],
  [6.44, 46.9],
  [6.72, 47.09],
  [7.0, 47.5],
];

/**
 * Grober Umriss des Kantons Genf – einer der beiden Kantone, die NICHT als
 * FSME-Risikogebiet gelten, und darum der einzige Grund, ihn zu kennen.
 */
const GENEVA: Ring = [
  [6.05, 46.13],
  [6.13, 46.13],
  [6.18, 46.15],
  [6.24, 46.21],
  [6.31, 46.25],
  [6.28, 46.31],
  [6.19, 46.36],
  [6.11, 46.32],
  [6.02, 46.28],
  [5.96, 46.26],
  [5.96, 46.18],
  [6.0, 46.14],
];

/**
 * Grober Umriss des Kantons Tessin. Die Mesolcina (Graubünden) schneidet in
 * Wirklichkeit von Osten hinein und ist Risikogebiet – der vereinfachte
 * Umriss schluckt sie. Eine bewusste Unschärfe zugunsten von Einfachheit.
 */
const TICINO: Ring = [
  [8.61, 46.56],
  [8.83, 46.53],
  [9.02, 46.42],
  [9.15, 46.32],
  [9.05, 46.1],
  [9.04, 45.82],
  [8.92, 45.85],
  [8.88, 45.97],
  [8.72, 46.03],
  [8.62, 46.12],
  [8.44, 46.24],
  [8.4, 46.46],
];

/**
 * Punkt-in-Polygon nach dem Strahlverfahren (ray casting): ein Strahl nach
 * Osten schneidet einen geschlossenen Umriss genau dann ungerade oft, wenn
 * der Punkt innen liegt.
 */
function inRing(latitude: number, longitude: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lonI, latI] = ring[i];
    const [lonJ, latJ] = ring[j];
    const crosses = latI > latitude !== latJ > latitude;
    if (!crosses) continue;
    const lonAtLatitude =
      lonI + ((latitude - latI) / (latJ - latI)) * (lonJ - lonI);
    if (longitude < lonAtLatitude) inside = !inside;
  }
  return inside;
}

/**
 * FSME-Einstufung eines Orts:
 * - `risk`: liegt in einem Kanton, den das BAG als Risikogebiet führt,
 * - `no-risk`: liegt in Genf oder im Tessin,
 * - `unknown`: ausserhalb der Schweiz – für andere Länder führt CampMesser
 *   keine Einstufung, und Raten wäre hier fehl am Platz.
 */
export type FsmeStatus = "risk" | "no-risk" | "unknown";

export interface FsmeAssessment {
  status: FsmeStatus;
  /**
   * Der erkannte Kanton – nur für Genf und Tessin, denn nur die beiden
   * müssen vom Rest unterschieden werden. Sonst null.
   */
  region: FsmeRegion | null;
}

/** FSME-Einstufung für Koordinaten (grobe Umrisse, siehe oben). */
export function fsmeStatusAt(
  latitude: number,
  longitude: number
): FsmeAssessment {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { status: "unknown", region: null };
  }
  if (!inRing(latitude, longitude, SWITZERLAND)) {
    return { status: "unknown", region: null };
  }
  if (inRing(latitude, longitude, GENEVA)) {
    return { status: "no-risk", region: fsmeRegionByCode("GE") };
  }
  if (inRing(latitude, longitude, TICINO)) {
    return { status: "no-risk", region: fsmeRegionByCode("TI") };
  }
  return { status: "risk", region: null };
}

/**
 * Höhe, oberhalb derer Zecken kaum noch vorkommen. Der Wert wandert mit dem
 * Klima langsam nach oben; rund 1500 m ist der gebräuchliche Richtwert.
 */
export const TICK_ALTITUDE_LIMIT_M = 1500;

/** Ab hier wird es merklich dünner – die Aktivität sinkt um eine Stufe. */
export const TICK_ALTITUDE_REDUCED_M = 1000;

/** Wie aktiv Zecken gerade sind. */
export type TickActivity = "none" | "low" | "moderate" | "high";

const ACTIVITY_ORDER: TickActivity[] = ["none", "low", "moderate", "high"];

/**
 * Saisonale Grundaktivität nach Monat (1–12) für das Schweizer Mittelland.
 * Zecken werden ab rund 7 °C munter: Frühling ist die stärkste Zeit, im
 * Hochsommer bremst die Trockenheit, im Herbst gibt es einen zweiten Gipfel,
 * im Winter ruht es weitgehend.
 */
const MONTHLY_ACTIVITY: TickActivity[] = [
  "none", // Januar
  "none", // Februar
  "low", // März
  "high", // April
  "high", // Mai
  "high", // Juni
  "moderate", // Juli
  "moderate", // August
  "moderate", // September
  "moderate", // Oktober
  "low", // November
  "none", // Dezember
];

/**
 * Zecken-Aktivität für Monat und Höhenlage. Über TICK_ALTITUDE_LIMIT_M gibt
 * es «none», zwischen TICK_ALTITUDE_REDUCED_M und der Grenze eine Stufe
 * weniger. Eine unbekannte Höhe (null) lässt die Monatsstufe stehen –
 * lieber die vorsichtigere Aussage.
 */
export function tickActivity(
  month: number,
  elevationM: number | null = null
): TickActivity {
  if (!Number.isInteger(month) || month < 1 || month > 12) return "none";
  const base = MONTHLY_ACTIVITY[month - 1];
  if (elevationM === null || !Number.isFinite(elevationM)) return base;
  if (elevationM > TICK_ALTITUDE_LIMIT_M) return "none";
  if (elevationM <= TICK_ALTITUDE_REDUCED_M) return base;
  const step = ACTIVITY_ORDER.indexOf(base);
  return ACTIVITY_ORDER[Math.max(0, step - 1)];
}

export interface TickRiskAssessment {
  activity: TickActivity;
  status: FsmeStatus;
  region: FsmeRegion | null;
  /** Über der Höhe, ab der Zecken kaum noch vorkommen */
  aboveTickLine: boolean;
  /**
   * Lohnt sich der Hinweis überhaupt? Nur wenn Zecken gerade aktiv sind –
   * im Januar auf 2000 m braucht niemand einen Zecken-Kasten.
   */
  relevant: boolean;
}

/**
 * Gesamteinschätzung für einen Ort: behördliche FSME-Einstufung UND
 * saisonale Aktivität. Bewusst zwei getrennte Aussagen – ein Risikogebiet
 * bleibt eines, auch wenn im Januar keine Zecke unterwegs ist.
 */
export function assessTickRisk(options: {
  month: number;
  elevationM?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}): TickRiskAssessment {
  const elevationM = options.elevationM ?? null;
  const activity = tickActivity(options.month, elevationM);
  const fsme =
    options.latitude != null && options.longitude != null
      ? fsmeStatusAt(options.latitude, options.longitude)
      : { status: "unknown" as FsmeStatus, region: null };
  return {
    activity,
    status: fsme.status,
    region: fsme.region,
    aboveTickLine:
      elevationM !== null &&
      Number.isFinite(elevationM) &&
      elevationM > TICK_ALTITUDE_LIMIT_M,
    relevant: activity !== "none",
  };
}

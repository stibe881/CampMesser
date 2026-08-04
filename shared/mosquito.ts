/**
 * Stechmücken-Index (#262): Wie unangenehm wird der Abend?
 *
 * Es gibt keine Messstationen für Mücken. Was es gibt, ist Wetter – und
 * drei Grössen, die in der Fachliteratur immer wieder als bestimmend
 * auftauchen: WÄRME (Flugaktivität beginnt bei rund 10 °C, Optimum um
 * 25–30 °C), FEUCHTE (trockene Luft trocknet die Tiere aus, ab etwa 70 %
 * relativer Feuchte fliegen sie gern) und WIND (ab rund 10 km/h wird
 * Fliegen mühsam, ab 15 km/h hört es praktisch auf). Dazu kommt stehendes
 * Wasser als Brutstätte, für das der Regen der letzten Tage ein grober
 * Anhaltspunkt ist.
 *
 * EHRLICH: Das ist eine Schätzung aus Wetterdaten, keine Zählung. Ein
 * Weiher zehn Meter neben dem Zelt schlägt jede Formel. Deshalb gibt der
 * Index eine STUFE mit Handlungsempfehlung aus und keine Mückenzahl – eine
 * Zahl wie «37 Mücken pro Stunde» wäre erfunden.
 *
 * Reine Rechnerei ohne Abruf – Client, Server und Tests teilen sie.
 */
import { l4, pick, type L4, type Language } from "./i18n";

export const MOSQUITO_LEVELS = [
  "keine",
  "wenig",
  "spuerbar",
  "stark",
  "plage",
] as const;
export type MosquitoLevel = (typeof MOSQUITO_LEVELS)[number];

/** Anzeige-Namen der Stufen. */
export const MOSQUITO_LEVEL_LABELS: Record<MosquitoLevel, L4> = {
  keine: l4("Ruhe", "Calme", "Tranquillo", "Quiet"),
  wenig: l4("Wenige", "Peu", "Poche", "Few"),
  spuerbar: l4("Spürbar", "Sensible", "Sensibile", "Noticeable"),
  stark: l4("Stark", "Fort", "Forte", "Heavy"),
  plage: l4("Plage", "Invasion", "Flagello", "Plague"),
};

/** Was man bei dieser Stufe tut. */
export const MOSQUITO_LEVEL_ADVICE: Record<MosquitoLevel, L4> = {
  keine: l4(
    "Kein Grund zur Sorge – der Abend gehört dir.",
    "Rien à craindre – la soirée est à toi.",
    "Nessun problema – la serata è tua.",
    "Nothing to worry about – the evening is yours."
  ),
  wenig: l4(
    "Einzelne Stiche möglich. Lange Kleidung reicht meist.",
    "Quelques piqûres possibles. Des vêtements longs suffisent en général.",
    "Qualche puntura possibile. Di solito bastano abiti lunghi.",
    "The odd bite is possible. Long clothing is usually enough."
  ),
  spuerbar: l4(
    "Mittel auftragen, lange Ärmel anziehen, Moskitonetz bereitlegen.",
    "Applique un répulsif, mets des manches longues, prépare la moustiquaire.",
    "Metti il repellente, maniche lunghe, prepara la zanzariera.",
    "Put on repellent, wear long sleeves, get the mosquito net ready."
  ),
  stark: l4(
    "Mittel auf alle freien Stellen, Zelt früh schliessen, Netz aufhängen. Rauch vom Feuer hilft ein wenig.",
    "Répulsif sur toutes les zones découvertes, ferme la tente tôt, suspends la moustiquaire. La fumée du feu aide un peu.",
    "Repellente su tutte le parti scoperte, chiudi la tenda presto, appendi la zanzariera. Il fumo del fuoco aiuta un po'.",
    "Repellent on every bare patch, close the tent early, hang the net. Smoke from the fire helps a little."
  ),
  plage: l4(
    "Draussen wird es ungemütlich. Zelt geschlossen halten, Netz zwingend, Essen nach drinnen verlegen.",
    "Dehors, ce sera pénible. Garde la tente fermée, moustiquaire indispensable, mange à l'intérieur.",
    "Fuori sarà sgradevole. Tieni la tenda chiusa, zanzariera indispensabile, mangia dentro.",
    "Outside will be miserable. Keep the tent shut, the net is a must, eat indoors."
  ),
};

export interface MosquitoInput {
  /** Lufttemperatur in °C. */
  temperatureC: number;
  /** Relative Luftfeuchte in Prozent (0–100). */
  humidityPercent: number;
  /** Windgeschwindigkeit in km/h. */
  windKmh: number;
  /**
   * Niederschlag der letzten Tage in Millimetern – grober Anhaltspunkt für
   * stehendes Wasser als Brutstätte. Optional; ohne Wert wird der Faktor
   * neutral gesetzt, statt Regen zu erfinden.
   */
  recentRainMm?: number;
}

export interface MosquitoResult {
  /** 0–100. Keine Mückenzahl, sondern eine Lästigkeits-Skala. */
  score: number;
  level: MosquitoLevel;
  /** Welche Grösse hält den Wert unten? null, wenn nichts bremst. */
  limitingFactor: "kalt" | "trocken" | "wind" | null;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Wärme-Faktor: unter 10 °C fliegt nichts, ab 25 °C ist das Optimum
 * erreicht, sehr grosse Hitze bremst wieder leicht (über 35 °C suchen die
 * Tiere Schatten).
 */
export function temperatureFactor(temperatureC: number): number {
  const t = Number.isFinite(temperatureC) ? temperatureC : 0;
  if (t < 10) return 0;
  if (t < 25) return clamp01((t - 10) / 15);
  if (t <= 35) return 1;
  return clamp01(1 - (t - 35) / 10);
}

/**
 * Feuchte-Faktor: unter 40 % rF praktisch nichts, ab 80 % voll. Dazwischen
 * linear – feiner wäre Genauigkeitstheater.
 */
export function humidityFactor(humidityPercent: number): number {
  const h = Number.isFinite(humidityPercent) ? humidityPercent : 0;
  return clamp01((h - 40) / 40);
}

/**
 * Wind-Faktor: bis 5 km/h stört nichts, ab 15 km/h ist Schluss. Der Wind
 * ist der stärkste Hebel überhaupt – ein luftiger Platz ist der beste
 * Mückenschutz, und genau das soll der Index zeigen.
 */
export function windFactor(windKmh: number): number {
  const w = Number.isFinite(windKmh) ? Math.max(0, windKmh) : 0;
  if (w <= 5) return 1;
  if (w >= 15) return 0;
  return clamp01(1 - (w - 5) / 10);
}

/**
 * Brut-Faktor aus dem Regen der letzten Tage: ohne Angabe neutral (0.8),
 * bei anhaltender Trockenheit weniger, nach ergiebigem Regen mehr. Der
 * Wert steigt bis 30 mm und danach nicht weiter – ab einer gewissen Menge
 * gibt es genug Pfützen, mehr Wasser bringt keine zusätzlichen Mücken.
 */
export function breedingFactor(recentRainMm: number | undefined): number {
  if (recentRainMm === undefined || !Number.isFinite(recentRainMm)) return 0.8;
  const mm = Math.max(0, recentRainMm);
  return 0.6 + 0.4 * clamp01(mm / 30);
}

/** Stufe aus dem Punktwert. */
export function mosquitoLevel(score: number): MosquitoLevel {
  if (score < 10) return "keine";
  if (score < 30) return "wenig";
  if (score < 55) return "spuerbar";
  if (score < 78) return "stark";
  return "plage";
}

/**
 * Index berechnen. Die drei Wetter-Faktoren werden MULTIPLIZIERT und nicht
 * gemittelt: Jeder von ihnen kann für sich allein alles beenden. Bei 6 °C
 * ist es egal, wie feucht und windstill es ist – es fliegt nichts. Ein
 * Mittelwert würde daraus fälschlich «mittleres Aufkommen» machen.
 */
export function mosquitoIndex(input: MosquitoInput): MosquitoResult {
  const temp = temperatureFactor(input.temperatureC);
  const humidity = humidityFactor(input.humidityPercent);
  const wind = windFactor(input.windKmh);
  const breeding = breedingFactor(input.recentRainMm);
  const score = Math.round(temp * humidity * wind * breeding * 100);
  const weakest = Math.min(temp, humidity, wind);
  const limitingFactor =
    score >= 55 || weakest > 0.6
      ? null
      : weakest === temp
        ? "kalt"
        : weakest === humidity
          ? "trocken"
          : "wind";
  return { score, level: mosquitoLevel(score), limitingFactor };
}

/** Stufen-Label in der aktiven Sprache. */
export function mosquitoLevelLabel(
  level: MosquitoLevel,
  lang: Language = "de"
): string {
  return pick(MOSQUITO_LEVEL_LABELS[level], lang);
}

/** Handlungsempfehlung in der aktiven Sprache. */
export function mosquitoAdvice(
  level: MosquitoLevel,
  lang: Language = "de"
): string {
  return pick(MOSQUITO_LEVEL_ADVICE[level], lang);
}

/**
 * Die Dämmerung ist die Hauptflugzeit. Für den Abend zählt deshalb nicht
 * der Tagesdurchschnitt, sondern das SCHLECHTESTE, was zwischen den
 * gegebenen Stunden zusammenkommt – wer um acht draussen sitzt, hat nichts
 * davon, dass es um zwei Uhr nachmittags windig war.
 */
export function eveningMosquitoIndex(
  hours: readonly (MosquitoInput & { hour: number })[],
  fromHour = 18,
  toHour = 23
): MosquitoResult | null {
  const evening = hours.filter(h => h.hour >= fromHour && h.hour <= toHour);
  if (evening.length === 0) return null;
  return evening
    .map(h => mosquitoIndex(h))
    .reduce((worst, current) =>
      current.score > worst.score ? current : worst
    );
}

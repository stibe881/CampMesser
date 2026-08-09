/**
 * Luftqualität (#565): Der europäische Luftqualitätsindex (EAQI) von
 * Open-Meteo, übersetzt in eine Ampel mit Worten.
 *
 * WARUM DER EAQI UND NICHT DER US-AQI: Die App lebt in Europa – die
 * Bänder des EAQI (0–20 gut … über 100 extrem schlecht) entsprechen den
 * europäischen Grenzwerten, mit denen auch die amtlichen Karten arbeiten.
 *
 * Reine Daten und Funktionen – Client und Tests teilen sie. Der Abruf
 * selbst passiert im Client (air-quality-api.open-meteo.com).
 */
import { l4, pick, type L4, type Language } from "./i18n";

export const AIR_QUALITY_LEVELS = [
  "gut",
  "ordentlich",
  "maessig",
  "schlecht",
  "sehrSchlecht",
  "extrem",
] as const;
export type AirQualityLevel = (typeof AIR_QUALITY_LEVELS)[number];

/** Obergrenzen der EAQI-Bänder (der letzte ist offen). */
const LEVEL_MAX: [AirQualityLevel, number][] = [
  ["gut", 20],
  ["ordentlich", 40],
  ["maessig", 60],
  ["schlecht", 80],
  ["sehrSchlecht", 100],
];

const LEVEL_LABELS: Record<AirQualityLevel, L4> = {
  gut: l4("Gut", "Bonne", "Buona", "Good"),
  ordentlich: l4("Ordentlich", "Correcte", "Discreta", "Fair"),
  maessig: l4("Mässig", "Moyenne", "Moderata", "Moderate"),
  schlecht: l4("Schlecht", "Mauvaise", "Scarsa", "Poor"),
  sehrSchlecht: l4(
    "Sehr schlecht",
    "Très mauvaise",
    "Molto scarsa",
    "Very poor"
  ),
  extrem: l4(
    "Extrem schlecht",
    "Extrêmement mauvaise",
    "Estremamente scarsa",
    "Extremely poor"
  ),
};

/** Ampelfarben je Stufe (Hex, für Punkt/Badge – Text bleibt Text). */
export const AIR_QUALITY_COLORS: Record<AirQualityLevel, string> = {
  gut: "#16a34a",
  ordentlich: "#65a30d",
  maessig: "#eab308",
  schlecht: "#f97316",
  sehrSchlecht: "#dc2626",
  extrem: "#7c3aed",
};

/** EAQI-Wert in die Stufe übersetzen; unsinnige Werte gelten als «gut» 0. */
export function airQualityLevel(aqi: number): AirQualityLevel {
  if (!Number.isFinite(aqi) || aqi < 0) return "gut";
  for (const [level, max] of LEVEL_MAX) {
    if (aqi <= max) return level;
  }
  return "extrem";
}

export function airQualityLabel(
  level: AirQualityLevel,
  lang: Language = "de"
): string {
  return pick(LEVEL_LABELS[level], lang);
}

/**
 * Ab hier lohnt sich ein Hinweis von selbst (Morgen-Briefing #565):
 * «schlecht» und schlimmer – «mässig» wäre an vielen Tagen Lärm.
 */
export function airQualityNoteworthy(aqi: number): boolean {
  const level = airQualityLevel(aqi);
  return level === "schlecht" || level === "sehrSchlecht" || level === "extrem";
}

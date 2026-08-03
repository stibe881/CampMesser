/**
 * Mass- & Temperatur-Umrechner fürs Kochen am Platz (#232): Tasse/Esslöffel/
 * Teelöffel ↔ Milliliter, Gramm ↔ Milliliter für die gängigsten Zutaten,
 * °C ↔ °F und Backofen-Temperatur ↔ Gasstufe. Reine Funktionen ohne DOM –
 * von der Rezept-Seite und den Tests genutzt.
 *
 * Schweizer Küchenmasse: 1 Tasse = 2 dl (nicht das amerikanische Cup mit
 * 2,4 dl), 1 EL = 15 ml, 1 TL = 5 ml. Die Dichten sind Küchenwerte für
 * gehäufte, ungesiebte Zutaten – gut genug fürs Lagerfeuer, keine Laborware.
 */
import { l4, type L4 } from "./i18n";

/** Volumenmasse in Anzeige-Reihenfolge (klein → gross). */
export const VOLUME_UNITS = [
  "tsp",
  "tbsp",
  "cup",
  "ml",
  "cl",
  "dl",
  "l",
] as const;
export type VolumeUnit = (typeof VOLUME_UNITS)[number];

/** Wie viele Milliliter ein Mass fasst. */
export const VOLUME_ML: Record<VolumeUnit, number> = {
  tsp: 5,
  tbsp: 15,
  cup: 200,
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
};

/** Anzeige-Labels der Volumenmasse (Schlüssel bleiben englisch). */
export const VOLUME_LABELS: Record<VolumeUnit, L4> = {
  tsp: l4("TL (Teelöffel)", "cc (cuillère à café)", "cucchiaino", "tsp"),
  tbsp: l4("EL (Esslöffel)", "cs (cuillère à soupe)", "cucchiaio", "tbsp"),
  cup: l4("Tasse (2 dl)", "tasse (2 dl)", "tazza (2 dl)", "cup (2 dl)"),
  ml: l4("ml", "ml", "ml", "ml"),
  cl: l4("cl", "cl", "cl", "cl"),
  dl: l4("dl", "dl", "dl", "dl"),
  l: l4("Liter", "litre", "litro", "litre"),
};

/** Kurzform fürs Ergebnis-Raster («2 dl», «13,3 EL»). */
export const VOLUME_SHORT_LABELS: Record<VolumeUnit, L4> = {
  tsp: l4("TL", "cc", "cucchiaini", "tsp"),
  tbsp: l4("EL", "cs", "cucchiai", "tbsp"),
  cup: l4("Tassen", "tasses", "tazze", "cups"),
  ml: l4("ml", "ml", "ml", "ml"),
  cl: l4("cl", "cl", "cl", "cl"),
  dl: l4("dl", "dl", "dl", "dl"),
  l: l4("l", "l", "l", "l"),
};

/** Volumen von einem Mass ins andere rechnen. */
export function convertVolume(
  value: number,
  from: VolumeUnit,
  to: VolumeUnit
): number {
  if (!Number.isFinite(value)) return 0;
  return (value * VOLUME_ML[from]) / VOLUME_ML[to];
}

/** Zutaten mit hinterlegter Dichte für die g ↔ ml-Umrechnung. */
export const DENSITY_INGREDIENTS = [
  "flour",
  "sugar",
  "rice",
  "oil",
  "water",
  "milk",
] as const;
export type DensityIngredient = (typeof DENSITY_INGREDIENTS)[number];

/** Küchendichte in Gramm pro Milliliter. */
export const DENSITY_G_PER_ML: Record<DensityIngredient, number> = {
  flour: 0.55,
  sugar: 0.85,
  rice: 0.85,
  oil: 0.92,
  water: 1,
  milk: 1.03,
};

/** Anzeige-Labels der Zutaten (Schlüssel bleiben englisch). */
export const DENSITY_INGREDIENT_LABELS: Record<DensityIngredient, L4> = {
  flour: l4("Mehl", "Farine", "Farina", "Flour"),
  sugar: l4("Zucker", "Sucre", "Zucchero", "Sugar"),
  rice: l4("Reis", "Riz", "Riso", "Rice"),
  oil: l4("Öl", "Huile", "Olio", "Oil"),
  water: l4("Wasser", "Eau", "Acqua", "Water"),
  milk: l4("Milch", "Lait", "Latte", "Milk"),
};

/** Gramm einer Zutat in Milliliter umrechnen. */
export function gramsToMl(
  grams: number,
  ingredient: DensityIngredient
): number {
  if (!Number.isFinite(grams)) return 0;
  return grams / DENSITY_G_PER_ML[ingredient];
}

/** Milliliter einer Zutat in Gramm umrechnen. */
export function mlToGrams(ml: number, ingredient: DensityIngredient): number {
  if (!Number.isFinite(ml)) return 0;
  return ml * DENSITY_G_PER_ML[ingredient];
}

/** Grad Celsius in Grad Fahrenheit. */
export function celsiusToFahrenheit(celsius: number): number {
  if (!Number.isFinite(celsius)) return 0;
  return celsius * 1.8 + 32;
}

/** Grad Fahrenheit in Grad Celsius. */
export function fahrenheitToCelsius(fahrenheit: number): number {
  if (!Number.isFinite(fahrenheit)) return 0;
  return (fahrenheit - 32) / 1.8;
}

/** Eine Stufe der Backofen-Tabelle (Gasflamme bzw. Stufe am Drehknopf). */
export interface OvenLevel {
  /** Gasstufe 1–9 (britische «gas mark», auf Gasöfen weit verbreitet). */
  gasMark: number;
  celsius: number;
  /** Kurze Einordnung der Hitze. */
  label: L4;
}

const OVEN_LABELS = {
  veryLow: l4("sehr schwach", "très doux", "molto basso", "very low"),
  low: l4("schwach", "doux", "basso", "low"),
  medium: l4("mittel", "moyen", "medio", "moderate"),
  hot: l4("heiss", "chaud", "caldo", "hot"),
  veryHot: l4("sehr heiss", "très chaud", "molto caldo", "very hot"),
};

/**
 * Backofen-Temperatur ↔ Gasstufe (Ober-/Unterhitze). Die Tabelle folgt den
 * gängigen Entsprechungen der Gasstufen 1–9.
 */
export const OVEN_LEVELS: OvenLevel[] = [
  { gasMark: 1, celsius: 140, label: OVEN_LABELS.veryLow },
  { gasMark: 2, celsius: 150, label: OVEN_LABELS.low },
  { gasMark: 3, celsius: 170, label: OVEN_LABELS.low },
  { gasMark: 4, celsius: 180, label: OVEN_LABELS.medium },
  { gasMark: 5, celsius: 190, label: OVEN_LABELS.medium },
  { gasMark: 6, celsius: 200, label: OVEN_LABELS.hot },
  { gasMark: 7, celsius: 220, label: OVEN_LABELS.hot },
  { gasMark: 8, celsius: 230, label: OVEN_LABELS.veryHot },
  { gasMark: 9, celsius: 240, label: OVEN_LABELS.veryHot },
];

/**
 * Nächstgelegene Gasstufe zu einer Temperatur. Bei genau gleichem Abstand
 * gewinnt die tiefere Stufe – lieber etwas zu wenig Hitze als verbrannt.
 * Unter 100 °C bzw. über 280 °C gibt es keine sinnvolle Stufe (null).
 */
export function ovenLevelForCelsius(celsius: number): OvenLevel | null {
  if (!Number.isFinite(celsius) || celsius < 100 || celsius > 280) return null;
  let best = OVEN_LEVELS[0];
  let bestDistance = Math.abs(best.celsius - celsius);
  OVEN_LEVELS.forEach(level => {
    const distance = Math.abs(level.celsius - celsius);
    if (distance < bestDistance) {
      best = level;
      bestDistance = distance;
    }
  });
  return best;
}

/** Temperatur zu einer Gasstufe – null bei unbekannter Stufe. */
export function celsiusForGasMark(gasMark: number): number | null {
  const level = OVEN_LEVELS.find(l => l.gasMark === gasMark);
  return level ? level.celsius : null;
}

/**
 * Ergebnis einer Umrechnung fürs Anzeigen runden: ab 100 auf ganze Zahlen,
 * ab 10 auf eine Nachkommastelle, darunter auf zwei. Sehr kleine Werte
 * behalten zwei Nachkommastellen statt zu 0 zu werden.
 */
export function roundResult(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const abs = Math.abs(value);
  if (abs >= 100) return Math.round(value);
  if (abs >= 10) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

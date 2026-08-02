/**
 * Rasenschoner-Rechner: Schätzt, wie lange ein Zelt auf Rasen stehen darf,
 * bevor das Gras Schaden nimmt.
 *
 * Grundlage: Gras vergilbt unter Lichtabschluss (Etiolierung) je nach
 * Bedingungen nach ca. 1–14 Tagen. Wachstum (Wärme + Feuchte) beschleunigt
 * die Schädigung, weil das Gras aktiv Licht braucht; Hitze unter dem
 * Zeltboden wirkt zusätzlich wie ein Treibhaus.
 */

import { l4, pick, type Language } from "./i18n";

export type FloorType = "mesh" | "standard" | "footprint";
export type GrassCondition = "robust" | "normal" | "delicate";
export type SunExposure = "shade" | "partial" | "full";
export type Moisture = "dry" | "normal" | "wet";

export interface LawnInput {
  /** Zeltboden: Mesh/ohne Boden, Standard-Zeltboden, Zeltboden + Footprint/Plane */
  floor: FloorType;
  /** Graszustand: robuster Sportrasen, normaler Wiesenrasen, empfindlicher Zierrasen */
  grass: GrassCondition;
  /** Tagestemperatur in °C */
  temperature: number;
  /** Sonneneinstrahlung am Stellplatz */
  sun: SunExposure;
  /** Bodenfeuchte */
  moisture: Moisture;
}

export type LawnVerdict = "safe" | "caution" | "damage";

export interface LawnResult {
  /** Stunden bis erste sichtbare Vergilbung */
  yellowingHours: number;
  /** Stunden bis bleibende Schäden wahrscheinlich werden */
  damageHours: number;
  /** Empfehlung: Zelt spätestens nach dieser Zeit umstellen (Stunden) */
  moveAfterHours: number;
}

/** Bewertung einer geplanten Standzeit gegen das Ergebnis. */
export function lawnVerdict(
  plannedHours: number,
  result: LawnResult
): LawnVerdict {
  if (plannedHours <= result.yellowingHours) return "safe";
  if (plannedHours <= result.damageHours) return "caution";
  return "damage";
}

/**
 * Kern-Berechnung. Basis: normaler Rasen, Standard-Boden, 20 °C, Halbschatten,
 * normale Feuchte → Vergilbung nach ~72 h, bleibende Schäden nach ~168 h (7 Tage).
 */
export function estimateLawnTolerance(input: LawnInput): LawnResult {
  let yellowing = 72;

  // Zeltboden: Mesh lässt Licht/Luft durch, Footprint dichtet komplett ab
  const floorFactor: Record<FloorType, number> = {
    mesh: 1.6,
    standard: 1.0,
    footprint: 0.7,
  };
  yellowing *= floorFactor[input.floor];

  // Graszustand
  const grassFactor: Record<GrassCondition, number> = {
    robust: 1.35,
    normal: 1.0,
    delicate: 0.6,
  };
  yellowing *= grassFactor[input.grass];

  // Temperatur: unter 10 °C ruht das Gras (träge, toleranter). Über 20 °C
  // beschleunigen Wachstum und Hitzestau die Schädigung deutlich.
  if (input.temperature < 10) yellowing *= 1.4;
  else if (input.temperature > 30) yellowing *= 0.5;
  else if (input.temperature > 25) yellowing *= 0.65;
  else if (input.temperature > 20) yellowing *= 0.85;

  // Sonne: pralle Sonne heizt den Zeltboden auf (Kochplatten-Effekt)
  const sunFactor: Record<SunExposure, number> = {
    shade: 1.25,
    partial: 1.0,
    full: 0.7,
  };
  yellowing *= sunFactor[input.sun];

  // Feuchte: nasser Boden unter dichtem Zelt schimmelt/fault schneller,
  // knochentrockener Rasen ist bereits gestresst
  const moistureFactor: Record<Moisture, number> = {
    dry: 0.85,
    normal: 1.0,
    wet: 0.75,
  };
  yellowing *= moistureFactor[input.moisture];

  // Grenzen: mindestens 12 h (ein Übernachten schadet praktisch nie), max. 10 Tage
  yellowing = Math.min(240, Math.max(12, yellowing));

  // Bleibende Schäden: ca. 2.3-fache der Vergilbungszeit
  const damage = Math.min(336, yellowing * 2.3);

  // Empfehlung: umstellen bei ~80 % der Vergilbungszeit
  const moveAfter = Math.max(12, Math.round(yellowing * 0.8));

  return {
    yellowingHours: Math.round(yellowing),
    damageHours: Math.round(damage),
    moveAfterHours: moveAfter,
  };
}

/** Stunden in lesbaren Text umwandeln, z. B. 60 → "2 Tage 12 Std." */
export function formatHours(hours: number, lang: Language = "de"): string {
  const hourUnit = pick(l4("Std.", "h", "h", "h"), lang);
  if (hours < 24) return `${Math.round(hours)} ${hourUnit}`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours % 24);
  const dayWord = pick(
    days > 1
      ? l4("Tage", "jours", "giorni", "days")
      : l4("Tag", "jour", "giorno", "day"),
    lang
  );
  return rest > 0
    ? `${days} ${dayWord} ${rest} ${hourUnit}`
    : `${days} ${dayWord}`;
}

/**
 * Bodenfeuchte-Kategorie aus Wetterdaten ableiten.
 * Primär: volumetrische Bodenfeuchte (0–7 cm) aus der Prognose (m³/m³).
 *   Richtwerte für Wiesenböden: < 0.15 trocken, 0.15–0.30 normal, > 0.30 nass.
 * Fallback: Niederschlagssumme der letzten 48 h (mm), wenn keine
 *   Bodenfeuchte-Daten verfügbar sind: >= 5 mm nass, >= 0.5 mm normal, sonst trocken.
 */
export function deriveMoisture(
  soilMoisture: number | null | undefined,
  rain48hMm: number
): Moisture {
  if (typeof soilMoisture === "number" && Number.isFinite(soilMoisture)) {
    if (soilMoisture > 0.3) return "wet";
    if (soilMoisture >= 0.15) return "normal";
    return "dry";
  }
  if (rain48hMm >= 5) return "wet";
  if (rain48hMm >= 0.5) return "normal";
  return "dry";
}

/**
 * Pollenflug: Stufen-Logik und Parser für die Open-Meteo Air-Quality-API
 * (CAMS-Europa-Modell, stündliche Pollenkonzentrationen in Körnern/m³).
 * Reine Funktionen – von Client und Tests genutzt. Anzeigetexte als L4,
 * Default-Sprache bleibt Deutsch.
 */

import { l4, pick, type L4, type Language } from "./i18n";

export const POLLEN_TYPES = [
  "alder",
  "birch",
  "grass",
  "mugwort",
  "olive",
  "ragweed",
] as const;

export type PollenType = (typeof POLLEN_TYPES)[number];

/** Feldnamen der Air-Quality-API pro Pollenart */
const POLLEN_API_FIELDS: Record<PollenType, string> = {
  alder: "alder_pollen",
  birch: "birch_pollen",
  grass: "grass_pollen",
  mugwort: "mugwort_pollen",
  olive: "olive_pollen",
  ragweed: "ragweed_pollen",
};

const POLLEN_NAMES: Record<PollenType, L4> = {
  alder: l4("Erle", "Aulne", "Ontano", "Alder"),
  birch: l4("Birke", "Bouleau", "Betulla", "Birch"),
  grass: l4("Gräser", "Graminées", "Graminacee", "Grass"),
  mugwort: l4("Beifuss", "Armoise", "Artemisia", "Mugwort"),
  olive: l4("Olive", "Olivier", "Olivo", "Olive"),
  ragweed: l4("Ambrosia", "Ambroisie", "Ambrosia", "Ragweed"),
};

export type PollenLevel = "keine" | "gering" | "maessig" | "hoch" | "sehrHoch";

const POLLEN_LEVEL_LABELS: Record<PollenLevel, L4> = {
  keine: l4("keine", "aucune", "nessuno", "none"),
  gering: l4("gering", "faible", "debole", "low"),
  maessig: l4("mässig", "modérée", "moderato", "moderate"),
  hoch: l4("hoch", "forte", "forte", "high"),
  sehrHoch: l4("sehr hoch", "très forte", "molto forte", "very high"),
};

/**
 * Konzentration (Körner/m³) in eine Belastungsstufe übersetzen.
 * Schwellen: 0 = keine, unter 10 gering, unter 50 mässig, unter 100 hoch,
 * darüber sehr hoch.
 */
export function pollenLevel(value: number): PollenLevel {
  if (value <= 0) return "keine";
  if (value < 10) return "gering";
  if (value < 50) return "maessig";
  if (value < 100) return "hoch";
  return "sehrHoch";
}

/** Name der Pollenart in der gewünschten Sprache. */
export function pollenTypeName(
  type: PollenType,
  lang: Language = "de"
): string {
  return pick(POLLEN_NAMES[type], lang);
}

/** Stufen-Label in der gewünschten Sprache. */
export function describePollenLevel(
  level: PollenLevel,
  lang: Language = "de"
): string {
  return pick(POLLEN_LEVEL_LABELS[level], lang);
}

export interface PollenReading {
  type: PollenType;
  /** Konzentration in Körnern/m³ (nie negativ) */
  value: number;
  level: PollenLevel;
}

/** Request-URL der Open-Meteo Air-Quality-API für die sechs Pollenarten. */
export function pollenRequestUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: POLLEN_TYPES.map(t => POLLEN_API_FIELDS[t]).join(","),
    timezone: "auto",
    forecast_days: "1",
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
}

/**
 * Air-Quality-Antwort in die aktuellen Pollenwerte übersetzen.
 * Gewählt wird die letzte Stunde, die nicht in der Zukunft liegt (die API
 * liefert bei timezone=auto Ortszeit-Strings). Arten ohne Zahlenwert (null,
 * z. B. ausserhalb der Europa-Abdeckung) werden übersprungen; gibt es gar
 * keine Werte, ist das Ergebnis null («keine Daten»).
 */
export function parsePollenResponse(
  json: unknown,
  nowMs: number = Date.now()
): PollenReading[] | null {
  if (!json || typeof json !== "object") return null;
  const hourly = (json as { hourly?: unknown }).hourly;
  if (!hourly || typeof hourly !== "object") return null;
  const h = hourly as Record<string, unknown>;
  const times = h.time;
  if (!Array.isArray(times) || times.length === 0) return null;

  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (typeof t !== "string") continue;
    const ms = new Date(t).getTime();
    if (Number.isFinite(ms) && ms <= nowMs) idx = i;
  }

  const readings: PollenReading[] = [];
  POLLEN_TYPES.forEach(type => {
    const values = h[POLLEN_API_FIELDS[type]];
    if (!Array.isArray(values)) return;
    const raw = values[idx];
    if (typeof raw !== "number" || !Number.isFinite(raw)) return;
    const value = Math.max(0, raw);
    readings.push({ type, value, level: pollenLevel(value) });
  });

  return readings.length > 0 ? readings : null;
}

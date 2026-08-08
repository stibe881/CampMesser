/**
 * Wetter-basierte Packvorschläge vor dem Trip: reine Regeln über die
 * Tages-Prognose des Reisezeitraums. Jede Regel schlägt konkrete Einträge
 * mit Begründung vor – vollständig übersetzt (L4), die Aufrufstelle wählt
 * mit `lang` die Sprache, in der die Einträge angezeigt und gespeichert werden.
 */
import { l4, pick, type L4, type Language } from "./i18n";
import { packCategories } from "./packTemplates";

/** Ein Prognose-Tag des Reisezeitraums (Open-Meteo daily). */
export interface ForecastDay {
  /** Tageshöchsttemperatur in °C */
  tMax: number;
  /** Tagestiefsttemperatur in °C */
  tMin: number;
  /** Maximale Regenwahrscheinlichkeit in % */
  precipProb: number;
  /** Maximale Windböen in km/h (optional, fehlt bei manchen Quellen) */
  windMax?: number;
}

/** Ab dieser Regenwahrscheinlichkeit (%) greift die Regen-Regel. */
export const RAIN_PROB_THRESHOLD = 50;
/** Ab dieser Tageshöchsttemperatur (°C) greift die Hitze-Regel. */
export const HEAT_TMAX_THRESHOLD = 28;
/** Ab dieser Tagestiefsttemperatur (°C) und darunter greift die Kälte-Regel. */
export const COLD_TMIN_THRESHOLD = 8;
/** Ab dieser Böen-Geschwindigkeit (km/h) greift die Wind-Regel. */
export const WIND_MAX_THRESHOLD = 40;

/** Ein Packvorschlag in der gewählten Sprache. */
export interface PackSuggestion {
  name: string;
  category: string;
  reason: string;
}

/** Interner Vorschlag mit allen Sprachen; `name.de` dient als Dedup-Schlüssel. */
interface SuggestionL4 {
  name: L4;
  category: L4;
  reason: L4;
  /**
   * Gehört zur Zelt-Ausrüstung (#464)? Solche Zeilen fallen weg, wenn die
   * Reise-Art nicht draussen übernachtet (Hotel, Städtereise …).
   */
  tent?: boolean;
}

/** Gemeinsamer Eintrag der Regen- und Wind-Regel (wird dedupliziert). */
const extraPegs = l4(
  "Zusätzliche Heringe",
  "Sardines supplémentaires",
  "Picchetti supplementari",
  "Extra tent pegs"
);

/**
 * Packvorschläge aus der Prognose des Reisezeitraums ableiten.
 * Jede Regel feuert, sobald EIN Tag ihren Schwellwert erreicht; die
 * Begründung nennt den extremsten Wert. Doppelte Einträge (z. B. Heringe
 * bei Regen UND Wind) erscheinen nur einmal – die erste Begründung gewinnt.
 */
export function packingSuggestions(
  forecastDays: ForecastDay[],
  lang: Language = "de",
  options: {
    /**
     * Zelt-Zeilen vorschlagen (#464)? false bei Reise-Arten, die nicht
     * draussen übernachten – «Zusätzliche Heringe» im Hotel untergraben
     * das Vertrauen in alle übrigen Vorschläge. Voreinstellung true,
     * damit bestehende Aufrufer unverändert bleiben.
     */
    tentGear?: boolean;
  } = {}
): PackSuggestion[] {
  if (forecastDays.length === 0) return [];
  const tentGear = options.tentGear !== false;

  const maxPrecip = Math.max(...forecastDays.map(d => d.precipProb));
  const maxTemp = Math.max(...forecastDays.map(d => d.tMax));
  const minTemp = Math.min(...forecastDays.map(d => d.tMin));
  const windValues = forecastDays
    .map(d => d.windMax)
    .filter((w): w is number => typeof w === "number");
  const maxWind = windValues.length > 0 ? Math.max(...windValues) : null;

  const suggestions: SuggestionL4[] = [];

  if (maxPrecip >= RAIN_PROB_THRESHOLD) {
    const p = Math.round(maxPrecip);
    const reason = l4(
      `Regenrisiko bis ${p} %`,
      `Risque de pluie jusqu'à ${p} %`,
      `Rischio di pioggia fino al ${p} %`,
      `Rain risk up to ${p}%`
    );
    suggestions.push(
      {
        name: l4(
          "Regenjacke",
          "Veste de pluie",
          "Giacca antipioggia",
          "Rain jacket"
        ),
        category: packCategories.kleidung,
        reason,
      },
      {
        name: l4(
          "Zeltunterlage/Plane",
          "Tapis de sol/bâche",
          "Telo per tenda/telone",
          "Groundsheet/tarp"
        ),
        category: packCategories.schlafen,
        reason,
        tent: true,
      },
      { name: extraPegs, category: packCategories.schlafen, reason, tent: true }
    );
  }

  if (maxTemp >= HEAT_TMAX_THRESHOLD) {
    const tmax = Math.round(maxTemp);
    const reason = l4(
      `Hitze bis ${tmax} °C`,
      `Chaleur jusqu'à ${tmax} °C`,
      `Caldo fino a ${tmax} °C`,
      `Heat up to ${tmax} °C`
    );
    suggestions.push(
      {
        name: l4("Sonnencreme", "Crème solaire", "Crema solare", "Sun cream"),
        category: packCategories.hygiene,
        reason,
      },
      {
        name: l4(
          "Sonnenhut",
          "Chapeau de soleil",
          "Cappello da sole",
          "Sun hat"
        ),
        category: packCategories.hygiene,
        reason,
      },
      {
        name: l4(
          "Extra Wasserbehälter",
          "Réservoir d'eau supplémentaire",
          "Contenitore d'acqua supplementare",
          "Extra water container"
        ),
        category: packCategories.kueche,
        reason,
      }
    );
  }

  if (minTemp <= COLD_TMIN_THRESHOLD) {
    const tmin = Math.round(minTemp);
    const reason = l4(
      `Kalte Nächte bis ${tmin} °C`,
      `Nuits froides jusqu'à ${tmin} °C`,
      `Notti fredde fino a ${tmin} °C`,
      `Cold nights down to ${tmin} °C`
    );
    suggestions.push(
      {
        name: l4(
          "Warmer Schlafsack",
          "Sac de couchage chaud",
          "Sacco a pelo caldo",
          "Warm sleeping bag"
        ),
        category: packCategories.schlafen,
        reason,
        tent: true,
      },
      {
        name: l4("Mütze", "Bonnet", "Berretto", "Beanie"),
        category: packCategories.kleidung,
        reason,
      },
      {
        name: l4(
          "Isolierende Isomatte",
          "Matelas isolant chaud",
          "Materassino ben isolante",
          "Insulating sleeping mat"
        ),
        category: packCategories.schlafen,
        reason,
        tent: true,
      }
    );
  }

  if (maxWind !== null && maxWind >= WIND_MAX_THRESHOLD) {
    const wind = Math.round(maxWind);
    const reason = l4(
      `Böen bis ${wind} km/h`,
      `Rafales jusqu'à ${wind} km/h`,
      `Raffiche fino a ${wind} km/h`,
      `Gusts up to ${wind} km/h`
    );
    suggestions.push(
      {
        name: l4(
          "Sturmleinen",
          "Haubans de tempête",
          "Tiranti antivento",
          "Storm guy lines"
        ),
        category: packCategories.schlafen,
        reason,
        tent: true,
      },
      { name: extraPegs, category: packCategories.schlafen, reason, tent: true }
    );
  }

  // Deduplizieren über den deutschen Namen (Quellsprache) – erste Regel gewinnt
  const seen = new Set<string>();
  const result: PackSuggestion[] = [];
  for (const suggestion of suggestions) {
    // Zelt-Zeilen (#464) fallen weg, wenn die Reise nicht draussen schläft
    if (suggestion.tent && !tentGear) continue;
    if (seen.has(suggestion.name.de)) continue;
    seen.add(suggestion.name.de);
    result.push({
      name: pick(suggestion.name, lang),
      category: pick(suggestion.category, lang),
      reason: pick(suggestion.reason, lang),
    });
  }
  return result;
}

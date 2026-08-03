/**
 * Höhenlage eines Zeltplatzes einordnen: Aus der Höhe über Meer wird ein
 * kurzer, praktischer Hinweis fürs Camping. Grundlage ist die Faustregel,
 * dass die Temperatur pro 100 Höhenmeter um rund 0,65 °C sinkt.
 *
 * Reine Funktionen ohne Abhängigkeiten – Client und Tests teilen sie sich.
 */
import { l4, pick, type L4, type Language } from "./i18n";

/** Faustregel: Temperaturabnahme pro 100 Höhenmeter (in °C). */
export const LAPSE_RATE_C_PER_100M = 0.65;

/** Ab dieser Höhe (in m) gilt die jeweilige Stufe. Darunter: kein Hinweis. */
export const ALTITUDE_THRESHOLDS = {
  cooler: 600,
  cold: 1200,
  alpine: 1800,
} as const;

export type AltitudeLevel = "cooler" | "cold" | "alpine";

/**
 * Stufe der Höhenlage: unter 600 m gibt es keinen Hinweis (null),
 * 600–1199 m «kühlere Nächte», 1200–1799 m «deutlich kühler»,
 * ab 1800 m «alpin». Ungültige Werte liefern ebenfalls null.
 */
export function altitudeLevel(elevationM: number): AltitudeLevel | null {
  if (!Number.isFinite(elevationM)) return null;
  if (elevationM >= ALTITUDE_THRESHOLDS.alpine) return "alpine";
  if (elevationM >= ALTITUDE_THRESHOLDS.cold) return "cold";
  if (elevationM >= ALTITUDE_THRESHOLDS.cooler) return "cooler";
  return null;
}

/**
 * Grobe Temperaturdifferenz zum Flachland (Meereshöhe) in ganzen °C,
 * nach der Faustregel 0,65 °C pro 100 m.
 */
export function temperatureDropC(elevationM: number): number {
  if (!Number.isFinite(elevationM)) return 0;
  return Math.round((elevationM / 100) * LAPSE_RATE_C_PER_100M);
}

const HINTS: Record<AltitudeLevel, (drop: number) => L4> = {
  cooler: drop =>
    l4(
      `Rund ${drop} °C kühler als im Flachland – rechne mit kühleren Nächten.`,
      `Environ ${drop} °C de moins qu'en plaine – attends-toi à des nuits plus fraîches.`,
      `Circa ${drop} °C in meno che in pianura: aspettati notti più fresche.`,
      `Around ${drop} °C cooler than in the lowlands – expect chilly nights.`
    ),
  cold: drop =>
    l4(
      `Rund ${drop} °C kühler als im Flachland: deutlich kühler, nimm einen warmen Schlafsack mit.`,
      `Environ ${drop} °C de moins qu'en plaine : nettement plus frais, prends un sac de couchage chaud.`,
      `Circa ${drop} °C in meno che in pianura: decisamente più fresco, porta un sacco a pelo caldo.`,
      `Around ${drop} °C cooler than in the lowlands: noticeably colder, bring a warm sleeping bag.`
    ),
  alpine: drop =>
    l4(
      `Alpine Lage, rund ${drop} °C kühler als im Flachland – Frost ist auch im Sommer möglich.`,
      `Situation alpine, environ ${drop} °C de moins qu'en plaine – le gel est possible même en été.`,
      `Zona alpina, circa ${drop} °C in meno che in pianura: il gelo è possibile anche d'estate.`,
      `Alpine location, around ${drop} °C cooler than in the lowlands – frost is possible even in summer.`
    ),
};

/**
 * Kurzer Hinweis zur Höhenlage in der gewünschten Sprache –
 * null, wenn die Höhe unauffällig (unter 600 m) oder unbekannt ist.
 */
export function altitudeHint(
  elevationM: number,
  lang: Language = "de"
): string | null {
  const level = altitudeLevel(elevationM);
  if (!level) return null;
  return pick(HINTS[level](temperatureDropC(elevationM)), lang);
}

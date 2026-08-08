/**
 * Platzkosten (#243): Preis pro Nacht je Zeltplatz und der daraus abgeleitete
 * Platz-Vergleich in der Statistik.
 *
 * Beträge stecken – wie in der Reisekasse und im Inventar – als Ganzzahl in
 * RAPPEN in der Datenbank, damit keine Rundungsfehler entstehen. Zwei Werte
 * pro Platz: der Grundpreis pro Nacht und Kurtaxe/Nebenkosten pro Nacht
 * (Strom, Duschmarken, Hund). Verglichen wird die Summe der beiden.
 *
 * Reine Funktionen ohne DB und ohne React – die Gesamtkosten sind bewusst nur
 * eine SCHÄTZUNG (Nächte × Preis pro Nacht); was wirklich bezahlt wurde, steht
 * in der Reisekasse.
 */
import { LOCALE_TAGS, type Language } from "./i18n";
import { tripNights } from "./trips";

/** Obergrenze eines Preisfelds: CHF 10'000 pro Nacht – alles darüber ist ein Tippfehler. */
export const SPOT_PRICE_MAX_RAPPEN = 1_000_000;

/** Minimalform eines Zeltplatzes für den Kosten-Vergleich. */
export interface SpotCostLike {
  id: number;
  name: string;
  /** Grundpreis pro Nacht in Rappen; null/undefined = nicht erfasst */
  pricePerNightRappen?: number | null;
  /** Kurtaxe und Nebenkosten pro Nacht in Rappen; null/undefined = nicht erfasst */
  extraPerNightRappen?: number | null;
}

/** Minimalform eines Aufenthalts (Reise/Tagebuch-Eintrag) für die Nächte-Zahl. */
export interface SpotStayLike {
  /** Verknüpfter Zeltplatz-Favorit; null = frei eingetragener Ort */
  spotId?: number | null;
  startDate: string;
  endDate: string;
}

/** Eine Zeile des Platz-Vergleichs. */
export interface SpotCostRow {
  spotId: number;
  name: string;
  /** Grundpreis pro Nacht in Rappen */
  priceRappen: number;
  /** Kurtaxe/Nebenkosten pro Nacht in Rappen (0 = nicht erfasst) */
  extraRappen: number;
  /** Preis + Nebenkosten pro Nacht in Rappen – danach wird sortiert */
  nightlyRappen: number;
  /** Übernachtungen an diesem Platz aus Reisen/Tagebuch */
  nights: number;
  /** Grobe Schätzung Nächte × Preis pro Nacht; null ohne Übernachtungen */
  estimatedTotalRappen: number | null;
}

/**
 * Einen gespeicherten Rappen-Wert auf eine brauchbare Zahl bringen: fehlende,
 * unlesbare, negative oder unplausibel grosse Werte gelten als «nicht erfasst»
 * (0). So kippt ein kaputter Datensatz nie die ganze Statistik.
 */
export function sanitizeRappen(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value);
  if (rounded <= 0) return 0;
  return Math.min(rounded, SPOT_PRICE_MAX_RAPPEN);
}

/**
 * Preis pro Nacht eines Platzes in Rappen: Grundpreis plus Nebenkosten.
 * null, wenn beide Felder leer sind – dann taucht der Platz im Vergleich
 * gar nicht erst auf.
 */
export function nightlyRappen(spot: SpotCostLike): number | null {
  const price = sanitizeRappen(spot.pricePerNightRappen);
  const extra = sanitizeRappen(spot.extraPerNightRappen);
  const total = price + extra;
  return total > 0 ? total : null;
}

/** Hat überhaupt ein Platz einen Preis? Ohne Preise zeigen wir den Vergleich nicht. */
export function hasAnySpotPrice(spots: SpotCostLike[]): boolean {
  return spots.some(spot => nightlyRappen(spot) !== null);
}

/**
 * Übernachtungen pro Zeltplatz aus den Reise-/Tagebuch-Einträgen. Einträge
 * ohne verknüpften Platz (Freitext-Ort) zählen nicht mit – ihnen fehlt der
 * Preis ohnehin.
 */
export function nightsBySpot(stays: SpotStayLike[]): Map<number, number> {
  const result = new Map<number, number>();
  for (const stay of stays) {
    const spotId = stay.spotId;
    if (spotId === null || spotId === undefined) continue;
    const nights = tripNights(stay.startDate, stay.endDate);
    if (nights <= 0) continue;
    result.set(spotId, (result.get(spotId) ?? 0) + nights);
  }
  return result;
}

/**
 * Platz-Vergleich für die Statistik: alle Plätze mit erfasstem Preis,
 * günstigster zuerst. Bei gleichem Preis entscheidet der Name (in der aktiven
 * Sprache sortiert), damit die Reihenfolge stabil bleibt.
 *
 * `estimatedTotalRappen` ist Nächte × Preis pro Nacht und ausdrücklich nur
 * eine Schätzung: Rabatte, Kinder, Hund und Kurtaxen-Sprünge kennt ReiseKompass
 * nicht. Ohne Übernachtungen bleibt das Feld null statt 0 – «keine Angabe»
 * ist etwas anderes als «kostet nichts».
 */
export function spotCostComparison(
  spots: SpotCostLike[],
  stays: SpotStayLike[],
  lang: Language = "de"
): SpotCostRow[] {
  const nights = nightsBySpot(stays);
  const rows: SpotCostRow[] = [];
  for (const spot of spots) {
    const nightly = nightlyRappen(spot);
    if (nightly === null) continue;
    const spotNights = nights.get(spot.id) ?? 0;
    rows.push({
      spotId: spot.id,
      name: spot.name,
      priceRappen: sanitizeRappen(spot.pricePerNightRappen),
      extraRappen: sanitizeRappen(spot.extraPerNightRappen),
      nightlyRappen: nightly,
      nights: spotNights,
      estimatedTotalRappen: spotNights > 0 ? spotNights * nightly : null,
    });
  }
  return rows.sort(
    (a, b) =>
      a.nightlyRappen - b.nightlyRappen ||
      a.name.localeCompare(b.name, LOCALE_TAGS[lang])
  );
}

/**
 * Summe aller Schätzungen in Rappen – 0, wenn zu keinem Platz Übernachtungen
 * bekannt sind. Ebenfalls nur eine Schätzung.
 */
export function estimatedTotalRappen(rows: SpotCostRow[]): number {
  return rows.reduce((sum, row) => sum + (row.estimatedTotalRappen ?? 0), 0);
}

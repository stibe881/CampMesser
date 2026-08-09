/**
 * Tankbuch (#443): Der Fahrtkosten-Rechner (#259) riet den Verbrauch
 * bisher mit einem Standardwert – dabei steht der echte Wert in den
 * eigenen Tankfüllungen. Zwischen zwei Füllungen gilt: getankte Liter
 * der ZWEITEN Füllung ÷ gefahrene Kilometer × 100.
 *
 * ANNAHME VOLLTANKEN: Nur wenn beide Male vollgetankt wurde, stimmt die
 * Rechnung – das ist die übliche Tankbuch-Konvention und steht als
 * Hinweis in der Ansicht. Unplausible Abschnitte (unter 50 km, unter
 * 2 oder über 30 l/100 km) fliegen aus dem Durchschnitt.
 */

/** Kürzere Abschnitte sind Rauschen (Zwischentanken, Tippfehler). */
export const FUEL_MIN_SEGMENT_KM = 50;
/** Plausibilitätsfenster für den Verbrauch eines Abschnitts. */
export const FUEL_MIN_L100 = 2;
export const FUEL_MAX_L100 = 30;
/** Obergrenzen für Eingaben – dahinter stecken Tippfehler. */
export const FUEL_MAX_ODOMETER_KM = 2_000_000;
export const FUEL_MAX_LITERS10 = 2_000;

export interface FuelFillLike {
  day: string;
  odometerKm: number;
  liters10: number;
}

export interface FuelSegment {
  fromKm: number;
  toKm: number;
  distanceKm: number;
  /** Verbrauch des Abschnitts in l/100 km (eine Nachkommastelle). */
  l100: number;
  /** Zählt der Abschnitt zum Durchschnitt? */
  plausible: boolean;
}

/**
 * Abschnitte zwischen aufeinanderfolgenden Füllungen, nach Kilometerstand
 * sortiert. Gleiche oder rückläufige Stände ergeben keinen Abschnitt.
 */
export function fuelSegments(fills: readonly FuelFillLike[]): FuelSegment[] {
  const sorted = [...fills].sort((a, b) => a.odometerKm - b.odometerKm);
  const segments: FuelSegment[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const distanceKm = sorted[i].odometerKm - sorted[i - 1].odometerKm;
    if (distanceKm <= 0) continue;
    const l100 =
      Math.round((sorted[i].liters10 / 10 / distanceKm) * 100 * 10) / 10;
    segments.push({
      fromKm: sorted[i - 1].odometerKm,
      toKm: sorted[i].odometerKm,
      distanceKm,
      l100,
      plausible:
        distanceKm >= FUEL_MIN_SEGMENT_KM &&
        l100 >= FUEL_MIN_L100 &&
        l100 <= FUEL_MAX_L100,
    });
  }
  return segments;
}

/**
 * Durchschnittsverbrauch über alle plausiblen Abschnitte, GEWICHTET nach
 * Distanz (Summe Liter ÷ Summe Kilometer) – ein kurzer Passabschnitt darf
 * die lange Autobahn nicht überstimmen. null, solange nichts Plausibles da
 * ist.
 */
export function averageConsumptionL100(
  fills: readonly FuelFillLike[]
): number | null {
  const segments = fuelSegments(fills).filter(s => s.plausible);
  const km = segments.reduce((sum, s) => sum + s.distanceKm, 0);
  if (km === 0) return null;
  const liters = segments.reduce(
    (sum, s) => sum + (s.l100 * s.distanceKm) / 100,
    0
  );
  return Math.round((liters / km) * 100 * 10) / 10;
}

/** Eine Füllung mit Betrag – so, wie die Monatsauswertung sie braucht. */
export interface FuelFillWithPrice {
  /** ISO-Tag der Füllung (YYYY-MM-DD). */
  day: string;
  /** Bezahlter Gesamtbetrag in Rappen; null = nicht erfasst. */
  priceRappen?: number | null;
}

export interface FuelMonthCost {
  /** Monat als YYYY-MM. */
  month: string;
  totalRappen: number;
  fills: number;
}

/**
 * Tank-Kosten pro Monat (#610): Füllungen MIT Betrag nach Monat summiert,
 * neuster Monat zuerst. Füllungen ohne Preis fallen ehrlich weg – ihr
 * Monat erscheint dann gar nicht oder mit kleinerer Summe, statt dass
 * geraten wird.
 */
export function fuelMonthlyCosts(
  fills: readonly FuelFillWithPrice[],
  limit = 12
): FuelMonthCost[] {
  const byMonth = new Map<string, { totalRappen: number; fills: number }>();
  for (const fill of fills) {
    if (fill.priceRappen == null || fill.priceRappen <= 0) continue;
    if (!/^\d{4}-\d{2}/.test(fill.day)) continue;
    const month = fill.day.slice(0, 7);
    const entry = byMonth.get(month) ?? { totalRappen: 0, fills: 0 };
    entry.totalRappen += fill.priceRappen;
    entry.fills += 1;
    byMonth.set(month, entry);
  }
  return Array.from(byMonth, ([month, entry]) => ({ month, ...entry }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, Math.max(1, limit));
}

/**
 * Fahrtkosten (#259): Kilometer × Verbrauch × Spritpreis, als Eintrag für
 * die Reisekasse.
 *
 * Der Sprit ist bei den meisten Reisen der zweitgrösste Posten nach der
 * Platzmiete und der einzige, für den es keinen Beleg gibt, den man
 * abtippen könnte – man weiss nur, wie weit man gefahren ist. Genau diese
 * Rechnung nimmt der Rechner ab.
 *
 * Zwei Entscheidungen stecken hier drin:
 *
 *  - Gerechnet wird mit dem DURCHSCHNITTSVERBRAUCH, nicht mit einer
 *    Verbrauchskurve nach Beladung, Höhenmetern und Tempo. Solche Modelle
 *    täuschen eine Genauigkeit vor, die es beim Spritpreis an der Zapfsäule
 *    ohnehin nicht gibt; wer es genauer will, tippt den Betrag von Hand ein.
 *  - Die Vorgabewerte sind bewusst konservativ und stehen sichtbar im
 *    Formular. Ein versteckter Standardwert, der zufällig danebenliegt,
 *    wäre schlimmer als gar keiner.
 *
 * Alle Beträge in RAPPEN wie im Rest der Reisekasse.
 */

/** Vorgabe-Verbrauch in Litern pro 100 km – Auto mit Anhänger/Dachbox. */
export const DEFAULT_CONSUMPTION_L100 = 8.5;

/** Vorgabe-Spritpreis in Rappen pro Liter. */
export const DEFAULT_FUEL_PRICE_RAPPEN = 185;

/** Grenzen, die Tippfehler abfangen, ohne echte Fahrten auszuschliessen. */
export const MAX_DISTANCE_KM = 20_000;
export const MAX_CONSUMPTION_L100 = 60;
export const MAX_FUEL_PRICE_RAPPEN = 1000;

/** Nicht negative, endliche Zahl (Unsinn wird zu 0). */
function clean(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export interface FuelCostInput {
  /** Einfache Strecke in Kilometern. */
  distanceKm: number;
  /** Durchschnittsverbrauch in Litern pro 100 km. */
  consumptionL100: number;
  /** Spritpreis in Rappen pro Liter. */
  pricePerLiterRappen: number;
  /** Hin- und Rückfahrt rechnen (Vorgabe: ja). */
  roundTrip?: boolean;
}

export interface FuelCostResult {
  /** Tatsächlich gerechnete Strecke (bei Hin und zurück das Doppelte). */
  totalKm: number;
  /** Verbrauchte Liter, ungerundet – nur zur Anzeige. */
  liters: number;
  /** Kosten in Rappen, kaufmännisch gerundet. */
  rappen: number;
}

/**
 * Fahrtkosten rechnen. Gerundet wird EINMAL ganz am Schluss: Wer Liter
 * und Preis einzeln rundet, sammelt bei langen Strecken sichtbar Fehler.
 */
export function fuelCost(input: FuelCostInput): FuelCostResult {
  const oneWay = Math.min(clean(input.distanceKm), MAX_DISTANCE_KM);
  const totalKm = input.roundTrip === false ? oneWay : oneWay * 2;
  const consumption = Math.min(
    clean(input.consumptionL100),
    MAX_CONSUMPTION_L100
  );
  const price = Math.min(
    clean(input.pricePerLiterRappen),
    MAX_FUEL_PRICE_RAPPEN
  );
  const liters = (totalKm * consumption) / 100;
  return {
    totalKm,
    liters,
    rappen: Math.round(liters * price),
  };
}

/**
 * Stromzähler am Stellplatz (#442): Auf vielen Plätzen wird Strom nach
 * Zähler abgerechnet – Stand bei Ankunft, Stand bei Abreise, Preis pro
 * kWh steht am Kasten. Die Rechnung ist banal, aber der Ankunfts-Stand
 * ist bei der Abreise längst vergessen; deshalb merkt sich die Ansicht
 * die Eingaben pro Reise.
 *
 * Muster wie der Fahrtkosten-Rechner (#259): rechnen und VORAUSFÜLLEN,
 * nicht selbst eintragen – abgerechnet wird am Ende, wie die Rezeption
 * rechnet.
 */

/** Obergrenze für Zählerstände – dahinter steckt ein Tippfehler. */
export const POWER_METER_MAX_KWH = 1_000_000;
/** Obergrenze Preis pro kWh in Rappen (2 CHF wären schon Wucher). */
export const POWER_PRICE_MAX_RAPPEN = 500;

/** Zählerstand-Eingabe («1234.5» oder «1234,5») → kWh; null = ungültig. */
export function parseKwhInput(input: string): number | null {
  const value = Number(input.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 0 || value > POWER_METER_MAX_KWH) {
    return null;
  }
  // Zähler zeigen höchstens eine Nachkommastelle
  return Math.round(value * 10) / 10;
}

export interface PowerMeterResult {
  /** Verbrauch in kWh (eine Nachkommastelle). */
  kwh: number;
  /** Kosten in Rappen. */
  rappen: number;
}

/**
 * Verbrauch und Kosten aus den Zählerständen. Ungültige Eingaben oder
 * Ende vor Anfang ergeben 0/0 – die Ansicht zeigt dann schlicht nichts
 * Übernehmbares.
 */
export function powerMeterCost(input: {
  startKwh: number;
  endKwh: number;
  pricePerKwhRappen: number;
}): PowerMeterResult {
  const { startKwh, endKwh, pricePerKwhRappen } = input;
  if (
    !Number.isFinite(startKwh) ||
    !Number.isFinite(endKwh) ||
    !Number.isFinite(pricePerKwhRappen) ||
    startKwh < 0 ||
    endKwh < startKwh ||
    pricePerKwhRappen <= 0 ||
    pricePerKwhRappen > POWER_PRICE_MAX_RAPPEN
  ) {
    return { kwh: 0, rappen: 0 };
  }
  const kwh = Math.round((endKwh - startKwh) * 10) / 10;
  return { kwh, rappen: Math.round(kwh * pricePerKwhRappen) };
}

/**
 * Tankbuch als CSV (#477): dieselben Excel-Entscheidungen wie beim
 * Reisekassen-Export (#258) – Semikolon, BOM, Beträge mit Punkt. Die
 * Verbrauchs-Spalte zeigt den Abschnitt, der an der jeweiligen Füllung
 * ENDET, wie in der Tankbuch-Ansicht.
 */
import { CSV_BOM, csvAmount, csvRow } from "./expensesCsv";
import { fuelSegments, type FuelFillLike } from "./fuelLog";

export interface CsvFuelFillLike extends FuelFillLike {
  /** Bezahlter Gesamtbetrag in Rappen; null = nicht erfasst. */
  priceRappen?: number | null;
}

/**
 * CSV-Text des Tankbuchs, nach Kilometerstand aufsteigend – so liest
 * sich die Datei wie das Tankbuch selbst. Spaltentitel kommen aus der
 * Ansicht (Sprache der App).
 */
export function fuelLogToCsv(
  fills: readonly CsvFuelFillLike[],
  options: {
    /** Spaltentitel: Datum, Kilometerstand, Liter, Betrag, Verbrauch */
    headers: readonly string[];
  }
): string {
  const sorted = [...fills].sort((a, b) => a.odometerKm - b.odometerKm);
  const l100ByToKm = new Map<number, number>();
  fuelSegments(sorted).forEach(segment =>
    l100ByToKm.set(segment.toKm, segment.l100)
  );
  const lines: string[] = [csvRow(options.headers)];
  sorted.forEach(fill => {
    const l100 = l100ByToKm.get(fill.odometerKm);
    lines.push(
      csvRow([
        fill.day,
        fill.odometerKm,
        (fill.liters10 / 10).toFixed(1),
        fill.priceRappen != null ? csvAmount(fill.priceRappen) : "",
        l100 !== undefined ? l100.toFixed(1) : "",
      ])
    );
  });
  // \r\n, weil Excel auf Windows sonst alles in eine Zeile legt
  return CSV_BOM + lines.join("\r\n") + "\r\n";
}

/** Dateiname des Exports, z. B. «tankbuch-2026-08-08.csv». */
export function fuelLogCsvFileName(day: string): string {
  return `tankbuch-${day}.csv`;
}

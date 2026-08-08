/**
 * Reisekasse als CSV (#258): die Ausgaben einer Reise so exportieren, dass
 * sie sich daheim in Excel, Numbers oder LibreOffice weiterrechnen lassen.
 *
 * Drei Entscheidungen, die man beim Öffnen der Datei sofort merkt:
 *
 *  - Trennzeichen SEMIKOLON statt Komma. Excel in der deutschsprachigen
 *    Schweiz erwartet das Semikolon; mit Komma landet die ganze Zeile in
 *    einer Spalte, und dann ist der Export wertlos.
 *  - BOM am Dateianfang. Ohne ihn liest Excel die Datei als Latin-1, und
 *    aus «Znüni Bäckerei» wird «ZnÃ¼ni BÃ¤ckerei».
 *  - Beträge mit PUNKT und zwei Nachkommastellen. Der Punkt ist in jeder
 *    Tabellenkalkulation eindeutig; ein Komma wäre hier zugleich Zahl- und
 *    Trennzeichen-Kandidat und lädt zum Fehlinterpretieren ein.
 *
 * Reine Zeichenketten-Arbeit ohne DOM – der Download selbst passiert in
 * der Ansicht.
 */

/** Trennzeichen: Semikolon, siehe Kopfkommentar. */
export const CSV_SEPARATOR = ";";

/** Byte Order Mark, damit Excel UTF-8 erkennt. */
export const CSV_BOM = "﻿";

/**
 * Ein Feld für CSV absichern: Enthält es Trennzeichen, Anführungszeichen
 * oder einen Zeilenumbruch, wird es in Anführungszeichen gesetzt und die
 * enthaltenen Anführungszeichen werden verdoppelt (RFC 4180).
 */
export function csvField(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  const needsQuotes =
    text.includes(CSV_SEPARATOR) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r");
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Eine Zeile aus Feldern bauen. */
export function csvRow(fields: readonly (string | number | null)[]): string {
  return fields.map(csvField).join(CSV_SEPARATOR);
}

/** Rappen als Tabellen-Betrag: Punkt, zwei Nachkommastellen, kein Zeichen. */
export function csvAmount(rappen: number): string {
  const value = Number.isFinite(rappen) ? Math.round(rappen) : 0;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Eine Ausgabe, so weit der Export sie braucht. */
export interface CsvExpenseLike {
  day: string;
  category: string;
  description?: string | null;
  paidBy: string;
  amountRappen: number;
  /** "CHF" | "EUR"; fehlt bei Alt-Zeilen und gilt dann als CHF (#441). */
  currency?: string;
}

/**
 * CSV-Text der Reisekasse. Die Spaltentitel und der Kategorie-Name kommen
 * aus der Ansicht – die Datei soll in der Sprache erscheinen, in der die
 * App bedient wird, und die Übersetzungen liegen nicht hier.
 *
 * Die Reihenfolge der Zeilen bleibt, wie sie hereinkommt: Sortiert wird
 * in der Liste, und der Export soll zeigen, was man auf dem Bildschirm
 * sieht. Am Ende steht eine Summenzeile – wer die Datei nur anschaut,
 * will die Zahl nicht selbst zusammenzählen.
 */
export function expensesToCsv(
  expenses: readonly CsvExpenseLike[],
  options: {
    /** Spaltentitel: Datum, Kategorie, Beschreibung, Bezahlt von, Währung, Betrag */
    headers: readonly string[];
    categoryLabel: (category: string) => string;
    totalLabel: string;
  }
): string {
  const lines: string[] = [csvRow(options.headers)];
  // Summen pro Währung (#441) – CHF und EUR in einer Zahl wären Unsinn.
  const totals = new Map<string, number>();
  expenses.forEach(expense => {
    const currency = expense.currency === "EUR" ? "EUR" : "CHF";
    const amount = Number.isFinite(expense.amountRappen)
      ? Math.round(expense.amountRappen)
      : 0;
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
    lines.push(
      csvRow([
        expense.day,
        options.categoryLabel(expense.category),
        expense.description ?? "",
        expense.paidBy,
        currency,
        csvAmount(expense.amountRappen),
      ])
    );
  });
  // Eine Summenzeile je vorhandener Währung, CHF zuerst
  for (const currency of ["CHF", "EUR"]) {
    const total = totals.get(currency);
    if (total === undefined && !(currency === "CHF" && totals.size === 0))
      continue;
    lines.push(
      csvRow(["", "", "", options.totalLabel, currency, csvAmount(total ?? 0)])
    );
  }
  // \r\n, weil Excel auf Windows sonst alles in eine Zeile legt
  return CSV_BOM + lines.join("\r\n") + "\r\n";
}

/**
 * Dateiname aus dem Reise-Namen: alles ausser Buchstaben, Ziffern und
 * Bindestrich fällt weg, damit der Name auf jedem Dateisystem und in
 * jedem Download-Ordner funktioniert.
 */
export function csvFileName(tripName: string, day: string): string {
  const base = (tripName || "reisekasse")
    .toLowerCase()
    .replace(/[äàáâ]/g, "a")
    .replace(/[öòóô]/g, "o")
    .replace(/[üùúû]/g, "u")
    .replace(/[éèêë]/g, "e")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "reisekasse"}-${day}.csv`;
}

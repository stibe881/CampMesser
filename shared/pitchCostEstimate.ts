/**
 * Was der Platz wirklich kostet (#386).
 *
 * WAS DA HERUMLAG: Seit #369 stehen die Tarife am Platz – Nebensaison,
 * Hauptsaison, darunter Erwachsene, Kind, Stellplatz. Seit #256 gibt es
 * ein Reise-Budget und seit #219 die Reisekasse. Multipliziert hat das
 * noch nie jemand. Dabei ist «zwei Erwachsene, ein Kind, fünf Nächte»
 * genau die Rechnung, die man vor der Abreise im Kopf macht und dabei
 * verrechnet.
 *
 * ES IST EINE SCHÄTZUNG UND HEISST AUCH SO. Die Rezeption rechnet am
 * Ende doch anders: Kurtaxe je nach Alter, Hund, Strom nach Verbrauch,
 * Duschmarken. Deshalb wird das Ergebnis VORGESCHLAGEN und nie
 * automatisch gebucht – eine Reisekasse, die sich selbst füllt, stimmt
 * nie und wird darum nicht mehr geführt.
 *
 * ZWEI QUELLEN, IN DIESER REIHENFOLGE:
 *   1. Ein gewählter Tarif mit Anzahl je Zeile – die genaue Rechnung.
 *   2. Der EINE Preis pro Nacht (#243), wenn keine Tarife erfasst sind –
 *      grob, aber besser als nichts.
 * Gibt es beides nicht, wird nichts behauptet (null).
 */
import type { SpotTariff } from "./spotTariffs";

/** Eine Tarifzeile mit der gewählten Anzahl. */
export interface CountedRow {
  label: string;
  priceRappen: number;
  /** Wie viele davon – Erwachsene, Kinder, Stellplätze. */
  count: number;
  /** Einmalig statt pro Nacht (#415) – zählt genau einmal. */
  oneOff?: boolean;
}

export interface CostEstimate {
  /** Kosten je Nacht in Rappen. */
  perNightRappen: number;
  /** Einmalige Posten in Rappen (#415) – Endreinigung, Buchungsgebühr. */
  oneOffRappen: number;
  /** Kosten für den ganzen Aufenthalt in Rappen. */
  totalRappen: number;
  nights: number;
  /** Woher die Zahl stammt – die Anzeige sagt es dazu. */
  source: "tariff" | "nightly";
}

/** Nur ganze, nicht negative Anzahlen; alles andere wird zu 0. */
export function cleanCount(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(99, Math.floor(num));
}

/**
 * Nächte zwischen Anreise und Abreise.
 *
 * NÄCHTE, NICHT TAGE: Wer am Freitag anreist und am Sonntag abreist,
 * zahlt zwei Nächte und nicht drei Tage. Genau hier verrechnet man sich
 * im Kopf, und genau deshalb steht es an einer Stelle.
 */
export function nightsBetween(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** Kosten je Nacht aus den gewählten Zeilen (ohne Einmaliges). */
export function perNightFromRows(rows: readonly CountedRow[]): number {
  return rows.reduce(
    (sum, row) =>
      row.oneOff
        ? sum
        : sum + Math.max(0, row.priceRappen) * cleanCount(row.count),
    0
  );
}

/** Einmalige Posten aus den gewählten Zeilen – zählen genau einmal (#415). */
export function oneOffFromRows(rows: readonly CountedRow[]): number {
  return rows.reduce(
    (sum, row) =>
      row.oneOff
        ? sum + Math.max(0, row.priceRappen) * cleanCount(row.count)
        : sum,
    0
  );
}

/**
 * Die Schätzung bilden.
 *
 * Null, wenn nichts zu rechnen ist: keine Nächte, oder null Franken je
 * Nacht. Ein Vorschlag über 0.– wäre ein Eintrag, den man wieder löscht.
 */
export function estimatePitchCost(input: {
  nights: number;
  rows?: readonly CountedRow[];
  /** Rückfall aus #243: der eine Preis samt Nebenkosten, in Rappen. */
  nightlyRappen?: number | null;
}): CostEstimate | null {
  const nights = Math.max(0, Math.floor(input.nights));
  if (nights <= 0) return null;

  const fromRows = input.rows ? perNightFromRows(input.rows) : 0;
  const fromOneOff = input.rows ? oneOffFromRows(input.rows) : 0;
  // Auch NUR Einmaliges ist eine Rechnung: Wer bloss die Buchungsgebühr
  // angewählt hat, bekommt sie – mit 0.– je Nacht, ehrlich ausgewiesen.
  if (fromRows > 0 || fromOneOff > 0) {
    return {
      perNightRappen: fromRows,
      oneOffRappen: fromOneOff,
      totalRappen: fromRows * nights + fromOneOff,
      nights,
      source: "tariff",
    };
  }
  const nightly = input.nightlyRappen ?? 0;
  if (nightly > 0) {
    return {
      perNightRappen: nightly,
      oneOffRappen: 0,
      totalRappen: nightly * nights,
      nights,
      source: "nightly",
    };
  }
  return null;
}

/**
 * Startbelegung eines Tarifs: alles auf 0.
 *
 * ABSICHTLICH NICHT «zwei Erwachsene» geraten. Wer die Zahl selbst
 * eintippt, prüft sie dabei; wer eine vorgesetzte Zahl übersieht, nimmt
 * eine falsche Schätzung mit ins Budget.
 */
export function emptyCounts(tariff: SpotTariff): CountedRow[] {
  return tariff.rows.map(row => ({
    label: row.label,
    priceRappen: row.priceRappen,
    count: 0,
    ...(row.oneOff ? { oneOff: true } : {}),
  }));
}

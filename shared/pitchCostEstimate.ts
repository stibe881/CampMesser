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
import { tariffActiveOn, type SpotTariff } from "./spotTariffs";

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
/**
 * Saisonwechsel mitten im Aufenthalt (#420).
 *
 * Wer vom 28.06. bis 05.07. bleibt, zahlt vier Nächte Nebensaison und
 * drei Nächte Hauptsaison – der Schätzer rechnete bisher stur mit dem
 * Anreise-Tarif. Jede NACHT gehört zu ihrem Datum: Für jedes wird der
 * erste Tarif genommen, dessen Zeitraum (#394) es abdeckt; Nächte ohne
 * Treffer fallen auf den gewählten Tarif zurück – besser die gewählte
 * Rechnung als gar keine.
 */
export interface SeasonPart {
  tariffIndex: number;
  nights: number;
}

/** ISO-Tag + n Tage, über die Kalenderfelder (#333). */
function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function nightsPerTariff(
  tariffs: readonly SpotTariff[],
  startDate: string,
  endDate: string,
  fallbackIndex: number
): SeasonPart[] {
  const nights = nightsBetween(startDate, endDate);
  const counts = new Map<number, number>();
  for (let i = 0; i < nights; i += 1) {
    const night = shiftIso(startDate, i);
    let index = tariffs.findIndex(tariff => tariffActiveOn(tariff, night));
    if (index < 0) index = fallbackIndex;
    counts.set(index, (counts.get(index) ?? 0) + 1);
  }
  return Array.from(counts, ([tariffIndex, n]) => ({
    tariffIndex,
    nights: n,
  }));
}

/**
 * Schätzung über mehrere Saisons: Die eingetippten Anzahlen gelten für
 * alle Teile – zwei Erwachsene bleiben zwei Erwachsene, nur der Preis
 * je Zeile wechselt mit dem Tarif. Eine Zeile, die es im anderen Tarif
 * nicht gibt (abweichende Bezeichnung), behält ihren gewählten Preis –
 * lieber leicht ungenau als eine stumm verschwundene Position.
 * Einmaliges (#415) zählt genau einmal, egal wie viele Saisons.
 */
export function estimateAcrossSeasons(input: {
  tariffs: readonly SpotTariff[];
  rows: readonly CountedRow[];
  startDate: string;
  endDate: string;
  fallbackIndex: number;
}): {
  parts: { tariffIndex: number; nights: number; perNightRappen: number }[];
  oneOffRappen: number;
  totalRappen: number;
} | null {
  const seasonParts = nightsPerTariff(
    input.tariffs,
    input.startDate,
    input.endDate,
    input.fallbackIndex
  );
  if (seasonParts.length === 0) return null;

  const parts = seasonParts.map(part => {
    const tariff = input.tariffs[part.tariffIndex];
    const perNightRappen = input.rows.reduce((sum, row) => {
      if (row.oneOff) return sum;
      const count = cleanCount(row.count);
      if (count === 0) return sum;
      const match = tariff?.rows.find(r => !r.oneOff && r.label === row.label);
      const price = match ? match.priceRappen : Math.max(0, row.priceRappen);
      return sum + price * count;
    }, 0);
    return { ...part, perNightRappen };
  });
  const oneOffRappen = oneOffFromRows(input.rows);
  const totalRappen =
    parts.reduce((sum, part) => sum + part.nights * part.perNightRappen, 0) +
    oneOffRappen;
  if (totalRappen <= 0) return null;
  return { parts, oneOffRappen, totalRappen };
}

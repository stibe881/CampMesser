/**
 * Mehrere Tarife pro Zeltplatz (#369, Nutzerwunsch).
 *
 * WAS FEHLTE: Der Platz hatte EINEN Preis pro Nacht plus Nebenkosten. So
 * rechnet aber kein Campingplatz ab. Real steht auf der Tafel an der
 * Rezeption: Nebensaison Erwachsene 12.–, Kind 6.–, Stellplatz 18.–;
 * Hauptsaison Erwachsene 16.–, Kind 8.–, Stellplatz 24.–. Wer das in ein
 * einziges Feld pressen musste, schrieb entweder eine Zahl hin, die für
 * niemanden stimmt, oder gar nichts.
 *
 * DIE FORM: eine Liste benannter Tarife («Nebensaison», «Hauptsaison»),
 * jeder mit eigenen Zeilen («Erwachsene», «Kind», «Stellplatz»). Zwei
 * Ebenen, mehr nicht – für die dritte gibt es kein Beispiel von einer
 * echten Preistafel.
 *
 * DER GRUNDPREIS BLEIBT, WAS ER IST: `pricePerNightRappen` und
 * `extraPerNightRappen` sind weiterhin der eine Wert, mit dem die
 * Statistik die Plätze VERGLEICHT (#243). Ein Vergleich über sechs Tarife
 * wäre keiner mehr; die Tarifliste ist das Nachschlagewerk daneben.
 *
 * ALLES HIER IST DEFENSIV: Der Text kommt aus einer JSON-Spalte, und eine
 * kaputte Zeile darf nie die Seite kippen – unlesbares wird still
 * weggelassen, wie bei `spotAttributes`.
 */
import { LOCALE_TAGS, type Language } from "./i18n";
import { SPOT_PRICE_MAX_RAPPEN } from "./spotCosts";

/** So viele Tarife stehen auf keiner Tafel – und niemand tippt sie ab. */
export const MAX_SPOT_TARIFFS = 8;
/** Zeilen je Tarif (Erwachsene, Kind, Stellplatz, Hund, Strom, Kurtaxe …). */
export const MAX_TARIFF_ROWS = 12;
export const TARIFF_NAME_MAX_LENGTH = 40;
export const TARIFF_ROW_LABEL_MAX_LENGTH = 40;
/** Obergrenze der gespeicherten JSON-Länge – schützt die Spalte. */
export const TARIFFS_JSON_MAX_LENGTH = 4000;

/** Eine Zeile eines Tarifs: Bezeichnung und Preis pro Nacht in Rappen. */
export interface SpotTariffRow {
  label: string;
  priceRappen: number;
}

/** Ein benannter Tarif mit seinen Zeilen. */
export interface SpotTariff {
  name: string;
  rows: SpotTariffRow[];
}

/** Text säubern und auf die Feldlänge kürzen; leer bleibt leer. */
function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/**
 * Rappen-Wert prüfen. Anders als in `spotCosts.sanitizeRappen` bleibt die
 * 0 hier ERLAUBT: «Kind bis 6 Jahre: gratis» ist eine echte Tarifzeile und
 * etwas anderes als eine fehlende Angabe.
 */
function cleanRappen(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  if (rounded < 0) return null;
  return Math.min(rounded, SPOT_PRICE_MAX_RAPPEN);
}

/**
 * Gespeichertes JSON in Tarife verwandeln. Alles, was nicht passt, fällt
 * still weg: kaputtes JSON, fremde Formen, Zeilen ohne Bezeichnung,
 * Tarife ohne Namen.
 */
export function parseSpotTariffs(raw: string | null | undefined): SpotTariff[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const tariffs: SpotTariff[] = [];
  for (const entry of data.slice(0, MAX_SPOT_TARIFFS)) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as { name?: unknown; rows?: unknown };
    const name = cleanText(record.name, TARIFF_NAME_MAX_LENGTH);
    if (!name) continue;
    const rows: SpotTariffRow[] = [];
    if (Array.isArray(record.rows)) {
      for (const rawRow of record.rows.slice(0, MAX_TARIFF_ROWS)) {
        if (typeof rawRow !== "object" || rawRow === null) continue;
        const row = rawRow as { label?: unknown; priceRappen?: unknown };
        const label = cleanText(row.label, TARIFF_ROW_LABEL_MAX_LENGTH);
        const priceRappen = cleanRappen(row.priceRappen);
        if (!label || priceRappen === null) continue;
        rows.push({ label, priceRappen });
      }
    }
    tariffs.push({ name, rows });
  }
  return tariffs;
}

/**
 * Tarife zum Speichern normalisieren. Gibt null zurück, wenn nichts
 * Brauchbares übrig bleibt – dann steht in der Spalte NULL statt `"[]"`,
 * und «nicht erfasst» bleibt von «leer erfasst» unterscheidbar.
 */
export function serializeSpotTariffs(
  tariffs: readonly SpotTariff[]
): string | null {
  const clean = parseSpotTariffs(JSON.stringify(tariffs));
  if (clean.length === 0) return null;
  const json = JSON.stringify(clean);
  // Sollte nach den Obergrenzen oben nicht vorkommen; wenn doch, lieber
  // nichts speichern als eine abgeschnittene, unlesbare Zeile.
  return json.length > TARIFFS_JSON_MAX_LENGTH ? null : json;
}

/** Summe aller Zeilen eines Tarifs in Rappen – «für zwei Erwachsene und ein Kind». */
export function tariffTotalRappen(tariff: SpotTariff): number {
  return tariff.rows.reduce((sum, row) => sum + row.priceRappen, 0);
}

/**
 * Günstigste und teuerste ZEILE über alle Tarife – für die Kurzfassung
 * («12.– bis 24.– pro Nacht»), ohne dass man aufklappen muss.
 * null, wenn es keine einzige Zeile gibt.
 */
export function tariffRange(
  tariffs: readonly SpotTariff[]
): { minRappen: number; maxRappen: number } | null {
  const prices = tariffs.flatMap(tariff =>
    tariff.rows.map(row => row.priceRappen)
  );
  if (prices.length === 0) return null;
  return {
    minRappen: Math.min(...prices),
    maxRappen: Math.max(...prices),
  };
}

/** Betrag in Rappen als Text in der aktiven Sprache («CHF 12.00»). */
export function formatRappen(rappen: number, lang: Language): string {
  return new Intl.NumberFormat(LOCALE_TAGS[lang], {
    style: "currency",
    currency: "CHF",
  }).format(rappen / 100);
}

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
/**
 * Obergrenze der gespeicherten JSON-Länge – schützt die Spalte.
 * Mit den Zeiträumen (#394) von 4000 angehoben; die Spalte ist `text`,
 * die Anhebung kostet nichts.
 */
export const TARIFFS_JSON_MAX_LENGTH = 6000;
/** Zeiträume je Tarif – Vor-, Zwischen- und Hauptsaison sind selten mehr. */
export const MAX_TARIFF_PERIODS = 6;

/** Eine Zeile eines Tarifs: Bezeichnung und Preis pro Nacht in Rappen. */
export interface SpotTariffRow {
  label: string;
  priceRappen: number;
  /**
   * Einmalig statt pro Nacht (#415): Endreinigung, Buchungsgebühr,
   * Strompauschale. Echte Preistafeln haben beides – ohne das Merkmal
   * multiplizierte der Kosten-Schätzer die Endreinigung mit den Nächten.
   */
  oneOff?: boolean;
}

/**
 * Ein Gültigkeits-Zeitraum eines Tarifs (#394, Nutzerwunsch 07.08.2026).
 *
 * OHNE JAHR («MM-TT»): Die Saison wiederholt sich – die Hauptsaison vom
 * 22.06. bis 23.08. gilt nächstes Jahr wieder, und niemand will die
 * Preistafel jeden Januar neu abtippen. Ein Zeitraum darf über den
 * Jahreswechsel laufen (Wintersaison 20.12.–10.01.).
 */
export interface TariffPeriod {
  /** Beginn als «MM-TT», einschliesslich. */
  from: string;
  /** Ende als «MM-TT», einschliesslich. */
  to: string;
}

/**
 * Währungen zur Auswahl (#395, Nutzerwunsch 07.08.2026).
 *
 * Bewusst eine LISTE und kein Freitextfeld: «Fr.», «SFr» und «CHF»
 * wären sonst drei Währungen. Alle Einträge haben zwei Nachkommastellen,
 * damit die Rappen-Speicherung (Hundertstel) für jede stimmt. Die Liste
 * deckt die Campingländer der Umgebung ab; CHF bleibt der Standard und
 * der einzige Wert, den es vor #395 gab.
 */
export const TARIFF_CURRENCIES = [
  "CHF",
  "EUR",
  "USD",
  "GBP",
  "NOK",
  "SEK",
  "DKK",
  "CZK",
  "PLN",
] as const;
export type TariffCurrency = (typeof TARIFF_CURRENCIES)[number];
export const DEFAULT_TARIFF_CURRENCY: TariffCurrency = "CHF";
/** «pro Nacht», «pro Tag», «pro Woche» – Freitext, kurz. */
export const TARIFF_UNIT_MAX_LENGTH = 24;

/**
 * Ein benannter Tarif mit seinen Zeilen.
 *
 * `periods` und `unit` sind FREIWILLIG und fehlen, wenn nichts erfasst
 * ist – ein Tarif ohne Zeitraum ist ein gültiger Tarif, keine halbe
 * Eingabe. Die WÄHRUNG ist Pflicht (#395) und steht immer da; Bestände
 * aus der Zeit vor #395 lesen sich als CHF, denn etwas anderes gab es
 * damals nicht.
 */
export interface SpotTariff {
  name: string;
  rows: SpotTariffRow[];
  currency: TariffCurrency;
  /** Wofür der Preis gilt («pro Tag») – Freitext, fehlt wenn leer. */
  unit?: string;
  periods?: TariffPeriod[];
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

/** Währung prüfen; Unbekanntes wird zum Standard statt zum Fehler. */
function cleanCurrency(value: unknown): TariffCurrency {
  return (TARIFF_CURRENCIES as readonly unknown[]).includes(value)
    ? (value as TariffCurrency)
    : DEFAULT_TARIFF_CURRENCY;
}

/** «MM-TT» prüfen und normalisieren; Unlesbares wird zu null. */
function cleanMonthDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Zeiträume eines rohen Eintrags lesen; Kaputtes fällt still weg. */
function cleanPeriods(raw: unknown): TariffPeriod[] {
  if (!Array.isArray(raw)) return [];
  const periods: TariffPeriod[] = [];
  for (const entry of raw.slice(0, MAX_TARIFF_PERIODS)) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as { from?: unknown; to?: unknown };
    const from = cleanMonthDay(record.from);
    const to = cleanMonthDay(record.to);
    if (!from || !to) continue;
    periods.push({ from, to });
  }
  return periods;
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
    const record = entry as {
      name?: unknown;
      rows?: unknown;
      currency?: unknown;
      unit?: unknown;
      periods?: unknown;
    };
    const name = cleanText(record.name, TARIFF_NAME_MAX_LENGTH);
    if (!name) continue;
    const rows: SpotTariffRow[] = [];
    if (Array.isArray(record.rows)) {
      for (const rawRow of record.rows.slice(0, MAX_TARIFF_ROWS)) {
        if (typeof rawRow !== "object" || rawRow === null) continue;
        const row = rawRow as {
          label?: unknown;
          priceRappen?: unknown;
          oneOff?: unknown;
        };
        const label = cleanText(row.label, TARIFF_ROW_LABEL_MAX_LENGTH);
        const priceRappen = cleanRappen(row.priceRappen);
        if (!label || priceRappen === null) continue;
        const cleanRow: SpotTariffRow = { label, priceRappen };
        if (row.oneOff === true) cleanRow.oneOff = true;
        rows.push(cleanRow);
      }
    }
    const tariff: SpotTariff = {
      name,
      rows,
      // Bestände vor #395 tragen keine Währung – damals gab es nur CHF.
      currency: cleanCurrency(record.currency),
    };
    const unit = cleanText(record.unit, TARIFF_UNIT_MAX_LENGTH);
    if (unit) tariff.unit = unit;
    const periods = cleanPeriods(record.periods);
    if (periods.length > 0) tariff.periods = periods;
    tariffs.push(tariff);
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

/**
 * Summe der PRO-NACHT-Zeilen eines Tarifs in Rappen – «für je einmal
 * jede Zeile». Einmaliges (#415) bleibt draussen: Eine Endreinigung in
 * der Nacht-Summe wäre eine Zahl, die zu keiner Rechnung passt.
 */
export function tariffTotalRappen(tariff: SpotTariff): number {
  return tariff.rows.reduce(
    (sum, row) => (row.oneOff ? sum : sum + row.priceRappen),
    0
  );
}

/**
 * Günstigste und teuerste ZEILE über alle Tarife – für die Kurzfassung
 * («12.– bis 24.– pro Nacht»), ohne dass man aufklappen muss.
 * null, wenn es keine einzige Zeile gibt.
 */
export function tariffRange(
  tariffs: readonly SpotTariff[]
): { minRappen: number; maxRappen: number } | null {
  // Einmaliges (#415) zählt nicht: «50.– Endreinigung» ist kein
  // Nachtpreis und würde die Spanne nach oben verfälschen.
  const prices = tariffs.flatMap(tariff =>
    tariff.rows.filter(row => !row.oneOff).map(row => row.priceRappen)
  );
  if (prices.length === 0) return null;
  return {
    minRappen: Math.min(...prices),
    maxRappen: Math.max(...prices),
  };
}

/**
 * Betrag in Hundertsteln als Text («CHF 12.00», «€ 12.00»).
 *
 * Die Währung kommt seit #395 aus dem Tarif; ohne Angabe bleibt es CHF –
 * alle anderen Beträge der App (Reisekasse, Platzkosten) sind CHF, und
 * die rufen ohne dritten Parameter auf.
 */
export function formatRappen(
  rappen: number,
  lang: Language,
  currency: TariffCurrency = DEFAULT_TARIFF_CURRENCY
): string {
  return new Intl.NumberFormat(LOCALE_TAGS[lang], {
    style: "currency",
    currency,
  }).format(rappen / 100);
}

/**
 * Getippten Betrag in Rappen verwandeln; Unlesbares wird zu null.
 *
 * Angenommen wird, was auf Preistafeln steht und was Menschen tippen:
 * «12.50», «12,50», «12.–», «12.-», «1'200». Genau das war der gemeldete
 * «man kann keine Untertarife hinzufügen»-Fehler: Wer «12.–» schrieb,
 * dessen Zeile fiel beim Speichern stumm weg – das sah aus, als hätte
 * das Hinzufügen nie funktioniert.
 */
export function parseAmountInput(value: string): number | null {
  const normalized = value
    .replace(/['’ \s]/g, "")
    .replace(",", ".")
    // Schweizer Schreibweise «12.–» / «12.-»: der Strich heisst «00».
    .replace(/\.?[–—-]+$/, "");
  if (!/^\d+(\.\d*)?$/.test(normalized)) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

// ── Zeiträume (#394) ──────────────────────────────────────────────────────

/**
 * Eingabe «TT.MM.» in «MM-TT» verwandeln; Unlesbares wird zu null.
 *
 * Angenommen wird, was Menschen tippen: «2.4.», «02.04.», «02.04» –
 * mit oder ohne Schlusspunkt, mit oder ohne führende Null.
 */
export function parseDayMonthInput(value: string): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.?$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** «MM-TT» als «TT.MM.» – die Schreibweise der Preistafel. */
export function formatMonthDay(monthDay: string): string {
  const [month, day] = monthDay.split("-");
  return `${day}.${month}.`;
}

/** Alle Zeiträume eines Tarifs als eine Zeile: «02.04.–06.04., 22.06.–23.08.». */
export function formatTariffPeriods(periods: readonly TariffPeriod[]): string {
  return periods
    .map(
      period => `${formatMonthDay(period.from)}–${formatMonthDay(period.to)}`
    )
    .join(", ");
}

/**
 * Gilt der Tarif an diesem ISO-Tag?
 *
 * Ohne Zeiträume: false – nicht «immer». Ein Tarif ohne Angabe sagt
 * nichts über heute, und ein «gilt jetzt» an allen dreien wäre keine
 * Auskunft. Zeiträume dürfen über den Jahreswechsel laufen: Bei
 * from > to (20.12.–10.01.) gilt alles AB from ODER BIS to.
 */
export function tariffActiveOn(tariff: SpotTariff, isoDate: string): boolean {
  if (!tariff.periods || tariff.periods.length === 0) return false;
  const monthDay = isoDate.slice(5, 10);
  if (!/^\d{2}-\d{2}$/.test(monthDay)) return false;
  return tariff.periods.some(period =>
    period.from <= period.to
      ? monthDay >= period.from && monthDay <= period.to
      : monthDay >= period.from || monthDay <= period.to
  );
}

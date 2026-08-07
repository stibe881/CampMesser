import { describe, expect, it } from "vitest";
import {
  DEFAULT_TARIFF_CURRENCY,
  MAX_SPOT_TARIFFS,
  MAX_TARIFF_PERIODS,
  formatMonthDay,
  formatTariffPeriods,
  parseAmountInput,
  parseDayMonthInput,
  parseSpotTariffs,
  serializeSpotTariffs,
  tariffActiveOn,
  tariffRange,
  tariffTotalRappen,
  type SpotTariff,
} from "@shared/spotTariffs";

/**
 * Mehrere Tarife pro Zeltplatz (#369).
 *
 * WORAUF ES ANKOMMT: Die Tarife stehen als JSON in einer Spalte. Was von
 * dort zurückkommt, ist nicht vertrauenswürdig – ein halb gespeicherter
 * Datensatz oder ein Stand aus einer älteren Version darf die Platzseite
 * nicht kippen. Unlesbares wird still weggelassen, nicht gemeldet.
 */
describe("Platz-Tarife", () => {
  it("nichts erfasst ist eine leere Liste", () => {
    expect(parseSpotTariffs(null)).toEqual([]);
    expect(parseSpotTariffs("")).toEqual([]);
    expect(parseSpotTariffs("kein json")).toEqual([]);
    expect(parseSpotTariffs('{"name":"x"}')).toEqual([]);
  });

  it("ein Tarif mit Untertarifen kommt heil zurück", () => {
    const json = JSON.stringify([
      {
        name: "Nebensaison",
        rows: [
          { label: "Erwachsene", priceRappen: 1200 },
          { label: "Kind", priceRappen: 600 },
        ],
      },
    ]);
    const [tariff] = parseSpotTariffs(json);
    expect(tariff.name).toBe("Nebensaison");
    expect(tariff.rows).toHaveLength(2);
    expect(tariffTotalRappen(tariff)).toBe(1800);
  });

  it("gratis ist eine Angabe, keine fehlende", () => {
    // «Kind bis 6 Jahre: gratis» muss dastehen dürfen.
    const json = JSON.stringify([
      { name: "Hauptsaison", rows: [{ label: "Kleinkind", priceRappen: 0 }] },
    ]);
    expect(parseSpotTariffs(json)[0].rows).toEqual([
      { label: "Kleinkind", priceRappen: 0 },
    ]);
  });

  it("kaputte Zeilen fallen weg, der Rest bleibt", () => {
    const json = JSON.stringify([
      {
        name: "Nebensaison",
        rows: [
          { label: "", priceRappen: 100 },
          { label: "Kind", priceRappen: "keine Zahl" },
          { label: "Hund", priceRappen: -5 },
          { label: "Erwachsene", priceRappen: 1200 },
        ],
      },
      { name: "", rows: [] },
      "Unsinn",
    ]);
    const tariffs = parseSpotTariffs(json);
    expect(tariffs).toHaveLength(1);
    expect(tariffs[0].rows).toEqual([
      { label: "Erwachsene", priceRappen: 1200 },
    ]);
  });

  it("mehr Tarife als erlaubt werden abgeschnitten", () => {
    const many = Array.from({ length: MAX_SPOT_TARIFFS + 5 }, (_, i) => ({
      name: `T${i}`,
      rows: [],
    }));
    expect(parseSpotTariffs(JSON.stringify(many))).toHaveLength(
      MAX_SPOT_TARIFFS
    );
  });

  it("leer speichern heisst NULL, nicht «[]»", () => {
    // «nicht erfasst» und «leer erfasst» sollen unterscheidbar bleiben.
    expect(serializeSpotTariffs([])).toBeNull();
    expect(
      serializeSpotTariffs([{ name: "  ", rows: [], currency: "CHF" }])
    ).toBeNull();
  });

  it("Speichern säubert mit derselben Regel wie das Lesen", () => {
    const json = serializeSpotTariffs([
      {
        name: "  Hauptsaison  ",
        rows: [{ label: " Erwachsene ", priceRappen: 1599.6 }],
        currency: "CHF",
      },
    ]);
    expect(parseSpotTariffs(json)).toEqual([
      {
        name: "Hauptsaison",
        rows: [{ label: "Erwachsene", priceRappen: 1600 }],
        currency: "CHF",
      },
    ]);
  });

  it("die Spanne über alle Tarife für die Kurzfassung", () => {
    const tariffs = parseSpotTariffs(
      JSON.stringify([
        { name: "Neben", rows: [{ label: "Kind", priceRappen: 600 }] },
        { name: "Haupt", rows: [{ label: "Erwachsene", priceRappen: 2400 }] },
      ])
    );
    expect(tariffRange(tariffs)).toEqual({ minRappen: 600, maxRappen: 2400 });
    expect(tariffRange([])).toBeNull();
  });
});

/**
 * Währung & Einheit (#395, Nutzerwunsch 07.08.2026).
 */
describe("Tarif-Währung und Einheit", () => {
  it("Bestände vor #395 lesen sich als CHF", () => {
    // Damals gab es nichts anderes – ein alter Datensatz ohne Währung
    // ist ein CHF-Datensatz, kein kaputter.
    const [tariff] = parseSpotTariffs(
      JSON.stringify([{ name: "Nebensaison", rows: [] }])
    );
    expect(tariff.currency).toBe("CHF");
    expect(DEFAULT_TARIFF_CURRENCY).toBe("CHF");
  });

  it("eine unbekannte Währung wird zum Standard, nicht zum Fehler", () => {
    const [tariff] = parseSpotTariffs(
      JSON.stringify([{ name: "T", rows: [], currency: "Fr." }])
    );
    expect(tariff.currency).toBe("CHF");
  });

  it("EUR bleibt EUR, die Einheit bleibt Freitext", () => {
    const [tariff] = parseSpotTariffs(
      JSON.stringify([
        { name: "T", rows: [], currency: "EUR", unit: "  pro Tag " },
      ])
    );
    expect(tariff.currency).toBe("EUR");
    expect(tariff.unit).toBe("pro Tag");
  });

  it("eine leere Einheit fehlt statt leer dazustehen", () => {
    const [tariff] = parseSpotTariffs(
      JSON.stringify([{ name: "T", rows: [], unit: "   " }])
    );
    expect(tariff.unit).toBeUndefined();
  });
});

/**
 * Getippte Beträge (#369, Bugfix 07.08.2026).
 *
 * DER GEMELDETE FEHLER «man kann keine Untertarife mehr hinzufügen» war
 * in Wahrheit ein stummer Datenverlust: «12.–» war für den Parser keine
 * Zahl, die Zeile fiel beim Speichern weg. Der Parser nimmt jetzt die
 * Schreibweisen echter Preistafeln.
 */
describe("parseAmountInput", () => {
  it("liest die üblichen Schreibweisen", () => {
    expect(parseAmountInput("12.50")).toBe(1250);
    expect(parseAmountInput("12,50")).toBe(1250);
    expect(parseAmountInput("12")).toBe(1200);
    expect(parseAmountInput(" 12.5 ")).toBe(1250);
  });

  it("liest die Schweizer Preistafel: «12.–» und «1'200»", () => {
    expect(parseAmountInput("12.–")).toBe(1200);
    expect(parseAmountInput("12.-")).toBe(1200);
    expect(parseAmountInput("1'200")).toBe(120000);
  });

  it("gratis ist 0, nicht unlesbar", () => {
    expect(parseAmountInput("0")).toBe(0);
  });

  it("Unlesbares und Negatives wird zu null", () => {
    expect(parseAmountInput("")).toBeNull();
    expect(parseAmountInput("gratis")).toBeNull();
    expect(parseAmountInput("-5")).toBeNull();
    expect(parseAmountInput("12.50 CHF")).toBeNull();
  });
});

/**
 * Gültigkeits-Zeiträume (#394, Nutzerwunsch 07.08.2026).
 */
describe("Tarif-Zeiträume", () => {
  const withPeriods = (periods: SpotTariff["periods"]): SpotTariff => ({
    name: "Hauptsaison",
    rows: [],
    currency: "CHF",
    periods,
  });

  it("Zeiträume überleben Speichern und Lesen", () => {
    const json = serializeSpotTariffs([
      withPeriods([
        { from: "04-02", to: "04-06" },
        { from: "06-22", to: "08-23" },
      ]),
    ]);
    expect(parseSpotTariffs(json)[0].periods).toEqual([
      { from: "04-02", to: "04-06" },
      { from: "06-22", to: "08-23" },
    ]);
  });

  it("halbe und unlesbare Zeiträume fallen still weg", () => {
    const [tariff] = parseSpotTariffs(
      JSON.stringify([
        {
          name: "T",
          rows: [],
          periods: [
            { from: "04-02" },
            { from: "13-01", to: "04-06" },
            { from: "04-40", to: "04-06" },
            "Unsinn",
            { from: "6-2", to: "8-23" },
          ],
        },
      ])
    );
    // Der letzte ist lesbar und wird normalisiert («6-2» → «06-02»).
    expect(tariff.periods).toEqual([{ from: "06-02", to: "08-23" }]);
  });

  it("mehr Zeiträume als erlaubt werden abgeschnitten", () => {
    const many = Array.from({ length: MAX_TARIFF_PERIODS + 3 }, (_, i) => ({
      from: `0${(i % 9) + 1}-01`,
      to: `0${(i % 9) + 1}-10`,
    }));
    const [tariff] = parseSpotTariffs(
      JSON.stringify([{ name: "T", rows: [], periods: many }])
    );
    expect(tariff.periods).toHaveLength(MAX_TARIFF_PERIODS);
  });

  it("ohne Zeiträume fehlt das Feld", () => {
    const [tariff] = parseSpotTariffs(
      JSON.stringify([{ name: "T", rows: [], periods: [] }])
    );
    expect(tariff.periods).toBeUndefined();
  });

  it("parseDayMonthInput nimmt, was Menschen tippen", () => {
    expect(parseDayMonthInput("2.4.")).toBe("04-02");
    expect(parseDayMonthInput("02.04.")).toBe("04-02");
    expect(parseDayMonthInput("02.04")).toBe("04-02");
    expect(parseDayMonthInput("32.04.")).toBeNull();
    expect(parseDayMonthInput("2.13.")).toBeNull();
    expect(parseDayMonthInput("April")).toBeNull();
  });

  it("formatMonthDay und formatTariffPeriods schreiben die Preistafel", () => {
    expect(formatMonthDay("04-02")).toBe("02.04.");
    expect(
      formatTariffPeriods([
        { from: "04-02", to: "04-06" },
        { from: "06-22", to: "08-23" },
      ])
    ).toBe("02.04.–06.04., 22.06.–23.08.");
  });

  it("tariffActiveOn: drin ist drin, daneben ist daneben", () => {
    const tariff = withPeriods([{ from: "06-22", to: "08-23" }]);
    expect(tariffActiveOn(tariff, "2026-06-22")).toBe(true);
    expect(tariffActiveOn(tariff, "2026-08-23")).toBe(true);
    expect(tariffActiveOn(tariff, "2026-05-01")).toBe(false);
    expect(tariffActiveOn(tariff, "2026-09-01")).toBe(false);
  });

  it("die Wintersaison läuft über den Jahreswechsel", () => {
    const tariff = withPeriods([{ from: "12-20", to: "01-10" }]);
    expect(tariffActiveOn(tariff, "2026-12-25")).toBe(true);
    expect(tariffActiveOn(tariff, "2027-01-05")).toBe(true);
    expect(tariffActiveOn(tariff, "2026-11-30")).toBe(false);
    expect(tariffActiveOn(tariff, "2027-02-01")).toBe(false);
  });

  it("ohne Zeiträume gilt der Tarif NICHT «immer»", () => {
    // Ein «gilt jetzt» an allen drei Tarifen wäre keine Auskunft.
    expect(tariffActiveOn(withPeriods(undefined), "2026-07-01")).toBe(false);
  });
});

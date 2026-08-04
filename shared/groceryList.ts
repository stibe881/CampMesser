/**
 * Wocheneinkauf aus dem Menüplan (#288): die Zutaten aller geplanten Tage
 * zu EINER Einkaufsliste zusammenrechnen – mengengerecht.
 *
 * Bisher wurden gleichlautende Zeilen nur entdoppelt. Das ging schief,
 * sobald dieselbe Zutat mehrfach vorkam: Aus «2 dl Rahm» am Montag und
 * «1 dl Rahm» am Donnerstag wurde ein einziges «2 dl Rahm» – und am
 * Donnerstag fehlte der Rahm. Hier wird stattdessen addiert.
 *
 * DREI REGELN, und die dritte ist die wichtigste:
 *
 * 1. ADDIERT WIRD IN DER GRUNDEINHEIT. 500 g plus 0,5 kg sind ein
 *    Kilogramm, nicht zwei Zeilen.
 * 2. ANGEZEIGT WIRD IN DER EINHEIT DER ERSTEN ZEILE – wer in Dezilitern
 *    plant, bekommt Deziliter zurück. Nur wenn die Summe die grosse
 *    Einheit füllt, wird auf kg bzw. l gewechselt: 1500 g sind 1,5 kg.
 * 3. WAS SICH NICHT SICHER UMRECHNEN LÄSST, WIRD NICHT UMGERECHNET.
 *    Ein Esslöffel ist kein Teelöffel, und eine Dose Tomaten sind keine
 *    500 Gramm Tomaten. Solche Zeilen werden nur zusammengefasst, wenn
 *    sie dieselbe Einheit benutzen – sonst stehen sie einzeln da. Lieber
 *    zwei ehrliche Zeilen als eine erfundene Zahl.
 *
 * Zeilen ohne Menge («Salz», «Pfeffer») werden wie bisher nur entdoppelt.
 */
import {
  findUnit,
  formatAmount,
  parseIngredientAmount,
  roundAmount,
  type UnitCategory,
} from "./servings";
import type { Language } from "./i18n";

/**
 * Umrechnungsfaktoren in die Grundeinheit – NUR für Gewicht und Volumen.
 * Löffel- und Stückmasse fehlen hier mit Absicht: «1 Tasse» ist je nach
 * Küche etwas anderes, und eine Dose ist keine Menge, sondern ein Gebinde.
 */
const BASE_FACTORS: Record<string, { factor: number; category: UnitCategory }> =
  {
    mg: { factor: 0.001, category: "mass" },
    g: { factor: 1, category: "mass" },
    kg: { factor: 1000, category: "mass" },
    ml: { factor: 1, category: "volume" },
    cl: { factor: 10, category: "volume" },
    dl: { factor: 100, category: "volume" },
    l: { factor: 1000, category: "volume" },
  };

/** Ab dieser Summe lohnt der Wechsel auf die grosse Einheit. */
const BIG_UNIT_THRESHOLD = 1000;

/** Die grosse Einheit je Klasse und ihr Faktor. */
const BIG_UNIT: Record<string, { text: string; factor: number }> = {
  mass: { text: "kg", factor: 1000 },
  volume: { text: "l", factor: 1000 },
};

/**
 * Faktor einer Einheit in die Grundeinheit; null, wenn die Einheit nicht
 * sicher umrechenbar ist (Löffel, Stück, Gebinde).
 */
export function baseFactorFor(
  unitText: string | null
): { factor: number; category: UnitCategory } | null {
  if (!unitText) return null;
  const unit = findUnit(unitText);
  if (!unit) return null;
  // Über die erste Schreibweise der Einheit: «Kilo» und «kg» sind dasselbe
  const canonical = unit.forms[0];
  return BASE_FACTORS[canonical] ?? null;
}

/**
 * Einheiten-Schlüssel für nicht umrechenbare Einheiten: die erste
 * Schreibweise der erkannten Einheit, sonst das Wort selbst.
 */
function canonicalUnitKey(unitText: string | null): string | null {
  if (!unitText) return null;
  const unit = findUnit(unitText);
  return unit ? unit.forms[0] : unitText.toLowerCase();
}

/**
 * Namen aufräumen, ohne ihn zu verändern: Leerraum vereinheitlichen und
 * Satzzeichen am Rand entfernen. Die Schreibweise BLEIBT – auf dem Zettel
 * soll «Rahm» stehen und nicht «rahm».
 */
function cleanName(name: string): string {
  return name
    .trim()
    .replace(/^[,;:.\-–\s]+/, "")
    .replace(/[,;:.\s]+$/, "")
    .replace(/\s+/g, " ");
}

/** Dieselbe Zutat erkennen: klein geschrieben, sonst wie `cleanName`. */
function normalizeName(name: string): string {
  return cleanName(name).toLowerCase();
}

/**
 * Mehrzahl auf Einzahl zurückführen – SEHR zurückhaltend.
 *
 * «Zwiebel» und «Zwiebeln» sind dasselbe, «Ei» und «Eis» nicht. Deshalb
 * wird nur eine angehängte Mehrzahl-Endung entfernt, und auch das nur,
 * wenn der Wortstamm lang genug ist, um kein anderes Wort zu sein.
 * Verschmolzen wird ausserdem nur, wenn beide Formen wirklich in der
 * Planung vorkommen – siehe `summarizeIngredients`.
 */
function singularKey(name: string): string {
  const match = /^(.*?)(en|n|s)$/.exec(name);
  if (!match) return name;
  const stem = match[1];
  return stem.length >= 4 ? stem : name;
}

export interface GroceryItem {
  /** Fertige Zeile für die Einkaufsliste, z. B. «1,5 kg Hackfleisch». */
  line: string;
  /** Der Name ohne Menge – für Herkunfts-Notiz und Suche. */
  name: string;
  /** Aus wie vielen Rezept-Zeilen ist diese Zeile entstanden? */
  sources: number;
  /** Wurde wirklich addiert (mehr als eine Zeile mit Menge)? */
  summed: boolean;
}

interface Bucket {
  /** Erste gesehene Schreibweise des Namens – die gewinnt. */
  name: string;
  /** Summe in der Grundeinheit bzw. in der Einheit der ersten Zeile. */
  total: number;
  /** Obergrenze, falls Bereiche («2–3 Zwiebeln») vorkamen. */
  totalTo: number;
  /** Kam überhaupt ein Bereich vor? */
  hasRange: boolean;
  /** Einheit der ersten Zeile, so wie sie dort stand. */
  unitText: string | null;
  /** Umrechenbar? Dann steht `total` in der Grundeinheit. */
  convertible: boolean;
  category: UnitCategory;
  sources: number;
}

/**
 * Zutaten-Zeilen mengengerecht zusammenfassen.
 *
 * Die Reihenfolge der Eingabe bleibt erhalten: Was zuerst geplant wurde,
 * steht zuerst auf der Liste.
 */
export function summarizeIngredients(
  lines: readonly string[],
  lang: Language = "de"
): GroceryItem[] {
  const buckets = new Map<string, Bucket>();
  const order: string[] = [];
  /** Zeilen ganz ohne Menge – nur entdoppeln, nichts rechnen. */
  const plain = new Map<string, string>();
  const plainOrder: string[] = [];
  /** Welche Namensstämme kamen vor? Für das vorsichtige Mehrzahl-Falten. */
  const stems = new Map<string, string>();

  const keyFor = (name: string, unitKey: string): string => {
    const normalized = normalizeName(name);
    const stem = singularKey(normalized);
    // Nur falten, wenn der Stamm schon einmal dastand – sonst bleibt der
    // Name so, wie er geschrieben wurde
    const known = stems.get(`${stem}|${unitKey}`);
    if (known) return known;
    const key = `${normalized}|${unitKey}`;
    stems.set(`${stem}|${unitKey}`, key);
    return key;
  };

  lines.forEach(raw => {
    const line = typeof raw === "string" ? raw.trim() : "";
    if (!line) return;
    const amount = parseIngredientAmount(line);
    if (!amount) {
      const key = normalizeName(line);
      if (!key || plain.has(key)) return;
      plain.set(key, line);
      plainOrder.push(key);
      return;
    }

    const name = amount.rest;
    const base = baseFactorFor(amount.unitText);
    // Umrechenbare Einheiten teilen sich einen Topf je Klasse, alle
    // anderen nur mit genau derselben Einheit
    const unitKey = base
      ? `#${base.category}`
      : // Über die erste Schreibweise: «Dose» und «Dosen» sind dieselbe
        // Einheit, «EL» und «Esslöffel» auch
        (canonicalUnitKey(amount.unitText) ?? "");
    const key = keyFor(name, unitKey);
    const factor = base ? base.factor : 1;
    const value = amount.value * factor;
    const valueTo = (amount.valueTo ?? amount.value) * factor;

    const existing = buckets.get(key);
    if (existing) {
      existing.total += value;
      existing.totalTo += valueTo;
      existing.hasRange = existing.hasRange || amount.valueTo !== null;
      existing.sources += 1;
      return;
    }
    buckets.set(key, {
      name: cleanName(name),
      total: value,
      totalTo: valueTo,
      hasRange: amount.valueTo !== null,
      unitText: amount.unitText,
      convertible: base !== null,
      category: base ? base.category : amount.category,
      sources: 1,
    });
    order.push(key);
  });

  const items: GroceryItem[] = order.map(key => {
    const bucket = buckets.get(key)!;
    let unitText = bucket.unitText;
    // GERUNDET WIRD IN DER GRUNDEINHEIT, erst danach umgerechnet. Andersherum
    // würden aus 1200 Millilitern glatte «1 l» statt der richtigen «1,2 l»:
    // Die Rundungsschritte sind auf Gramm und Milliliter gemacht, nicht auf
    // Kilo und Liter.
    let total = roundAmount(bucket.total, bucket.category);
    let totalTo = roundAmount(bucket.totalTo, bucket.category);

    if (bucket.convertible) {
      const own = baseFactorFor(bucket.unitText);
      const big = BIG_UNIT[bucket.category];
      const divisor =
        big && total >= BIG_UNIT_THRESHOLD ? big.factor : (own?.factor ?? 1);
      if (big && total >= BIG_UNIT_THRESHOLD) unitText = big.text;
      total /= divisor;
      totalTo /= divisor;
    }

    // Fliesskomma-Reste abschneiden (0.30000000000000004)
    const rounded = Math.round(total * 10000) / 10000;
    const roundedTo = Math.round(totalTo * 10000) / 10000;
    const amountText =
      bucket.hasRange && roundedTo > rounded
        ? `${formatAmount(rounded, lang)}–${formatAmount(roundedTo, lang)}`
        : formatAmount(rounded, lang);
    const unitPart = unitText ? `${unitText} ` : "";
    return {
      line: `${amountText} ${unitPart}${bucket.name}`
        .replace(/\s+/g, " ")
        .trim(),
      name: bucket.name,
      sources: bucket.sources,
      summed: bucket.sources > 1,
    };
  });

  plainOrder.forEach(key => {
    const line = plain.get(key)!;
    items.push({ line, name: line, sources: 1, summed: false });
  });

  return items;
}

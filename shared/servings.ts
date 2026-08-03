/**
 * Portionen im Rezept skalieren (#231): Mengenangaben am Anfang einer
 * Zutaten-Zeile lesen, mit einem Faktor multiplizieren und sinnvoll gerundet
 * wieder als Text ausgeben. Reine Funktionen ohne DOM/React – von der
 * Rezept-Seite, dem Menüplan und den Tests genutzt.
 *
 * Die Zutaten sind Freitext-Zeilen («400 g Mehl», «2-3 Zwiebeln», «Salz nach
 * Geschmack»). Erkannt wird ausschliesslich eine Mengenangabe am ZEILENANFANG;
 * Zeilen ohne Menge bleiben Zeichen für Zeichen unverändert.
 *
 * Bewusst OHNE Unicode-Property-Regexes (\p{L}) und ohne u-Flag – die
 * Einheiten aller vier Sprachen kommen mit ASCII plus Latin-1-Zeichenbereich
 * aus (siehe LETTER_CLASS).
 *
 * Grenzen (bewusst): Nur die EINHEIT wird in Ein-/Mehrzahl gesetzt, nicht das
 * Lebensmittel dahinter («2 Zwiebel» bleibt «2 Zwiebel», wenn die Zeile so
 * geschrieben ist). Und: Werte, die schon auf dem Rundungsraster liegen –
 * also praktisch alle Rezeptmengen – überstehen den Rundlauf «×2 dann ÷2»
 * unverändert.
 */
import { type Language } from "./i18n";

/** Wie eine Menge gerundet wird – abgeleitet aus der Einheit. */
export type UnitCategory =
  /** Gewicht (g, kg …) */
  | "mass"
  /** Volumen (ml, dl, l …) */
  | "volume"
  /** Löffel- und Tassenmasse (EL, TL, Tasse) – halbe Schritte */
  | "spoon"
  /** Stückzahlen (Stück, Dose, Zehe … und Zeilen ganz ohne Einheit) */
  | "piece";

/** Eine bekannte Einheit mit allen erkannten Schreibweisen. */
export interface UnitDefinition {
  category: UnitCategory;
  /** Erkannte Schreibweisen, klein und ohne Schlusspunkt. */
  forms: string[];
  /**
   * Ein-/Mehrzahl für ausgeschriebene Wort-Einheiten. Fehlt bei Kürzeln
   * (g, dl, EL …) – dort bleibt die Schreibweise der Zeile erhalten.
   */
  inflect?: { one: string; many: string };
}

/**
 * Einheiten in DE/FR/IT/EN. Kürzel stehen ohne `inflect` (sie ändern sich
 * nicht), ausgeschriebene Wörter mit Ein- und Mehrzahl der jeweiligen Sprache.
 */
export const UNITS: UnitDefinition[] = [
  // ── Gewicht ──
  { category: "mass", forms: ["g", "gr", "gramm", "gramme", "grammi", "gram"] },
  {
    category: "mass",
    forms: ["kg", "kilo", "kilos", "kilogramm", "kilogramme", "chilo", "chili"],
  },
  { category: "mass", forms: ["mg"] },
  // ── Volumen ──
  { category: "volume", forms: ["ml", "millilitre", "millilitri"] },
  { category: "volume", forms: ["cl"] },
  { category: "volume", forms: ["dl", "deziliter"] },
  {
    category: "volume",
    forms: ["l", "liter", "litre", "litres", "litro", "litri", "litres"],
  },
  // ── Löffel- und Tassenmasse ──
  {
    category: "spoon",
    forms: [
      "el",
      "essl",
      "esslöffel",
      "esslöffeln",
      "tbsp",
      "tbs",
      "cs",
      "cuillère",
      "cuillères",
      "cuillere",
      "cuilleres",
      "cucchiaio",
      "cucchiai",
    ],
  },
  {
    category: "spoon",
    forms: [
      "tl",
      "teel",
      "teelöffel",
      "kl",
      "kaffeelöffel",
      "tsp",
      "cc",
      "cucchiaino",
      "cucchiaini",
    ],
  },
  {
    category: "spoon",
    forms: ["tasse", "tassen"],
    inflect: { one: "Tasse", many: "Tassen" },
  },
  {
    category: "spoon",
    forms: ["cup", "cups"],
    inflect: { one: "cup", many: "cups" },
  },
  {
    category: "spoon",
    forms: ["tazza", "tazze"],
    inflect: { one: "tazza", many: "tazze" },
  },
  // ── Stückzahlen ──
  {
    category: "piece",
    forms: ["stück", "stücke", "stk", "stk."],
    inflect: { one: "Stück", many: "Stück" },
  },
  {
    category: "piece",
    forms: ["pièce", "pièces", "piece", "pieces"],
    inflect: { one: "pièce", many: "pièces" },
  },
  {
    category: "piece",
    forms: ["pezzo", "pezzi"],
    inflect: { one: "pezzo", many: "pezzi" },
  },
  {
    category: "piece",
    forms: ["dose", "dosen"],
    inflect: { one: "Dose", many: "Dosen" },
  },
  {
    category: "piece",
    forms: ["boîte", "boîtes", "boite", "boites"],
    inflect: { one: "boîte", many: "boîtes" },
  },
  {
    category: "piece",
    forms: ["barattolo", "barattoli"],
    inflect: { one: "barattolo", many: "barattoli" },
  },
  {
    category: "piece",
    forms: ["can", "cans", "tin", "tins"],
    inflect: { one: "can", many: "cans" },
  },
  {
    category: "piece",
    forms: ["päckli", "päckchen", "pack", "packung", "packungen"],
    inflect: { one: "Päckli", many: "Päckli" },
  },
  {
    category: "piece",
    forms: ["sachet", "sachets"],
    inflect: { one: "sachet", many: "sachets" },
  },
  {
    category: "piece",
    forms: ["bustina", "bustine"],
    inflect: { one: "bustina", many: "bustine" },
  },
  {
    category: "piece",
    forms: ["packet", "packets"],
    inflect: { one: "packet", many: "packets" },
  },
  {
    category: "piece",
    forms: ["prise", "prisen"],
    inflect: { one: "Prise", many: "Prisen" },
  },
  {
    category: "piece",
    forms: ["pincée", "pincées", "pincee", "pincees"],
    inflect: { one: "pincée", many: "pincées" },
  },
  {
    category: "piece",
    forms: ["pizzico", "pizzichi"],
    inflect: { one: "pizzico", many: "pizzichi" },
  },
  {
    category: "piece",
    forms: ["pinch", "pinches"],
    inflect: { one: "pinch", many: "pinches" },
  },
  {
    category: "piece",
    forms: ["zehe", "zehen"],
    inflect: { one: "Zehe", many: "Zehen" },
  },
  {
    category: "piece",
    forms: ["gousse", "gousses"],
    inflect: { one: "gousse", many: "gousses" },
  },
  {
    category: "piece",
    forms: ["spicchio", "spicchi"],
    inflect: { one: "spicchio", many: "spicchi" },
  },
  {
    category: "piece",
    forms: ["clove", "cloves"],
    inflect: { one: "clove", many: "cloves" },
  },
  {
    category: "piece",
    forms: ["scheibe", "scheiben"],
    inflect: { one: "Scheibe", many: "Scheiben" },
  },
  {
    category: "piece",
    forms: ["tranche", "tranches"],
    inflect: { one: "tranche", many: "tranches" },
  },
  {
    category: "piece",
    forms: ["fetta", "fette"],
    inflect: { one: "fetta", many: "fette" },
  },
  {
    category: "piece",
    forms: ["slice", "slices"],
    inflect: { one: "slice", many: "slices" },
  },
  {
    category: "piece",
    forms: ["blatt", "blätter"],
    inflect: { one: "Blatt", many: "Blätter" },
  },
  {
    category: "piece",
    forms: ["feuille", "feuilles"],
    inflect: { one: "feuille", many: "feuilles" },
  },
  {
    category: "piece",
    forms: ["foglia", "foglie"],
    inflect: { one: "foglia", many: "foglie" },
  },
  {
    category: "piece",
    forms: ["leaf", "leaves"],
    inflect: { one: "leaf", many: "leaves" },
  },
  {
    category: "piece",
    forms: ["bund", "bündel"],
    inflect: { one: "Bund", many: "Bund" },
  },
  {
    category: "piece",
    forms: ["bunch", "bunches"],
    inflect: { one: "bunch", many: "bunches" },
  },
  {
    category: "piece",
    forms: ["stange", "stangen"],
    inflect: { one: "Stange", many: "Stangen" },
  },
  {
    category: "piece",
    forms: ["becher"],
    inflect: { one: "Becher", many: "Becher" },
  },
  {
    category: "piece",
    forms: ["glas", "gläser"],
    inflect: { one: "Glas", many: "Gläser" },
  },
  {
    category: "piece",
    forms: ["verre", "verres"],
    inflect: { one: "verre", many: "verres" },
  },
  {
    category: "piece",
    forms: ["bicchiere", "bicchieri"],
    inflect: { one: "bicchiere", many: "bicchieri" },
  },
  {
    category: "piece",
    forms: ["handvoll"],
    inflect: { one: "Handvoll", many: "Handvoll" },
  },
  {
    category: "piece",
    forms: ["poignée", "poignées", "poignee", "poignees"],
    inflect: { one: "poignée", many: "poignées" },
  },
  {
    category: "piece",
    forms: ["manciata", "manciate"],
    inflect: { one: "manciata", many: "manciate" },
  },
  {
    category: "piece",
    forms: ["handful", "handfuls"],
    inflect: { one: "handful", many: "handfuls" },
  },
  {
    category: "piece",
    forms: ["tropfen"],
    inflect: { one: "Tropfen", many: "Tropfen" },
  },
  {
    category: "piece",
    forms: ["goutte", "gouttes"],
    inflect: { one: "goutte", many: "gouttes" },
  },
  {
    category: "piece",
    forms: ["goccia", "gocce"],
    inflect: { one: "goccia", many: "gocce" },
  },
  {
    category: "piece",
    forms: ["drop", "drops"],
    inflect: { one: "drop", many: "drops" },
  },
];

/** Nachschlagetabelle Schreibweise → Einheit (klein, ohne Schlusspunkt). */
const UNIT_BY_FORM = new Map<string, UnitDefinition>();
UNITS.forEach(unit => {
  unit.forms.forEach(form => {
    if (!UNIT_BY_FORM.has(form)) UNIT_BY_FORM.set(form, unit);
  });
});

/** Einheit zu einer Schreibweise – null, wenn das Wort keine Einheit ist. */
export function findUnit(word: string): UnitDefinition | null {
  const key = word.toLowerCase().replace(/\.$/, "");
  return UNIT_BY_FORM.get(key) ?? null;
}

/** Typografische Bruchzeichen und ihr Zahlenwert. */
const FRACTION_VALUES: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅕": 1 / 5,
  "⅖": 2 / 5,
  "⅗": 3 / 5,
  "⅘": 4 / 5,
  "⅙": 1 / 6,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

const FRACTION_CLASS = "½⅓⅔¼¾⅕⅖⅗⅘⅙⅛⅜⅝⅞";

/**
 * Buchstaben für Einheiten-Wörter: ASCII plus der Latin-Bereich (Umlaute,
 * Akzente). Ohne u-Flag, damit die Regex auch ohne Unicode-Modus arbeitet.
 */
const LETTER_CLASS = "a-zA-ZÀ-ɏ";

/**
 * Zahl in allen im Rezept üblichen Schreibweisen: gemischter Bruch («1 1/2»,
 * «1½»), einfacher Bruch («1/2», «½»), Dezimalzahl mit Komma oder Punkt und
 * ganze Zahl. Reihenfolge = längste Form zuerst.
 */
const NUMBER_PATTERN =
  `\\d+\\s*[${FRACTION_CLASS}]` +
  `|[${FRACTION_CLASS}]` +
  `|\\d+\\s+\\d+\\s*\\/\\s*\\d+` +
  `|\\d+\\s*\\/\\s*\\d+` +
  `|\\d+(?:[.,]\\d+)?`;

/** Mengenangabe am Zeilenanfang, optional als Bereich («2-3», «2 bis 3»). */
const AMOUNT_RE = new RegExp(
  `^(\\s*)(${NUMBER_PATTERN})` +
    `(?:(\\s*(?:-|–|—|bis|to|à|a)\\s*)(${NUMBER_PATTERN}))?`,
  "i"
);

/** Einheiten-Wort direkt nach der Zahl (mit optionalem Schlusspunkt). */
const UNIT_RE = new RegExp(`^([ \\t]*)([${LETTER_CLASS}]+\\.?)`);

/**
 * Nach der Mengenangabe muss die Zeile enden oder ein Trennzeichen folgen –
 * so wird «3-Käse-Mischung» nicht als Menge missverstanden.
 */
const BOUNDARY_RE = /^(?:$|[\s,;:.()\/])/;

/** Eine erkannte Mengenangabe am Anfang einer Zutaten-Zeile. */
export interface IngredientAmount {
  /** Wert (bei Bereichen die untere Grenze). */
  value: number;
  /** Obere Grenze eines Bereichs, sonst null. */
  valueTo: number | null;
  /** Trennzeichen des Bereichs, so wie es in der Zeile steht (inkl. Leerraum). */
  rangeSeparator: string | null;
  /** Einheit, falls erkannt – sonst null (reine Stückzahl). */
  unit: UnitDefinition | null;
  /** Einheiten-Wort im Wortlaut der Zeile (null ohne Einheit). */
  unitText: string | null;
  /** Rundungsklasse: Einheit oder «piece», wenn keine Einheit dasteht. */
  category: UnitCategory;
  /** Leerraum vor der Zahl (bleibt beim Umbauen erhalten). */
  leading: string;
  /** Alles nach der Mengenangabe – wird unverändert übernommen. */
  rest: string;
}

/** «1,5», «1.5», «1/2», «½» und «1 ½» gleichermassen lesen. */
export function parseNumberToken(raw: string): number {
  const text = raw.trim();
  const fractionChar = text.slice(-1);
  const fractionValue = FRACTION_VALUES[fractionChar];
  if (fractionValue !== undefined) {
    const whole = text.slice(0, -1).trim();
    const base = whole === "" ? 0 : Number(whole.replace(",", "."));
    return Number.isFinite(base) ? base + fractionValue : NaN;
  }
  const slash = text.indexOf("/");
  if (slash >= 0) {
    const before = text.slice(0, slash).trim();
    const denominator = Number(text.slice(slash + 1).trim());
    // Gemischter Bruch «1 1/2»: Ganzzahl und Zähler stehen vor dem Strich
    const parts = before.split(/\s+/);
    const numerator = Number(parts[parts.length - 1]);
    const whole = parts.length > 1 ? Number(parts[0]) : 0;
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator))
      return NaN;
    if (denominator === 0 || !Number.isFinite(whole)) return NaN;
    return whole + numerator / denominator;
  }
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) ? value : NaN;
}

/**
 * Mengenangabe am Anfang einer Zutaten-Zeile lesen. null bedeutet: keine
 * Menge erkannt («Salz nach Geschmack») – die Zeile bleibt unverändert.
 */
export function parseIngredientAmount(line: string): IngredientAmount | null {
  if (typeof line !== "string" || line.trim() === "") return null;
  const match = AMOUNT_RE.exec(line);
  if (!match) return null;
  const value = parseNumberToken(match[2] ?? "");
  if (!Number.isFinite(value) || value <= 0) return null;

  let valueTo: number | null = null;
  let rangeSeparator: string | null = null;
  if (match[4] !== undefined) {
    const upper = parseNumberToken(match[4]);
    // Nur echte, aufsteigende Bereiche gelten als Bereich
    if (Number.isFinite(upper) && upper > value) {
      valueTo = upper;
      rangeSeparator = match[3] ?? null;
    }
  }

  // Ohne gültige obere Grenze zählt nur die erste Zahl
  let end = (match[1] ?? "").length + (match[2] ?? "").length;
  if (valueTo !== null) {
    end += (match[3] ?? "").length + (match[4] ?? "").length;
  }

  let unit: UnitDefinition | null = null;
  let unitText: string | null = null;
  const unitMatch = UNIT_RE.exec(line.slice(end));
  if (unitMatch) {
    const found = findUnit(unitMatch[2]);
    if (found) {
      unit = found;
      unitText = unitMatch[2];
      end += unitMatch[0].length;
    }
  }

  if (!BOUNDARY_RE.test(line.slice(end))) return null;

  return {
    value,
    valueTo,
    rangeSeparator,
    unit,
    unitText,
    category: unit?.category ?? "piece",
    leading: match[1] ?? "",
    rest: line.slice(end),
  };
}

/** Kleinster sinnvoller Schritt je Rundungsklasse – nie auf 0 runden. */
const MIN_STEP: Record<UnitCategory, number> = {
  mass: 0.05,
  volume: 0.05,
  spoon: 0.25,
  piece: 0.5,
};

/**
 * Rundungsschritt für einen Wert: Gramm/Milliliter werden mit der Menge
 * gröber (5er-, 10er-, 50er-Schritte), Löffelmasse gehen in Vierteln und
 * Halben, Stückzahlen in Halben und ab vier Stück in Ganzen.
 */
function stepFor(value: number, category: UnitCategory): number {
  if (category === "spoon") return value < 1 ? 0.25 : 0.5;
  if (category === "piece") return value < 4 ? 0.5 : 1;
  if (value < 1) return 0.05;
  if (value < 10) return 0.5;
  if (value < 100) return 5;
  if (value < 1000) return 10;
  return 50;
}

/**
 * Menge sinnvoll runden: Gramm/Milliliter auf glatte Werte, Löffelmasse auf
 * Viertel/Halbe, Stückzahlen auf Halbe oder Ganze. Sehr kleine Mengen werden
 * nie auf 0 gerundet, sondern auf den kleinsten Schritt der Klasse.
 */
export function roundAmount(value: number, category: UnitCategory): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const step = stepFor(value, category);
  const rounded = Math.round(value / step) * step;
  const min = MIN_STEP[category];
  // Rundungsfehler der Fliesskommazahlen abschneiden (0.30000000000000004)
  const clean = Math.round(rounded * 10000) / 10000;
  return clean < min ? min : clean;
}

/** Dezimaltrennzeichen der Sprache: Punkt im Englischen, sonst Komma. */
function decimalSeparator(lang: Language): string {
  return lang === "en" ? "." : ",";
}

/**
 * Menge als Text: ganze Zahlen ohne Nachkomma, sonst mit bis zu zwei
 * Nachkommastellen und dem Trennzeichen der Sprache.
 */
export function formatAmount(value: number, lang: Language = "de"): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded
    .toFixed(2)
    .replace(/0+$/, "")
    .replace(".", decimalSeparator(lang));
}

/** Ein-/Mehrzahl der Einheit, mit der Gross-/Kleinschreibung der Zeile. */
function unitTextFor(amount: IngredientAmount, value: number): string {
  const { unit, unitText } = amount;
  if (!unit || unitText === null) return "";
  if (!unit.inflect) return unitText;
  const form = value === 1 ? unit.inflect.one : unit.inflect.many;
  // Schreibweise der Zeile beibehalten: klein geschrieben bleibt klein
  const firstChar = unitText.charAt(0);
  if (firstChar === firstChar.toLowerCase()) {
    return form.charAt(0).toLowerCase() + form.slice(1);
  }
  return form.charAt(0).toUpperCase() + form.slice(1);
}

/** Faktor von der Grundportionenzahl auf die gewünschte Personenzahl. */
export function servingsFactor(
  baseServings: number,
  targetServings: number
): number {
  if (
    !Number.isFinite(baseServings) ||
    !Number.isFinite(targetServings) ||
    baseServings <= 0 ||
    targetServings <= 0
  ) {
    return 1;
  }
  return targetServings / baseServings;
}

/** Erlaubte Personenzahl im Rezept – gleiche Grenzen wie im Rezept-Editor. */
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;

/** Personenzahl auf den erlaubten Bereich begrenzen (ungültig → Grundwert). */
export function clampServings(value: number, fallback = 4): number {
  if (!Number.isFinite(value)) return fallback;
  const whole = Math.round(value);
  if (whole < MIN_SERVINGS) return MIN_SERVINGS;
  if (whole > MAX_SERVINGS) return MAX_SERVINGS;
  return whole;
}

/**
 * Eine Zutaten-Zeile auf einen Faktor umrechnen.
 *
 * - Ohne erkannte Mengenangabe («Salz nach Geschmack») bleibt die Zeile gleich.
 * - Bereiche («2-3 Zwiebeln») werden an beiden Enden mitgerechnet.
 * - Faktor 1 gibt die Zeile unverändert zurück – nichts wird umformatiert.
 */
export function scaleIngredientLine(
  line: string,
  factor: number,
  lang: Language = "de"
): string {
  if (typeof line !== "string") return "";
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return line;
  const amount = parseIngredientAmount(line);
  if (!amount) return line;

  const value = roundAmount(amount.value * factor, amount.category);
  const upper =
    amount.valueTo === null
      ? null
      : roundAmount(amount.valueTo * factor, amount.category);

  // Die Mehrzahl richtet sich nach der Zahl, die vor der Einheit steht
  const decisive = upper ?? value;
  const unitText = unitTextFor(amount, decisive);
  const numberText =
    upper === null || upper === value
      ? formatAmount(value, lang)
      : `${formatAmount(value, lang)}${amount.rangeSeparator ?? "-"}${formatAmount(upper, lang)}`;

  return `${amount.leading}${numberText}${unitText ? ` ${unitText}` : ""}${amount.rest}`;
}

/** Mehrere Zutaten-Zeilen auf einmal umrechnen (Reihenfolge bleibt). */
export function scaleIngredientLines(
  lines: string[],
  factor: number,
  lang: Language = "de"
): string[] {
  return lines.map(line => scaleIngredientLine(line, factor, lang));
}

/**
 * Zutaten eines Rezepts auf eine Personenzahl umrechnen – Kurzform für
 * `scaleIngredientLines(lines, servingsFactor(base, target), lang)`.
 */
export function scaleIngredientsForServings(
  lines: string[],
  baseServings: number,
  targetServings: number,
  lang: Language = "de"
): string[] {
  return scaleIngredientLines(
    lines,
    servingsFactor(baseServings, targetServings),
    lang
  );
}

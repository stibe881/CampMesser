/**
 * Vorrats-Logik: Zustand und Resttage aus dem Mindesthaltbarkeitsdatum
 * ableiten sowie die Kataloge für Lagerort, Einheit und Vorrats-Kategorie.
 * Reine Funktionen auf ISO-Daten (YYYY-MM-DD).
 *
 * Seit #233 hat ein Vorrats-Eintrag einen LAGERORT: «cooled» (Kühlbox) oder
 * «dry» (Trockenvorrat-Schrank). Beide liegen bewusst in DERSELBEN Tabelle –
 * Einkaufsliste, MHD-Erinnerung, Resteverwertung und Vorlagen arbeiten so
 * ohne Doppelspurigkeit auf einem einzigen Bestand.
 */
import { l4, pick, type L4, type Language } from "./i18n";
import type { ShoppingCategory } from "./shopping";

export type ExpiryState = "expired" | "today" | "soon" | "ok";

export interface ExpiryInfo {
  state: ExpiryState;
  /** Tage bis zum Ablauf (negativ = bereits abgelaufen) */
  daysLeft: number;
  /** Kurztext für die Anzeige, z. B. «läuft heute ab» */
  label: string;
}

const DAY_MS = 86400000;
/** Ab so vielen Resttagen (einschliesslich) gilt ein Lebensmittel als «bald ablaufend». */
export const SOON_THRESHOLD_DAYS = 3;

/** Anzeigetexte in allen vier Sprachen. */
const LABELS = {
  expiredYesterday: l4(
    "seit gestern abgelaufen",
    "périmé depuis hier",
    "scaduto da ieri",
    "expired since yesterday"
  ),
  expiredDays: (d: number) =>
    l4(
      `seit ${d} Tagen abgelaufen`,
      `périmé depuis ${d} jours`,
      `scaduto da ${d} giorni`,
      `expired ${d} days ago`
    ),
  today: l4(
    "läuft heute ab",
    "expire aujourd'hui",
    "scade oggi",
    "expires today"
  ),
  tomorrow: l4(
    "läuft morgen ab",
    "expire demain",
    "scade domani",
    "expires tomorrow"
  ),
  daysLeft: (d: number) =>
    l4(
      `noch ${d} Tage`,
      `encore ${d} jours`,
      `ancora ${d} giorni`,
      `${d} days left`
    ),
};

function parseIsoDay(iso: string): number | null {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/** Haltbarkeits-Info zu einem MHD (null = kein Datum erfasst oder unlesbar). */
export function expiryInfo(
  expiryDate: string | null | undefined,
  today: string,
  lang: Language = "de"
): ExpiryInfo | null {
  if (!expiryDate) return null;
  const expiry = parseIsoDay(expiryDate);
  const now = parseIsoDay(today);
  if (expiry === null || now === null) return null;
  const daysLeft = Math.round((expiry - now) / DAY_MS);
  if (daysLeft < 0) {
    const days = Math.abs(daysLeft);
    return {
      state: "expired",
      daysLeft,
      label: pick(
        days === 1 ? LABELS.expiredYesterday : LABELS.expiredDays(days),
        lang
      ),
    };
  }
  if (daysLeft === 0)
    return { state: "today", daysLeft, label: pick(LABELS.today, lang) };
  if (daysLeft <= SOON_THRESHOLD_DAYS) {
    return {
      state: "soon",
      daysLeft,
      label: pick(
        daysLeft === 1 ? LABELS.tomorrow : LABELS.daysLeft(daysLeft),
        lang
      ),
    };
  }
  return {
    state: "ok",
    daysLeft,
    label: pick(LABELS.daysLeft(daysLeft), lang),
  };
}

/**
 * Einfache Normalisierung für den Zutaten-Abgleich: Kleinschreibung,
 * Umlaute/Akzente falten und alles ausser a–z entfernen (Mengen, Einheiten
 * und Satzzeichen fallen so weg).
 */
export function normalizeFoodName(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/é|è|ê/g, "e")
    .replace(/à|â/g, "a")
    .replace(/[^a-z]/g, "");
}

/**
 * Kürzeste normalisierte Länge, die noch verglichen wird – kürzere Namen
 * («Ei», «Öl») würden sonst in fast jeder Zutat als Teilstring auftauchen.
 */
export const FOOD_MATCH_MIN_LENGTH = 3;

/** Minimal nötige Felder eines Kühlbox-Eintrags fürs Matching. */
export interface FoodItemLike {
  id: number;
  name: string;
}

/** Ein Kühlbox-Eintrag samt der Rezept-Zutat, die ihn getroffen hat. */
export interface FoodMatch<T extends FoodItemLike> {
  item: T;
  ingredient: string;
}

/**
 * Rezept-Zutaten mit den Kühlbox-Einträgen abgleichen (#190): getroffen wird,
 * wenn der normalisierte Name des Eintrags in der normalisierten Zutat steckt
 * oder umgekehrt («Tomaten» ↔ «4 Tomaten, gewürfelt», «Käse» ↔ «Bergkäse»).
 * Jeder Eintrag erscheint höchstens einmal – mit der ERSTEN passenden Zutat;
 * die Reihenfolge der Kühlbox bleibt erhalten.
 */
export function matchFoodItems<T extends FoodItemLike>(
  ingredients: string[],
  foodItems: T[]
): FoodMatch<T>[] {
  const normalizedIngredients = ingredients
    .map(ingredient => ({
      ingredient,
      normalized: normalizeFoodName(ingredient),
    }))
    .filter(entry => entry.normalized.length > 0);
  const matches: FoodMatch<T>[] = [];
  foodItems.forEach(item => {
    const normalizedName = normalizeFoodName(item.name);
    if (normalizedName.length < FOOD_MATCH_MIN_LENGTH) return;
    const hit = normalizedIngredients.find(
      entry =>
        entry.normalized.includes(normalizedName) ||
        normalizedName.includes(entry.normalized)
    );
    if (hit) matches.push({ item, ingredient: hit.ingredient });
  });
  return matches;
}

/**
 * Sortierschlüssel für «Verbrauche zuerst»: ablaufende Einträge zuerst
 * (früheste zuerst), Einträge ohne Datum ans Ende.
 */
export function expirySortKey(expiryDate: string | null | undefined): number {
  if (!expiryDate) return Number.MAX_SAFE_INTEGER;
  const t = parseIsoDay(expiryDate);
  return t === null ? Number.MAX_SAFE_INTEGER : t;
}

// ── Lagerorte (#233): Kühlbox und Trockenvorrat-Schrank ──

/** Lagerort-Schlüssel, wie sie in der Datenbank stehen. */
export const FOOD_STORAGES = ["cooled", "dry"] as const;
export type FoodStorage = (typeof FOOD_STORAGES)[number];

/** Standard-Lagerort: alles ohne Angabe liegt in der Kühlbox. */
export const DEFAULT_FOOD_STORAGE: FoodStorage = "cooled";

/** Anzeige-Namen der beiden Lager (Schlüssel bleiben englisch in der DB). */
export const FOOD_STORAGE_LABELS: Record<FoodStorage, L4> = {
  cooled: l4("Kühlbox", "Glacière", "Frigo box", "Cool box"),
  dry: l4("Trockenvorrat", "Provisions sèches", "Dispensa", "Dry store"),
};

/** Ist der Wert ein bekannter Lagerort? */
export function isFoodStorage(
  value: string | null | undefined
): value is FoodStorage {
  return value != null && (FOOD_STORAGES as readonly string[]).includes(value);
}

/** Unbekannte oder fehlende Lagerorte landen in der Kühlbox. */
export function normalizeFoodStorage(
  value: string | null | undefined
): FoodStorage {
  return isFoodStorage(value) ? value : DEFAULT_FOOD_STORAGE;
}

// ── Einheiten: kurze Auswahl fürs Mengenfeld ──

/** Einheiten-Schlüssel (in der DB); die Anzeige kommt aus FOOD_UNIT_LABELS. */
export const FOOD_UNITS = [
  "piece",
  "pack",
  "g",
  "kg",
  "ml",
  "l",
  "can",
  "bottle",
] as const;
export type FoodUnit = (typeof FOOD_UNITS)[number];

/** Kurze Anzeige-Einheiten – g, kg, ml und l sind überall gleich. */
export const FOOD_UNIT_LABELS: Record<FoodUnit, L4> = {
  piece: l4("Stk.", "pce", "pz", "pcs"),
  pack: l4("Pack.", "paquet", "conf.", "pack"),
  g: l4("g", "g", "g", "g"),
  kg: l4("kg", "kg", "kg", "kg"),
  ml: l4("ml", "ml", "ml", "ml"),
  l: l4("l", "l", "l", "l"),
  can: l4("Dose", "boîte", "lattina", "tin"),
  bottle: l4("Fl.", "bouteille", "bottiglia", "bottle"),
};

/** Ist der Wert ein bekannter Einheiten-Schlüssel? */
export function isFoodUnit(
  value: string | null | undefined
): value is FoodUnit {
  return value != null && (FOOD_UNITS as readonly string[]).includes(value);
}

/**
 * Menge und Einheit als eine Zeile: «500 g», «2 Dose». Ohne Menge gibt es
 * nichts anzuzeigen (null); eine unbekannte Einheit fällt weg. Alt-Einträge
 * tragen Menge UND Einheit im Freitext («500 g») – die bleiben unverändert.
 */
export function formatFoodQuantity(
  quantity: string | null | undefined,
  unit: string | null | undefined,
  lang: Language = "de"
): string | null {
  const amount = (quantity ?? "").trim();
  if (!amount) return null;
  if (!isFoodUnit(unit)) return amount;
  return `${amount} ${pick(FOOD_UNIT_LABELS[unit], lang)}`;
}

// ── Vorrats-Kategorien: Ordnung im Trockenvorrat-Schrank ──

/** Kategorien-Schlüssel in Anzeige-Reihenfolge (Schrank von oben nach unten). */
export const FOOD_CATEGORIES = [
  "cans",
  "pasta",
  "baking",
  "breakfast",
  "coffee",
  "spices",
  "snacks",
  "drinks",
  "other",
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

/** Anzeige-Labels der Vorrats-Kategorien. */
export const FOOD_CATEGORY_LABELS: Record<FoodCategory, L4> = {
  cans: l4("Konserven", "Conserves", "Conserve", "Tinned food"),
  pasta: l4("Teigwaren & Reis", "Pâtes & riz", "Pasta e riso", "Pasta & rice"),
  baking: l4(
    "Mehl & Backen",
    "Farine & pâtisserie",
    "Farina e dolci da forno",
    "Flour & baking"
  ),
  breakfast: l4("Frühstück", "Petit-déjeuner", "Colazione", "Breakfast"),
  coffee: l4("Kaffee & Tee", "Café & thé", "Caffè e tè", "Coffee & tea"),
  spices: l4(
    "Gewürze & Saucen",
    "Épices & sauces",
    "Spezie e salse",
    "Spices & sauces"
  ),
  snacks: l4(
    "Snacks & Süsses",
    "En-cas & sucreries",
    "Snack e dolci",
    "Snacks & sweets"
  ),
  drinks: l4("Getränke", "Boissons", "Bevande", "Drinks"),
  other: l4("Sonstiges", "Divers", "Varie", "Other"),
};

/** Ist der Wert eine bekannte Vorrats-Kategorie? */
export function isFoodCategory(
  value: string | null | undefined
): value is FoodCategory {
  return (
    value != null && (FOOD_CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Passende Laden-Kategorie fürs «Nachkaufen» (shared/shopping.ts): Trocken-
 * vorräte landen im Laden-Regal «Trockenwaren», Getränke bei den Getränken.
 * So kommt ein nachgekaufter Vorrat gleich in der richtigen Gruppe an.
 */
export const FOOD_CATEGORY_SHOPPING: Record<FoodCategory, ShoppingCategory> = {
  cans: "dry",
  pasta: "dry",
  baking: "dry",
  breakfast: "dry",
  coffee: "dry",
  spices: "dry",
  snacks: "dry",
  drinks: "drinks",
  other: "other",
};

/** Laden-Kategorie zu einer Vorrats-Kategorie (unbekannt = keine). */
export function shoppingCategoryForFood(
  value: string | null | undefined
): ShoppingCategory | null {
  return isFoodCategory(value) ? FOOD_CATEGORY_SHOPPING[value] : null;
}

/**
 * Einträge eines Lagers nach Kategorie gruppieren – in der Reihenfolge von
 * FOOD_CATEGORIES, leere Gruppen fallen weg, Einträge ohne (gültige)
 * Kategorie stehen als `null`-Gruppe zuletzt. Die Reihenfolge innerhalb
 * einer Gruppe bleibt erhalten (also die bereits gewählte Sortierung).
 */
export function groupFoodByCategory<T extends { category?: string | null }>(
  items: readonly T[]
): { category: FoodCategory | null; items: T[] }[] {
  const groups: { category: FoodCategory | null; items: T[] }[] = [];
  FOOD_CATEGORIES.forEach(category => {
    const own = items.filter(i => i.category === category);
    if (own.length > 0) groups.push({ category, items: own });
  });
  const rest = items.filter(i => !isFoodCategory(i.category));
  if (rest.length > 0) groups.push({ category: null, items: rest });
  return groups;
}

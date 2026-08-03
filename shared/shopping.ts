/**
 * Einkaufslisten-Kategorien: fester Katalog in Laden-Reihenfolge –
 * so wandert man beim Einkaufen einmal durchs Geschäft. Die Schlüssel
 * landen in der DB (shoppingItems.category), die Labels sind L4-Texte.
 * null = «Ohne Kategorie» (Label im Wörterbuch des Clients).
 */
import { l4, pick, type L4, type Language } from "./i18n";
import { comparePackCategories } from "./packCategories";

/** Maximale Länge eines Listen-Namens (#215) – gleich wie in der DB-Spalte. */
export const MAX_SHOPPING_LIST_NAME_LENGTH = 80;

/**
 * Name der Standard-Liste, die der Server beim ersten Zugriff anlegt bzw. an
 * die er Bestände aus der Zeit der EINEN Liste hängt (#215). Der Name landet
 * als Text in der DB – deshalb wird beim Anlegen die App-Sprache mitgegeben
 * und über pick() aufgelöst; umbenennen lässt er sich jederzeit.
 */
export const DEFAULT_SHOPPING_LIST_NAME: L4 = l4(
  "Einkaufsliste",
  "Liste de courses",
  "Lista della spesa",
  "Shopping list"
);

/** Kategorien-Schlüssel in Laden-Reihenfolge (Anzeige-Reihenfolge der Gruppen). */
export const SHOPPING_CATEGORIES = [
  "fruitVeg",
  "dairy",
  "meatFish",
  "dry",
  "drinks",
  "frozen",
  "hygiene",
  "other",
] as const;
export type ShoppingCategory = (typeof SHOPPING_CATEGORIES)[number];

/** Anzeige-Labels der Kategorien (Schlüssel bleiben englisch in der DB). */
export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategory, L4> = {
  fruitVeg: l4(
    "Früchte & Gemüse",
    "Fruits & légumes",
    "Frutta & verdura",
    "Fruit & veg"
  ),
  dairy: l4("Milchprodukte", "Produits laitiers", "Latticini", "Dairy"),
  meatFish: l4(
    "Fleisch & Fisch",
    "Viande & poisson",
    "Carne & pesce",
    "Meat & fish"
  ),
  dry: l4("Trockenwaren", "Produits secs", "Prodotti secchi", "Dry goods"),
  drinks: l4("Getränke", "Boissons", "Bevande", "Drinks"),
  frozen: l4("Tiefkühl", "Surgelés", "Surgelati", "Frozen"),
  hygiene: l4("Hygiene", "Hygiène", "Igiene", "Hygiene"),
  other: l4("Sonstiges", "Divers", "Varie", "Other"),
};

/** Ist der Wert ein bekannter Kategorien-Schlüssel? */
export function isShoppingCategory(
  value: string | null | undefined
): value is ShoppingCategory {
  return (
    value != null && (SHOPPING_CATEGORIES as readonly string[]).includes(value)
  );
}

// ── Eigene Kategorien (#272) ──────────────────────────────────────────────
//
// Neben dem festen Katalog darf man eigene Kategorien anlegen (Freitext).
// Damit ein getippter Name nie mit einem Katalog-Schlüssel kollidiert – jemand
// tippt «dry» –, stehen eigene Kategorien mit Präfix in der DB: «custom:Grill».
// Der Wert bleibt so in EINER Spalte (varchar(80)), es braucht keine zweite
// Tabelle und keine Migration.

/** Präfix, mit dem eigene Kategorien in der DB stehen. */
export const CUSTOM_CATEGORY_PREFIX = "custom:";

/** Maximale Länge des gespeicherten Werts – wie die DB-Spalte (varchar(80)). */
export const MAX_SHOPPING_CATEGORY_LENGTH = 80;

/** Maximale Länge des getippten Namens, damit «custom:» + Name hineinpasst. */
export const MAX_CUSTOM_CATEGORY_NAME_LENGTH =
  MAX_SHOPPING_CATEGORY_LENGTH - CUSTOM_CATEGORY_PREFIX.length;

/**
 * Getippten Namen in einen speicherbaren Kategorie-Wert übersetzen: getrimmt
 * und auf die Höchstlänge gekürzt. Leerer Name → null («Ohne Kategorie»).
 */
export function customCategory(name: string): string | null {
  const trimmed = name.trim().slice(0, MAX_CUSTOM_CATEGORY_NAME_LENGTH).trim();
  return trimmed ? `${CUSTOM_CATEGORY_PREFIX}${trimmed}` : null;
}

/** Ist der Wert eine eigene Kategorie («custom:<Name>» mit echtem Namen)? */
export function isCustomCategory(
  value: string | null | undefined
): value is string {
  return customCategoryName(value) !== null;
}

/** Name einer eigenen Kategorie; null, wenn es keine eigene Kategorie ist. */
export function customCategoryName(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  if (value.length > MAX_SHOPPING_CATEGORY_LENGTH) return null;
  if (!value.startsWith(CUSTOM_CATEGORY_PREFIX)) return null;
  const name = value.slice(CUSTOM_CATEGORY_PREFIX.length).trim();
  return name || null;
}

/** Ist der Wert überhaupt speicherbar – Katalog-Schlüssel ODER eigene Kategorie? */
export function isShoppingCategoryValue(
  value: string | null | undefined
): value is string {
  return isShoppingCategory(value) || isCustomCategory(value);
}

/**
 * Anzeige-Label eines Kategorie-Werts: Katalog-Schlüssel → übersetztes Label,
 * eigene Kategorie → der getippte Name. null (auch bei unbekannten Werten),
 * damit der Aufrufer sein eigenes «Ohne Kategorie» einsetzen kann.
 */
export function shoppingCategoryLabel(
  value: string | null | undefined,
  lang: Language = "de"
): string | null {
  if (isShoppingCategory(value))
    return pick(SHOPPING_CATEGORY_LABELS[value], lang);
  return customCategoryName(value);
}

/** Rang für die Anzeige: Katalog in Laden-Reihenfolge, dann eigene, dann ohne. */
function categoryRank(value: string | null | undefined): number {
  if (isShoppingCategory(value))
    return (SHOPPING_CATEGORIES as readonly string[]).indexOf(value);
  if (isCustomCategory(value)) return SHOPPING_CATEGORIES.length;
  return SHOPPING_CATEGORIES.length + 1;
}

/**
 * Sortierung der Kategorie-Gruppen: erst der Katalog in Laden-Reihenfolge
 * (so wandert man einmal durchs Geschäft), dann die eigenen Kategorien
 * alphabetisch, «Ohne Kategorie» zuletzt.
 */
export function compareShoppingCategories(
  a: string | null | undefined,
  b: string | null | undefined,
  lang: Language = "de"
): number {
  const rankA = categoryRank(a);
  const rankB = categoryRank(b);
  if (rankA !== rankB) return rankA - rankB;
  const nameA = customCategoryName(a);
  const nameB = customCategoryName(b);
  if (nameA !== null && nameB !== null)
    return comparePackCategories(nameA, nameB, lang);
  return 0;
}

/**
 * Die eigenen Kategorien einer Liste – für die Auswahl am Eintrag: doppelte
 * Werte fliegen raus, sortiert wird alphabetisch. Katalog-Schlüssel und
 * unbekannte Werte werden übersprungen.
 */
export function customShoppingCategories(
  values: readonly (string | null | undefined)[],
  lang: Language = "de"
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach(value => {
    if (!isCustomCategory(value) || seen.has(value)) return;
    seen.add(value);
    result.push(value);
  });
  return result.sort((a, b) => compareShoppingCategories(a, b, lang));
}

/**
 * Einträge nach Kategorie gruppieren – in Anzeige-Reihenfolge (Katalog, dann
 * eigene Kategorien alphabetisch, «Ohne Kategorie» zuletzt). Unbekannte Werte
 * landen bei «Ohne Kategorie»; innerhalb einer Gruppe bleibt die Reihenfolge
 * der Einträge erhalten. Leere Gruppen entstehen gar nicht erst.
 */
export function groupByShoppingCategory<T extends { category?: string | null }>(
  items: readonly T[],
  lang: Language = "de"
): { key: string | null; items: T[] }[] {
  const groups: { key: string | null; items: T[] }[] = [];
  const byKey = new Map<string, { key: string | null; items: T[] }>();
  items.forEach(item => {
    const raw = item.category ?? null;
    const key = isShoppingCategoryValue(raw) ? raw : null;
    // "" kann kein echter Schlüssel sein – taugt also als Marke für «ohne»
    const mapKey = key ?? "";
    let group = byKey.get(mapKey);
    if (!group) {
      group = { key, items: [] };
      byKey.set(mapKey, group);
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups.sort((a, b) => compareShoppingCategories(a.key, b.key, lang));
}

/**
 * Resteverwertung (#235): «Was koche ich aus dem, was noch da ist?» – gleicht
 * den Bestand der Kühlbox mit den Zutaten der Rezepte ab und sortiert die
 * Rezepte nach Treffern. Reine Funktionen ohne DOM – von der Kühlbox-Seite
 * und den Tests genutzt.
 *
 * Der Abgleich nutzt bewusst dieselbe fehlertolerante Logik wie die globale
 * Suche (shared/textMatch.ts): gleiche Umlaut-Faltung, gleiche
 * Levenshtein-Schwellen. Mengen und Einheiten der Zutaten-Zeilen fallen über
 * die Einheiten-Tabelle aus shared/servings.ts weg – «400 g Magronen» trifft
 * also auf «Magronen», nicht auf «g».
 */
import { expiryInfo } from "./food";
import { findUnit } from "./servings";
import { fuzzyWordMatch, normalizeText } from "./textMatch";

/** Kürzeste Wortlänge, die noch verglichen wird («Ei», «Öl» wären zu unscharf). */
export const MIN_MATCH_LENGTH = 3;

/** Minimal nötige Felder eines Vorrats-Eintrags (Kühlbox). */
export interface StockItem {
  id: number;
  name: string;
  /** Mindesthaltbarkeitsdatum (ISO, optional) */
  expiryDate?: string | null;
}

/** Rezept für den Abgleich – alle Texte bereits in der aktiven Sprache. */
export interface LeftoverRecipe {
  id: string;
  name: string;
  ingredients: string[];
  timeMinutes: number;
  /** Favorit? Bricht Gleichstände zugunsten der Lieblingsrezepte. */
  favorite?: boolean;
}

/** Eine Zutat, die im Bestand liegt. */
export interface IngredientMatch {
  /** Zutaten-Zeile des Rezepts */
  ingredient: string;
  /** Der Eintrag aus dem Bestand, der sie deckt */
  item: StockItem;
  /** Läuft dieser Vorrat bald ab oder ist er schon abgelaufen? */
  urgent: boolean;
}

/** Ein Rezept-Vorschlag samt Treffern und fehlenden Zutaten. */
export interface LeftoverSuggestion {
  recipe: LeftoverRecipe;
  /** Zutaten, die du schon hast (Reihenfolge des Rezepts) */
  matched: IngredientMatch[];
  /** Zutaten-Zeilen, die fehlen – genau so, wie sie im Rezept stehen */
  missing: string[];
  /** Zahl der Zutaten-Zeilen des Rezepts */
  total: number;
  /** Wie viele Treffer bald ablaufen (die will man zuerst aufbrauchen) */
  urgentCount: number;
  /** Sortierwert: Treffer plus Zuschlag für bald ablaufende Vorräte */
  score: number;
}

/**
 * Vergleichbare Wörter eines Textes: normalisiert, ohne Zahlen, ohne
 * Einheiten und ohne zu kurze Wörter.
 */
export function matchWords(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter(
      word =>
        word.length >= MIN_MATCH_LENGTH &&
        !/^\d+$/.test(word) &&
        findUnit(word) === null
    );
}

/**
 * Deckt ein Bestandsname eine Zutaten-Zeile ab? Geprüft wird in beide
 * Richtungen («Tomaten» ↔ «4 Tomaten, gewürfelt», «Käse» ↔ «Bergkäse»),
 * zusätzlich fehlertolerant gegen Tippfehler («Tomatn» → «Tomaten»).
 */
export function stockCoversIngredient(
  ingredient: string,
  stockName: string
): boolean {
  const normIngredient = normalizeText(ingredient);
  const normStock = normalizeText(stockName);
  const stockWords = matchWords(stockName);
  const ingredientWords = matchWords(ingredient);
  if (stockWords.length === 0 || ingredientWords.length === 0) return false;
  for (const word of stockWords) {
    if (normIngredient.includes(word)) return true;
    if (fuzzyWordMatch(word, normIngredient)) return true;
  }
  for (const word of ingredientWords) {
    if (normStock.includes(word)) return true;
    if (fuzzyWordMatch(word, normStock)) return true;
  }
  return false;
}

/**
 * Welche Zutaten-Zeilen der Bestand NICHT deckt (#436) – die Umkehrung
 * der Resteverwertung: Dort sucht man Rezepte zum Vorrat, hier fehlende
 * Zutaten zum geplanten Rezept. Gleicher Abgleich, gleiche Toleranz.
 */
export function missingIngredients(
  ingredients: readonly string[],
  stock: readonly StockItem[]
): string[] {
  return ingredients.filter(
    ingredient =>
      !stock.some(item => stockCoversIngredient(ingredient, item.name))
  );
}

/** Zuschlag pro bald ablaufendem Vorrat – bevorzugt, was weg muss. */
export const URGENT_BONUS = 0.5;
/** Kleiner Zuschlag für Favoriten – bricht nur echte Gleichstände. */
const FAVORITE_BONUS = 0.1;

/**
 * Rezept-Vorschläge aus dem Bestand: jedes Rezept bekommt seine Treffer und
 * die fehlenden Zutaten. Sortiert wird nach Treffern (mit Zuschlag für bald
 * ablaufende Vorräte), dann nach Abdeckung, dann nach Zubereitungszeit;
 * Rezepte ohne einen einzigen Treffer fallen raus.
 *
 * `today` (ISO-Datum) schaltet die Haltbarkeits-Gewichtung ein; ohne Datum
 * zählen nur die Treffer.
 */
export function leftoverSuggestions(options: {
  recipes: LeftoverRecipe[];
  stock: StockItem[];
  today?: string;
  limit?: number;
}): LeftoverSuggestion[] {
  const { recipes, stock, today, limit = 8 } = options;
  // Bestand einmal vorbereiten: Vergleichswörter und Dringlichkeit
  const prepared = stock
    .map(item => ({
      item,
      urgent: today
        ? (expiryInfo(item.expiryDate ?? null, today)?.state ?? "ok") !== "ok"
        : false,
    }))
    .filter(entry => matchWords(entry.item.name).length > 0);
  if (prepared.length === 0) return [];

  const suggestions: LeftoverSuggestion[] = [];
  recipes.forEach(recipe => {
    const matched: IngredientMatch[] = [];
    const missing: string[] = [];
    recipe.ingredients.forEach(ingredient => {
      const hit = prepared.find(entry =>
        stockCoversIngredient(ingredient, entry.item.name)
      );
      if (hit) matched.push({ ingredient, item: hit.item, urgent: hit.urgent });
      else missing.push(ingredient);
    });
    if (matched.length === 0) return;
    const urgentCount = matched.filter(m => m.urgent).length;
    suggestions.push({
      recipe,
      matched,
      missing,
      total: recipe.ingredients.length,
      urgentCount,
      score:
        matched.length +
        urgentCount * URGENT_BONUS +
        (recipe.favorite ? FAVORITE_BONUS : 0),
    });
  });

  const coverage = (s: LeftoverSuggestion) =>
    s.total === 0 ? 0 : s.matched.length / s.total;
  return suggestions
    .sort(
      (a, b) =>
        b.score - a.score ||
        coverage(b) - coverage(a) ||
        a.recipe.timeMinutes - b.recipe.timeMinutes ||
        a.recipe.id.localeCompare(b.recipe.id)
    )
    .slice(0, limit);
}

/**
 * Eigene Rezepte: sichere Übersetzung der JSON-Spalten. Reine Funktionen –
 * von Client, Server und Tests genutzt.
 */
import { l4, type L4 } from "./i18n";

export const RECIPE_METHODS = ["Gaskocher", "Offenes Feuer", "Beides"] as const;
export type RecipeMethod = (typeof RECIPE_METHODS)[number];

export const RECIPE_DIFFICULTIES = ["einfach", "mittel"] as const;
export type RecipeDifficulty = (typeof RECIPE_DIFFICULTIES)[number];

/**
 * Anzeige-Labels der Zubereitungsarten. Die deutschen Werte bleiben die
 * gespeicherten Schlüssel (Datenbank + API), angezeigt wird via pick().
 */
export const RECIPE_METHOD_LABELS: Record<RecipeMethod, L4> = {
  Gaskocher: l4("Gaskocher", "Réchaud à gaz", "Fornello a gas", "Gas stove"),
  "Offenes Feuer": l4("Offenes Feuer", "Feu ouvert", "Fuoco vivo", "Open fire"),
  Beides: l4("Beides", "Les deux", "Entrambi", "Both"),
};

/** Anzeige-Labels der Schwierigkeitsgrade (Schlüssel bleiben deutsch). */
export const RECIPE_DIFFICULTY_LABELS: Record<RecipeDifficulty, L4> = {
  einfach: l4("einfach", "facile", "facile", "easy"),
  mittel: l4("mittel", "moyen", "medio", "medium"),
};

/** JSON-Spalte in eine bereinigte String-Liste übersetzen. */
export function parseStringList(json: string, maxItems = 30): string[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .slice(0, maxItems)
      .map(s => s.trim());
  } catch {
    return [];
  }
}

/** Zubereitungsart absichern (unbekannte Werte → Gaskocher). */
export function normalizeMethod(value: string): RecipeMethod {
  return (RECIPE_METHODS as readonly string[]).includes(value)
    ? (value as RecipeMethod)
    : "Gaskocher";
}

/** Schwierigkeit absichern (unbekannte Werte → einfach). */
export function normalizeDifficulty(value: string): RecipeDifficulty {
  return (RECIPE_DIFFICULTIES as readonly string[]).includes(value)
    ? (value as RecipeDifficulty)
    : "einfach";
}

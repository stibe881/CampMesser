/**
 * Eigene Rezepte: sichere Übersetzung der JSON-Spalten. Reine Funktionen –
 * von Client, Server und Tests genutzt.
 */

export const RECIPE_METHODS = ["Gaskocher", "Offenes Feuer", "Beides"] as const;
export type RecipeMethod = (typeof RECIPE_METHODS)[number];

export const RECIPE_DIFFICULTIES = ["einfach", "mittel"] as const;
export type RecipeDifficulty = (typeof RECIPE_DIFFICULTIES)[number];

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

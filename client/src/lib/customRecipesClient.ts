/**
 * Eigene Rezepte: Abbildung der Datenbank-Zeilen auf das Recipe-Format des
 * Rezeptbuchs, damit Karten, Detail-Dialog und Kühlbox-Vorschläge sie wie
 * eingebaute Rezepte behandeln können.
 */
import type { Recipe } from "@/data/recipes";
import {
  normalizeDifficulty,
  normalizeMethod,
  parseStringList,
} from "@shared/customRecipes";

export interface CustomRecipeRow {
  id: number;
  name: string;
  method: string;
  timeMinutes: number;
  servings: number;
  difficulty: string;
  onePot: boolean;
  kidFriendly: boolean;
  ingredientsJson: string;
  stepsJson: string;
  tip: string | null;
  imageFileName: string | null;
}

/** Präfix der Anzeige-IDs eigener Rezepte (z. B. «eigenes-7»). */
export const CUSTOM_RECIPE_ID_PREFIX = "eigenes-";

/** Private Foto-URL eines eigenen Rezepts (Auth über Session-Cookie). */
export function recipePhotoUrl(fileName: string): string {
  return `/api/recipes/photos/${fileName}`;
}

export function customRecipeToRecipe(row: CustomRecipeRow): Recipe {
  return {
    id: `${CUSTOM_RECIPE_ID_PREFIX}${row.id}`,
    name: row.name,
    image: row.imageFileName ? recipePhotoUrl(row.imageFileName) : undefined,
    method: normalizeMethod(row.method),
    timeMinutes: row.timeMinutes,
    servings: row.servings,
    difficulty: normalizeDifficulty(row.difficulty),
    onePot: row.onePot,
    kidFriendly: row.kidFriendly,
    ingredients: parseStringList(row.ingredientsJson),
    steps: parseStringList(row.stepsJson, 20),
    tip: row.tip ?? undefined,
  };
}

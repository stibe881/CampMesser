import { useEffect, useState } from "react";
import type { recipes as RecipeList } from "@/data/recipes";

/**
 * Das Rezeptbuch nachladen statt mitbringen (#342).
 *
 * `client/src/data/recipes.ts` sind 2065 Zeilen in vier Sprachen. Weil
 * die Startseite daraus zwei Namen braucht – die heutige Mahlzeit und den
 * Tipp des Tages –, lag das ganze Buch im Haupt-Bündel und musste vor dem
 * ERSTEN Bild geparst werden.
 *
 * WAS DAS BRINGT UND WAS NICHT, ehrlich: Die Bytes sind dieselben, denn
 * die Startseite lädt das Buch ohnehin. Früher da ist aber alles ANDERE –
 * das Gerüst, die Reise-Karte, das Wetter –, weil sie nicht mehr hinter
 * dem Buch warten. Der Preis ist eine Zeile, die einen Wimpernschlag
 * später erscheint; wer über einen Link direkt auf einer anderen Seite
 * landet, lädt das Buch gar nicht.
 *
 * `null` heisst «noch nicht da», nicht «leer». Die Aufrufer lassen ihre
 * Zeile so lange weg, statt einen Platzhalter zu zeigen, der gleich
 * wieder verschwindet.
 */
export type Recipes = typeof RecipeList;

let cache: Recipes | null = null;

export function useRecipes(enabled = true): Recipes | null {
  const [list, setList] = useState<Recipes | null>(cache);
  useEffect(() => {
    if (!enabled || cache) return;
    let cancelled = false;
    void import("@/data/recipes").then(module => {
      cache = module.recipes;
      if (!cancelled) setList(module.recipes);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return list;
}

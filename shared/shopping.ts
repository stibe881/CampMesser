/**
 * Einkaufslisten-Kategorien: fester Katalog in Laden-Reihenfolge –
 * so wandert man beim Einkaufen einmal durchs Geschäft. Die Schlüssel
 * landen in der DB (shoppingItems.category), die Labels sind L4-Texte.
 * null = «Ohne Kategorie» (Label im Wörterbuch des Clients).
 */
import { l4, type L4 } from "./i18n";

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

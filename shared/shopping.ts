/**
 * Einkaufslisten-Kategorien: fester Katalog in Laden-Reihenfolge –
 * so wandert man beim Einkaufen einmal durchs Geschäft. Die Schlüssel
 * landen in der DB (shoppingItems.category), die Labels sind L4-Texte.
 * null = «Ohne Kategorie» (Label im Wörterbuch des Clients).
 */
import { l4, type L4 } from "./i18n";

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

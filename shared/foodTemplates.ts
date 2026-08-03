/**
 * Vorrats-Vorlagen («Standardfüllung»): Eintrags-Format und sichere
 * JSON-Übersetzung. Reine Funktionen – von Client, Server und Tests genutzt
 * (Muster shared/quizzes.ts / shared/packTemplates.ts).
 *
 * Seit #233 merkt sich eine Vorlage auch Lagerort, Einheit und Kategorie;
 * ältere Vorlagen ohne diese Felder laden weiterhin in die Kühlbox.
 */
import {
  isFoodCategory,
  isFoodStorage,
  isFoodUnit,
  type FoodCategory,
  type FoodStorage,
  type FoodUnit,
} from "./food";

export interface FoodTemplateItem {
  /** Lebensmittel-Name, z. B. «Milch» */
  name: string;
  /** Menge & Einheit als Freitext, z. B. «2×» oder «500 g» (optional). */
  quantity?: string;
  /**
   * Restlaufzeit in Tagen – wird beim Laden der Vorlage in ein konkretes
   * MHD (heute + X Tage) umgerechnet. Ohne Wert bleibt der Eintrag ohne MHD.
   */
  expiryDays?: number;
  /** Lagerort (cooled|dry); ohne Angabe = Kühlbox. */
  storage?: FoodStorage;
  /** Einheit zur Menge (piece|pack|g|…); ohne Angabe = Freitext-Menge. */
  unit?: FoodUnit;
  /** Vorrats-Kategorie (cans|pasta|…); ohne Angabe = keine. */
  category?: FoodCategory;
}

export const MAX_FOOD_TEMPLATE_ITEMS = 100;
export const MAX_FOOD_ITEM_NAME_LENGTH = 160;
export const MAX_FOOD_ITEM_QUANTITY_LENGTH = 80;
export const MAX_EXPIRY_DAYS = 3650;

/** itemsJson defensiv parsen – kaputte Daten ergeben eine leere Vorlage. */
export function parseFoodTemplateItems(json: string): FoodTemplateItem[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const items: FoodTemplateItem[] = [];
    for (const entry of parsed) {
      if (items.length >= MAX_FOOD_TEMPLATE_ITEMS) break;
      if (typeof entry !== "object" || entry === null) continue;
      const { name, quantity, expiryDays, storage, unit, category } =
        entry as Record<string, unknown>;
      if (typeof name !== "string" || name.trim().length === 0) continue;
      const item: FoodTemplateItem = {
        name: name.trim().slice(0, MAX_FOOD_ITEM_NAME_LENGTH),
      };
      // Menge nur übernehmen, wenn sie ein nicht-leerer String ist –
      // ältere Vorlagen ohne quantity bleiben unverändert lesbar.
      if (typeof quantity === "string" && quantity.trim().length > 0) {
        item.quantity = quantity.trim().slice(0, MAX_FOOD_ITEM_QUANTITY_LENGTH);
      }
      if (
        typeof expiryDays === "number" &&
        Number.isFinite(expiryDays) &&
        expiryDays >= 0
      ) {
        item.expiryDays = Math.min(MAX_EXPIRY_DAYS, Math.round(expiryDays));
      }
      // Lagerort/Einheit/Kategorie nur übernehmen, wenn sie bekannt sind –
      // Vorlagen von vor #233 kommen ganz ohne diese Felder.
      if (typeof storage === "string" && isFoodStorage(storage)) {
        item.storage = storage;
      }
      if (typeof unit === "string" && isFoodUnit(unit)) item.unit = unit;
      if (typeof category === "string" && isFoodCategory(category)) {
        item.category = category;
      }
      items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * MHD beim Einfügen berechnen: heute + expiryDays als ISO-Datum (YYYY-MM-DD).
 * Ohne expiryDays gibt es kein MHD (null).
 */
export function expiryDateFromDays(
  today: string,
  expiryDays: number | undefined
): string | null {
  if (expiryDays === undefined) return null;
  const base = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(base)) return null;
  const target = new Date(base + expiryDays * 86400000);
  return target.toISOString().slice(0, 10);
}

/**
 * Kühlbox-Vorlagen («Standardfüllung»): Eintrags-Format und sichere
 * JSON-Übersetzung. Reine Funktionen – von Client, Server und Tests genutzt
 * (Muster shared/quizzes.ts / shared/packTemplates.ts).
 */

export interface FoodTemplateItem {
  /** Lebensmittel-Name, z. B. «Milch» */
  name: string;
  /**
   * Restlaufzeit in Tagen – wird beim Laden der Vorlage in ein konkretes
   * MHD (heute + X Tage) umgerechnet. Ohne Wert bleibt der Eintrag ohne MHD.
   */
  expiryDays?: number;
}

export const MAX_FOOD_TEMPLATE_ITEMS = 100;
export const MAX_FOOD_ITEM_NAME_LENGTH = 160;
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
      const { name, expiryDays } = entry as Record<string, unknown>;
      if (typeof name !== "string" || name.trim().length === 0) continue;
      const item: FoodTemplateItem = {
        name: name.trim().slice(0, MAX_FOOD_ITEM_NAME_LENGTH),
      };
      if (
        typeof expiryDays === "number" &&
        Number.isFinite(expiryDays) &&
        expiryDays >= 0
      ) {
        item.expiryDays = Math.min(MAX_EXPIRY_DAYS, Math.round(expiryDays));
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

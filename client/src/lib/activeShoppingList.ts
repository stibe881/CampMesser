/**
 * Zuletzt genutzte persönliche Einkaufsliste (#215): Die App merkt sich die
 * aktive Liste pro Gerät in localStorage (Schlüssel
 * campmesser.activeShoppingList). Sie dient sowohl der Einkaufsliste selbst
 * als auch allen Übernahme-Flows (Rezepte, Menüplan, Kühlbox, Schnellaktion)
 * als Vorgabe für die Ziel-Liste.
 */

export const ACTIVE_SHOPPING_LIST_KEY = "campmesser.activeShoppingList";

/** Gemerkte Listen-Id (null = noch keine bzw. unlesbar). */
export function loadActiveShoppingListId(): number | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SHOPPING_LIST_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/** Aktive Liste merken (null löscht die Erinnerung wieder). */
export function saveActiveShoppingListId(id: number | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (id === null) localStorage.removeItem(ACTIVE_SHOPPING_LIST_KEY);
    else localStorage.setItem(ACTIVE_SHOPPING_LIST_KEY, String(id));
  } catch {
    // Privater Modus o. Ä. – dann eben ohne Erinnerung
  }
}

/**
 * Gültige Ziel-Liste aus gemerkter Id und vorhandenen Listen bestimmen:
 * die gemerkte Liste, sonst die erste. null, solange nichts geladen ist.
 */
export function resolveActiveShoppingListId(
  lists: { id: number }[],
  remembered: number | null
): number | null {
  if (lists.length === 0) return null;
  if (remembered !== null && lists.some(l => l.id === remembered)) {
    return remembered;
  }
  return lists[0].id;
}

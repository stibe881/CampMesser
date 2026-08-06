/**
 * Kühlbox, Vorratsvorlagen, Einkaufs- und Reiselisten (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertFoodItem,
  InsertFoodTemplate,
  InsertShoppingItem,
  InsertTripShoppingItem,
  and,
  desc,
  eq,
  foodItems,
  foodTemplates,
  getDb,
  inArray,
  isNull,
  isShareExpired,
  requireDb,
  shoppingItems,
  shoppingLists,
  shoppingShares,
  tripShoppingItems,
} from "./_shared";

// ── Lebensmittel-Inventar ──
export async function getFoodItems(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(foodItems).where(eq(foodItems.userId, userId));
}
export async function addFoodItem(data: InsertFoodItem) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(foodItems).values(data);
  return result.insertId;
}
export async function updateFoodItem(
  id: number,
  userId: number,
  data: Partial<
    Pick<
      InsertFoodItem,
      "quantity" | "expiryDate" | "storage" | "unit" | "category"
    >
  >
) {
  const db = requireDb(await getDb());
  await db
    .update(foodItems)
    .set(data)
    .where(and(eq(foodItems.id, id), eq(foodItems.userId, userId)));
}
export async function deleteFoodItem(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(foodItems)
    .where(and(eq(foodItems.id, id), eq(foodItems.userId, userId)));
}
// ── Kühlbox-Vorlagen («Standardfüllung») ──
export async function getFoodTemplates(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(foodTemplates)
    .where(eq(foodTemplates.userId, userId))
    .orderBy(desc(foodTemplates.id));
}
export async function getFoodTemplate(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(foodTemplates)
    .where(and(eq(foodTemplates.id, id), eq(foodTemplates.userId, userId)))
    .limit(1);
  return rows[0];
}
export async function createFoodTemplate(data: InsertFoodTemplate) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(foodTemplates).values(data);
  return result.insertId;
}
export async function deleteFoodTemplate(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(foodTemplates)
    .where(and(eq(foodTemplates.id, id), eq(foodTemplates.userId, userId)));
}
/** Mehrere Kühlbox-Einträge auf einmal anlegen (Vorlage laden). */
export async function addFoodItems(items: InsertFoodItem[]) {
  const db = requireDb(await getDb());
  if (items.length === 0) return;
  await db.insert(foodItems).values(items);
}
/** Alle Listen eines Kontos in Anzeige-Reihenfolge (position, dann id). */
export async function getShoppingLists(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.userId, userId))
    .orderBy(shoppingLists.position, shoppingLists.id);
}
/** Einzelne Liste MIT Besitz-Prüfung (undefined = fremd oder nicht da). */
export async function getShoppingList(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(shoppingLists)
    .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)))
    .limit(1);
  return rows[0];
}
/** Neue Liste ans Ende hängen; gibt die frisch vergebene Id zurück. */
export async function createShoppingList(userId: number, name: string) {
  const db = requireDb(await getDb());
  const existing = await getShoppingLists(userId);
  const position =
    existing.reduce((max, l) => Math.max(max, l.position), -1) + 1;
  const [result] = await db
    .insert(shoppingLists)
    .values({ userId, name, position });
  return result.insertId;
}
/** Liste umbenennen (nur eigene). */
export async function renameShoppingList(
  id: number,
  userId: number,
  name: string
) {
  const db = requireDb(await getDb());
  await db
    .update(shoppingLists)
    .set({ name })
    .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)));
}
/** Liste samt Einträgen und Teil-Link löschen (nur eigene). */
export async function deleteShoppingList(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(shoppingItems)
    .where(and(eq(shoppingItems.userId, userId), eq(shoppingItems.listId, id)));
  await db
    .delete(shoppingShares)
    .where(
      and(eq(shoppingShares.userId, userId), eq(shoppingShares.listId, id))
    );
  await db
    .delete(shoppingLists)
    .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)));
}
/** Neue Reihenfolge der Listen speichern: position = 0..n. */
export async function reorderShoppingLists(userId: number, ids: number[]) {
  const db = requireDb(await getDb());
  await Promise.all(
    ids.map((id, idx) =>
      db
        .update(shoppingLists)
        .set({ position: idx })
        .where(and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId)))
    )
  );
}
/**
 * Übergangs-Migration im Code (idempotent): sorgt dafür, dass ein Konto
 * mindestens EINE Liste hat und dass Einträge/Teil-Links ohne listId an der
 * ersten Liste hängen. Wird von shopping.lists/shopping.list aufgerufen und
 * ist damit die einzige Stelle, die Altbestände nachzieht. Rückgabe: die
 * Liste, an der die Altdaten nun hängen (= die erste Liste des Kontos).
 */
export async function ensureDefaultShoppingList(
  userId: number,
  defaultName: string
) {
  const db = requireDb(await getDb());
  const lists = await getShoppingLists(userId);
  let target = lists[0];
  if (!target) {
    const id = await createShoppingList(userId, defaultName);
    target = {
      id,
      userId,
      name: defaultName,
      position: 0,
      createdAt: new Date(),
    };
  }
  // Alt-Einträge (listId IS NULL) an die erste Liste hängen
  await db
    .update(shoppingItems)
    .set({ listId: target.id })
    .where(and(eq(shoppingItems.userId, userId), isNull(shoppingItems.listId)));
  // Alt-Teil-Link (listId IS NULL) übernehmen – existiert für die Ziel-Liste
  // bereits ein Token, gewinnt dieses und die Alt-Zeile fällt weg
  // (verhindert eine Kollision mit unique(userId, listId)).
  const shares = await db
    .select()
    .from(shoppingShares)
    .where(eq(shoppingShares.userId, userId));
  const legacy = shares.filter(s => s.listId === null);
  if (legacy.length > 0) {
    const hasTarget = shares.some(s => s.listId === target.id);
    if (hasTarget) {
      await db
        .delete(shoppingShares)
        .where(
          and(eq(shoppingShares.userId, userId), isNull(shoppingShares.listId))
        );
    } else {
      await db
        .update(shoppingShares)
        .set({ listId: target.id })
        .where(
          and(eq(shoppingShares.userId, userId), isNull(shoppingShares.listId))
        );
    }
  }
  return target;
}
// ── Einkaufsliste ──
/** Einträge eines Kontos; mit listId nur die der gewünschten Liste. */
export async function getShoppingItems(userId: number, listId?: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(shoppingItems)
    .where(
      listId === undefined
        ? eq(shoppingItems.userId, userId)
        : and(
            eq(shoppingItems.userId, userId),
            eq(shoppingItems.listId, listId)
          )
    )
    .orderBy(shoppingItems.position, shoppingItems.id);
}
export async function addShoppingItems(items: InsertShoppingItem[]) {
  if (items.length === 0) return;
  const db = requireDb(await getDb());
  await db.insert(shoppingItems).values(items);
}
export async function setShoppingItemChecked(
  id: number,
  userId: number,
  checked: boolean
) {
  const db = requireDb(await getDb());
  await db
    .update(shoppingItems)
    .set({ checked })
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)));
}
/** Laden-Kategorie eines Eintrags setzen; null = «Ohne Kategorie». */
export async function setShoppingItemCategory(
  id: number,
  userId: number,
  category: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(shoppingItems)
    .set({ category })
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)));
}
/** Menge und/oder Notiz eines Eintrags setzen (nur eigene Zeilen; null entfernt). */
export async function updateShoppingItemDetails(
  id: number,
  userId: number,
  data: {
    quantity?: string | null;
    note?: string | null;
    priceRappen?: number | null;
  }
) {
  if (Object.keys(data).length === 0) return;
  const db = requireDb(await getDb());
  await db
    .update(shoppingItems)
    .set(data)
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)));
}
/**
 * Einträge als «in der Reisekasse verbucht» markieren (#234): setzt
 * bookedExpenseId auf die Ausgabe. Nur eigene, noch UNVERBUCHTE Zeilen
 * werden angefasst – zwei gleichzeitige Übernahmen können denselben
 * Einkauf so nicht doppelt zählen.
 */
export async function markShoppingItemsBooked(
  userId: number,
  itemIds: number[],
  expenseId: number
) {
  if (itemIds.length === 0) return;
  const db = requireDb(await getDb());
  await db
    .update(shoppingItems)
    .set({ bookedExpenseId: expenseId })
    .where(
      and(
        eq(shoppingItems.userId, userId),
        inArray(shoppingItems.id, itemIds),
        isNull(shoppingItems.bookedExpenseId)
      )
    );
}
/** Neue Reihenfolge der Einkaufsliste speichern: position = 0..n. */
export async function reorderShoppingItems(userId: number, itemIds: number[]) {
  const db = requireDb(await getDb());
  await Promise.all(
    itemIds.map((id, idx) =>
      db
        .update(shoppingItems)
        .set({ position: idx })
        .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)))
    )
  );
}
export async function deleteShoppingItem(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(shoppingItems)
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)));
}
/**
 * Einträge ohne Listen-Zuordnung (Bestand aus der Zeit der EINEN Liste).
 * Nur für den öffentlichen Teil-Link nötig, falls dessen Zeile noch keine
 * listId trägt und die Besitzerin die App seit #215 nie geöffnet hat.
 */
export async function getUnassignedShoppingItems(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(shoppingItems)
    .where(and(eq(shoppingItems.userId, userId), isNull(shoppingItems.listId)))
    .orderBy(shoppingItems.position, shoppingItems.id);
}
/** Alle abgehakten Einträge einer Einkaufsliste entfernen. */
export async function deleteCheckedShoppingItems(
  userId: number,
  listId: number
) {
  const db = requireDb(await getDb());
  await db
    .delete(shoppingItems)
    .where(
      and(
        eq(shoppingItems.userId, userId),
        eq(shoppingItems.listId, listId),
        eq(shoppingItems.checked, true)
      )
    );
}
/** Eine Einkaufsliste leeren (die Liste selbst bleibt bestehen). */
export async function clearShoppingItems(userId: number, listId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(shoppingItems)
    .where(
      and(eq(shoppingItems.userId, userId), eq(shoppingItems.listId, listId))
    );
}
/** Teil-Zeile einer eigenen Einkaufsliste (undefined = nicht geteilt). */
export async function getShoppingShare(userId: number, listId: number) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(shoppingShares)
    .where(
      and(eq(shoppingShares.userId, userId), eq(shoppingShares.listId, listId))
    )
    .limit(1);
  return result[0];
}
/** Teil-Token für eine Einkaufsliste anlegen (eine Zeile pro Liste). */
export async function createShoppingShare(
  userId: number,
  listId: number,
  token: string,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .insert(shoppingShares)
    .values({ userId, listId, shareToken: token, shareExpiresAt: expiresAt });
}
/** Ablauf des bestehenden Einkaufslisten-Links neu setzen (null = unbegrenzt). */
export async function setShoppingShareExpiry(
  userId: number,
  listId: number,
  expiresAt: Date | null
) {
  const db = requireDb(await getDb());
  await db
    .update(shoppingShares)
    .set({ shareExpiresAt: expiresAt })
    .where(
      and(eq(shoppingShares.userId, userId), eq(shoppingShares.listId, listId))
    );
}
/** Teilen einer Einkaufsliste beenden: Zeile entfernen, Link wird ungültig. */
export async function deleteShoppingShare(userId: number, listId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(shoppingShares)
    .where(
      and(eq(shoppingShares.userId, userId), eq(shoppingShares.listId, listId))
    );
}
/** Geteilte Einkaufsliste anhand des Tokens finden (öffentlich, ohne Login). */
export async function getShoppingShareByToken(token: string) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(shoppingShares)
    .where(eq(shoppingShares.shareToken, token))
    .limit(1);
  const row = result[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}
export async function getTripShoppingItems(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripShoppingItems)
    .where(eq(tripShoppingItems.tripId, tripId))
    .orderBy(tripShoppingItems.position, tripShoppingItems.id);
}
export async function addTripShoppingItems(items: InsertTripShoppingItem[]) {
  if (items.length === 0) return;
  const db = requireDb(await getDb());
  await db.insert(tripShoppingItems).values(items);
}
export async function setTripShoppingItemChecked(
  id: number,
  tripId: number,
  checked: boolean
) {
  const db = requireDb(await getDb());
  await db
    .update(tripShoppingItems)
    .set({ checked })
    .where(
      and(eq(tripShoppingItems.id, id), eq(tripShoppingItems.tripId, tripId))
    );
}
/** Laden-Kategorie eines Reise-Eintrags setzen; null = «Ohne Kategorie». */
export async function setTripShoppingItemCategory(
  id: number,
  tripId: number,
  category: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripShoppingItems)
    .set({ category })
    .where(
      and(eq(tripShoppingItems.id, id), eq(tripShoppingItems.tripId, tripId))
    );
}
/** Menge und/oder Notiz eines Reise-Eintrags setzen (null entfernt). */
export async function updateTripShoppingItemDetails(
  id: number,
  tripId: number,
  data: {
    quantity?: string | null;
    note?: string | null;
    priceRappen?: number | null;
  }
) {
  if (Object.keys(data).length === 0) return;
  const db = requireDb(await getDb());
  await db
    .update(tripShoppingItems)
    .set(data)
    .where(
      and(eq(tripShoppingItems.id, id), eq(tripShoppingItems.tripId, tripId))
    );
}
/** Einträge der Reise-Liste als in der Reisekasse verbucht markieren (#234). */
export async function markTripShoppingItemsBooked(
  tripId: number,
  itemIds: number[],
  expenseId: number
) {
  if (itemIds.length === 0) return;
  const db = requireDb(await getDb());
  await db
    .update(tripShoppingItems)
    .set({ bookedExpenseId: expenseId })
    .where(
      and(
        eq(tripShoppingItems.tripId, tripId),
        inArray(tripShoppingItems.id, itemIds),
        isNull(tripShoppingItems.bookedExpenseId)
      )
    );
}
/** Neue Reihenfolge der Reise-Einkaufsliste speichern: position = 0..n. */
export async function reorderTripShoppingItems(
  tripId: number,
  itemIds: number[]
) {
  const db = requireDb(await getDb());
  await Promise.all(
    itemIds.map((id, idx) =>
      db
        .update(tripShoppingItems)
        .set({ position: idx })
        .where(
          and(
            eq(tripShoppingItems.id, id),
            eq(tripShoppingItems.tripId, tripId)
          )
        )
    )
  );
}
export async function deleteTripShoppingItem(id: number, tripId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripShoppingItems)
    .where(
      and(eq(tripShoppingItems.id, id), eq(tripShoppingItems.tripId, tripId))
    );
}
/** Alle abgehakten Einträge der Reise-Einkaufsliste entfernen. */
export async function deleteCheckedTripShoppingItems(tripId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripShoppingItems)
    .where(
      and(
        eq(tripShoppingItems.tripId, tripId),
        eq(tripShoppingItems.checked, true)
      )
    );
}

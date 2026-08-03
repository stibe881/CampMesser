import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { isShareExpired } from "@shared/sharing";
import { drizzle } from "drizzle-orm/mysql2";
import {
  campSpots,
  childBadges,
  childStats,
  familyChildren,
  InsertFamilyChild,
  customHunts,
  customQuizzes,
  customRecipes,
  InsertCustomHunt,
  InsertCustomQuiz,
  InsertCustomRecipe,
  foodItems,
  foodTemplates,
  gearTasks,
  homeLocations,
  InsertGearTask,
  InsertCampSpot,
  InsertFoodItem,
  InsertFoodTemplate,
  InsertHomeLocation,
  InsertInventoryItem,
  InsertPackItem,
  InsertPackList,
  InsertPackTemplateCustom,
  InsertMenuEntry,
  InsertPowerConsumer,
  InsertShoppingItem,
  InsertNatureSighting,
  InsertTripLog,
  InsertTripPhoto,
  InsertTripShoppingItem,
  InsertUser,
  inventoryItems,
  menuDayNotes,
  menuEntries,
  natureSightings,
  packItems,
  packLists,
  packTemplatesCustom,
  powerConsumers,
  shoppingItems,
  shoppingLists,
  shoppingShares,
  spotPhotos,
  InsertSpotPhoto,
  tickBites,
  InsertTickBite,
  tripInvites,
  tripJournal,
  tripLogs,
  tripMembers,
  tripPhotos,
  tripShoppingItems,
  users,
  userSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("Datenbank nicht verfügbar");
  return db;
}

// ── Packlisten ──
export async function getPackLists(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(packLists).where(eq(packLists.userId, userId));
}

export async function createPackList(data: InsertPackList) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(packLists).values(data);
  return result.insertId;
}

export async function getPackList(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packLists)
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)))
    .limit(1);
  return rows[0];
}

/**
 * Zugriff auf eine Packliste: die eigene Liste ODER die Liste ist mit einer
 * Reise verknüpft, bei der das Konto eingeladenes Mitglied ist (der Trip
 * gehört dabei der Listen-Besitzerin/dem Listen-Besitzer – nur eigene Listen
 * lassen sich verknüpfen). Für eigene Listen verhält sich das exakt wie
 * getPackList(id, userId).
 */
export async function canAccessList(listId: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packLists)
    .where(eq(packLists.id, listId))
    .limit(1);
  const list = rows[0];
  if (!list) return undefined;
  if (list.userId === userId) return list;
  const linked = await db
    .select({ id: tripLogs.id })
    .from(tripLogs)
    .innerJoin(
      tripMembers,
      and(eq(tripMembers.tripId, tripLogs.id), eq(tripMembers.userId, userId))
    )
    .where(
      and(eq(tripLogs.packListId, listId), eq(tripLogs.userId, list.userId))
    )
    .limit(1);
  return linked.length > 0 ? list : undefined;
}

/** Einzelnen Eintrag laden – für die Zugriffs-Prüfung über seine Liste. */
export async function getPackItem(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packItems)
    .where(eq(packItems.id, id))
    .limit(1);
  return rows[0];
}

/**
 * Liste archivieren (archivedAt = jetzt) oder wieder aktivieren (null) –
 * die Einträge bleiben unangetastet erhalten (#194).
 */
export async function setPackListArchived(
  id: number,
  userId: number,
  archived: boolean
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}

export async function deletePackList(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db.delete(packItems).where(eq(packItems.listId, id));
  await db
    .delete(packLists)
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}

export async function getPackItems(listId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(packItems)
    .where(eq(packItems.listId, listId))
    .orderBy(asc(packItems.sortOrder), asc(packItems.id));
}

export async function addPackItems(items: InsertPackItem[]) {
  if (items.length === 0) return;
  const db = requireDb(await getDb());
  await db.insert(packItems).values(items);
}

/**
 * Haken setzen/lösen; updatedByUserId hält fest, WER es war («Zuletzt
 * geändert von» bei gemeinsamen Reisen) – null bei anonymen Änderungen
 * über den Teil-Link (löscht eine allfällige alte Zuordnung).
 */
export async function setPackItemChecked(
  id: number,
  checked: boolean,
  updatedByUserId: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packItems)
    .set({ checked, updatedByUserId })
    .where(eq(packItems.id, id));
}

/** Alle Einträge einer Liste auf «ungepackt» zurücksetzen. */
export async function uncheckAllPackItems(listId: number) {
  const db = requireDb(await getDb());
  await db
    .update(packItems)
    .set({ checked: false })
    .where(eq(packItems.listId, listId));
}

/**
 * Eintrag anpassen: Personen-Zuordnung («Wer packt das?», null entfernt sie)
 * und/oder Kategorie. Nicht übergebene Felder bleiben unverändert;
 * updatedByUserId hält fest, wer die Änderung gemacht hat (Anzeige bei
 * gemeinsamen Reisen).
 */
export async function updatePackItem(
  id: number,
  data: {
    assignee?: string | null;
    category?: string;
    updatedByUserId?: number;
  }
) {
  if (data.assignee === undefined && data.category === undefined) return;
  const db = requireDb(await getDb());
  await db.update(packItems).set(data).where(eq(packItems.id, id));
}

export async function deletePackItem(id: number) {
  const db = requireDb(await getDb());
  await db.delete(packItems).where(eq(packItems.id, id));
}

/** Neue Reihenfolge einer Liste speichern: sortOrder = Position 0..n. */
export async function reorderPackItems(listId: number, itemIds: number[]) {
  const db = requireDb(await getDb());
  await Promise.all(
    itemIds.map((id, idx) =>
      db
        .update(packItems)
        .set({ sortOrder: idx })
        .where(and(eq(packItems.id, id), eq(packItems.listId, listId)))
    )
  );
}

// ── Eigene Packlisten-Vorlagen ──
export async function getPackTemplates(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(packTemplatesCustom)
    .where(eq(packTemplatesCustom.userId, userId))
    .orderBy(desc(packTemplatesCustom.id));
}

export async function getPackTemplate(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(packTemplatesCustom)
    .where(
      and(
        eq(packTemplatesCustom.id, id),
        eq(packTemplatesCustom.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function createPackTemplate(data: InsertPackTemplateCustom) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(packTemplatesCustom).values(data);
  return result.insertId;
}

export async function deletePackTemplate(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(packTemplatesCustom)
    .where(
      and(
        eq(packTemplatesCustom.id, id),
        eq(packTemplatesCustom.userId, userId)
      )
    );
}

/** Teil-Token einer Vorlage setzen oder entfernen (nur für die eigene Vorlage). */
export async function setPackTemplateShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(packTemplatesCustom)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(
      and(
        eq(packTemplatesCustom.id, id),
        eq(packTemplatesCustom.userId, userId)
      )
    );
}

/** Geteilte Vorlage anhand des Tokens laden (öffentlich, ohne Login). */
export async function getPackTemplateByToken(token: string) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(packTemplatesCustom)
    .where(eq(packTemplatesCustom.shareToken, token))
    .limit(1);
  const row = result[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}

/** Gewichts-Budget in Gramm setzen oder mit null entfernen (nur eigene Liste). */
export async function setPackListWeightBudget(
  id: number,
  userId: number,
  grams: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ weightBudgetGrams: grams })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}

/** Personen-Bereiche (JSON-Array von Namen) setzen; null entfernt sie. */
export async function setPackListPersons(
  id: number,
  userId: number,
  personsJson: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ personsJson })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}

/**
 * Zuordnungen entfernter Personen lösen: ihre Einträge wandern zurück in den
 * Bereich «Allgemein» (assignee null).
 */
export async function clearPackItemAssignees(
  listId: number,
  assignees: string[]
) {
  if (assignees.length === 0) return;
  const db = requireDb(await getDb());
  await db
    .update(packItems)
    .set({ assignee: null })
    .where(
      and(eq(packItems.listId, listId), inArray(packItems.assignee, assignees))
    );
}

/** Teil-Token setzen oder entfernen (nur für die eigene Liste). */
export async function setPackListShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(packLists.id, id), eq(packLists.userId, userId)));
}

/** Geteilte Liste anhand des Tokens laden (öffentlich, ohne Login). */
export async function getPackListByToken(token: string) {
  const db = requireDb(await getDb());
  const result = await db
    .select()
    .from(packLists)
    .where(eq(packLists.shareToken, token))
    .limit(1);
  const row = result[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}

// ── Inventar ──
export async function getInventory(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.userId, userId));
}

/** Einzelner Inventar-Gegenstand (nur, wenn er der Person gehört). */
export async function getInventoryItem(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
    .limit(1);
  return rows[0];
}

/** Inventar-Gegenstand über den Foto-Dateinamen (für die private Auslieferung). */
export async function getInventoryItemByImageFileName(
  fileName: string,
  userId: number
) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.imageFileName, fileName),
        eq(inventoryItems.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}

/** Inventar-Gegenstand über den Beleg-Dateinamen (für die private Auslieferung). */
export async function getInventoryItemByReceiptFileName(
  fileName: string,
  userId: number
) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.receiptFileName, fileName),
        eq(inventoryItems.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function addInventoryItem(data: InsertInventoryItem) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(inventoryItems).values(data);
  return result.insertId;
}

export async function updateInventoryItem(
  id: number,
  userId: number,
  data: Partial<InsertInventoryItem>
) {
  const db = requireDb(await getDb());
  await db
    .update(inventoryItems)
    .set(data)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
}

export async function deleteInventoryItem(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
}

// ── Natur-Beobachtungen (Sichtungs-Tagebuch) ──
export async function getNatureSightings(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(natureSightings)
    .where(eq(natureSightings.userId, userId))
    .orderBy(desc(natureSightings.sightedAt), desc(natureSightings.id));
}

/** Einzelne Beobachtung (nur, wenn sie der Person gehört). */
export async function getNatureSighting(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(natureSightings)
    .where(and(eq(natureSightings.id, id), eq(natureSightings.userId, userId)))
    .limit(1);
  return rows[0];
}

/** Beobachtung über den Foto-Dateinamen (für die private Auslieferung). */
export async function getNatureSightingByFileName(
  fileName: string,
  userId: number
) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(natureSightings)
    .where(
      and(
        eq(natureSightings.fileName, fileName),
        eq(natureSightings.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function addNatureSighting(data: InsertNatureSighting) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(natureSightings).values(data);
  return result.insertId;
}

export async function updateNatureSighting(
  id: number,
  userId: number,
  data: Partial<InsertNatureSighting>
) {
  const db = requireDb(await getDb());
  await db
    .update(natureSightings)
    .set(data)
    .where(and(eq(natureSightings.id, id), eq(natureSightings.userId, userId)));
}

export async function deleteNatureSighting(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(natureSightings)
    .where(and(eq(natureSightings.id, id), eq(natureSightings.userId, userId)));
}

// ── Ausrüstungs-Pflege (wiederkehrende Wartungsaufgaben) ──
export async function getGearTasks(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(gearTasks)
    .where(eq(gearTasks.userId, userId))
    .orderBy(asc(gearTasks.createdAt), asc(gearTasks.id));
}

export async function addGearTask(data: InsertGearTask) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(gearTasks).values(data);
  return result.insertId;
}

export async function updateGearTask(
  id: number,
  userId: number,
  data: Partial<Pick<InsertGearTask, "title" | "intervalMonths" | "lastDoneAt">>
) {
  const db = requireDb(await getDb());
  await db
    .update(gearTasks)
    .set(data)
    .where(and(eq(gearTasks.id, id), eq(gearTasks.userId, userId)));
}

export async function deleteGearTask(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(gearTasks)
    .where(and(eq(gearTasks.id, id), eq(gearTasks.userId, userId)));
}

// ── Zeckenstich-Merker (#179) ──
export async function getTickBites(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tickBites)
    .where(eq(tickBites.userId, userId))
    .orderBy(desc(tickBites.bitAt), desc(tickBites.id));
}

export async function addTickBite(data: InsertTickBite) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tickBites).values(data);
  return result.insertId;
}

export async function updateTickBite(
  id: number,
  userId: number,
  data: Partial<
    Pick<InsertTickBite, "bitAt" | "bodyPart" | "note" | "resolvedAt">
  >
) {
  const db = requireDb(await getDb());
  await db
    .update(tickBites)
    .set(data)
    .where(and(eq(tickBites.id, id), eq(tickBites.userId, userId)));
}

export async function deleteTickBite(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tickBites)
    .where(and(eq(tickBites.id, id), eq(tickBites.userId, userId)));
}

// ── Energie-Verbraucher ──
export async function getPowerConsumers(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(powerConsumers)
    .where(eq(powerConsumers.userId, userId));
}

export async function addPowerConsumer(data: InsertPowerConsumer) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(powerConsumers).values(data);
  return result.insertId;
}

export async function updatePowerConsumer(
  id: number,
  userId: number,
  data: Partial<InsertPowerConsumer>
) {
  const db = requireDb(await getDb());
  await db
    .update(powerConsumers)
    .set(data)
    .where(and(eq(powerConsumers.id, id), eq(powerConsumers.userId, userId)));
}

export async function deletePowerConsumer(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(powerConsumers)
    .where(and(eq(powerConsumers.id, id), eq(powerConsumers.userId, userId)));
}

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
  data: Partial<Pick<InsertFoodItem, "quantity" | "expiryDate">>
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

// ── Einkaufslisten (#215) ──
// Seit #215 hat jedes Konto BELIEBIG VIELE persönliche Einkaufslisten.
// Einträge (shoppingItems.listId) und Teil-Links (shoppingShares.listId)
// hängen an einer Liste; beide Spalten sind nullable, damit Bestände aus der
// Zeit der EINEN Liste erhalten bleiben. ensureDefaultShoppingList() holt
// diese Altdaten beim ersten Zugriff idempotent nach.

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
  data: { quantity?: string | null; note?: string | null }
) {
  if (Object.keys(data).length === 0) return;
  const db = requireDb(await getDb());
  await db
    .update(shoppingItems)
    .set(data)
    .where(and(eq(shoppingItems.id, id), eq(shoppingItems.userId, userId)));
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

// ── Reise-Einkaufsliste ──
// Alle Funktionen sind über tripId gescoped; die Berechtigung (Owner oder
// Mitreisende*r) prüft der Router VOR jedem Aufruf via canAccessTrip.

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
  data: { quantity?: string | null; note?: string | null }
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

// ── Zeltplatz-Favoriten ──
export async function getCampSpots(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(campSpots).where(eq(campSpots.userId, userId));
}

/** Einzelnen Zeltplatz-Favoriten laden (nur eigener). */
export async function getCampSpot(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(campSpots)
    .where(and(eq(campSpots.id, id), eq(campSpots.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function addCampSpot(data: InsertCampSpot) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(campSpots).values(data);
  return result.insertId;
}

export async function updateCampSpot(
  id: number,
  userId: number,
  data: Partial<
    Pick<
      InsertCampSpot,
      | "name"
      | "note"
      | "attributesJson"
      | "receptionPhone"
      | "checkinInfo"
      | "parcelNumber"
      | "elevationM"
    >
  >
) {
  const db = requireDb(await getDb());
  await db
    .update(campSpots)
    .set(data)
    .where(and(eq(campSpots.id, id), eq(campSpots.userId, userId)));
}

export async function deleteCampSpot(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(campSpots)
    .where(and(eq(campSpots.id, id), eq(campSpots.userId, userId)));
}

// ── Heim-Standort ──
/** Heim-Standort der Nutzer*in (undefined = keiner gesetzt). */
export async function getHomeLocation(userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(homeLocations)
    .where(eq(homeLocations.userId, userId))
    .limit(1);
  return rows[0];
}

/** Heim-Standort setzen bzw. ersetzen (genau einer pro Nutzer*in, userId unique). */
export async function upsertHomeLocation(data: InsertHomeLocation) {
  const db = requireDb(await getDb());
  await db
    .insert(homeLocations)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
}

export async function deleteHomeLocation(userId: number) {
  const db = requireDb(await getDb());
  await db.delete(homeLocations).where(eq(homeLocations.userId, userId));
}

// ── Reise-Tagebuch ──
export async function getTripLogs(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripLogs)
    .where(eq(tripLogs.userId, userId))
    .orderBy(desc(tripLogs.startDate), desc(tripLogs.id));
}

export async function addTripLog(data: InsertTripLog) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripLogs).values(data);
  return result.insertId;
}

/**
 * Eintrag nachträglich bearbeiten (nur eigener). `weatherJson` wird vom
 * Router auf null gesetzt, wenn sich Ort oder Zeitraum ändern – das
 * Wetterarchiv holt sich die Seite dann automatisch neu.
 */
export async function updateTripLog(
  id: number,
  userId: number,
  data: Partial<
    Pick<
      InsertTripLog,
      | "spotId"
      | "packListId"
      | "location"
      | "title"
      | "notes"
      | "startDate"
      | "endDate"
      | "rating"
      | "arrivalTime"
      | "departureTime"
      | "weatherJson"
    >
  >
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set(data)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}

/** Einzelnen Tagebuch-/Trip-Eintrag laden (nur eigener). */
export async function getTripLog(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripLogs)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)))
    .limit(1);
  return rows[0];
}

/** Sterne-Bewertung (1–5) setzen oder mit null entfernen (nur eigener Eintrag). */
export async function setTripLogRating(
  id: number,
  userId: number,
  rating: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ rating })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}

/**
 * Wetterarchiv-JSON eines Tagebuch-Eintrags speichern (nur eigener Eintrag).
 * Wird vom Client einmalig nach der Heimkehr befüllt.
 */
export async function setTripLogWeather(
  id: number,
  userId: number,
  weatherJson: string
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ weatherJson })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}

/**
 * Titelbild eines Tagebuch-Eintrags setzen oder mit null entfernen (nur
 * eigener Eintrag). Ob das Foto zum Trip gehört, prüft der Router.
 */
export async function setTripLogCoverPhoto(
  id: number,
  userId: number,
  coverPhotoId: number | null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ coverPhotoId })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}

/**
 * Titelbild-Verweis eines Trips löschen, falls er auf das gegebene Foto
 * zeigt – wird beim Löschen des Fotos aufgerufen, damit kein toter
 * coverPhotoId zurückbleibt.
 */
export async function clearTripLogCoverPhoto(
  tripId: number,
  userId: number,
  photoId: number
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    .set({ coverPhotoId: null })
    .where(
      and(
        eq(tripLogs.id, tripId),
        eq(tripLogs.userId, userId),
        eq(tripLogs.coverPhotoId, photoId)
      )
    );
}

export async function deleteTripLog(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripLogs)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
  // Zugehörige Menüplan-Einträge mitlöschen (kein DB-FK, daher manuell) –
  // trip-weit, damit auch Einträge von Mitreisenden nicht verwaisen.
  // Der Router stellt vor dem Aufruf sicher, dass NUR die Besitzerin/der
  // Besitzer hier ankommt.
  await db.delete(menuEntries).where(eq(menuEntries.tripId, id));
  // Tages-Notizen des Menüplans hängen ebenfalls an der Reise
  await db.delete(menuDayNotes).where(eq(menuDayNotes.tripId, id));
  // Tages-Journal der Reise (#192) hängt wie die Notizen an der Reise
  await db.delete(tripJournal).where(eq(tripJournal.tripId, id));
  // Mitglieder und offene Einladungs-Links der Reise mit aufräumen
  await db.delete(tripMembers).where(eq(tripMembers.tripId, id));
  await db.delete(tripInvites).where(eq(tripInvites.tripId, id));
  // Gemeinsame Reise-Einkaufsliste hängt an der Reise – ebenfalls weg
  await db.delete(tripShoppingItems).where(eq(tripShoppingItems.tripId, id));
}

// ── Reise-Mitglieder & Einladungen ──

/** Trip ohne Besitz-Filter laden – nur intern für die Mitglieds-Prüfung. */
async function getTripLogById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripLogs)
    .where(eq(tripLogs.id, id))
    .limit(1);
  return rows[0];
}

/** Mitglieds-Zeile eines Kontos für eine Reise (undefined = kein Mitglied). */
export async function getTripMembership(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
    .limit(1);
  return rows[0];
}

/**
 * Kern des Berechtigungs-Modells: liefert den Trip, wenn das Konto die
 * Besitzerin/der Besitzer ODER eingeladenes Mitglied ist – sonst undefined.
 * Für nicht geteilte Trips verhält sich das exakt wie getTripLog(id, userId).
 */
export async function canAccessTrip(tripId: number, userId: number) {
  const trip = await getTripLogById(tripId);
  if (!trip) return undefined;
  if (trip.userId === userId) return trip;
  const membership = await getTripMembership(tripId, userId);
  return membership ? trip : undefined;
}

/** Mitglied hinzufügen – idempotent (unique tripId+userId). */
export async function addTripMember(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .insert(tripMembers)
    .values({ tripId, userId, role: "member" })
    .onDuplicateKeyUpdate({ set: { role: "member" } });
}

export async function removeTripMember(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)));
}

/**
 * Reise-Ids mit mindestens einem eingeladenen Mitglied – für die
 * «geteilt»-Markierung in trips.list, ohne pro Reise einzeln abzufragen.
 */
export async function getSharedTripIds(tripIds: number[]) {
  if (tripIds.length === 0) return new Set<number>();
  const db = requireDb(await getDb());
  const rows = await db
    .selectDistinct({ tripId: tripMembers.tripId })
    .from(tripMembers)
    .where(inArray(tripMembers.tripId, tripIds));
  return new Set(rows.map(r => r.tripId));
}

/** Mitglieder einer Reise samt Anzeige-Daten (Name/E-Mail) der Konten. */
export async function getTripMembersWithUsers(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      userId: tripMembers.userId,
      role: tripMembers.role,
      name: users.name,
      email: users.email,
    })
    .from(tripMembers)
    .leftJoin(users, eq(users.id, tripMembers.userId))
    .where(eq(tripMembers.tripId, tripId))
    .orderBy(asc(tripMembers.id));
}

/**
 * Anzeigenamen mehrerer Konten in EINER Abfrage (Name, sonst E-Mail,
 * sonst #id) – für «Zuletzt geändert von»-Anzeigen bei gemeinsamen Reisen.
 */
export async function getUserDisplayNames(ids: number[]) {
  const map = new Map<number, string>();
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return map;
  const db = requireDb(await getDb());
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, unique));
  rows.forEach(r => map.set(r.id, r.name || r.email || `#${r.id}`));
  return map;
}

/**
 * Ist die Packliste mit einer GEMEINSAMEN Reise ihrer Besitzerin/ihres
 * Besitzers verknüpft (mind. 1 Mitglied)? Liefert die Trip-Id, sonst null –
 * eine Abfrage, damit packing.items das «Zuletzt geändert von»-Feld nur
 * für geteilte Listen auflösen muss.
 */
export async function getListSharedTripId(listId: number, ownerUserId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select({ tripId: tripLogs.id })
    .from(tripLogs)
    .innerJoin(tripMembers, eq(tripMembers.tripId, tripLogs.id))
    .where(
      and(eq(tripLogs.packListId, listId), eq(tripLogs.userId, ownerUserId))
    )
    .limit(1);
  return rows[0]?.tripId ?? null;
}

/** Konto-Zeile für Anzeige-Zwecke (Owner-Name in Mitglieder-Liste/Einladung). */
export async function getUserById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

/**
 * Reisen, bei denen das Konto eingeladenes Mitglied ist – mit Owner-Name
 * und dem Namen des verknüpften Zeltplatzes (der gehört der Besitzerin/dem
 * Besitzer und wäre für Mitglieder sonst nicht auflösbar).
 */
export async function getMemberTripLogs(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      trip: tripLogs,
      ownerName: users.name,
      ownerEmail: users.email,
      spotName: campSpots.name,
    })
    .from(tripMembers)
    .innerJoin(tripLogs, eq(tripMembers.tripId, tripLogs.id))
    .leftJoin(users, eq(users.id, tripLogs.userId))
    .leftJoin(campSpots, eq(campSpots.id, tripLogs.spotId))
    .where(eq(tripMembers.userId, userId))
    .orderBy(desc(tripLogs.startDate), desc(tripLogs.id));
}

/** Aktiver Einladungs-Link einer Reise (undefined = keiner). */
export async function getTripInvite(tripId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripInvites)
    .where(eq(tripInvites.tripId, tripId))
    .limit(1);
  return rows[0];
}

/** Einladungs-Token setzen – ersetzt einen bestehenden Link (unique tripId). */
export async function upsertTripInvite(tripId: number, inviteToken: string) {
  const db = requireDb(await getDb());
  await db
    .insert(tripInvites)
    .values({ tripId, inviteToken })
    .onDuplicateKeyUpdate({ set: { inviteToken } });
}

export async function deleteTripInvite(tripId: number) {
  const db = requireDb(await getDb());
  await db.delete(tripInvites).where(eq(tripInvites.tripId, tripId));
}

// ── Reise-Hub teilen (öffentlicher Read-only-Link, unabhängig von Mitgliedern) ──

/** Teil-Token des Reise-Hubs setzen oder entfernen (nur eigene Reise). */
export async function setTripLogShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(tripLogs)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
}

/** Geteilte Reise anhand des Hub-Tokens laden (öffentlich, ohne Login). */
export async function getTripLogByShareToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripLogs)
    .where(eq(tripLogs.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}

/** Einladung anhand des Tokens laden (öffentlich, ohne Login). */
export async function getTripInviteByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripInvites)
    .where(eq(tripInvites.inviteToken, token))
    .limit(1);
  const invite = rows[0];
  if (!invite) return undefined;
  const trip = await getTripLogById(invite.tripId);
  if (!trip) return undefined;
  return { invite, trip };
}

// ── Fotos im Reise-Tagebuch ──
export async function getTripPhotos(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripPhotos)
    .where(and(eq(tripPhotos.tripId, tripId), eq(tripPhotos.userId, userId)))
    .orderBy(tripPhotos.id);
}

export async function countTripPhotos(tripId: number, userId: number) {
  return (await getTripPhotos(tripId, userId)).length;
}

/**
 * Alle Fotos einer Reise – unabhängig davon, wer sie hochgeladen hat.
 * Nur NACH einer canAccessTrip-Prüfung im Router verwenden.
 */
export async function getTripPhotosForTrip(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripPhotos)
    .where(eq(tripPhotos.tripId, tripId))
    .orderBy(tripPhotos.id);
}

export async function countTripPhotosForTrip(tripId: number) {
  return (await getTripPhotosForTrip(tripId)).length;
}

/** Foto ohne Besitz-Filter – der Router prüft danach den Trip-Zugriff. */
export async function getTripPhotoById(id: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(eq(tripPhotos.id, id))
    .limit(1);
  return rows[0];
}

/** Foto per Dateiname ohne Besitz-Filter – Router prüft den Trip-Zugriff. */
export async function getTripPhotoByFileNameAny(fileName: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(eq(tripPhotos.fileName, fileName))
    .limit(1);
  return rows[0];
}

/** Foto-Zeile löschen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteTripPhotoById(id: number) {
  const db = requireDb(await getDb());
  await db.delete(tripPhotos).where(eq(tripPhotos.id, id));
}

/** Alle Foto-Zeilen einer Reise löschen (auch die von Mitreisenden). */
export async function deleteAllTripPhotosForTrip(tripId: number) {
  const db = requireDb(await getDb());
  await db.delete(tripPhotos).where(eq(tripPhotos.tripId, tripId));
}

export async function addTripPhoto(data: InsertTripPhoto) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(tripPhotos).values(data);
  return result.insertId;
}

/** Einzelnes Foto laden (nur eigenes). */
export async function getTripPhoto(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(and(eq(tripPhotos.id, id), eq(tripPhotos.userId, userId)))
    .limit(1);
  return rows[0];
}

/** Foto anhand des Dateinamens laden – nur für die Besitzerin/den Besitzer. */
export async function getTripPhotoByFileName(fileName: string, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(tripPhotos)
    .where(
      and(eq(tripPhotos.fileName, fileName), eq(tripPhotos.userId, userId))
    )
    .limit(1);
  return rows[0];
}

export async function deleteTripPhoto(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripPhotos)
    .where(and(eq(tripPhotos.id, id), eq(tripPhotos.userId, userId)));
}

/** Alle Foto-Zeilen eines Trips löschen (Dateien löscht der Aufrufer). */
export async function deleteTripPhotosForTrip(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripPhotos)
    .where(and(eq(tripPhotos.tripId, tripId), eq(tripPhotos.userId, userId)));
}

// ── Menüplan pro Trip ──

/**
 * Alle Menüplan-Einträge einer Reise – unabhängig davon, wer sie angelegt
 * hat. Nur NACH einer canAccessTrip-Prüfung im Router verwenden.
 */
export async function getMenuEntriesForTrip(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(menuEntries)
    .where(eq(menuEntries.tripId, tripId))
    .orderBy(menuEntries.day, menuEntries.id);
}

/** Slot einer Reise leeren – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteMenuEntrySlot(
  tripId: number,
  day: string,
  meal: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const db = requireDb(await getDb());
  await db
    .delete(menuEntries)
    .where(
      and(
        eq(menuEntries.tripId, tripId),
        eq(menuEntries.day, day),
        eq(menuEntries.meal, meal)
      )
    );
}

export async function getMenuEntries(tripId: number, userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(menuEntries)
    .where(and(eq(menuEntries.tripId, tripId), eq(menuEntries.userId, userId)))
    .orderBy(menuEntries.day, menuEntries.id);
}

/** Eintrag pro Tag+Mahlzeit setzen oder ersetzen (Upsert über Unique-Index). */
export async function upsertMenuEntry(data: InsertMenuEntry) {
  const db = requireDb(await getDb());
  await db
    .insert(menuEntries)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        recipeId: data.recipeId ?? null,
        customRecipeId: data.customRecipeId ?? null,
        freeText: data.freeText ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
}

export async function deleteMenuEntry(
  tripId: number,
  userId: number,
  day: string,
  meal: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const db = requireDb(await getDb());
  await db
    .delete(menuEntries)
    .where(
      and(
        eq(menuEntries.tripId, tripId),
        eq(menuEntries.userId, userId),
        eq(menuEntries.day, day),
        eq(menuEntries.meal, meal)
      )
    );
}

/**
 * Tages-Notizen einer Reise (aufsteigend nach Tag) – nur NACH einer
 * canAccessTrip-Prüfung im Router verwenden.
 */
export async function getMenuDayNotesForTrip(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(menuDayNotes)
    .where(eq(menuDayNotes.tripId, tripId))
    .orderBy(menuDayNotes.day);
}

/**
 * Tages-Notiz setzen oder ersetzen (Upsert über unique tripId+day) –
 * nur NACH einer canAccessTrip-Prüfung im Router verwenden.
 */
export async function upsertMenuDayNote(
  tripId: number,
  day: string,
  note: string
) {
  const db = requireDb(await getDb());
  await db
    .insert(menuDayNotes)
    .values({ tripId, day, note })
    .onDuplicateKeyUpdate({ set: { note } });
}

/** Tages-Notiz löschen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteMenuDayNote(tripId: number, day: string) {
  const db = requireDb(await getDb());
  await db
    .delete(menuDayNotes)
    .where(and(eq(menuDayNotes.tripId, tripId), eq(menuDayNotes.day, day)));
}

// ── Tages-Journal der Reise (#192) ──

/**
 * Journal-Einträge einer Reise (aufsteigend nach Tag) – nur NACH einer
 * canAccessTrip-Prüfung im Router verwenden.
 */
export async function getTripJournal(tripId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(tripJournal)
    .where(eq(tripJournal.tripId, tripId))
    .orderBy(tripJournal.day);
}

/**
 * Journal-Eintrag setzen oder ersetzen (Upsert über unique tripId+day) –
 * nur NACH einer canAccessTrip-Prüfung im Router verwenden. createdByUserId
 * hält fest, wer zuletzt geschrieben hat.
 */
export async function upsertTripJournalEntry(
  tripId: number,
  day: string,
  text: string,
  createdByUserId: number | null
) {
  const db = requireDb(await getDb());
  await db
    .insert(tripJournal)
    .values({ tripId, day, text, createdByUserId })
    .onDuplicateKeyUpdate({ set: { text, createdByUserId } });
}

/** Journal-Eintrag löschen – nur NACH einer canAccessTrip-Prüfung im Router. */
export async function deleteTripJournalEntry(tripId: number, day: string) {
  const db = requireDb(await getDb());
  await db
    .delete(tripJournal)
    .where(and(eq(tripJournal.tripId, tripId), eq(tripJournal.day, day)));
}

// ── Fotos zu Zeltplatz-Favoriten ──
export async function getSpotPhotos(spotId: number, userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(spotPhotos)
    .where(and(eq(spotPhotos.spotId, spotId), eq(spotPhotos.userId, userId)))
    .orderBy(spotPhotos.id);
}

export async function countSpotPhotos(spotId: number, userId: number) {
  return (await getSpotPhotos(spotId, userId)).length;
}

export async function addSpotPhoto(data: InsertSpotPhoto) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(spotPhotos).values(data);
  return result.insertId;
}

/** Einzelnes Foto laden (nur eigenes). */
export async function getSpotPhoto(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(spotPhotos)
    .where(and(eq(spotPhotos.id, id), eq(spotPhotos.userId, userId)))
    .limit(1);
  return rows[0];
}

/** Foto anhand des Dateinamens laden – nur für die Besitzerin/den Besitzer. */
export async function getSpotPhotoByFileName(fileName: string, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(spotPhotos)
    .where(
      and(eq(spotPhotos.fileName, fileName), eq(spotPhotos.userId, userId))
    )
    .limit(1);
  return rows[0];
}

export async function deleteSpotPhoto(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(spotPhotos)
    .where(and(eq(spotPhotos.id, id), eq(spotPhotos.userId, userId)));
}

/** Alle Foto-Zeilen eines Platzes löschen (Dateien löscht der Aufrufer). */
export async function deleteSpotPhotosForSpot(spotId: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(spotPhotos)
    .where(and(eq(spotPhotos.spotId, spotId), eq(spotPhotos.userId, userId)));
}

/** Teil-Token eines Zeltplatzes setzen oder entfernen (nur eigener Favorit). */
export async function setCampSpotShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(campSpots)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(campSpots.id, id), eq(campSpots.userId, userId)));
}

/** Geteilten Zeltplatz anhand des Tokens laden (öffentlich, ohne Login). */
export async function getCampSpotByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(campSpots)
    .where(eq(campSpots.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}

// ── Eigene Rezepte ──
export async function getCustomRecipes(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(customRecipes)
    .where(eq(customRecipes.userId, userId))
    .orderBy(desc(customRecipes.id));
}

/** Einzelnes eigenes Rezept (nur, wenn es der Person gehört). */
export async function getCustomRecipe(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customRecipes)
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)))
    .limit(1);
  return rows[0];
}

/** Teil-Token eines Rezepts setzen oder entfernen (nur fürs eigene Rezept). */
export async function setCustomRecipeShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(customRecipes)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
}

/** Geteiltes Rezept anhand des Tokens laden (öffentlich, ohne Login). */
export async function getCustomRecipeByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customRecipes)
    .where(eq(customRecipes.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}

/** Eigenes Rezept über den Foto-Dateinamen (für die private Auslieferung). */
export async function getCustomRecipeByImageFileName(
  fileName: string,
  userId: number
) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customRecipes)
    .where(
      and(
        eq(customRecipes.imageFileName, fileName),
        eq(customRecipes.userId, userId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function addCustomRecipe(data: InsertCustomRecipe) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(customRecipes).values(data);
  return result.insertId;
}

export async function updateCustomRecipe(
  id: number,
  userId: number,
  data: Partial<Omit<InsertCustomRecipe, "id" | "userId">>
) {
  const db = requireDb(await getDb());
  await db
    .update(customRecipes)
    .set(data)
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
}

export async function deleteCustomRecipe(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(customRecipes)
    .where(and(eq(customRecipes.id, id), eq(customRecipes.userId, userId)));
}

// ── Eigene Schnitzeljagden ──
export async function getCustomHunts(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(customHunts)
    .where(eq(customHunts.userId, userId))
    .orderBy(desc(customHunts.id));
}

export async function addCustomHunt(data: InsertCustomHunt) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(customHunts).values(data);
  return result.insertId;
}

export async function updateCustomHunt(
  id: number,
  userId: number,
  data: Partial<Omit<InsertCustomHunt, "id" | "userId">>
) {
  const db = requireDb(await getDb());
  await db
    .update(customHunts)
    .set(data)
    .where(and(eq(customHunts.id, id), eq(customHunts.userId, userId)));
}

export async function deleteCustomHunt(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(customHunts)
    .where(and(eq(customHunts.id, id), eq(customHunts.userId, userId)));
}

// ── Eigene Quizze ──
export async function getCustomQuizzes(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(customQuizzes)
    .where(eq(customQuizzes.userId, userId))
    .orderBy(desc(customQuizzes.id));
}

export async function getCustomQuiz(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customQuizzes)
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function addCustomQuiz(data: InsertCustomQuiz) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(customQuizzes).values(data);
  return result.insertId;
}

/** Teil-Token eines Quiz setzen oder entfernen (nur fürs eigene Quiz). */
export async function setCustomQuizShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(customQuizzes)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)));
}

/** Geteiltes Quiz anhand des Tokens laden (öffentlich, ohne Login). */
export async function getCustomQuizByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(customQuizzes)
    .where(eq(customQuizzes.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}

export async function updateCustomQuiz(
  id: number,
  userId: number,
  data: Partial<Omit<InsertCustomQuiz, "id" | "userId">>
) {
  const db = requireDb(await getDb());
  await db
    .update(customQuizzes)
    .set(data)
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)));
}

export async function deleteCustomQuiz(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(customQuizzes)
    .where(and(eq(customQuizzes.id, id), eq(customQuizzes.userId, userId)));
}

// ── Familien-Modus: Kinder-Profile, Abzeichen & Zähler ──
export async function getFamilyChildren(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(familyChildren)
    .where(eq(familyChildren.userId, userId))
    .orderBy(asc(familyChildren.id));
}

/** Einzelnes Kind laden (nur eigenes). */
export async function getFamilyChild(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(familyChildren)
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function addFamilyChild(data: InsertFamilyChild) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(familyChildren).values(data);
  return result.insertId;
}

export async function renameFamilyChild(
  id: number,
  userId: number,
  name: string
) {
  const db = requireDb(await getDb());
  await db
    .update(familyChildren)
    .set({ name })
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)));
}

/** Kind löschen – Abzeichen und Zähler gehen mit (kein DB-FK, daher manuell). */
export async function deleteFamilyChild(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(childBadges)
    .where(and(eq(childBadges.childId, id), eq(childBadges.userId, userId)));
  await db
    .delete(childStats)
    .where(and(eq(childStats.childId, id), eq(childStats.userId, userId)));
  await db
    .delete(familyChildren)
    .where(and(eq(familyChildren.id, id), eq(familyChildren.userId, userId)));
}

export async function getChildBadges(userId: number, childId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(childBadges)
    .where(
      and(eq(childBadges.userId, userId), eq(childBadges.childId, childId))
    )
    .orderBy(asc(childBadges.id));
}

/**
 * Abzeichen vergeben – idempotent: der unique Index childId+badgeId macht
 * die zweite Vergabe zum No-op (earnedAt bleibt das Erst-Datum).
 */
export async function awardChildBadge(
  userId: number,
  childId: number,
  badgeId: string
) {
  const db = requireDb(await getDb());
  await db
    .insert(childBadges)
    .values({ userId, childId, badgeId })
    .onDuplicateKeyUpdate({ set: { badgeId } });
}

/**
 * Ereignis-Zähler eines Kindes atomar fortschreiben (eine Upsert-Anweisung:
 * Zähler inkrementieren, beste Serie per GREATEST) und den neuen Stand laden.
 */
export async function recordChildEvent(
  userId: number,
  childId: number,
  event: { hunt?: boolean; quiz?: boolean; streak?: number }
) {
  const db = requireDb(await getDb());
  const huntInc = event.hunt ? 1 : 0;
  const quizInc = event.quiz ? 1 : 0;
  const streak = Math.max(0, event.streak ?? 0);
  await db
    .insert(childStats)
    .values({
      userId,
      childId,
      huntsCompleted: huntInc,
      quizzesCompleted: quizInc,
      bestStreak: streak,
    })
    .onDuplicateKeyUpdate({
      set: {
        huntsCompleted: sql`${childStats.huntsCompleted} + ${huntInc}`,
        quizzesCompleted: sql`${childStats.quizzesCompleted} + ${quizInc}`,
        bestStreak: sql`GREATEST(${childStats.bestStreak}, ${streak})`,
      },
    });
  const rows = await db
    .select()
    .from(childStats)
    .where(and(eq(childStats.userId, userId), eq(childStats.childId, childId)))
    .limit(1);
  return rows[0];
}

// ── Synchronisierte Einstellungen ──
export async function getUserSettings(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(userSettings).where(eq(userSettings.userId, userId));
}

export async function upsertUserSetting(
  userId: number,
  key: string,
  value: string
) {
  const db = requireDb(await getDb());
  await db
    .insert(userSettings)
    .values({ userId, key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

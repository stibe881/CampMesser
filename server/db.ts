import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  campSpots,
  customHunts,
  customQuizzes,
  customRecipes,
  InsertCustomHunt,
  InsertCustomQuiz,
  InsertCustomRecipe,
  foodItems,
  foodTemplates,
  homeLocations,
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
  InsertTripLog,
  InsertTripPhoto,
  InsertUser,
  inventoryItems,
  menuEntries,
  packItems,
  packLists,
  packTemplatesCustom,
  powerConsumers,
  shoppingItems,
  spotPhotos,
  InsertSpotPhoto,
  tripLogs,
  tripPhotos,
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

export async function setPackItemChecked(id: number, checked: boolean) {
  const db = requireDb(await getDb());
  await db.update(packItems).set({ checked }).where(eq(packItems.id, id));
}

/** Personen-Zuordnung («Wer packt das?») setzen oder mit null entfernen. */
export async function setPackItemAssignee(id: number, assignee: string | null) {
  const db = requireDb(await getDb());
  await db.update(packItems).set({ assignee }).where(eq(packItems.id, id));
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
  token: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packTemplatesCustom)
    .set({ shareToken: token })
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
  return result[0];
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

/** Teil-Token setzen oder entfernen (nur für die eigene Liste). */
export async function setPackListShareToken(
  id: number,
  userId: number,
  token: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(packLists)
    .set({ shareToken: token })
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
  return result[0];
}

// ── Inventar ──
export async function getInventory(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.userId, userId));
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

// ── Einkaufsliste ──
export async function getShoppingItems(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(shoppingItems)
    .where(eq(shoppingItems.userId, userId))
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

/** Alle abgehakten Einträge der Einkaufsliste entfernen. */
export async function deleteCheckedShoppingItems(userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(shoppingItems)
    .where(
      and(eq(shoppingItems.userId, userId), eq(shoppingItems.checked, true))
    );
}

/** Die ganze Einkaufsliste leeren. */
export async function clearShoppingItems(userId: number) {
  const db = requireDb(await getDb());
  await db.delete(shoppingItems).where(eq(shoppingItems.userId, userId));
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
  data: Partial<Pick<InsertCampSpot, "name" | "note" | "attributesJson">>
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

export async function deleteTripLog(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripLogs)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
  // Zugehörige Menüplan-Einträge mitlöschen (kein DB-FK, daher manuell)
  await db
    .delete(menuEntries)
    .where(and(eq(menuEntries.tripId, id), eq(menuEntries.userId, userId)));
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
  token: string | null
) {
  const db = requireDb(await getDb());
  await db
    .update(campSpots)
    .set({ shareToken: token })
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
  return rows[0];
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

export async function addCustomQuiz(data: InsertCustomQuiz) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(customQuizzes).values(data);
  return result.insertId;
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

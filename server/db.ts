import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  campSpots,
  customHunts,
  customRecipes,
  InsertCustomHunt,
  InsertCustomRecipe,
  foodItems,
  InsertCampSpot,
  InsertFoodItem,
  InsertInventoryItem,
  InsertPackItem,
  InsertPackList,
  InsertPowerConsumer,
  InsertTripLog,
  InsertUser,
  inventoryItems,
  packItems,
  packLists,
  powerConsumers,
  tripLogs,
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
  return db.select().from(packItems).where(eq(packItems.listId, listId));
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

export async function deletePackItem(id: number) {
  const db = requireDb(await getDb());
  await db.delete(packItems).where(eq(packItems.id, id));
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

// ── Zeltplatz-Favoriten ──
export async function getCampSpots(userId: number) {
  const db = requireDb(await getDb());
  return db.select().from(campSpots).where(eq(campSpots.userId, userId));
}

export async function addCampSpot(data: InsertCampSpot) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(campSpots).values(data);
  return result.insertId;
}

export async function updateCampSpot(
  id: number,
  userId: number,
  data: Partial<Pick<InsertCampSpot, "name" | "note">>
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

export async function deleteTripLog(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(tripLogs)
    .where(and(eq(tripLogs.id, id), eq(tripLogs.userId, userId)));
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

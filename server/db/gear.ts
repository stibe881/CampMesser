/**
 * Inventar, Kisten, Beobachtungen, Pflege, Strom (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertFishCatch,
  InsertGearTask,
  InsertInventoryItem,
  InsertNatureSighting,
  InsertPowerConsumer,
  InsertStorageBox,
  InsertTickBite,
  and,
  asc,
  desc,
  eq,
  fishCatches,
  gearTasks,
  getDb,
  inventoryItems,
  natureSightings,
  powerConsumers,
  requireDb,
  storageBoxes,
  tickBites,
} from "./_shared";

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
/** Alle Kisten eines Kontos, neueste zuletzt (Reihenfolge des Anlegens). */
export async function getStorageBoxes(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(storageBoxes)
    .where(eq(storageBoxes.userId, userId))
    .orderBy(storageBoxes.id);
}
/** Kiste über ihre Kennung finden – der Weg, den ein QR-Scan nimmt. */
export async function getStorageBoxByCode(userId: number, code: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(storageBoxes)
    .where(and(eq(storageBoxes.userId, userId), eq(storageBoxes.code, code)))
    .limit(1);
  return rows[0];
}
export async function createStorageBox(data: InsertStorageBox) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(storageBoxes).values(data);
  return result.insertId;
}
export async function updateStorageBox(
  id: number,
  userId: number,
  data: Partial<Pick<InsertStorageBox, "code" | "name" | "location" | "notes">>
) {
  const db = requireDb(await getDb());
  await db
    .update(storageBoxes)
    .set(data)
    .where(and(eq(storageBoxes.id, id), eq(storageBoxes.userId, userId)));
}
/**
 * Kiste löschen. Die Ausrüstung bleibt bestehen und wird nur ausgeräumt –
 * eine Kiste wegzuwerfen heisst nicht, den Gaskocher wegzuwerfen.
 */
export async function deleteStorageBox(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .update(inventoryItems)
    .set({ boxId: null })
    .where(
      and(eq(inventoryItems.boxId, id), eq(inventoryItems.userId, userId))
    );
  await db
    .delete(storageBoxes)
    .where(and(eq(storageBoxes.id, id), eq(storageBoxes.userId, userId)));
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
// ── Fangbuch (#236) ──
export async function getFishCatches(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(fishCatches)
    .where(eq(fishCatches.userId, userId))
    .orderBy(desc(fishCatches.caughtAt), desc(fishCatches.id));
}
/** Einzelner Fang (nur, wenn er der Person gehört). */
export async function getFishCatch(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(fishCatches)
    .where(and(eq(fishCatches.id, id), eq(fishCatches.userId, userId)))
    .limit(1);
  return rows[0];
}
/** Fang über den Foto-Dateinamen (für die private Auslieferung). */
export async function getFishCatchByFileName(fileName: string, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(fishCatches)
    .where(
      and(eq(fishCatches.fileName, fileName), eq(fishCatches.userId, userId))
    )
    .limit(1);
  return rows[0];
}
export async function addFishCatch(data: InsertFishCatch) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(fishCatches).values(data);
  return result.insertId;
}
export async function updateFishCatch(
  id: number,
  userId: number,
  data: Partial<InsertFishCatch>
) {
  const db = requireDb(await getDb());
  await db
    .update(fishCatches)
    .set(data)
    .where(and(eq(fishCatches.id, id), eq(fishCatches.userId, userId)));
}
export async function deleteFishCatch(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(fishCatches)
    .where(and(eq(fishCatches.id, id), eq(fishCatches.userId, userId)));
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

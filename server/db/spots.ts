/**
 * Zeltplätze und Heim-Standort (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertCampSpot,
  InsertHomeLocation,
  and,
  campSpots,
  eq,
  getDb,
  homeLocations,
  requireDb,
} from "./_shared";

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
      | "pricePerNightRappen"
      | "extraPerNightRappen"
      | "tariffsJson"
      | "elevationM"
      | "ratingSanitary"
      | "ratingQuiet"
      | "ratingShade"
      | "ratingKids"
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

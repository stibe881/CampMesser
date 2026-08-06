/**
 * Wanderungen, geplante Routen, Standort-Links, Platz-Fotos (#336).
 *
 * Aus `server/db.ts` herausgelöst, Verhalten unverändert. Der gemeinsame
 * Unterbau steht in `_shared.ts`.
 */
import {
  InsertHikeTrack,
  InsertPlannedRoute,
  InsertSpotPhoto,
  and,
  campSpots,
  desc,
  eq,
  getDb,
  hikeTracks,
  isShareExpired,
  locationShares,
  plannedRoutes,
  requireDb,
  spotPhotos,
} from "./_shared";

/**
 * Tracks eines Kontos, neuste zuoberst – OHNE die Punktreihe. Die Liste
 * zeigt nur Name und Statistik; `pointsJson` kann pro Track hunderte
 * Kilobyte gross sein und wird deshalb erst beim Öffnen eines Tracks
 * nachgeladen (getHikeTrack).
 */
export async function getHikeTracks(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select({
      id: hikeTracks.id,
      userId: hikeTracks.userId,
      tripId: hikeTracks.tripId,
      name: hikeTracks.name,
      startedAt: hikeTracks.startedAt,
      endedAt: hikeTracks.endedAt,
      distanceM: hikeTracks.distanceM,
      durationS: hikeTracks.durationS,
      ascentM: hikeTracks.ascentM,
      descentM: hikeTracks.descentM,
      // Teil-Status (#282): die Liste zeigt, ob ein Link im Umlauf ist
      shareToken: hikeTracks.shareToken,
      shareExpiresAt: hikeTracks.shareExpiresAt,
      createdAt: hikeTracks.createdAt,
    })
    .from(hikeTracks)
    .where(eq(hikeTracks.userId, userId))
    .orderBy(desc(hikeTracks.startedAt), desc(hikeTracks.id));
}
/** Einzelnen Track samt Punktreihe laden (nur eigener Track). */
export async function getHikeTrack(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(hikeTracks)
    .where(and(eq(hikeTracks.id, id), eq(hikeTracks.userId, userId)))
    .limit(1);
  return rows[0];
}
/** Aufgezeichnete Wanderung speichern. */
export async function addHikeTrack(data: InsertHikeTrack) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(hikeTracks).values(data);
  return result.insertId;
}
/** Track umbenennen bzw. einer Reise zuordnen (nur eigener Track). */
export async function updateHikeTrack(
  id: number,
  userId: number,
  data: Partial<InsertHikeTrack>
) {
  const db = requireDb(await getDb());
  await db
    .update(hikeTracks)
    .set(data)
    .where(and(eq(hikeTracks.id, id), eq(hikeTracks.userId, userId)));
}
/** Track löschen (nur eigener Track). */
export async function deleteHikeTrack(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(hikeTracks)
    .where(and(eq(hikeTracks.id, id), eq(hikeTracks.userId, userId)));
}
/**
 * Beim Löschen einer Reise: Tracks behalten, nur die Zuordnung lösen –
 * eine Wanderung ist auch ohne ihre Reise etwas wert.
 */
export async function detachHikeTracksFromTrip(tripId: number) {
  const db = requireDb(await getDb());
  await db
    .update(hikeTracks)
    .set({ tripId: null })
    .where(eq(hikeTracks.tripId, tripId));
}
/** Teil-Token einer Wanderung setzen oder entfernen (#282). */
export async function setHikeTrackShareToken(
  id: number,
  userId: number,
  token: string | null,
  expiresAt: Date | null = null
) {
  const db = requireDb(await getDb());
  await db
    .update(hikeTracks)
    // Ohne Token gibt es auch keinen Ablauf mehr
    .set({ shareToken: token, shareExpiresAt: token ? expiresAt : null })
    .where(and(eq(hikeTracks.id, id), eq(hikeTracks.userId, userId)));
}
/** Geteilte Wanderung anhand des Tokens laden (öffentlich, ohne Login). */
export async function getHikeTrackByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(hikeTracks)
    .where(eq(hikeTracks.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Teil-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}
/**
 * Geplante Routen eines Kontos, neuste zuoberst. Die Wegpunkte kommen mit –
 * anders als bei den aufgezeichneten Tracks sind es höchstens vierzig
 * Tupel pro Route, und die Liste zeigt jede Route auf einer Mini-Karte.
 */
export async function getPlannedRoutes(userId: number) {
  const db = requireDb(await getDb());
  return db
    .select()
    .from(plannedRoutes)
    .where(eq(plannedRoutes.userId, userId))
    .orderBy(desc(plannedRoutes.createdAt), desc(plannedRoutes.id));
}
/** Einzelne Route laden (nur eigene). */
export async function getPlannedRoute(id: number, userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(plannedRoutes)
    .where(and(eq(plannedRoutes.id, id), eq(plannedRoutes.userId, userId)))
    .limit(1);
  return rows[0];
}
/** Route speichern. */
export async function addPlannedRoute(data: InsertPlannedRoute) {
  const db = requireDb(await getDb());
  const [result] = await db.insert(plannedRoutes).values(data);
  return result.insertId;
}
/** Route ändern (nur eigene). */
export async function updatePlannedRoute(
  id: number,
  userId: number,
  data: Partial<InsertPlannedRoute>
) {
  const db = requireDb(await getDb());
  await db
    .update(plannedRoutes)
    .set(data)
    .where(and(eq(plannedRoutes.id, id), eq(plannedRoutes.userId, userId)));
}
/** Route löschen (nur eigene). */
export async function deletePlannedRoute(id: number, userId: number) {
  const db = requireDb(await getDb());
  await db
    .delete(plannedRoutes)
    .where(and(eq(plannedRoutes.id, id), eq(plannedRoutes.userId, userId)));
}
/** Beim Löschen einer Reise: Route behalten, nur die Zuordnung lösen. */
export async function detachPlannedRoutesFromTrip(tripId: number) {
  const db = requireDb(await getDb());
  await db
    .update(plannedRoutes)
    .set({ tripId: null })
    .where(eq(plannedRoutes.tripId, tripId));
}
/** Aktiver Standort-Link eines Kontos (undefined = keiner oder abgelaufen). */
export async function getLocationShare(userId: number) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(locationShares)
    .where(eq(locationShares.userId, userId))
    .limit(1);
  const row = rows[0];
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
}
/**
 * Standort-Link anlegen oder auffrischen. Es gibt höchstens einen pro Konto:
 * existiert bereits eine Zeile, behält sie ihren Token – so bleibt ein
 * bereits verschickter Link gültig, wenn der Standort nachgeführt wird.
 * Zurück kommt der gültige Token.
 */
export async function upsertLocationShare(data: {
  userId: number;
  token: string;
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  capturedAt: Date;
  expiresAt: Date;
}): Promise<string> {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(locationShares)
    .where(eq(locationShares.userId, data.userId))
    .limit(1);
  const existing = rows[0];
  if (existing) {
    await db
      .update(locationShares)
      .set({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracyM: data.accuracyM,
        capturedAt: data.capturedAt,
        shareExpiresAt: data.expiresAt,
      })
      .where(eq(locationShares.userId, data.userId));
    return existing.shareToken;
  }
  await db.insert(locationShares).values({
    userId: data.userId,
    shareToken: data.token,
    latitude: data.latitude,
    longitude: data.longitude,
    accuracyM: data.accuracyM,
    capturedAt: data.capturedAt,
    shareExpiresAt: data.expiresAt,
  });
  return data.token;
}
/** Standort-Link vorzeitig beenden – die Zeile verschwindet ganz. */
export async function deleteLocationShare(userId: number) {
  const db = requireDb(await getDb());
  await db.delete(locationShares).where(eq(locationShares.userId, userId));
}
/** Geteilten Standort anhand des Tokens laden (öffentlich, ohne Login). */
export async function getLocationShareByToken(token: string) {
  const db = requireDb(await getDb());
  const rows = await db
    .select()
    .from(locationShares)
    .where(eq(locationShares.shareToken, token))
    .limit(1);
  const row = rows[0];
  // Abgelaufene Standort-Links verhalten sich wie unbekannte Tokens
  return row && !isShareExpired(row.shareExpiresAt) ? row : undefined;
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

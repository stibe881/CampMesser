import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { users, type User } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";

const scryptAsync = promisify(scrypt);

/**
 * Eigenständige E-Mail/Passwort-Authentifizierung.
 * Nutzt die bestehende Session-Infrastruktur (JWT-Cookie), aber mit lokalen
 * Nutzerkonten statt Manus OAuth. openId-Format: "local:<random>".
 */

export const LOCAL_OPEN_ID_PREFIX = "local:";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8)
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  if (password.length > 200) return "Das Passwort ist zu lang.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

export async function findUserByEmail(
  email: string
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  return rows[0];
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  const openId = `${LOCAL_OPEN_ID_PREFIX}${randomBytes(24).toString("hex")}`;
  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    openId,
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  if (!rows[0]) throw new Error("Registrierung fehlgeschlagen");
  return rows[0];
}

/** Session-Token für ein lokales Konto ausstellen (gleiche JWT-Infrastruktur wie bisher). */
export async function createLocalSessionToken(user: User): Promise<string> {
  return sdk.createSessionToken(user.openId, {
    name: user.name || user.email || "Camper",
    expiresInMs: ONE_YEAR_MS,
  });
}

/** Namen eines Kontos ändern. */
export async function updateUserName(
  userId: number,
  name: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db.update(users).set({ name: name.trim() }).where(eq(users.id, userId));
}

/**
 * E-Mail-Adresse eines Kontos ändern (normalisiert). Die neue Adresse ist
 * noch unbestätigt – emailVerifiedAt wird deshalb zurückgesetzt.
 */
export async function updateUserEmail(
  userId: number,
  email: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .update(users)
    .set({ email: normalizeEmail(email), emailVerifiedAt: null })
    .where(eq(users.id, userId));
}

/** E-Mail-Adresse eines Kontos als bestätigt markieren. */
export async function markEmailVerified(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Passwort eines Kontos setzen (Hash wird neu berechnet). */
export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

/** Konto und alle zugehörigen Daten unwiderruflich löschen. */
export async function deleteUserAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  const {
    packLists,
    packItems,
    packTemplatesCustom,
    inventoryItems,
    storageBoxes,
    powerConsumers,
    foodItems,
    foodTemplates,
    campSpots,
    homeLocations,
    spotPhotos,
    tripLogs,
    tripInvites,
    tripMembers,
    tripPhotos,
    tripShoppingItems,
    menuDayNotes,
    menuEntries,
    tripJournal,
    tripBoardNotes,
    customRecipes,
    customHunts,
    customQuizzes,
    familyChildren,
    childBadges,
    childStats,
    shoppingItems,
    shoppingLists,
    shoppingShares,
    pushSubscriptions,
    pushLog,
    userSettings,
    passwordResetTokens,
    emailVerifyTokens,
    passkeys,
    gearTasks,
    natureSightings,
    fishCatches,
    tickBites,
    userNotes,
  } = await import("../drizzle/schema");
  const { inArray, or } = await import("drizzle-orm");
  // Eigene Reisen zuerst ermitteln: deren Mitglieder, Einladungs-Links und
  // von Mitreisenden beigesteuerte Fotos/Menüplan-Einträge fallen mit.
  const ownedTrips = await db
    .select({ id: tripLogs.id })
    .from(tripLogs)
    .where(eq(tripLogs.userId, userId));
  const ownedTripIds = ownedTrips.map(t => t.id);
  // Dateinamen der Foto-Uploads sichern, bevor die DB-Zeilen fallen –
  // der DB-Eintrag ist die Wahrheit (Muster wie trips.remove/recipes.remove).
  // Eigene Uploads (auch auf fremden Reisen) plus alle Fotos eigener Reisen.
  const photoRows = await db
    .select({ fileName: tripPhotos.fileName })
    .from(tripPhotos)
    .where(
      ownedTripIds.length > 0
        ? or(
            eq(tripPhotos.userId, userId),
            inArray(tripPhotos.tripId, ownedTripIds)
          )
        : eq(tripPhotos.userId, userId)
    );
  const recipeRows = await db
    .select({ imageFileName: customRecipes.imageFileName })
    .from(customRecipes)
    .where(eq(customRecipes.userId, userId));
  const spotPhotoRows = await db
    .select({ fileName: spotPhotos.fileName })
    .from(spotPhotos)
    .where(eq(spotPhotos.userId, userId));
  const inventoryRows = await db
    .select({
      imageFileName: inventoryItems.imageFileName,
      receiptFileName: inventoryItems.receiptFileName,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.userId, userId));
  const sightingRows = await db
    .select({ fileName: natureSightings.fileName })
    .from(natureSightings)
    .where(eq(natureSightings.userId, userId));
  const catchRows = await db
    .select({ fileName: fishCatches.fileName })
    .from(fishCatches)
    .where(eq(fishCatches.userId, userId));
  // Packlisten-Positionen zuerst (referenzieren Listen)
  const lists = await db
    .select({ id: packLists.id })
    .from(packLists)
    .where(eq(packLists.userId, userId));
  const listIds = lists.map(l => l.id);
  if (listIds.length > 0) {
    await db.delete(packItems).where(inArray(packItems.listId, listIds));
  }
  await db.delete(packLists).where(eq(packLists.userId, userId));
  await db
    .delete(packTemplatesCustom)
    .where(eq(packTemplatesCustom.userId, userId));
  await db.delete(inventoryItems).where(eq(inventoryItems.userId, userId));
  await db.delete(storageBoxes).where(eq(storageBoxes.userId, userId));
  await db.delete(powerConsumers).where(eq(powerConsumers.userId, userId));
  await db.delete(foodItems).where(eq(foodItems.userId, userId));
  await db.delete(foodTemplates).where(eq(foodTemplates.userId, userId));
  await db.delete(homeLocations).where(eq(homeLocations.userId, userId));
  await db.delete(spotPhotos).where(eq(spotPhotos.userId, userId));
  await db.delete(campSpots).where(eq(campSpots.userId, userId));
  // Reise-Tagebuch samt Fotos und Menüplänen (referenzieren Trips) –
  // eigene Beiträge überall PLUS alles, was an eigenen Reisen hängt
  // (auch Beiträge von Mitreisenden), damit nichts verwaist.
  if (ownedTripIds.length > 0) {
    await db.delete(tripPhotos).where(inArray(tripPhotos.tripId, ownedTripIds));
    await db
      .delete(menuEntries)
      .where(inArray(menuEntries.tripId, ownedTripIds));
    // Tages-Notizen des Menüplans hängen ohne userId an der Reise –
    // Notizen in FREMDEN Reisen bleiben bewusst stehen (gehören zur Reise)
    await db
      .delete(menuDayNotes)
      .where(inArray(menuDayNotes.tripId, ownedTripIds));
    // Tages-Journal (#192) hängt wie die Notizen ohne userId an der Reise –
    // Einträge in FREMDEN Reisen bleiben bewusst stehen (gehören zur Reise)
    await db
      .delete(tripJournal)
      .where(inArray(tripJournal.tripId, ownedTripIds));
    // Pinnwand (#245) eigener Reisen komplett – auch Zettel von
    // Mitreisenden. Eigene Zettel in FREMDEN Reisen bleiben bewusst stehen
    // (sie gehören zur Reise); userId bleibt als tote Referenz zurück, die
    // «von …»-Anzeige entfällt dann einfach.
    await db
      .delete(tripBoardNotes)
      .where(inArray(tripBoardNotes.tripId, ownedTripIds));
    await db
      .delete(tripMembers)
      .where(inArray(tripMembers.tripId, ownedTripIds));
    await db
      .delete(tripInvites)
      .where(inArray(tripInvites.tripId, ownedTripIds));
    // Reise-Einkaufslisten eigener Reisen komplett (auch Einträge von
    // Mitreisenden). Eigene Einträge in FREMDEN Reisen bleiben bewusst
    // stehen – sie gehören inhaltlich zur Reise; createdByUserId bleibt
    // dann als tote Referenz zurück (die «von …»-Anzeige entfällt einfach).
    await db
      .delete(tripShoppingItems)
      .where(inArray(tripShoppingItems.tripId, ownedTripIds));
  }
  await db.delete(tripPhotos).where(eq(tripPhotos.userId, userId));
  await db.delete(menuEntries).where(eq(menuEntries.userId, userId));
  // Eigene Mitgliedschaften bei fremden Reisen ebenfalls aufräumen
  await db.delete(tripMembers).where(eq(tripMembers.userId, userId));
  await db.delete(tripLogs).where(eq(tripLogs.userId, userId));
  await db.delete(customRecipes).where(eq(customRecipes.userId, userId));
  await db.delete(customHunts).where(eq(customHunts.userId, userId));
  await db.delete(customQuizzes).where(eq(customQuizzes.userId, userId));
  // Kinder-Profile samt Abzeichen und Zählern (referenzieren Kinder)
  await db.delete(childBadges).where(eq(childBadges.userId, userId));
  await db.delete(childStats).where(eq(childStats.userId, userId));
  await db.delete(familyChildren).where(eq(familyChildren.userId, userId));
  await db.delete(shoppingItems).where(eq(shoppingItems.userId, userId));
  await db.delete(shoppingShares).where(eq(shoppingShares.userId, userId));
  // Listen-Hüllen der Einkaufslisten (#215) zuletzt – Einträge sind weg
  await db.delete(shoppingLists).where(eq(shoppingLists.userId, userId));
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  // Benachrichtigungs-Verlauf (#201) hängt direkt am Konto
  await db.delete(pushLog).where(eq(pushLog.userId, userId));
  await db.delete(userSettings).where(eq(userSettings.userId, userId));
  // Zeckenstich-Merker (#179) hängen direkt am Konto
  await db.delete(tickBites).where(eq(tickBites.userId, userId));
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
  await db
    .delete(emailVerifyTokens)
    .where(eq(emailVerifyTokens.userId, userId));
  await db.delete(passkeys).where(eq(passkeys.userId, userId));
  await db.delete(gearTasks).where(eq(gearTasks.userId, userId));
  await db.delete(natureSightings).where(eq(natureSightings.userId, userId));
  // Fangbuch (#236) hängt direkt am Konto
  await db.delete(fishCatches).where(eq(fishCatches.userId, userId));
  // Freie Notizen (#246) hängen ebenfalls direkt am Konto
  await db.delete(userNotes).where(eq(userNotes.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  // Zuletzt die Upload-Dateien vom Webspace entfernen – fehlende Dateien
  // blockieren nie, und verwaiste Dateien sind schlimmstenfalls harmlos.
  const {
    tripPhotoStorage,
    recipePhotoStorage,
    spotPhotoStorage,
    inventoryPhotoStorage,
    receiptPhotoStorage,
    sightingPhotoStorage,
    catchPhotoStorage,
  } = await import("./photoStorage");
  await tripPhotoStorage.deleteFiles(photoRows.map(p => p.fileName));
  await recipePhotoStorage.deleteFiles(
    recipeRows
      .map(r => r.imageFileName)
      .filter((name): name is string => Boolean(name))
  );
  await spotPhotoStorage.deleteFiles(spotPhotoRows.map(p => p.fileName));
  await inventoryPhotoStorage.deleteFiles(
    inventoryRows
      .map(r => r.imageFileName)
      .filter((name): name is string => Boolean(name))
  );
  await receiptPhotoStorage.deleteFiles(
    inventoryRows
      .map(r => r.receiptFileName)
      .filter((name): name is string => Boolean(name))
  );
  await sightingPhotoStorage.deleteFiles(
    sightingRows
      .map(r => r.fileName)
      .filter((name): name is string => Boolean(name))
  );
  await catchPhotoStorage.deleteFiles(
    catchRows
      .map(r => r.fileName)
      .filter((name): name is string => Boolean(name))
  );
}

/** Konto anhand der numerischen Id nachschlagen (z. B. für den Passwort-Reset). */
export async function findUserById(userId: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0];
}

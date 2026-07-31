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
  if (password.length < 8) return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  if (password.length > 200) return "Das Passwort ist zu lang.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
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
  password: string,
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
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
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
export async function updateUserName(userId: number, name: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db.update(users).set({ name: name.trim() }).where(eq(users.id, userId));
}

/** Passwort eines Kontos setzen (Hash wird neu berechnet). */
export async function updateUserPassword(userId: number, newPassword: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

/** Konto und alle zugehörigen Daten unwiderruflich löschen. */
export async function deleteUserAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  const { packLists, packItems, inventoryItems, powerConsumers, foodItems, campSpots } =
    await import("../drizzle/schema");
  const { inArray } = await import("drizzle-orm");
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
  await db.delete(inventoryItems).where(eq(inventoryItems.userId, userId));
  await db.delete(powerConsumers).where(eq(powerConsumers.userId, userId));
  await db.delete(foodItems).where(eq(foodItems.userId, userId));
  await db.delete(campSpots).where(eq(campSpots.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

// ---------------------------------------------------------------------------
// Passwort vergessen: 6-stelliger Code, 15 Minuten gültig, max. 5 Versuche.
// In-Memory-Speicher genügt: Codes sind kurzlebig; bei Server-Neustart kann
// einfach ein neuer Code angefordert werden.
// ---------------------------------------------------------------------------

interface ResetEntry {
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

const resetCodes = new Map<string, ResetEntry>();
const RESET_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

/** Reset-Code für eine E-Mail erzeugen und speichern; gibt den Klartext-Code zurück. */
export async function createResetCode(email: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  resetCodes.set(normalizeEmail(email), {
    codeHash: await hashPassword(code),
    expiresAt: Date.now() + RESET_TTL_MS,
    attempts: 0,
  });
  return code;
}

/** Reset-Code prüfen. Gibt eine Fehlermeldung zurück oder null bei Erfolg. */
export async function verifyResetCode(email: string, code: string): Promise<string | null> {
  const key = normalizeEmail(email);
  const entry = resetCodes.get(key);
  if (!entry) return "Kein Code angefordert oder Code abgelaufen. Fordere einen neuen Code an.";
  if (Date.now() > entry.expiresAt) {
    resetCodes.delete(key);
    return "Der Code ist abgelaufen. Fordere einen neuen Code an.";
  }
  if (entry.attempts >= RESET_MAX_ATTEMPTS) {
    resetCodes.delete(key);
    return "Zu viele Fehlversuche. Fordere einen neuen Code an.";
  }
  entry.attempts += 1;
  const ok = await verifyPassword(code, entry.codeHash);
  if (!ok) return "Der Code ist falsch. Bitte prüfe deine Eingabe.";
  return null;
}

/** Reset-Code nach erfolgreicher Nutzung entwerten. */
export function consumeResetCode(email: string): void {
  resetCodes.delete(normalizeEmail(email));
}

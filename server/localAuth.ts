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


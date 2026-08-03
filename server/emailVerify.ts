import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { emailVerifyTokens, type EmailVerifyToken } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * E-Mail-Bestätigung per Link (Muster Passwort-Reset): Für jeden Versand wird
 * ein Token aus 32 Zufallsbytes (hex, 64 Zeichen) erzeugt. In der Datenbank
 * liegt nur der sha256-Hash – der Klartext steht ausschliesslich im
 * verschickten Link. Tokens sind 48 Stunden gültig; eine erfolgreiche
 * Bestätigung löscht alle Tokens des Kontos.
 */

export const VERIFY_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

/** Neues Bestätigungs-Token erzeugen (32 Zufallsbytes als Hex, 64 Zeichen). */
export function generateVerifyToken(): string {
  return randomBytes(32).toString("hex");
}

/** sha256-Hex eines Tokens – nur dieser Hash wird gespeichert. */
export function hashVerifyToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Zustand eines gespeicherten Tokens prüfen (reine Logik, testbar):
 * "expired" = abgelaufen, sonst "valid" (verwendete Tokens werden gelöscht,
 * einen used-Zustand gibt es deshalb nicht).
 */
export function verifyTokenState(
  entry: Pick<EmailVerifyToken, "expiresAt">,
  now: Date = new Date()
): "valid" | "expired" {
  return now.getTime() > entry.expiresAt.getTime() ? "expired" : "valid";
}

/**
 * Token für ein Konto anlegen und den Klartext zurückgeben (wird nur in den
 * E-Mail-Link eingesetzt, nie gespeichert). Ältere Tokens des Kontos werden
 * gelöscht – nach einer Adress-Änderung bestätigen alte Links nichts mehr.
 */
export async function createVerifyToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .delete(emailVerifyTokens)
    .where(eq(emailVerifyTokens.userId, userId));
  const token = generateVerifyToken();
  await db.insert(emailVerifyTokens).values({
    userId,
    tokenHash: hashVerifyToken(token),
    expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
  });
  return token;
}

/** Gespeicherten Eintrag zu einem Klartext-Token nachschlagen (über den Hash). */
export async function findVerifyToken(
  token: string
): Promise<EmailVerifyToken | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(emailVerifyTokens)
    .where(eq(emailVerifyTokens.tokenHash, hashVerifyToken(token)))
    .limit(1);
  return rows[0];
}

/** Alle Bestätigungs-Tokens eines Kontos löschen (nach erfolgreicher Bestätigung). */
export async function deleteVerifyTokens(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .delete(emailVerifyTokens)
    .where(eq(emailVerifyTokens.userId, userId));
}

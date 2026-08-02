import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import {
  passwordResetTokens,
  type PasswordResetToken,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Passwort-Reset per E-Mail-Link: Für jede Anfrage wird ein Token aus
 * 32 Zufallsbytes (hex, 64 Zeichen) erzeugt. In der Datenbank liegt nur der
 * sha256-Hash – der Klartext steht ausschliesslich im verschickten Link.
 * Tokens sind 60 Minuten gültig und einmalig verwendbar.
 */

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Neues Reset-Token erzeugen (32 Zufallsbytes als Hex, 64 Zeichen). */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** sha256-Hex eines Tokens – nur dieser Hash wird gespeichert. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Zustand eines gespeicherten Tokens prüfen (reine Logik, testbar):
 * "used" = bereits verwendet/entwertet, "expired" = abgelaufen, sonst "valid".
 */
export function resetTokenState(
  entry: Pick<PasswordResetToken, "expiresAt" | "usedAt">,
  now: Date = new Date()
): "valid" | "used" | "expired" {
  if (entry.usedAt) return "used";
  if (now.getTime() > entry.expiresAt.getTime()) return "expired";
  return "valid";
}

/**
 * Token für ein Konto anlegen und den Klartext zurückgeben
 * (wird nur in den E-Mail-Link eingesetzt, nie gespeichert).
 */
export async function createResetToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  const token = generateResetToken();
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });
  return token;
}

/** Gespeicherten Eintrag zu einem Klartext-Token nachschlagen (über den Hash). */
export async function findResetToken(
  token: string
): Promise<PasswordResetToken | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hashResetToken(token)))
    .limit(1);
  return rows[0];
}

/**
 * Nach erfolgreichem Reset alle offenen Tokens eines Kontos entwerten –
 * das verwendete und alle weiteren noch nicht genutzten.
 */
export async function consumeResetTokens(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt)
      )
    );
}

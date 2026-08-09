/**
 * Passkey-Anmeldung (WebAuthn) zusätzlich zum Passwort: Registrierung und
 * Login über @simplewebauthn/server. Die kurzlebigen Challenges leben
 * in-memory (Muster server/rateLimit.ts) – bei einem Neustart des Prozesses
 * beginnt der Client den Ablauf einfach neu, persistiert wird nichts.
 * Die rpID/Origin leiten sich aus APP_URL ab (Fallback: Request-Host bzw.
 * localhost im Dev-Betrieb) – stimmt APP_URL nicht mit der öffentlichen
 * Domain überein, verweigern Browser die Passkey-Nutzung.
 */
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { and, eq } from "drizzle-orm";
import { passkeys, type Passkey, type User } from "../drizzle/schema";
import { getDb } from "./db";

export const RP_NAME = "ReiseKompass";

// ---------------------------------------------------------------------------
// rpID/Origin-Ableitung – reine Funktionen (für Tests exportiert)
// ---------------------------------------------------------------------------

/**
 * rpID (Relying-Party-Id) = Hostname ohne Port: bevorzugt aus APP_URL,
 * sonst aus dem Request-Host, zuletzt «localhost» für den Dev-Betrieb.
 */
export function rpIdFrom(
  appUrl: string | undefined,
  requestHost: string | undefined
): string {
  if (appUrl) {
    try {
      return new URL(appUrl).hostname;
    } catch {
      // Kaputte APP_URL: unten weiter mit dem Request-Host
    }
  }
  if (requestHost) return requestHost.split(":")[0] || "localhost";
  return "localhost";
}

/**
 * Erwartete Origin des WebAuthn-Aufrufs: bevorzugt aus APP_URL, sonst aus
 * Protokoll + Request-Host, zuletzt der Vite-Dev-Server auf localhost.
 */
export function originFrom(
  appUrl: string | undefined,
  protocol: string | undefined,
  requestHost: string | undefined
): string {
  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      // Kaputte APP_URL: unten weiter mit dem Request-Host
    }
  }
  if (requestHost) return `${protocol || "https"}://${requestHost}`;
  return "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Challenge-Zwischenspeicher: kurzlebig in-memory, einmalig einlösbar
// ---------------------------------------------------------------------------

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

interface ChallengeEntry {
  /** Konto-Id bei der Registrierung; null beim (anonymen) Login */
  userId: number | null;
  expiresAt: number;
}

const challenges = new Map<string, ChallengeEntry>();

/** Abgelaufene Challenges entsorgen, damit die Map nicht unbegrenzt wächst. */
function pruneChallenges(now: number) {
  challenges.forEach((entry, key) => {
    if (entry.expiresAt <= now) challenges.delete(key);
  });
}

/** Challenge für 5 Minuten vormerken (Registrierung: mit Konto-Id). */
export function rememberChallenge(
  challenge: string,
  userId: number | null,
  now: number = Date.now()
): void {
  if (challenges.size > 1000) pruneChallenges(now);
  challenges.set(challenge, { userId, expiresAt: now + CHALLENGE_TTL_MS });
}

/**
 * Challenge einlösen: gibt den gespeicherten Eintrag genau einmal zurück
 * (danach gelöscht), null bei unbekannter oder abgelaufener Challenge.
 */
export function consumeChallenge(
  challenge: string,
  now: number = Date.now()
): { userId: number | null } | null {
  const entry = challenges.get(challenge);
  if (!entry) return null;
  challenges.delete(challenge);
  if (entry.expiresAt <= now) return null;
  return { userId: entry.userId };
}

/** Nur für Tests: alle gemerkten Challenges verwerfen. */
export function resetChallenges(): void {
  challenges.clear();
}

/**
 * Challenge aus dem clientDataJSON einer WebAuthn-Antwort lesen (Base64URL →
 * JSON), null bei kaputten Daten. Reine Funktion (für Tests exportiert).
 */
export function challengeFromClientData(
  clientDataJSON: unknown
): string | null {
  if (typeof clientDataJSON !== "string" || clientDataJSON.length === 0) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(clientDataJSON, "base64url").toString("utf8")
    ) as { challenge?: unknown };
    return typeof parsed.challenge === "string" && parsed.challenge.length > 0
      ? parsed.challenge
      : null;
  } catch {
    return null;
  }
}

/** Komma-Liste aus der DB zurück in ein Transports-Array (leer → undefined). */
function parseTransports(
  value: string | null
): AuthenticatorTransportsOf | undefined {
  if (!value) return undefined;
  const list = value
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);
  return list.length > 0 ? (list as AuthenticatorTransportsOf) : undefined;
}

type AuthenticatorTransportsOf = NonNullable<
  Parameters<typeof verifyAuthenticationResponse>[0]["credential"]["transports"]
>;

// ---------------------------------------------------------------------------
// Datenbank-Zugriffe
// ---------------------------------------------------------------------------

/** Alle Passkeys eines Kontos (älteste zuerst). */
export async function listPasskeys(userId: number): Promise<Passkey[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passkeys).where(eq(passkeys.userId, userId));
}

/** Passkey anhand der Base64URL-Credential-Id (undefined = unbekannt). */
export async function findPasskeyByCredentialId(
  credentialId: string
): Promise<Passkey | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.credentialId, credentialId))
    .limit(1);
  return rows[0];
}

/** Passkey eines Kontos löschen (fremde Ids sind ein No-op). */
export async function deletePasskey(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  await db
    .delete(passkeys)
    .where(and(eq(passkeys.id, id), eq(passkeys.userId, userId)));
}

// ---------------------------------------------------------------------------
// Registrierung
// ---------------------------------------------------------------------------

/**
 * Registrierungs-Optionen für ein eingeloggtes Konto erzeugen: bestehende
 * Passkeys werden über excludeCredentials ausgeschlossen (kein Duplikat auf
 * demselben Authenticator), die Challenge wird 5 Minuten vorgemerkt.
 */
export async function createRegistrationOptions(
  user: Pick<User, "id" | "name" | "email">,
  rpID: string
) {
  const existing = await listPasskeys(user.id);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    // Stabile Konto-Kennung auf dem Authenticator (nie die E-Mail als Id)
    userID: new TextEncoder().encode(`campmesser:${user.id}`),
    userName: user.email || user.name || `konto-${user.id}`,
    userDisplayName: user.name || user.email || "ReiseKompass",
    attestationType: "none",
    excludeCredentials: existing.map(p => ({
      id: p.credentialId,
      transports: parseTransports(p.transports),
    })),
    authenticatorSelection: {
      // Discoverable Credential bevorzugt → Login auch ganz ohne E-Mail
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
  rememberChallenge(options.challenge, user.id);
  return options;
}

/**
 * Registrierungs-Antwort des Browsers prüfen und den Passkey speichern.
 * Wirft bei abgelaufener Challenge oder fehlgeschlagener Verifikation.
 */
export async function verifyAndSavePasskey(
  userId: number,
  response: RegistrationResponseJSON,
  rpID: string,
  origin: string,
  name: string
): Promise<{ id: number; name: string }> {
  const challenge = challengeFromClientData(response.response?.clientDataJSON);
  const stored = challenge ? consumeChallenge(challenge) : null;
  if (!stored || stored.userId !== userId) {
    throw new Error("Die Passkey-Anfrage ist abgelaufen. Versuch es erneut.");
  }
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge!,
    expectedOrigin: origin,
    expectedRPID: rpID,
    // PIN/Biometrie ist erwünscht, aber nicht Pflicht (ältere Sticks)
    requireUserVerification: false,
  });
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Der Passkey konnte nicht bestätigt werden.");
  }
  const credential = verification.registrationInfo.credential;
  const db = await getDb();
  if (!db) throw new Error("Datenbank nicht verfügbar");
  const [result] = await db.insert(passkeys).values({
    userId,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports?.join(",") ?? null,
    name,
  });
  return { id: result.insertId, name };
}

// ---------------------------------------------------------------------------
// Anmeldung
// ---------------------------------------------------------------------------

/**
 * Login-Optionen erzeugen: mit bekannten Credentials (allowCredentials) des
 * Kontos zur E-Mail – oder ohne, dann bietet der Browser die auf dem Gerät
 * gespeicherten (discoverable) Passkeys an. Unbekannte E-Mails verhalten
 * sich wie «ohne», damit keine Konto-Existenz verraten wird.
 */
export async function createLoginOptions(
  email: string | undefined,
  rpID: string
) {
  let allowCredentials:
    { id: string; transports?: AuthenticatorTransportsOf }[] | undefined;
  if (email) {
    const { findUserByEmail } = await import("./localAuth");
    const user = await findUserByEmail(email);
    if (user) {
      const list = await listPasskeys(user.id);
      if (list.length > 0) {
        allowCredentials = list.map(p => ({
          id: p.credentialId,
          transports: parseTransports(p.transports),
        }));
      }
    }
  }
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  });
  rememberChallenge(options.challenge, null);
  return options;
}

/**
 * Login-Antwort des Browsers prüfen: Challenge einlösen, Signatur gegen den
 * gespeicherten öffentlichen Schlüssel verifizieren, Zähler fortschreiben.
 * Gibt das Konto zurück – die Session setzt der Router (wie beim Passwort).
 */
export async function verifyPasskeyLogin(
  response: AuthenticationResponseJSON,
  rpID: string,
  origin: string
): Promise<User> {
  const challenge = challengeFromClientData(response.response?.clientDataJSON);
  const stored = challenge ? consumeChallenge(challenge) : null;
  if (!stored) {
    throw new Error("Die Passkey-Anfrage ist abgelaufen. Versuch es erneut.");
  }
  const passkey =
    typeof response.id === "string"
      ? await findPasskeyByCredentialId(response.id)
      : undefined;
  if (!passkey) throw new Error("Unbekannter Passkey.");
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge!,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(Buffer.from(passkey.publicKey, "base64url")),
      counter: passkey.counter,
      transports: parseTransports(passkey.transports),
    },
    requireUserVerification: false,
  });
  if (!verification.verified) {
    throw new Error("Die Passkey-Anmeldung konnte nicht bestätigt werden.");
  }
  const db = await getDb();
  if (db) {
    await db
      .update(passkeys)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(passkeys.id, passkey.id));
  }
  const { findUserById } = await import("./localAuth");
  const user = await findUserById(passkey.userId);
  if (!user) throw new Error("Konto nicht gefunden.");
  return user;
}

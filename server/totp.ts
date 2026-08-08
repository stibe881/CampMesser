/**
 * Zwei-Faktor-Anmeldung per TOTP (#453): Einmalcodes nach RFC 6238
 * (HMAC-SHA-1, 30-Sekunden-Fenster, 6 Stellen) – kompatibel mit jeder
 * Authenticator-App. Bewusst OHNE zusätzliche Abhängigkeit: HOTP ist
 * eine Handvoll Zeilen über Node-crypto, und die RFC-Testvektoren
 * stehen als Tests daneben.
 *
 * Wiederherstellungs-Codes: acht Einmal-Codes, gespeichert werden nur
 * SHA-256-Hashes. Wer Handy UND Codes verliert, ist ausgesperrt – das
 * ist der Sinn der Sache, steht aber gross im UI.
 *
 * Passkeys (#122) bleiben unberührt: Ein Passkey ist bereits an das
 * Gerät gebunden und braucht keinen zweiten Faktor obendrauf. TOTP
 * schützt die Passwort-Anmeldung.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const TOTP_PERIOD_S = 30;
export const TOTP_DIGITS = 6;
/** Erlaubte Abweichung in Perioden (±1 = ±30 s Uhren-Drift). */
export const TOTP_WINDOW = 1;
export const RECOVERY_CODE_COUNT = 8;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Bytes als Base32 (RFC 4648, ohne Padding) – das Format der Apps. */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

/** Base32 zurück in Bytes; wirft bei unlesbaren Zeichen. */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("invalid base32 character");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Neues Geheimnis: 20 Zufalls-Bytes (160 Bit, RFC-Empfehlung für SHA-1). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** HOTP (RFC 4226): 6-stelliger Code aus Geheimnis und Zähler. */
export function hotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

/**
 * TOTP-Code prüfen (RFC 6238). ±TOTP_WINDOW Perioden gelten, damit eine
 * leicht falsch gehende Handy-Uhr niemanden aussperrt. Vergleich in
 * konstanter Zeit.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  nowMs: number,
  window: number = TOTP_WINDOW
): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(nowMs / 1000 / TOTP_PERIOD_S);
  const given = Buffer.from(normalized);
  for (let offset = -window; offset <= window; offset++) {
    const candidate = counter + offset;
    if (candidate < 0) continue;
    const expected = Buffer.from(hotp(secretBase32, candidate));
    if (expected.length === given.length && timingSafeEqual(expected, given)) {
      return true;
    }
  }
  return false;
}

/** otpauth-URL für den QR-Code der Authenticator-App. */
export function otpauthUrl(account: string, secretBase32: string): string {
  const issuer = "CampMesser";
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_S),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Wiederherstellungs-Code normalisieren (Bindestriche/Leerraum egal). */
export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, "");
}

/** Acht Einmal-Codes im Format XXXX-XXXX (Base32-Zeichen). */
export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = base32Encode(randomBytes(5)); // 8 Zeichen
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
}

/** Gespeichert wird nur der Hash – wie beim Passwort. */
export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}

/** Hash-Liste fürs Speichern in users.totpRecoveryJson. */
export function serializeRecoveryHashes(codes: string[]): string {
  return JSON.stringify(codes.map(hashRecoveryCode));
}

/**
 * Wiederherstellungs-Code einlösen: passt einer der Hashes, kommt die
 * um ihn bereinigte Liste zurück – jeder Code gilt genau einmal.
 */
export function consumeRecoveryCode(
  json: string | null,
  code: string
): { ok: boolean; nextJson: string } {
  let hashes: string[] = [];
  try {
    const parsed = JSON.parse(json ?? "[]");
    if (Array.isArray(parsed)) {
      hashes = parsed.filter((h): h is string => typeof h === "string");
    }
  } catch {
    // kaputte Daten = keine gültigen Codes
  }
  const hash = hashRecoveryCode(code);
  const index = hashes.indexOf(hash);
  if (index === -1) return { ok: false, nextJson: JSON.stringify(hashes) };
  const next = hashes.filter((_, i) => i !== index);
  return { ok: true, nextJson: JSON.stringify(next) };
}

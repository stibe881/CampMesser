/**
 * Teil-Links: gemeinsame Regeln fürs Ablaufdatum.
 *
 * Ein Teil-Link kann unbegrenzt gültig sein (kein Ablauf gespeichert) oder
 * nach 7, 30 bzw. 90 Tagen verfallen. Die Prüfung steckt bewusst in einer
 * reinen Funktion, damit Server (sharedGet-Prozeduren, OG-Injection) und
 * Client dieselbe Regel verwenden – abgelaufene Links verhalten sich überall
 * exakt wie unbekannte Tokens.
 */

/** Erlaubte Gültigkeitsdauern in Tagen (null = unbegrenzt). */
export const SHARE_EXPIRY_DAYS = [7, 30, 90] as const;

export type ShareExpiryDays = (typeof SHARE_EXPIRY_DAYS)[number];

/** Unbekannte Tageszahlen auf «unbegrenzt» zurückführen. */
export function sanitizeShareExpiryDays(
  value: unknown
): ShareExpiryDays | null {
  return SHARE_EXPIRY_DAYS.indexOf(value as ShareExpiryDays) >= 0
    ? (value as ShareExpiryDays)
    : null;
}

/**
 * Ablauf-Zeitpunkt aus einer Dauer berechnen; null (unbegrenzt) bleibt null.
 * Gerechnet wird in ganzen Tagen ab `now`.
 */
export function shareExpiryFromDays(
  days: ShareExpiryDays | null | undefined,
  now: Date = new Date()
): Date | null {
  const valid = sanitizeShareExpiryDays(days);
  if (valid === null) return null;
  return new Date(now.getTime() + valid * 24 * 60 * 60 * 1000);
}

/**
 * Ist der Teil-Link abgelaufen? null/undefined heisst «unbegrenzt gültig»
 * und ist nie abgelaufen. Ein unbrauchbarer Wert (kaputtes Datum) gilt
 * absichtlich als abgelaufen – im Zweifel wird der Link nicht herausgegeben.
 * Der Ablauf-Zeitpunkt selbst zählt bereits als abgelaufen.
 */
export function isShareExpired(
  expiresAt: Date | string | number | null | undefined,
  now: Date = new Date()
): boolean {
  if (expiresAt === null || expiresAt === undefined) return false;
  const ms = new Date(expiresAt).getTime();
  if (!Number.isFinite(ms)) return true;
  return ms <= now.getTime();
}

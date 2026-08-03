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

// ── Standort-Links (#221) ─────────────────────────────────────────────────

/**
 * Ein geteilter Standort ist etwas anderes als eine geteilte Packliste:
 * Er sagt, WO JEMAND GERADE IST. Deshalb gibt es hier bewusst KEINE
 * unbegrenzte Gültigkeit und keine Wochen-Dauern, sondern nur 1, 4 oder 24
 * Stunden – lange genug für einen Nachmittag, kurz genug, dass die eigene
 * Position nicht monatelang offen im Netz liegt.
 */
export const LOCATION_SHARE_EXPIRY_HOURS = [1, 4, 24] as const;

export type LocationShareExpiryHours =
  (typeof LOCATION_SHARE_EXPIRY_HOURS)[number];

/** Voreinstellung: 4 Stunden – ein Ausflug, kein Dauerabo. */
export const DEFAULT_LOCATION_SHARE_HOURS: LocationShareExpiryHours = 4;

/** Unbekannte Stundenzahlen auf die Voreinstellung zurückführen. */
export function sanitizeLocationShareHours(
  value: unknown
): LocationShareExpiryHours {
  return LOCATION_SHARE_EXPIRY_HOURS.indexOf(
    value as LocationShareExpiryHours
  ) >= 0
    ? (value as LocationShareExpiryHours)
    : DEFAULT_LOCATION_SHARE_HOURS;
}

/**
 * Ablauf-Zeitpunkt eines Standort-Links. Anders als bei
 * `shareExpiryFromDays` gibt es hier immer einen Ablauf – ein unbrauchbarer
 * Wert landet bei der Voreinstellung, nicht bei «unbegrenzt».
 */
export function locationShareExpiry(
  hours: unknown,
  now: Date = new Date()
): Date {
  const valid = sanitizeLocationShareHours(hours);
  return new Date(now.getTime() + valid * 60 * 60 * 1000);
}

/**
 * Alter eines Zeitstempels als Zahl + Einheit für `Intl.RelativeTimeFormat`
 * («vor 5 Minuten», «il y a 2 heures»). Der Wert ist NEGATIV, weil der
 * Zeitpunkt in der Vergangenheit liegt; unter einer Minute wird auf
 * «vor 0 Minuten» gerundet, damit nirgends Sekunden herumtropfen. Zukunft
 * (Uhren laufen auseinander) ergibt ebenfalls 0 Minuten.
 */
export function relativeAge(
  timestamp: Date | string | number,
  now: Date = new Date()
): { value: number; unit: "minute" | "hour" | "day" } {
  const ms = new Date(timestamp).getTime();
  if (!Number.isFinite(ms)) return { value: 0, unit: "minute" };
  const diffS = Math.max(0, (now.getTime() - ms) / 1000);
  // 0 statt -0 zurückgeben: -0 sieht in Tests und Vergleichen unnötig
  // seltsam aus, obwohl es rechnerisch dasselbe ist.
  const past = (n: number) => (n === 0 ? 0 : -n);
  if (diffS < 3600)
    return { value: past(Math.floor(diffS / 60)), unit: "minute" };
  if (diffS < 86400) {
    return { value: past(Math.floor(diffS / 3600)), unit: "hour" };
  }
  return { value: past(Math.floor(diffS / 86400)), unit: "day" };
}

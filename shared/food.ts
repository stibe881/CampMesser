/**
 * Haltbarkeits-Logik fürs Kühlbox-Inventar: Zustand und Resttage aus dem
 * Mindesthaltbarkeitsdatum ableiten. Reine Funktionen auf ISO-Daten (YYYY-MM-DD).
 */

export type ExpiryState = "expired" | "today" | "soon" | "ok";

export interface ExpiryInfo {
  state: ExpiryState;
  /** Tage bis zum Ablauf (negativ = bereits abgelaufen) */
  daysLeft: number;
  /** Kurztext für die Anzeige, z. B. «läuft heute ab» */
  label: string;
}

const DAY_MS = 86400000;
/** Ab so vielen Resttagen (einschliesslich) gilt ein Lebensmittel als «bald ablaufend». */
export const SOON_THRESHOLD_DAYS = 3;

function parseIsoDay(iso: string): number | null {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/** Haltbarkeits-Info zu einem MHD (null = kein Datum erfasst oder unlesbar). */
export function expiryInfo(
  expiryDate: string | null | undefined,
  today: string,
): ExpiryInfo | null {
  if (!expiryDate) return null;
  const expiry = parseIsoDay(expiryDate);
  const now = parseIsoDay(today);
  if (expiry === null || now === null) return null;
  const daysLeft = Math.round((expiry - now) / DAY_MS);
  if (daysLeft < 0) {
    const days = Math.abs(daysLeft);
    return {
      state: "expired",
      daysLeft,
      label: days === 1 ? "seit gestern abgelaufen" : `seit ${days} Tagen abgelaufen`,
    };
  }
  if (daysLeft === 0) return { state: "today", daysLeft, label: "läuft heute ab" };
  if (daysLeft <= SOON_THRESHOLD_DAYS) {
    return {
      state: "soon",
      daysLeft,
      label: daysLeft === 1 ? "läuft morgen ab" : `noch ${daysLeft} Tage`,
    };
  }
  return { state: "ok", daysLeft, label: `noch ${daysLeft} Tage` };
}

/**
 * Sortierschlüssel für «Verbrauche zuerst»: ablaufende Einträge zuerst
 * (früheste zuerst), Einträge ohne Datum ans Ende.
 */
export function expirySortKey(expiryDate: string | null | undefined): number {
  if (!expiryDate) return Number.MAX_SAFE_INTEGER;
  const t = parseIsoDay(expiryDate);
  return t === null ? Number.MAX_SAFE_INTEGER : t;
}

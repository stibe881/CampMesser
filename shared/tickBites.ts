/**
 * Zeckenstich-Merker (#179): reine Beobachtungs-Logik für erfasste Stiche.
 * Nach einem Zeckenstich lohnt es sich, die Einstichstelle rund zwei Wochen
 * im Auge zu behalten. Diese Datei rechnet nur mit ISO-Datumsstrings
 * (YYYY-MM-DD) – testbar ohne DB, keine Anzeigetexte, KEINE medizinische
 * Bewertung (die Hinweise stehen im Wörterbuch).
 */

/** Länge des Beobachtungsfensters in Tagen ab dem Stich. */
export const TICK_OBSERVATION_DAYS = 14;

/** Maximale Längen der Freitext-Felder (passend zur DB). */
export const MAX_TICK_BODY_PART_LENGTH = 80;
export const MAX_TICK_NOTE_LENGTH = 500;

/** Ein Stich, soweit für die Beobachtung relevant. */
export interface TickBiteLike {
  /** Datum des Stichs (ISO) */
  bitAt: string;
  /** Als erledigt abgehakt am (ISO); null = noch offen */
  resolvedAt?: string | null;
}

export interface TickObservationStatus {
  /**
   * Verbleibende Beobachtungstage (0 = Fenster abgelaufen oder erledigt).
   * Am Tag des Stichs sind es TICK_OBSERVATION_DAYS Tage.
   */
  daysLeft: number;
  /** Beobachtung abgeschlossen: abgehakt ODER Fenster abgelaufen. */
  done: boolean;
}

const DAY_MS = 86400000;

/** ISO-Datum in Millisekunden (UTC); null bei kaputten Werten. */
function parseIsoDay(iso: string | null | undefined): number | null {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/**
 * Beobachtungs-Stand eines Stichs am Stichtag `today`: das Fenster läuft
 * TICK_OBSERVATION_DAYS Tage ab dem Stich. Ein abgehakter Stich
 * (resolvedAt gesetzt) gilt sofort als erledigt; kaputte Daten gelten
 * defensiv als erledigt, damit nichts endlos in der Liste hängen bleibt.
 */
export function tickObservationStatus(
  bite: TickBiteLike,
  today: string
): TickObservationStatus {
  if (bite.resolvedAt) return { daysLeft: 0, done: true };
  const start = parseIsoDay(bite.bitAt);
  const now = parseIsoDay(today);
  if (start === null || now === null) return { daysLeft: 0, done: true };
  const elapsed = Math.round((now - start) / DAY_MS);
  const daysLeft = TICK_OBSERVATION_DAYS - elapsed;
  if (daysLeft <= 0) return { daysLeft: 0, done: true };
  return { daysLeft, done: false };
}

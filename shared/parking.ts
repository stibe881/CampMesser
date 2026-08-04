/**
 * Auto-Standort merken (#283).
 *
 * BEWUSSTE ENTSCHEIDUNG gegen ein eigenes Modul: Der Zelt-Finder kann seit
 * #64 beliebig viele benannte Ziele mit Kompass-Peilung – ein zweites
 * Modul mit derselben Mechanik wäre Doppelspurigkeit und hätte am Ende
 * einen eigenen, schlechteren Kompass. Neu ist deshalb nicht die Peilung,
 * sondern das, was am Auto anders ist als am Zelt:
 *
 * 1. EIN Knopf statt eines Formulars. Man steigt aus, tippt einmal, geht.
 *    Ein neuer Tipp überschreibt den alten Standort – zwei Autos an zwei
 *    Orten hat man nicht, und ein Dutzend alter «Auto (3)»-Ziele will
 *    niemand aufräumen.
 * 2. Die PARKZEIT. «Wo steht das Auto» ist die eine Frage, «wie lange
 *    steht es schon» die andere – bei einer Parkscheibe oder einem
 *    bezahlten Ticket ist sie die teurere.
 * 3. Eine NOTIZ. Im Parkhaus ist GPS wertlos; was zählt, ist «Ebene 3,
 *    Reihe C». Das kann kein Sensor wissen, nur die Person.
 *
 * Reine Funktionen ohne DOM, damit sie testbar bleiben.
 */

/** Notizlänge: «Ebene 3, Reihe C beim Lift» passt, ein Aufsatz nicht. */
export const PARKING_NOTE_MAX_LENGTH = 80;

/** Wählbare Parkzeit-Limiten in Minuten (null = ohne Limit). */
export const PARKING_LIMITS = [30, 60, 120, 180, 240] as const;

export type ParkingLimit = (typeof PARKING_LIMITS)[number];

/**
 * Vorwarnung: So viele Minuten vor Ablauf gilt die Parkzeit als «knapp».
 * Fünfzehn Minuten sind etwa das, was der Rückweg über einen Campingplatz
 * dauert – wer erst beim Ablauf gewarnt wird, kommt zu spät.
 */
export const PARKING_WARN_MINUTES = 15;

/** Unbekannte Limiten auf «ohne Limit» zurückführen. */
export function sanitizeParkingLimit(value: unknown): ParkingLimit | null {
  return PARKING_LIMITS.indexOf(value as ParkingLimit) >= 0
    ? (value as ParkingLimit)
    : null;
}

/** Notiz säubern: trimmen, kürzen, Zeilenumbrüche zu Leerzeichen. */
export function sanitizeParkingNote(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, PARKING_NOTE_MAX_LENGTH);
}

/** Wie lange steht das Auto schon? Negative Werte (Uhr verstellt) → 0. */
export function parkedMinutes(savedAt: number, now: number): number {
  if (!Number.isFinite(savedAt) || savedAt <= 0) return 0;
  return Math.max(0, Math.floor((now - savedAt) / 60_000));
}

export type ParkingState = "none" | "running" | "soon" | "expired";

export interface ParkingStatus {
  state: ParkingState;
  /** Verstrichene Minuten seit dem Parkieren. */
  elapsedMinutes: number;
  /** Verbleibende Minuten; null ohne Limit, 0 nach Ablauf. */
  remainingMinutes: number | null;
}

/**
 * Zustand der Parkuhr. Ohne Limit gibt es nur die verstrichene Zeit – ein
 * Ablauf, den niemand gesetzt hat, soll auch nicht erfunden werden.
 */
export function parkingStatus(
  savedAt: number,
  // Absichtlich `number`: Der gespeicherte Wert kommt aus localStorage bzw.
  // dem Geräte-Sync und ist erst nach sanitizeParkingLimit eine ParkingLimit
  limitMinutes: number | null | undefined,
  now: number
): ParkingStatus {
  const elapsedMinutes = parkedMinutes(savedAt, now);
  const limit = sanitizeParkingLimit(limitMinutes);
  if (limit === null) {
    return { state: "none", elapsedMinutes, remainingMinutes: null };
  }
  const remainingMinutes = Math.max(0, limit - elapsedMinutes);
  const state: ParkingState =
    remainingMinutes === 0
      ? "expired"
      : remainingMinutes <= PARKING_WARN_MINUTES
        ? "soon"
        : "running";
  return { state, elapsedMinutes, remainingMinutes };
}

/**
 * Dauer in Stunden und Minuten zerlegen – die Beschriftung selbst macht
 * die Sprachdatei, damit «2 h 05 min» überall gleich aussieht.
 */
export function splitDuration(minutes: number): {
  hours: number;
  minutes: number;
} {
  const total = Math.max(0, Math.floor(minutes));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

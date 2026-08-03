/**
 * Garantie-Erinnerung fürs Inventar: aus Kaufdatum und Garantiedauer (Monate)
 * wird das Garantie-Ende berechnet und eingeordnet. Reine Logik ohne DB –
 * Daten kommen als ISO-Strings (YYYY-MM-DD) aus der inventoryItems-Tabelle.
 */
import { addMonthsClamped } from "./gearTasks";

/** Erlaubte Bandbreite der Garantiedauer in Monaten (1 Monat bis 20 Jahre). */
export const MIN_WARRANTY_MONTHS = 1;
export const MAX_WARRANTY_MONTHS = 240;

/** Innerhalb dieser Frist vor dem Ablauf gilt eine Garantie als «läuft bald ab». */
export const WARRANTY_SOON_DAYS = 60;

const DAY_MS = 86400000;

/** Zustand einer Garantie am Stichtag. */
export type WarrantyState = "active" | "endingSoon" | "expired";

export interface WarrantyStatus {
  /** Letzter Tag der Garantie als ISO-Datum (YYYY-MM-DD). */
  endsOn: string;
  /** Tage bis zum Ablauf (0 = heute, negativ = bereits abgelaufen). */
  daysLeft: number;
  /** Einordnung: läuft, läuft in ≤ 60 Tagen ab, oder ist abgelaufen. */
  state: WarrantyState;
}

/** Ein Inventar-Eintrag, soweit für die Garantie relevant. */
export interface WarrantyItemLike {
  purchaseDate?: string | null;
  warrantyMonths?: number | null;
}

/**
 * Existiert dieser Kalendertag wirklich? `2025-13-40` erfüllt zwar das Muster,
 * würde aber beim Rechnen still in einen anderen Monat rutschen.
 */
function isRealDay(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso
  );
}

/**
 * Garantie-Status eines Gegenstands am Stichtag `today` (ISO-Datum).
 * Fehlende oder unbrauchbare Angaben (kein Kaufdatum, keine Dauer,
 * kaputte Datums-Strings) liefern null – dann gibt es schlicht nichts
 * anzuzeigen. Monats-Überläufe klemmen auf den letzten Tag des
 * Ziel-Monats (31.08. + 6 Monate → 28./29.02.).
 */
export function warrantyStatus(
  purchaseDate: string | null | undefined,
  warrantyMonths: number | null | undefined,
  today: string
): WarrantyStatus | null {
  if (!purchaseDate || !warrantyMonths) return null;
  if (!Number.isFinite(warrantyMonths)) return null;
  const months = Math.round(warrantyMonths);
  if (months < MIN_WARRANTY_MONTHS || months > MAX_WARRANTY_MONTHS) return null;
  if (!isRealDay(purchaseDate)) return null;
  const endsOn = addMonthsClamped(purchaseDate, months);
  if (!endsOn) return null;
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const endMs = Date.parse(`${endsOn}T00:00:00Z`);
  if (Number.isNaN(todayMs) || Number.isNaN(endMs)) return null;
  const daysLeft = Math.round((endMs - todayMs) / DAY_MS);
  const state: WarrantyState =
    daysLeft < 0
      ? "expired"
      : daysLeft <= WARRANTY_SOON_DAYS
        ? "endingSoon"
        : "active";
  return { endsOn, daysLeft, state };
}

/**
 * Wie viele Gegenstände laufen in den nächsten 60 Tagen ab (Zustand
 * «endingSoon»)? Basis für den Hinweis oben im Inventar.
 */
export function countWarrantiesEndingSoon(
  items: readonly WarrantyItemLike[],
  today: string
): number {
  let count = 0;
  items.forEach(item => {
    const status = warrantyStatus(
      item.purchaseDate,
      item.warrantyMonths,
      today
    );
    if (status?.state === "endingSoon") count += 1;
  });
  return count;
}

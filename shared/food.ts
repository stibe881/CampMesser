/**
 * Haltbarkeits-Logik fürs Kühlbox-Inventar: Zustand und Resttage aus dem
 * Mindesthaltbarkeitsdatum ableiten. Reine Funktionen auf ISO-Daten (YYYY-MM-DD).
 */
import { l4, pick, type Language } from "./i18n";

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

/** Anzeigetexte in allen vier Sprachen. */
const LABELS = {
  expiredYesterday: l4(
    "seit gestern abgelaufen",
    "périmé depuis hier",
    "scaduto da ieri",
    "expired since yesterday"
  ),
  expiredDays: (d: number) =>
    l4(
      `seit ${d} Tagen abgelaufen`,
      `périmé depuis ${d} jours`,
      `scaduto da ${d} giorni`,
      `expired ${d} days ago`
    ),
  today: l4(
    "läuft heute ab",
    "expire aujourd'hui",
    "scade oggi",
    "expires today"
  ),
  tomorrow: l4(
    "läuft morgen ab",
    "expire demain",
    "scade domani",
    "expires tomorrow"
  ),
  daysLeft: (d: number) =>
    l4(
      `noch ${d} Tage`,
      `encore ${d} jours`,
      `ancora ${d} giorni`,
      `${d} days left`
    ),
};

function parseIsoDay(iso: string): number | null {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : t;
}

/** Haltbarkeits-Info zu einem MHD (null = kein Datum erfasst oder unlesbar). */
export function expiryInfo(
  expiryDate: string | null | undefined,
  today: string,
  lang: Language = "de"
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
      label: pick(
        days === 1 ? LABELS.expiredYesterday : LABELS.expiredDays(days),
        lang
      ),
    };
  }
  if (daysLeft === 0)
    return { state: "today", daysLeft, label: pick(LABELS.today, lang) };
  if (daysLeft <= SOON_THRESHOLD_DAYS) {
    return {
      state: "soon",
      daysLeft,
      label: pick(
        daysLeft === 1 ? LABELS.tomorrow : LABELS.daysLeft(daysLeft),
        lang
      ),
    };
  }
  return {
    state: "ok",
    daysLeft,
    label: pick(LABELS.daysLeft(daysLeft), lang),
  };
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

/**
 * Ablaufdaten für Karten & Ausweise (#476): ACSI-Card, Vignette und
 * Ausweise laufen ab – und man merkt es klassisch erst an der Rezeption.
 * Hier stehen die Einstufung (gültig / läuft bald ab / abgelaufen) und
 * der Bau der Erinnerungs-Meldung. Reine Funktionen für Client, Server
 * und Tests.
 */

/** So viele Tage vor dem Ablauf beginnt «läuft bald ab». */
export const DOC_EXPIRY_WARN_DAYS = 30;

export type DocumentExpiryStatus = "ok" | "soon" | "expired";

export interface ExpiringDocumentLike {
  title: string;
  /** ISO-Datum YYYY-MM-DD; null = läuft nicht ab. */
  expiresOn: string | null;
}

/** Tage zwischen zwei ISO-Daten (b − a), auf ganze Tage gerundet. */
function daysBetween(a: string, b: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() -
      new Date(`${a}T00:00:00Z`).getTime()) /
      MS_PER_DAY
  );
}

/**
 * Einstufung eines Ablaufdatums am Stichtag: Der Ablauftag selbst gilt
 * noch als gültig («läuft bald ab») – abgelaufen ist erst der Tag danach.
 * null (kein Datum) ergibt null: nichts anzuzeigen.
 */
export function documentExpiryStatus(
  expiresOn: string | null | undefined,
  today: string
): DocumentExpiryStatus | null {
  if (!expiresOn) return null;
  const days = daysBetween(today, expiresOn);
  if (days < 0) return "expired";
  if (days <= DOC_EXPIRY_WARN_DAYS) return "soon";
  return "ok";
}

/**
 * Karten, die eine Erinnerung verdienen (abgelaufen oder innert
 * DOC_EXPIRY_WARN_DAYS ablaufend), nach Ablaufdatum sortiert.
 */
export function expiringDocuments<T extends ExpiringDocumentLike>(
  cards: readonly T[],
  today: string
): T[] {
  return cards
    .filter(card => {
      const status = documentExpiryStatus(card.expiresOn, today);
      return status === "soon" || status === "expired";
    })
    .sort((a, b) => (a.expiresOn ?? "").localeCompare(b.expiresOn ?? ""));
}

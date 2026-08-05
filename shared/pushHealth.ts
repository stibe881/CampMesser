/**
 * Beurteilung des letzten Cron-Laufs (#314).
 *
 * Der Zeitstempel allein sagt nichts: «11:04 Uhr» ist beruhigend oder
 * alarmierend, je nachdem, welcher Tag heute ist. Diese Funktion macht
 * daraus die eine Aussage, die zählt – läuft die Prüfung noch?
 */

/** Der Cronjob läuft stündlich; ab hier stimmt etwas nicht. */
export const PUSH_CHECK_STALE_HOURS = 6;

export type PushCheckHealth =
  /** Noch nie gelaufen – der Cronjob ist vermutlich nie eingerichtet worden. */
  | { state: "never" }
  /** Innerhalb der Frist gelaufen. */
  | { state: "ok"; minutesAgo: number }
  /** Überfällig: seit über PUSH_CHECK_STALE_HOURS Stunden nichts mehr. */
  | { state: "stale"; minutesAgo: number };

/**
 * @param at ISO-Zeitstempel des letzten erfolgreichen Laufs oder null
 * @param now aktuelle Zeit in Millisekunden (zum Testen übergebbar)
 */
export function pushCheckHealth(
  at: string | null | undefined,
  now: number
): PushCheckHealth {
  if (!at) return { state: "never" };
  const stamp = Date.parse(at);
  if (Number.isNaN(stamp)) return { state: "never" };
  // Eine Uhr, die vorgeht, darf nicht zu «vor -3 Minuten» führen.
  const minutesAgo = Math.max(0, Math.round((now - stamp) / 60000));
  return minutesAgo >= PUSH_CHECK_STALE_HOURS * 60
    ? { state: "stale", minutesAgo }
    : { state: "ok", minutesAgo };
}

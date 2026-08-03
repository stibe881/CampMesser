/**
 * Schnitzeljagd-Bestzeiten: reine Logik rund um die Stoppuhr im Hunt-Player.
 * Pro Jagd (Player-Id, eingebaute UND eigene «eigene-<id>») wird die beste
 * Zeit in Sekunden behalten. Persistiert in localStorage und über den
 * Geräte-Sync (useSyncedSetting, Muster knotProgress).
 */

/** localStorage-Schlüssel der Bestzeiten. */
export const HUNT_BEST_TIMES_KEY = "campmesser.huntBestTimes";

/** Obergrenze erfasster Jagden – schützt localStorage und den Sync-Payload. */
export const MAX_TRACKED_HUNTS = 200;

/** Obergrenze einer plausiblen Zeit: 24 h – alles darüber wird verworfen. */
export const MAX_HUNT_SECONDS = 24 * 60 * 60;

/** Bestzeit in Sekunden pro Jagd-Id. */
export type HuntBestTimes = Record<string, number>;

/**
 * Eine fertig gespielte Jagd festhalten – gibt die neuen Bestzeiten und
 * zurück, ob die Zeit eine neue Bestzeit ist (auch beim ersten Durchgang).
 * Unplausible Zeiten (<= 0, nicht ganzzahlig, > 24 h) ändern nichts.
 */
export function recordHuntTime(
  times: HuntBestTimes,
  huntId: string,
  seconds: number
): { times: HuntBestTimes; isNewBest: boolean } {
  if (
    !huntId ||
    !Number.isInteger(seconds) ||
    seconds <= 0 ||
    seconds > MAX_HUNT_SECONDS
  ) {
    return { times, isNewBest: false };
  }
  const previous = times[huntId];
  if (previous !== undefined && previous <= seconds) {
    return { times, isNewBest: false };
  }
  return { times: { ...times, [huntId]: seconds }, isNewBest: true };
}

/** Sekunden als «mm:ss» formatieren (über 99 Minuten wächst der Minutenteil). */
export function formatHuntSeconds(seconds: number): string {
  const clean = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clean / 60);
  const rest = clean % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/**
 * Unbekannte Daten (localStorage/Geräte-Sync) defensiv in saubere Bestzeiten
 * überführen: nur ganzzahlige Sekunden im plausiblen Bereich, Anzahl gekappt.
 */
export function sanitizeHuntBestTimes(value: unknown): HuntBestTimes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: HuntBestTimes = {};
  let count = 0;
  for (const [huntId, raw] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (count >= MAX_TRACKED_HUNTS) break;
    if (
      !huntId ||
      typeof raw !== "number" ||
      !Number.isInteger(raw) ||
      raw <= 0 ||
      raw > MAX_HUNT_SECONDS
    ) {
      continue;
    }
    result[huntId] = raw;
    count++;
  }
  return result;
}

/** Bestzeiten aus localStorage laden (defensiv – kaputte Werte ergeben {}). */
export function loadHuntBestTimes(): HuntBestTimes {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(HUNT_BEST_TIMES_KEY);
    return raw ? sanitizeHuntBestTimes(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/** Bestzeiten in localStorage schreiben (Fehler wie volle Quota ignorieren). */
export function storeHuntBestTimes(times: HuntBestTimes): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(HUNT_BEST_TIMES_KEY, JSON.stringify(times));
  } catch {
    /* Quota voll o. Ä. – der Geräte-Sync gleicht es später aus */
  }
}

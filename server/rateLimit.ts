/**
 * Einfaches In-Memory-Rate-Limiting für Anmeldeversuche: schützt die
 * Passwort-Anmeldung vor Brute-Force. Zustand lebt im Prozess – für das
 * Selbst-Hosting mit einer einzelnen Node-Instanz ausreichend.
 */

const WINDOW_MS = 15 * 60 * 1000;
export const MAX_LOGIN_ATTEMPTS = 10;

interface Bucket {
  count: number;
  firstAt: number;
}

const buckets = new Map<string, Bucket>();

/** Abgelaufene Fenster entsorgen, damit die Map nicht unbegrenzt wächst. */
function prune(now: number) {
  buckets.forEach((bucket, key) => {
    if (now - bucket.firstAt > WINDOW_MS) buckets.delete(key);
  });
}

/** Ist dieser Schlüssel (z. B. E-Mail+IP) aktuell gesperrt? */
export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  if (now - bucket.firstAt > WINDOW_MS) {
    buckets.delete(key);
    return false;
  }
  return bucket.count >= MAX_LOGIN_ATTEMPTS;
}

/** Fehlversuch registrieren. */
export function registerFailure(key: string, now: number = Date.now()): void {
  if (buckets.size > 10000) prune(now);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.firstAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAt: now });
    return;
  }
  bucket.count += 1;
}

/** Fehlversuche löschen (nach erfolgreicher Anmeldung). */
export function clearFailures(key: string): void {
  buckets.delete(key);
}

/** Verbleibende Sperrzeit in Minuten (aufgerundet, mind. 1). */
export function lockoutMinutes(key: string, now: number = Date.now()): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  const remainingMs = WINDOW_MS - (now - bucket.firstAt);
  return Math.max(1, Math.ceil(remainingMs / 60000));
}

/** Nur für Tests: gesamten Zustand zurücksetzen. */
export function resetRateLimits(): void {
  buckets.clear();
}

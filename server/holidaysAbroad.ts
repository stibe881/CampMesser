/**
 * Feiertage des Reiselands (#539): Fällt ein Feiertag in die Reise, sind
 * Läden zu und Strassen voll – das will man VOR der Abreise wissen. Die
 * CH-Feiertage kennt die App seit #70; hier geht es ums Ausland.
 *
 * Quelle ist die offene Nager.Date-API (ohne Schlüssel, ohne Limit,
 * Jahresliste pro Land). Gecacht wird pro Land und Jahr eine Woche –
 * Feiertage ändern sich nicht, und bei einem Ausfall reicht der letzte
 * bekannte Stand allemal (Muster ecbRates.ts).
 */

const NAGER_URL = "https://date.nager.at/api/v3/PublicHolidays";

/** Zeitlimit des Abrufs: lieber ohne Hinweis als mit hängendem Cockpit. */
const FETCH_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface PublicHoliday {
  /** ISO-Tag des Feiertags. */
  date: string;
  /** Name in der Landessprache («Ferragosto»). */
  localName: string;
  /** Englischer Name als Rückfall («Assumption Day»). */
  name: string;
}

interface CacheEntry {
  fetchedAt: number;
  value: PublicHoliday[];
}

/** Ein Eintrag pro Land+Jahr. */
const cache = new Map<string, CacheEntry>();

/** Nur für Tests: Zwischenspeicher leeren. */
export function clearHolidaysCache(): void {
  cache.clear();
}

/**
 * Nager-Antwort auf das Nötigste reduzieren. Regionale Feiertage
 * (global=false, nur einzelne counties) fliegen raus – ein Hinweis auf
 * einen Feiertag, der am Reiseort gar nicht gilt, wäre falscher Alarm.
 */
export function parseNagerHolidays(json: unknown): PublicHoliday[] {
  if (!Array.isArray(json)) return [];
  const clean: PublicHoliday[] = [];
  for (const entry of json) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
      typeof e.localName !== "string" ||
      e.global !== true
    )
      continue;
    clean.push({
      date: e.date,
      localName: e.localName,
      name: typeof e.name === "string" ? e.name : e.localName,
    });
  }
  return clean;
}

/** Feiertage einer Liste auf den Reisezeitraum einschränken, sortiert. */
export function holidaysInRange(
  holidays: readonly PublicHoliday[],
  from: string,
  to: string
): PublicHoliday[] {
  return holidays
    .filter(h => h.date >= from && h.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function holidaysForYear(
  country: string,
  year: number
): Promise<PublicHoliday[] | null> {
  const key = `${country}:${year}`;
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) return cached.value;
  try {
    const res = await fetch(`${NAGER_URL}/${year}/${country}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`nager ${res.status}`);
    const value = parseNagerHolidays(await res.json());
    cache.set(key, { fetchedAt: now, value });
    return value;
  } catch {
    return cached?.value ?? null;
  }
}

/**
 * Landesweite Feiertage im Zeitraum [from, to]; null, wenn die Quelle
 * nicht erreichbar ist UND nichts im Zwischenspeicher liegt – dann zeigt
 * das Cockpit schlicht keinen Hinweis, statt «keine Feiertage» zu
 * behaupten.
 */
export async function getHolidaysAbroad(
  country: string,
  from: string,
  to: string
): Promise<PublicHoliday[] | null> {
  const code = country.toUpperCase();
  const years = Array.from(
    new Set([Number(from.slice(0, 4)), Number(to.slice(0, 4))])
  ).filter(y => Number.isInteger(y) && y >= 2000 && y <= 2100);
  if (years.length === 0) return [];
  const results = await Promise.all(years.map(y => holidaysForYear(code, y)));
  if (results.some(r => r === null)) return null;
  return holidaysInRange(
    results.flatMap(r => r ?? []),
    from,
    to
  );
}

/**
 * Schulferien & Feiertage für einen Kanton laden (OpenHolidays-API) – mit
 * einfachem Cache: in-Memory pro Sitzung plus localStorage für ~1 Tag, damit
 * die API pro Kanton und Zeitraum höchstens einmal täglich angefragt wird.
 * Fehler führen zu null – der Trip-Planer lässt die Hinweise dann einfach weg.
 */
import {
  countryPublicHolidaysUrl,
  parseHolidaysResponse,
  parseNationwideHolidays,
  publicHolidaysUrl,
  schoolHolidaysUrl,
  type Holiday,
} from "@shared/holidays";

export interface CantonHolidays {
  school: Holiday[];
  publicHolidays: Holiday[];
}

/** Cache-Lebensdauer: ein Tag. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "campmesser.holidayCache.";

interface CacheEntry {
  fetchedAt: number;
  school: Holiday[];
  publicHolidays: Holiday[];
}

const memoryCache = new Map<string, CantonHolidays>();

/**
 * Abgedeckter Zeitraum: laufendes plus nächstes Kalenderjahr – deckt alle
 * realistisch geplanten Aufenthalte ab und ergibt einen stabilen Cache-Key.
 */
export function holidayRange(now: Date): {
  validFrom: string;
  validTo: string;
} {
  const year = now.getFullYear();
  return { validFrom: `${year}-01-01`, validTo: `${year + 1}-12-31` };
}

function readStoredEntry(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    if (
      typeof parsed.fetchedAt === "number" &&
      Array.isArray(parsed.school) &&
      Array.isArray(parsed.publicHolidays)
    ) {
      return parsed as CacheEntry;
    }
  } catch {
    // defekter Eintrag – ignorieren, wird neu geladen
  }
  return null;
}

/**
 * Ferien und Feiertage für den Kanton laden. Liefert null bei jedem Fehler
 * (Netz, API, ungültige Antwort) – bewusst still, kein Blockieren der Seite.
 */
export async function loadCantonHolidays(
  cantonCode: string,
  now = new Date()
): Promise<CantonHolidays | null> {
  const { validFrom, validTo } = holidayRange(now);
  const cacheKey = `${CACHE_KEY_PREFIX}${cantonCode}.${validFrom.slice(0, 4)}`;

  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  const stored = readStoredEntry(cacheKey);
  if (stored && now.getTime() - stored.fetchedAt < CACHE_TTL_MS) {
    const result: CantonHolidays = {
      school: stored.school,
      publicHolidays: stored.publicHolidays,
    };
    memoryCache.set(cacheKey, result);
    return result;
  }

  try {
    const [schoolRes, publicRes] = await Promise.all([
      fetch(schoolHolidaysUrl(cantonCode, validFrom, validTo)),
      fetch(publicHolidaysUrl(cantonCode, validFrom, validTo)),
    ]);
    if (!schoolRes.ok || !publicRes.ok) return null;
    const result: CantonHolidays = {
      school: parseHolidaysResponse(await schoolRes.json()),
      publicHolidays: parseHolidaysResponse(await publicRes.json()),
    };
    memoryCache.set(cacheKey, result);
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          fetchedAt: now.getTime(),
          school: result.school,
          publicHolidays: result.publicHolidays,
        } satisfies CacheEntry)
      );
    } catch {
      // Speicher voll/blockiert – der In-Memory-Cache reicht für die Sitzung
    }
    return result;
  } catch {
    return null;
  }
}

/** In-Memory-Cache der Zielland-Feiertage (#469), Key: Land + Jahr. */
const countryMemoryCache = new Map<string, Holiday[]>();

interface CountryCacheEntry {
  fetchedAt: number;
  holidays: Holiday[];
}

/**
 * Landesweite Feiertage eines Ziellandes laden (#469) – gleiches Cache-
 * Muster wie beim Kanton: in-Memory pro Sitzung plus localStorage für
 * ~1 Tag. Fehler ergeben null, die Hinweise bleiben dann einfach weg.
 */
export async function loadCountryHolidays(
  countryCode: string,
  now = new Date()
): Promise<Holiday[] | null> {
  const { validFrom, validTo } = holidayRange(now);
  const cacheKey = `${CACHE_KEY_PREFIX}land.${countryCode}.${validFrom.slice(0, 4)}`;

  const cached = countryMemoryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CountryCacheEntry>;
      if (
        typeof parsed.fetchedAt === "number" &&
        Array.isArray(parsed.holidays) &&
        now.getTime() - parsed.fetchedAt < CACHE_TTL_MS
      ) {
        countryMemoryCache.set(cacheKey, parsed.holidays);
        return parsed.holidays;
      }
    }
  } catch {
    // defekter Eintrag – ignorieren, wird neu geladen
  }

  try {
    const res = await fetch(
      countryPublicHolidaysUrl(countryCode, validFrom, validTo)
    );
    if (!res.ok) return null;
    const holidays = parseNationwideHolidays(await res.json());
    countryMemoryCache.set(cacheKey, holidays);
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          fetchedAt: now.getTime(),
          holidays,
        } satisfies CountryCacheEntry)
      );
    } catch {
      // Speicher voll/blockiert – der In-Memory-Cache reicht für die Sitzung
    }
    return holidays;
  } catch {
    return null;
  }
}

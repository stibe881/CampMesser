/**
 * Zelt-Finder: mehrere benannte Ziele (Zelt, Duschen, Abwaschstelle …).
 * Reine Logik – Validierung unbekannter Daten (localStorage/Server-Sync) und
 * Migration des alten Einzel-Ziels. Ohne DOM-Abhängigkeiten, damit testbar.
 */

/** localStorage-Schlüssel der benannten Ziel-Liste. */
export const TARGETS_KEY = "campmesser.tentFinderTargets";
/** Alter Schlüssel des einzelnen gemerkten Standorts (wird migriert). */
export const LEGACY_TARGET_KEY = "campmesser.tentFinderTarget";

/** Obergrenzen – schützen localStorage und den Geräte-Sync-Payload. */
export const MAX_TARGETS = 50;
export const MAX_NAME_LENGTH = 60;

export interface TentFinderTarget {
  id: string;
  name: string;
  lat: number;
  lon: number;
  savedAt: number;
}

function isValidCoords(lat: unknown, lon: unknown): lat is number {
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    typeof lon === "number" &&
    Number.isFinite(lon) &&
    Math.abs(lon) <= 180
  );
}

/**
 * Unbekannte Daten in eine saubere Ziel-Liste überführen: nur Einträge mit
 * nicht-leerem Namen und gültigen Koordinaten, Namen getrimmt und gekürzt,
 * doppelte ids verworfen, fehlende ids deterministisch ergänzt.
 */
export function sanitizeTargets(value: unknown): TentFinderTarget[] {
  if (!Array.isArray(value)) return [];
  const result: TentFinderTarget[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < value.length && result.length < MAX_TARGETS; i++) {
    const entry = value[i] as Partial<TentFinderTarget> | null;
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.name !== "string") continue;
    const name = entry.name.trim().slice(0, MAX_NAME_LENGTH);
    if (!name) continue;
    if (!isValidCoords(entry.lat, entry.lon)) continue;
    const savedAt =
      typeof entry.savedAt === "number" && Number.isFinite(entry.savedAt)
        ? entry.savedAt
        : 0;
    const id =
      typeof entry.id === "string" && entry.id
        ? entry.id
        : `target-${savedAt}-${i}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    result.push({
      id,
      name,
      lat: entry.lat as number,
      lon: entry.lon as number,
      savedAt,
    });
  }
  return result;
}

/**
 * Gespeicherte Liste laden und – falls der alte Einzel-Ziel-Schlüssel noch
 * existiert – dessen Standort als benanntes Ziel (z. B. «Zelt») übernehmen.
 * `changed` heisst: Liste neu schreiben und den alten Schlüssel löschen.
 */
export function migrateTargets(
  rawTargets: string | null,
  rawLegacy: string | null,
  legacyName: string
): { targets: TentFinderTarget[]; changed: boolean } {
  let targets: TentFinderTarget[] = [];
  try {
    targets = sanitizeTargets(rawTargets ? JSON.parse(rawTargets) : []);
  } catch {
    targets = [];
  }
  if (rawLegacy === null) return { targets, changed: false };
  try {
    const parsed = JSON.parse(rawLegacy) as {
      lat?: unknown;
      lon?: unknown;
      savedAt?: unknown;
    } | null;
    if (
      parsed &&
      typeof parsed === "object" &&
      isValidCoords(parsed.lat, parsed.lon) &&
      targets.length < MAX_TARGETS
    ) {
      const savedAt =
        typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt)
          ? parsed.savedAt
          : 0;
      targets = [
        ...targets,
        {
          id: `legacy-${savedAt}`,
          name: legacyName.trim().slice(0, MAX_NAME_LENGTH) || "?",
          lat: parsed.lat as number,
          lon: parsed.lon as number,
          savedAt,
        },
      ];
    }
  } catch {
    /* kaputter Alt-Wert: nur aufräumen, nichts übernehmen */
  }
  return { targets, changed: true };
}

/** Neue, praktisch kollisionsfreie Ziel-id (crypto.randomUUID mit Fallback). */
export function newTargetId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

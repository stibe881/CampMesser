/**
 * Zelt-Finder: mehrere benannte Ziele (Zelt, Duschen, Abwaschstelle …).
 * Reine Logik – Validierung unbekannter Daten (localStorage/Server-Sync) und
 * Migration des alten Einzel-Ziels. Ohne DOM-Abhängigkeiten, damit testbar.
 */
import { sanitizeParkingLimit, sanitizeParkingNote } from "@shared/parking";

/** localStorage-Schlüssel der benannten Ziel-Liste. */
export const TARGETS_KEY = "campmesser.tentFinderTargets";
/** Alter Schlüssel des einzelnen gemerkten Standorts (wird migriert). */
export const LEGACY_TARGET_KEY = "campmesser.tentFinderTarget";

/** Obergrenzen – schützen localStorage und den Geräte-Sync-Payload. */
export const MAX_TARGETS = 50;
export const MAX_NAME_LENGTH = 60;

/** Feste Symbol-Liste für Ziele – nur diese Schlüssel werden gespeichert. */
export const TARGET_ICONS = [
  "tent",
  "shower",
  "wc",
  "water",
  "playground",
  "reception",
  "car",
  "waste",
  "other",
] as const;

export type TargetIcon = (typeof TARGET_ICONS)[number];

/** Rückfall-Symbol für Unbekanntes und für Ziele ohne eigene Wahl. */
export const DEFAULT_TARGET_ICON: TargetIcon = "other";

/** Unbekannte Symbol-Werte auf «other» zurückführen. */
export function sanitizeTargetIcon(value: unknown): TargetIcon {
  return TARGET_ICONS.indexOf(value as TargetIcon) >= 0
    ? (value as TargetIcon)
    : DEFAULT_TARGET_ICON;
}

export interface TentFinderTarget {
  id: string;
  name: string;
  lat: number;
  lon: number;
  savedAt: number;
  /** Symbol für Liste, Kompass-Kopf und Karten-Pin (optional – Alt-Ziele). */
  icon?: TargetIcon;
  /**
   * Freie Notiz zum Ziel (#283): «Ebene 3, Reihe C». Im Parkhaus ist GPS
   * wertlos, und die Ebene weiss nur die Person, die ausgestiegen ist.
   */
  note?: string;
  /** Parkzeit-Limite in Minuten (#283); fehlt = ohne Limit. */
  parkingLimitMinutes?: number;
}

/**
 * Symbol-Glyphen als reines SVG-Markup für einen 28×28-Kreis mit Mittelpunkt
 * 14/14 – weiss auf farbigem Grund. Bewusst ohne Bild-Assets und ohne
 * Schriftarten-Abhängigkeit, damit die Karten-Pins auch offline stimmen.
 */
const TARGET_ICON_GLYPHS: Record<TargetIcon, string> = {
  tent: `<path d="M14 7 20.5 20h-4.7L14 16.2 12.2 20H7.5Z" fill="#ffffff"/>`,
  shower:
    `<path d="M14 6.5v3.2" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>` +
    `<path d="M8.6 13.2a5.4 5.4 0 0 1 10.8 0Z" fill="#ffffff"/>` +
    `<circle cx="10.8" cy="17.2" r="1.15" fill="#ffffff"/><circle cx="14" cy="19" r="1.15" fill="#ffffff"/><circle cx="17.2" cy="17.2" r="1.15" fill="#ffffff"/>`,
  wc:
    `<path d="M9.5 8.4h9" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>` +
    `<path d="M10.4 10.6h7.2l-.9 7.6a1.2 1.2 0 0 1-1.2 1h-3a1.2 1.2 0 0 1-1.2-1Z" fill="#ffffff"/>`,
  water: `<path d="M14 6.6c3.1 3.7 4.9 6.2 4.9 8.3a4.9 4.9 0 0 1-9.8 0c0-2.1 1.8-4.6 4.9-8.3Z" fill="#ffffff"/>`,
  playground:
    `<path d="M7.5 19.5 14 8l6.5 11.5" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M14 9.5v4.4" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>` +
    `<circle cx="14" cy="15.6" r="1.9" fill="#ffffff"/>`,
  reception:
    `<circle cx="14" cy="8.9" r="1.5" fill="#ffffff"/>` +
    `<rect x="12.7" y="11.4" width="2.6" height="7.6" rx="1.3" fill="#ffffff"/>`,
  car:
    `<path d="M7.6 17.2v-2.6l1.7-3.5h9.4l1.7 3.5v2.6h-2.2v-1.5H9.8v1.5Z" fill="#ffffff"/>` +
    `<circle cx="10.7" cy="17.6" r="1.3" fill="#ffffff"/><circle cx="17.3" cy="17.6" r="1.3" fill="#ffffff"/>`,
  waste:
    `<path d="M8.6 9.6h10.8" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>` +
    `<path d="M12 9.6V8.2h4v1.4" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M9.9 11.4h8.2l-.8 7.4a1.2 1.2 0 0 1-1.2 1.1h-4.2a1.2 1.2 0 0 1-1.2-1.1Z" fill="#ffffff"/>`,
  other:
    `<circle cx="14" cy="14" r="3" fill="#ffffff"/>` +
    `<path d="M14 5.5v4M14 18.5v4M5.5 14h4M18.5 14h4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,
};

/** SVG-Glyph eines Ziels – ohne (oder mit unbekanntem) Symbol das Fadenkreuz. */
export function targetIconGlyph(icon: TargetIcon | undefined): string {
  return TARGET_ICON_GLYPHS[sanitizeTargetIcon(icon)];
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
      // Ohne Symbol bleibt das Feld weg (Alt-Ziele); ein vorhandener, aber
      // unbekannter Wert wird auf «other» zurechtgebogen.
      ...(entry.icon === undefined || entry.icon === null
        ? {}
        : { icon: sanitizeTargetIcon(entry.icon) }),
      // Notiz und Parkzeit (#283) nur übernehmen, wenn sie brauchbar sind –
      // ein leerer String wäre eine Notiz, die es nicht gibt
      ...(sanitizeParkingNote(entry.note)
        ? { note: sanitizeParkingNote(entry.note) }
        : {}),
      ...(sanitizeParkingLimit(entry.parkingLimitMinutes) !== null
        ? {
            parkingLimitMinutes: sanitizeParkingLimit(
              entry.parkingLimitMinutes
            ) as number,
          }
        : {}),
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

/**
 * Ziel umbenennen: neuer Name wird wie beim Anlegen validiert (trimmen,
 * auf MAX_NAME_LENGTH kürzen, leer verboten). Ist `icon` gesetzt, wird auch
 * das Symbol übernommen (unbekannte Werte werden zu «other»); ohne Angabe
 * bleibt das bisherige Symbol stehen. Liefert eine NEUE Liste mit dem
 * umbenannten Ziel – oder null, wenn der Name (nach Trimmen) leer ist
 * oder kein Ziel mit dieser id existiert. Die Eingabe bleibt unverändert.
 */
export function renameTarget(
  targets: TentFinderTarget[],
  id: string,
  name: string,
  icon?: TargetIcon
): TentFinderTarget[] | null {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (!trimmed) return null;
  if (!targets.some(t => t.id === id)) return null;
  return targets.map(t =>
    t.id === id
      ? {
          ...t,
          name: trimmed,
          ...(icon === undefined ? {} : { icon: sanitizeTargetIcon(icon) }),
        }
      : t
  );
}

/** Neue, praktisch kollisionsfreie Ziel-id (crypto.randomUUID mit Fallback). */
export function newTargetId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Auto-Standort merken (#283) ───────────────────────────────────────────

/**
 * Feste id des Auto-Ziels. Bewusst KEINE zufällige id: Es gibt genau ein
 * Auto, ein neuer Tipp auf «hier parkiert» überschreibt den alten Standort.
 * Ein Dutzend Ziele namens «Auto (3)» will niemand aufräumen.
 */
export const CAR_TARGET_ID = "car-parked";

/** Das gemerkte Auto aus der Ziel-Liste (undefined = nirgends parkiert). */
export function findCarTarget(
  targets: TentFinderTarget[]
): TentFinderTarget | undefined {
  return targets.find(t => t.id === CAR_TARGET_ID);
}

/**
 * Auto-Standort setzen oder ersetzen. Notiz und Parkzeit werden vom
 * bisherigen Eintrag NICHT übernommen: Wer neu parkiert, steht woanders,
 * und «Ebene 3, Reihe C» von gestern wäre dort schlicht falsch.
 */
export function parkCar(
  targets: TentFinderTarget[],
  position: {
    lat: number;
    lon: number;
    savedAt: number;
    name: string;
    note?: string;
    parkingLimitMinutes?: number | null;
  }
): TentFinderTarget[] {
  const note = sanitizeParkingNote(position.note);
  const limit = sanitizeParkingLimit(position.parkingLimitMinutes);
  const car: TentFinderTarget = {
    id: CAR_TARGET_ID,
    name: position.name.trim().slice(0, MAX_NAME_LENGTH) || "Auto",
    lat: position.lat,
    lon: position.lon,
    savedAt: position.savedAt,
    icon: "car",
    ...(note ? { note } : {}),
    ...(limit !== null ? { parkingLimitMinutes: limit } : {}),
  };
  const others = targets.filter(t => t.id !== CAR_TARGET_ID);
  return [...others, car];
}

/**
 * Notiz und Parkzeit am gemerkten Auto ändern, ohne den Standort und den
 * Zeitpunkt anzufassen – man tippt die Ebene erst ein, wenn man schon
 * ausgestiegen ist. Ohne gemerktes Auto bleibt die Liste unverändert.
 */
export function updateParking(
  targets: TentFinderTarget[],
  changes: { note?: string; parkingLimitMinutes?: number | null }
): TentFinderTarget[] {
  if (!findCarTarget(targets)) return targets;
  return targets.map(t => {
    if (t.id !== CAR_TARGET_ID) return t;
    const next: TentFinderTarget = { ...t };
    if (changes.note !== undefined) {
      const note = sanitizeParkingNote(changes.note);
      if (note) next.note = note;
      else delete next.note;
    }
    if (changes.parkingLimitMinutes !== undefined) {
      const limit = sanitizeParkingLimit(changes.parkingLimitMinutes);
      if (limit !== null) next.parkingLimitMinutes = limit;
      else delete next.parkingLimitMinutes;
    }
    return next;
  });
}

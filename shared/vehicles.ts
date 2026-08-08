/**
 * Fahrzeug-Profile: gemeinsame Grundlage für die Wasserwaage (#200) und den
 * Zuladungs-Rechner (#227). Ein Profil beschreibt EIN Fahrzeug bzw. eine
 * Unterkunft – Name, Art (bestimmt die Wasserwaagen-Toleranz), Rolle im
 * Gespann und die Gewichts-Grenzen aus dem Fahrzeugausweis.
 *
 * Reine Logik ohne DOM: Client (localStorage + Geräte-Sync), Server-Sync und
 * Tests teilen sich dieselben Sanitize-/Migrations-Funktionen.
 */

import {
  DEFAULT_LEVEL_PROFILE,
  LEVEL_PROFILES,
  sanitizeLevelProfile,
  type LevelProfile,
} from "./level";

/**
 * Rolle im Gespann:
 * - `tow`: Zugfahrzeug oder Einzelfahrzeug (Auto, Bus, Wohnmobil)
 * - `trailer`: Anhänger (Wohnwagen, Lastenanhänger)
 * - `none`: Unterkunft ohne Räder (Zelt) – nur für die Wasserwaage
 */
export type VehicleRole = "tow" | "trailer" | "none";

/** Alle Rollen in Anzeige-Reihenfolge. */
export const VEHICLE_ROLES: VehicleRole[] = ["tow", "trailer", "none"];

/** Vorgabe-Rolle einer Fahrzeug-Art: Wohnwagen zieht niemand, Zelt fährt nicht. */
export function defaultVehicleRole(kind: LevelProfile): VehicleRole {
  if (kind === "caravan") return "trailer";
  if (kind === "tent") return "none";
  return "tow";
}

/** Unbekannte Rollen-Werte auf die Vorgabe der Art zurückführen. */
export function sanitizeVehicleRole(
  value: unknown,
  kind: LevelProfile
): VehicleRole {
  return VEHICLE_ROLES.indexOf(value as VehicleRole) >= 0
    ? (value as VehicleRole)
    : defaultVehicleRole(kind);
}

/** Obergrenzen – schützen localStorage und den Geräte-Sync-Payload. */
export const MAX_VEHICLES = 12;
export const MAX_VEHICLE_NAME_LENGTH = 60;
/** Grösste zulässige Gewichts-Angabe in kg (Reisemobil/Anhänger-Bereich). */
export const MAX_VEHICLE_KG = 40000;

export interface VehicleProfile {
  /** Stabile Id; die drei Start-Profile tragen die Art als Id (tent/bus/caravan). */
  id: string;
  /** Frei wählbarer Name («Unser Bus»). */
  name: string;
  /** Art – bestimmt die Toleranz der Wasserwaage. */
  kind: LevelProfile;
  /** Rolle im Gespann. */
  role: VehicleRole;
  /** Leergewicht (Fahrzeugausweis) in kg; null = nicht erfasst. */
  emptyKg: number | null;
  /** Zulässiges Gesamtgewicht in kg; null = nicht erfasst. */
  grossKg: number | null;
  /** Zulässige Anhängelast in kg (nur Zugfahrzeug); null = nicht erfasst. */
  towKg: number | null;
  /** Zulässige Stützlast in kg; null = nicht erfasst. */
  noseKg: number | null;
  /** Zulässige Achslast in kg; null = nicht erfasst. */
  axleKg: number | null;
  /** Reifendruck vorne in bar (#481); null = nicht erfasst. */
  tireFrontBar: number | null;
  /** Reifendruck hinten in bar (#481); null = nicht erfasst. */
  tireRearBar: number | null;
  /** Nächster Service als ISO-Datum (#481); null = nicht erfasst. */
  serviceDue: string | null;
}

/** Grösster plausibler Reifendruck in bar (Wohnmobil-Hinterachse ~5.5). */
export const MAX_TIRE_BAR = 10;

/** Zahl auf einen plausiblen bar-Wert bringen (0–10, eine Nachkommastelle). */
export function sanitizeBar(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.min(MAX_TIRE_BAR, Math.round(value * 10) / 10);
}

/** Eingetippten bar-Wert lesen (Komma wie Punkt); Leer/Unsinn ergibt null. */
export function parseBarInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  if (!/^\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return sanitizeBar(value);
}

/** ISO-Datum (YYYY-MM-DD) übernehmen, alles andere verwerfen. */
export function sanitizeServiceDue(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
}

/** Zahl auf eine sinnvolle kg-Angabe zurechtbiegen (0–40 000, eine Nachkommastelle). */
export function sanitizeKg(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.min(MAX_VEHICLE_KG, Math.round(value * 10) / 10);
}

/**
 * Eingetippte kg-Angabe lesen: Dezimal-Komma wie Dezimal-Punkt, Leerzeichen
 * und Apostrophe (Tausender) werden ignoriert. Leer/Unsinn ergibt null.
 */
export function parseKgInput(raw: string): number | null {
  const cleaned = raw.replace(/[\s'’]/g, "").replace(",", ".");
  if (!cleaned) return null;
  if (!/^\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return sanitizeKg(value);
}

/** kg-Wert fürs Eingabefeld formatieren (Dezimal-Komma ausser im Englischen). */
export function kgToInput(kg: number | null, lang: string = "de"): string {
  if (kg === null) return "";
  const text = Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
  return lang === "en" ? text : text.replace(".", ",");
}

/** Ein einzelnes Profil aus unbekannten Daten säubern; null = unbrauchbar. */
export function sanitizeVehicle(
  value: unknown,
  fallbackId: string
): VehicleProfile | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<VehicleProfile>;
  const kind = sanitizeLevelProfile(entry.kind);
  const name =
    typeof entry.name === "string"
      ? entry.name.trim().slice(0, MAX_VEHICLE_NAME_LENGTH)
      : "";
  if (!name) return null;
  const id =
    typeof entry.id === "string" && entry.id.trim()
      ? entry.id.trim().slice(0, 64)
      : fallbackId;
  return {
    id,
    name,
    kind,
    role: sanitizeVehicleRole(entry.role, kind),
    emptyKg: sanitizeKg(entry.emptyKg),
    grossKg: sanitizeKg(entry.grossKg),
    towKg: sanitizeKg(entry.towKg),
    noseKg: sanitizeKg(entry.noseKg),
    axleKg: sanitizeKg(entry.axleKg),
    tireFrontBar: sanitizeBar(entry.tireFrontBar),
    tireRearBar: sanitizeBar(entry.tireRearBar),
    serviceDue: sanitizeServiceDue(entry.serviceDue),
  };
}

/** Liste von Profilen säubern: doppelte Ids und leere Namen fallen weg. */
export function sanitizeVehicles(value: unknown): VehicleProfile[] {
  if (!Array.isArray(value)) return [];
  const result: VehicleProfile[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < value.length && result.length < MAX_VEHICLES; i++) {
    const vehicle = sanitizeVehicle(value[i], `vehicle-${i}`);
    if (!vehicle) continue;
    if (seen.has(vehicle.id)) continue;
    seen.add(vehicle.id);
    result.push(vehicle);
  }
  return result;
}

/**
 * Die drei Start-Profile – genau die Auswahl, die die Wasserwaage vor #227
 * hatte. Die Ids entsprechen den alten Profil-Werten, damit eine gespeicherte
 * Wahl («caravan») ohne Umweg weiter gilt. Die Namen kommen aus der UI-Sprache
 * und lassen sich später umbenennen.
 */
export function defaultVehicles(
  names: Record<LevelProfile, string>
): VehicleProfile[] {
  return LEVEL_PROFILES.map(kind => ({
    id: kind,
    name: names[kind],
    kind,
    role: defaultVehicleRole(kind),
    emptyKg: null,
    grossKg: null,
    towKg: null,
    noseKg: null,
    axleKg: null,
    tireFrontBar: null,
    tireRearBar: null,
    serviceDue: null,
  }));
}

export interface VehicleStoreState {
  vehicles: VehicleProfile[];
  /** Id des in der Wasserwaage gewählten Profils. */
  selectedId: string;
}

/**
 * Gespeicherten Stand laden und den alten Wasserwaagen-Schlüssel übernehmen:
 * Ohne Fahrzeug-Liste entstehen die drei Start-Profile, und der bisher
 * gespeicherte Profil-Wert («tent»/«bus»/«caravan») wird zur Auswahl.
 * `changed` heisst: neu schreiben (Migration hat etwas erzeugt).
 */
export function migrateVehicles(
  rawVehicles: unknown,
  rawLegacyProfile: string | null,
  names: Record<LevelProfile, string>
): VehicleStoreState & { changed: boolean } {
  const vehicles = sanitizeVehicles(rawVehicles);
  const legacyKind = sanitizeLevelProfile(rawLegacyProfile);
  if (vehicles.length === 0) {
    return {
      vehicles: defaultVehicles(names),
      // Die Start-Profile tragen die Art als Id – die alte Wahl passt 1:1.
      selectedId: legacyKind,
      changed: true,
    };
  }
  return {
    vehicles,
    selectedId: selectedVehicleId(vehicles, rawLegacyProfile),
    changed: false,
  };
}

/**
 * Gültige Auswahl-Id bestimmen: gespeicherte Id, sonst das erste Profil der
 * alten Art, sonst das erste Profil der Standard-Art, sonst das erste Profil.
 */
export function selectedVehicleId(
  vehicles: VehicleProfile[],
  stored: string | null
): string {
  if (vehicles.length === 0) return DEFAULT_LEVEL_PROFILE;
  if (stored && vehicles.some(v => v.id === stored)) return stored;
  const byKind = vehicles.find(v => v.kind === sanitizeLevelProfile(stored));
  if (byKind) return byKind.id;
  const byDefault = vehicles.find(v => v.kind === DEFAULT_LEVEL_PROFILE);
  return (byDefault ?? vehicles[0]).id;
}

/** Profil zur Id – oder null, wenn es die Id nicht (mehr) gibt. */
export function findVehicle(
  vehicles: VehicleProfile[],
  id: string | null
): VehicleProfile | null {
  if (!id) return null;
  return vehicles.find(v => v.id === id) ?? null;
}

/** Neue, praktisch kollisionsfreie Fahrzeug-Id. */
export function newVehicleId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

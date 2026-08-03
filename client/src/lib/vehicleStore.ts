/**
 * Lokaler Speicher der Fahrzeug-Profile (localStorage) – geteilt von der
 * Wasserwaage und vom Zuladungs-Rechner. Die Profil-Logik selbst liegt in
 * shared/vehicles.ts, der Zuladungs-Plan in shared/payload.ts.
 *
 * Der alte Wasserwaagen-Schlüssel «campmesser.levelProfile» bleibt in
 * Gebrauch: Er hält jetzt die Id des gewählten Profils – die drei
 * Start-Profile tragen die alten Werte (tent/bus/caravan) als Id, eine
 * gespeicherte Wahl gilt also ohne Umweg weiter.
 */
import {
  migrateVehicles,
  sanitizeVehicles,
  selectedVehicleId,
  type VehicleProfile,
  type VehicleStoreState,
} from "@shared/vehicles";
import { sanitizePayloadPlan, type PayloadPlan } from "@shared/payload";
import type { LevelProfile } from "@shared/level";

export const VEHICLES_KEY = "campmesser.vehicles";
/** Auswahl der Wasserwaage – früher der Profil-Name, heute die Fahrzeug-Id. */
export const SELECTED_VEHICLE_KEY = "campmesser.levelProfile";
export const PAYLOAD_PLAN_KEY = "campmesser.payloadPlan";

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Fahrzeuge laden und beim ersten Aufruf die drei Start-Profile anlegen
 * (Namen kommen aus der UI-Sprache). Neu angelegte Profile werden sofort
 * gespeichert, damit die Wasserwaage und der Rechner dieselben Ids sehen.
 */
export function loadVehicles(
  names: Record<LevelProfile, string>
): VehicleStoreState {
  const state = migrateVehicles(
    readJson(VEHICLES_KEY),
    readString(SELECTED_VEHICLE_KEY),
    names
  );
  if (state.changed) {
    saveVehicles(state.vehicles);
    saveSelectedVehicleId(state.selectedId);
  }
  return { vehicles: state.vehicles, selectedId: state.selectedId };
}

export function saveVehicles(vehicles: VehicleProfile[]) {
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  } catch {
    /* Speicher voll oder blockiert – die Sitzung funktioniert trotzdem */
  }
}

export function saveSelectedVehicleId(id: string) {
  try {
    localStorage.setItem(SELECTED_VEHICLE_KEY, id);
  } catch {
    /* Sitzung reicht */
  }
}

/** Server-Stand (Geräte-Sync) übernehmen: säubern und lokal sichern. */
export function acceptSyncedVehicles(value: unknown): VehicleProfile[] {
  const vehicles = sanitizeVehicles(value);
  if (vehicles.length > 0) saveVehicles(vehicles);
  return vehicles;
}

export function loadPayloadPlan(): PayloadPlan {
  return sanitizePayloadPlan(readJson(PAYLOAD_PLAN_KEY));
}

export function savePayloadPlan(plan: PayloadPlan) {
  try {
    localStorage.setItem(PAYLOAD_PLAN_KEY, JSON.stringify(plan));
  } catch {
    /* Sitzung reicht */
  }
}

export { selectedVehicleId };
export type { VehicleProfile, VehicleStoreState };

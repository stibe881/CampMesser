/**
 * Lokaler Speicher für die Hindernis-Profile des Sonnen-Kompasses
 * (localStorage). Wird auch von der Solarpanel-Ausrichtungshilfe im
 * Energie-Budget genutzt. Die Profil-Logik selbst liegt in
 * shared/obstacleProfiles.ts.
 */
import {
  emptyProfiles,
  normalizeProfiles,
  type ObstacleProfiles,
} from "@shared/obstacleProfiles";

export type { Obstacle, ObstacleProfiles } from "@shared/obstacleProfiles";

// Schlüssel bleibt v1: loadObstacleProfiles migriert die alte Array-Form automatisch
export const OBSTACLES_STORAGE_KEY = "campmesser.sunObstacles.v1";

export function loadObstacleProfiles(): ObstacleProfiles {
  try {
    const raw = localStorage.getItem(OBSTACLES_STORAGE_KEY);
    if (!raw) return emptyProfiles();
    return normalizeProfiles(JSON.parse(raw)) ?? emptyProfiles();
  } catch {
    return emptyProfiles();
  }
}

export function saveObstacleProfiles(profiles: ObstacleProfiles) {
  try {
    localStorage.setItem(OBSTACLES_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    /* Speicher voll oder blockiert – Anzeige funktioniert trotzdem */
  }
}

/**
 * Gemeinsamer Speicher für das Hindernis-Profil des Sonnen-Kompasses
 * (localStorage). Wird auch von der Solarpanel-Ausrichtungshilfe im
 * Energie-Budget genutzt.
 */
import type { ObstacleShape } from "@shared/obstacles";

/** Ein Hindernis am Horizont: verdeckt einen Richtungs-Sektor bis zu einer bestimmten Höhe. */
export interface Obstacle extends ObstacleShape {
  id: string;
  kind: "baum" | "berg" | "gebaeude";
}

export const OBSTACLES_STORAGE_KEY = "campmesser.sunObstacles.v1";

export function loadObstacles(): Obstacle[] {
  try {
    const raw = localStorage.getItem(OBSTACLES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Obstacle[];
    return Array.isArray(parsed) ? parsed.filter(o => o && typeof o.azimuth === "number") : [];
  } catch {
    return [];
  }
}

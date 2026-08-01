/**
 * Hindernis-Profile: ein allgemeines Profil plus optionale Profile pro
 * Zeltplatz-Favorit, damit ein Platzwechsel das erfasste Panorama nicht
 * überschreibt. Reine Funktionen – von Client und Tests genutzt.
 */
import type { ObstacleShape } from "./obstacles";

/** Ein Hindernis am Horizont: verdeckt einen Richtungs-Sektor bis zu einer bestimmten Höhe. */
export interface Obstacle extends ObstacleShape {
  id: string;
  kind: "baum" | "berg" | "gebaeude";
}

export interface ObstacleProfiles {
  /** Allgemeines Profil (bisheriges Verhalten ohne Platz-Auswahl) */
  global: Obstacle[];
  /** Profile pro Zeltplatz-Favorit (Schlüssel = Spot-ID als Text) */
  spots: Record<string, Obstacle[]>;
}

export function emptyProfiles(): ObstacleProfiles {
  return { global: [], spots: {} };
}

function cleanList(value: unknown): Obstacle[] {
  return Array.isArray(value)
    ? (value as Obstacle[]).filter(o => o && typeof o.azimuth === "number")
    : [];
}

/**
 * Beliebige gespeicherte oder synchronisierte Werte in Profile übersetzen.
 * Die alte Form (einfaches Array = globales Profil) wird migriert; leere
 * Platz-Profile werden entsorgt. Unbrauchbares ergibt null.
 */
export function normalizeProfiles(value: unknown): ObstacleProfiles | null {
  if (Array.isArray(value)) return { global: cleanList(value), spots: {} };
  if (value && typeof value === "object" && "global" in value) {
    const v = value as { global?: unknown; spots?: unknown };
    const spots: Record<string, Obstacle[]> = {};
    if (v.spots && typeof v.spots === "object") {
      for (const [key, list] of Object.entries(
        v.spots as Record<string, unknown>
      )) {
        const clean = cleanList(list);
        if (clean.length > 0) spots[key] = clean;
      }
    }
    return { global: cleanList(v.global), spots };
  }
  return null;
}

/** Hindernisse des aktiven Profils (null = allgemeines Profil). */
export function getProfileObstacles(
  profiles: ObstacleProfiles,
  spotId: number | null
): Obstacle[] {
  if (spotId != null) return profiles.spots[String(spotId)] ?? [];
  return profiles.global;
}

/** Neues Profil-Objekt mit ersetzter Hindernis-Liste des aktiven Profils. */
export function withProfileObstacles(
  profiles: ObstacleProfiles,
  spotId: number | null,
  obstacles: Obstacle[]
): ObstacleProfiles {
  if (spotId != null) {
    const spots = { ...profiles.spots };
    if (obstacles.length > 0) spots[String(spotId)] = obstacles;
    else delete spots[String(spotId)];
    return { ...profiles, spots };
  }
  return { ...profiles, global: obstacles };
}

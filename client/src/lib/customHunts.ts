/**
 * Eigene Schnitzeljagden: Abbildung der Datenbank-Zeilen auf das
 * ScavengerHunt-Format, damit Player und Druckansicht sie genauso wie die
 * eingebauten Jagden verwenden können.
 */
import type { ScavengerHunt } from "@/data/familyActivities";
import { l4 } from "@shared/i18n";
import { parseHuntStations } from "@shared/hunts";

export interface CustomHuntRow {
  id: number;
  title: string;
  ageHint: string | null;
  durationMinutes: number;
  intro: string;
  preparation: string | null;
  stationsJson: string;
  solutionWord: string | null;
  finale: string;
}

/** Präfix der Player-/Druck-IDs eigener Jagden (z. B. «eigene-7»). */
export const CUSTOM_HUNT_ID_PREFIX = "eigene-";

export function customHuntToScavengerHunt(row: CustomHuntRow): ScavengerHunt {
  return {
    id: `${CUSTOM_HUNT_ID_PREFIX}${row.id}`,
    title: row.title,
    ageHint:
      row.ageHint ??
      l4("selbst erstellt", "création maison", "creata da te", "self-made"),
    durationMinutes: row.durationMinutes,
    intro: row.intro,
    preparation: row.preparation ?? undefined,
    stations: parseHuntStations(row.stationsJson),
    solutionWord: row.solutionWord ?? undefined,
    finale: row.finale,
  };
}

/** Numerische Datenbank-ID aus einer Player-/Druck-ID («eigene-7» → 7). */
export function customHuntDbId(id: string): number | null {
  if (!id.startsWith(CUSTOM_HUNT_ID_PREFIX)) return null;
  const parsed = parseInt(id.slice(CUSTOM_HUNT_ID_PREFIX.length), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

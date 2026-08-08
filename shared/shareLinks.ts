/**
 * Teil-Link-Übersicht (#422): Über die Jahre sind neun Arten von
 * Teil-Links zusammengekommen – Platz-Dossier, Packliste, Packvorlage,
 * Reise-Hub, Rezept, Quiz, Einkaufsliste, Wanderung, Standort. Jeder
 * wird an seinem Ort erzeugt und beendet, aber NIRGENDS sah man, was
 * alles offen ist. Ein vergessener Link ist ein offenes Fenster.
 *
 * Hier steht der Katalog: Art → öffentlicher Pfad. Die Pfade sind
 * dieselben wie in den Routen von App.tsx – ändert sich dort etwas,
 * schlägt der Test an.
 */

export const SHARE_LINK_KINDS = [
  "spot",
  "packList",
  "packTemplate",
  "trip",
  "recipe",
  "quiz",
  "shopping",
  "track",
  "location",
] as const;

export type ShareLinkKind = (typeof SHARE_LINK_KINDS)[number];

/** Öffentlicher Pfad-Präfix pro Art (Routen in App.tsx). */
export const SHARE_LINK_PATHS: Record<ShareLinkKind, string> = {
  spot: "/platz",
  packList: "/liste",
  packTemplate: "/vorlage",
  trip: "/reise",
  recipe: "/rezept",
  quiz: "/quiz",
  shopping: "/einkaufsliste",
  track: "/wanderung",
  location: "/standort",
};

import { isShareExpired } from "./sharing";

export interface ShareLinkEntry {
  kind: ShareLinkKind;
  /** Id des geteilten Eintrags bzw. der Teil-Zeile (shopping/location). */
  id: number;
  /** Name des geteilten Inhalts; null, wenn es keinen gibt (Standort). */
  label: string | null;
  token: string;
  /** Ablauf als ISO-Zeit; null = unbegrenzt gültig. */
  expiresAt: string | null;
}

/** Relativer öffentlicher Pfad eines Teil-Links. */
export function shareLinkPath(kind: ShareLinkKind, token: string): string {
  return `${SHARE_LINK_PATHS[kind]}/${token}`;
}

/**
 * Aktive Links in Katalog-Reihenfolge, innerhalb einer Art nach Name.
 * Abgelaufene fliegen raus (Ablauf-Regel aus shared/sharing.ts, #189) –
 * wer sie sehen wollte, hätte nichts davon: sie funktionieren nicht mehr.
 */
export function sortShareLinks(
  entries: readonly ShareLinkEntry[],
  nowMs: number
): ShareLinkEntry[] {
  return entries
    .filter(entry => !isShareExpired(entry.expiresAt, new Date(nowMs)))
    .slice()
    .sort(
      (a, b) =>
        SHARE_LINK_KINDS.indexOf(a.kind) - SHARE_LINK_KINDS.indexOf(b.kind) ||
        (a.label ?? "").localeCompare(b.label ?? "") ||
        a.id - b.id
    );
}

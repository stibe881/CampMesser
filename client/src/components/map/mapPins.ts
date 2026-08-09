/**
 * Pin-Vokabular der Karte (#574, aus MapView.tsx herausgelöst): die
 * divIcon-Fabriken aller Ebenen (Favorit, Ziel, Beobachtung, OSM-Fund,
 * Ausflug, Feuerstelle, Familie, Merkort), die Cluster-Färbung samt
 * Zahlen-Kreis und die Pin-Datentypen. Reine Daten und Funktionen ohne
 * JSX – SpotsMap und die Karten-Seite teilen sie sich.
 */
import { type FamilyPlaceKind, type OsmCampsite } from "@/lib/overpass";
import { divIcon, type IconSpec, type LatLngTuple } from "@/lib/mapEngine";
import { targetIconGlyph, type TargetIcon } from "@/lib/tentFinderTargets";
import {
  SAVED_PLACE_COLOR_HEX,
  normalizeSavedPlaceColor,
} from "@shared/savedPlaces";

export interface SpotPin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

/** Merkort (#537) – Wunschziel mit Notiz und selbst gewählter Pin-Farbe. */
export interface SavedPlacePin {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  note: string | null;
  color: string;
  /** EIN Foto (#589); im Popup als Vorschau (#599). */
  photoFileName: string | null;
}

/** Natur-Beobachtung mit Koordinaten – Datum bereits sprachrichtig formatiert. */
export interface SightingPin {
  id: number;
  title: string;
  dateLabel: string;
  lat: number;
  lon: number;
}

/** Schweiz als Ausgangs-Ausschnitt, solange keine Pins vorhanden sind. */
export const FALLBACK_CENTER: LatLngTuple = [46.8, 8.2];
export const FALLBACK_ZOOM = 8;

/** Runder Zelt-Marker als divIcon – keine Bild-Assets nötig (Bundler-sicher). */
export const spotIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#2f6b4f" stroke="#ffffff" stroke-width="2.5"/><path d="M14 8.5 20 19h-4.2L14 15.8 12.2 19H8Z" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Zelt-Finder-Ziel als bernsteinfarbener Marker (gleiches divIcon-Muster);
 * im Kreis steht der SVG-Glyph des gewählten Symbols, ohne Wahl das
 * Fadenkreuz wie bisher.
 */
export function targetIconFor(icon: TargetIcon | undefined): IconSpec {
  return divIcon({
    className: "",
    html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#b45309" stroke="#ffffff" stroke-width="2.5"/>${targetIconGlyph(icon)}</svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** Entdeckter OSM-Campingplatz: blauer Kreis mit Zelt-Umriss (dritte Farbe). */
export const campsiteIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#0369a1" stroke="#ffffff" stroke-width="2.5"/><path d="M14 8.5 20 19h-4.2L14 15.8 12.2 19H8Z" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/** Natur-Beobachtung: violetter Kreis mit Pfoten-Punkten (vierte Farbe). */
export const sightingIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#7c3aed" stroke="#ffffff" stroke-width="2.5"/><ellipse cx="14" cy="16.5" rx="3.4" ry="2.9" fill="#ffffff"/><circle cx="9.6" cy="12.4" r="1.7" fill="#ffffff"/><circle cx="13" cy="10.4" r="1.7" fill="#ffffff"/><circle cx="16.8" cy="10.9" r="1.7" fill="#ffffff"/><circle cx="19.4" cy="13.7" r="1.6" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Ausflugsziel aus der Ausflugfinder-App (#271): dunkelroter Kreis mit
 * Riesenrad-Stern – fünfte Farbe, klar unterscheidbar von Plätzen (grün),
 * Zielen (bernstein), Beobachtungen (violett) und OSM-Funden (blau).
 */
export const excursionIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#be123c" stroke="#ffffff" stroke-width="2.5"/><circle cx="14" cy="14" r="5.4" fill="none" stroke="#ffffff" stroke-width="1.6"/><path d="M14 6.6v3M14 18.4v3M6.6 14h3M18.4 14h3M9 9l2.1 2.1M16.9 16.9 19 19M19 9l-2.1 2.1M11.1 16.9 9 19" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Feuer- bzw. Grillstelle aus OpenStreetMap (#247): reines Rot mit Flamme –
 * sechste Farbe, deutlich heller und satter als das Bernstein der Ziele und
 * das dunkle Karminrot der Ausflüge, dazu ein unverwechselbarer Umriss.
 */
export const firepitIcon = divIcon({
  className: "",
  html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="2.5"/><path d="M14.4 6.6c2.5 2.9 4.3 5 4.3 7.8a4.7 4.7 0 0 1-9.4 0c0-1.8.8-3.2 2-4.6.2 1.2.8 2 1.7 2.3.6-2.1.3-3.8-.9-5.7 1 .1 1.7.2 2.3.2Z" fill="#ffffff"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

/**
 * Spielplatz bzw. Badeplatz (#248): beide in Petrol #0d9488 – siebte Farbe,
 * klar getrennt vom Platz-Grün und vom Blau der OSM-Campingplätze. Weil beide
 * zur selben Ebene «Familie» gehören, unterscheidet sie nicht die Farbe,
 * sondern der Umriss: Rutschbahn für den Spielplatz, Wellen fürs Baden.
 */
export const FAMILY_GLYPHS: Record<FamilyPlaceKind, string> = {
  playground: `<path d="M10.2 19.4v-8.2M10.2 11.6h1.8M10.2 14.2h1.8M10.2 16.8h1.8" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M12 10.8c3.1 1.5 5.2 4.5 6.2 8.6" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M7.8 19.6h12.4" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>`,
  bathing: `<circle cx="11" cy="10.4" r="2" fill="#ffffff"/><path d="M7.4 15.4c1.3-1.5 2.6-1.5 3.9 0s2.6 1.5 3.9 0 2.6-1.5 3.9 0M7.4 18.8c1.3-1.5 2.6-1.5 3.9 0s2.6 1.5 3.9 0 2.6-1.5 3.9 0" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
};

export function familyIconFor(kind: FamilyPlaceKind): IconSpec {
  return divIcon({
    className: "",
    html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#0d9488" stroke="#ffffff" stroke-width="2.5"/>${FAMILY_GLYPHS[kind]}</svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/**
 * Merkort (#537): Kreis in der selbst gewählten Farbe mit Stern-Umriss –
 * der Stern unterscheidet ihn von allen Ebenen-Pins, egal welche Farbe
 * gewählt ist (der Katalog nutzt bewusst hellere Töne als die Ebenen).
 */
export function savedPlaceIconFor(color: string): IconSpec {
  const hex = SAVED_PLACE_COLOR_HEX[normalizeSavedPlaceColor(color)];
  return divIcon({
    className: "",
    html: `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="${hex}" stroke="#ffffff" stroke-width="2.5"/><path d="M14 7.8l1.9 3.8 4.2.6-3 3 .7 4.2-3.8-2-3.8 2 .7-4.2-3-3 4.2-.6Z" fill="#ffffff"/></svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** Pin-Typen für die Cluster-Färbung (Farben wie die jeweiligen Einzel-Icons). */
export type PinKind =
  | "spot"
  | "target"
  | "sighting"
  | "campsite"
  | "excursion"
  | "firepit"
  | "family"
  | "savedPlace";

export const PIN_COLORS: Record<PinKind, string> = {
  spot: "#2f6b4f",
  target: "#b45309",
  sighting: "#7c3aed",
  campsite: "#0369a1",
  excursion: "#be123c",
  firepit: "#dc2626",
  family: "#0d9488",
  // Merkorte haben pro Pin eine eigene Farbe – fürs Cluster zählt die
  // Standard-Farbe des Katalogs.
  savedPlace: SAVED_PLACE_COLOR_HEX.red,
};

/** Neutrales Grau, wenn kein Pin-Typ im Cluster klar dominiert. */
export const CLUSTER_NEUTRAL_COLOR = "#475569";

/** Farbe des dominanten Pin-Typs – bei Gleichstand neutral. */
export function clusterColor(kinds: readonly PinKind[]): string {
  const counts = new Map<PinKind, number>();
  kinds.forEach(kind => counts.set(kind, (counts.get(kind) ?? 0) + 1));
  let bestKind: PinKind | null = null;
  let bestCount = 0;
  let tied = false;
  counts.forEach((count, kind) => {
    if (count > bestCount) {
      bestKind = kind;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  });
  return bestKind && !tied ? PIN_COLORS[bestKind] : CLUSTER_NEUTRAL_COLOR;
}

/** Zahlen-Kreis für gruppierte Pins – Grösse wächst leicht mit der Anzahl. */
/** Beschriftung der Messstrecke – ein Pin statt eines Tooltips. */
export function measureLabelIcon(label: string): IconSpec {
  const width = Math.max(44, label.length * 8 + 16);
  return divIcon({
    className: "",
    html: `<div style="background:#0ea5e9;color:#fff;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:600;white-space:nowrap;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.3)">${label}</div>`,
    iconSize: [width, 20],
    iconAnchor: [width / 2, 10],
  });
}

export function clusterIcon(
  count: number,
  color: string,
  label: string
): IconSpec {
  const size = count < 10 ? 34 : count < 100 ? 40 : 46;
  return divIcon({
    className: "",
    html: `<div role="img" aria-label="${label}" style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:#ffffff;border:2.5px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Liegt der OSM-Platz praktisch auf einem Favoriten? (~50 m Toleranz) */
export function isNearFavorite(
  campsite: OsmCampsite,
  spots: SpotPin[]
): boolean {
  return spots.some(
    s =>
      Math.abs(s.latitude - campsite.lat) < 0.0005 &&
      Math.abs(s.longitude - campsite.lon) < 0.0005
  );
}

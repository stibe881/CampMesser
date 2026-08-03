/**
 * Reine Geodäsie-Helfer: Grosskreis-Distanz (Haversine) und Anfangs-Peilung
 * zwischen zwei WGS84-Koordinaten, dazu die Distanz-Ausgabe. Ohne
 * Seiteneffekte, damit Client, Server und Tests sie direkt nutzen.
 */
import { LOCALE_TAGS, type Language } from "./i18n";

/** Mittlerer Erdradius in Metern. */
const EARTH_RADIUS_M = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Grosskreis-Distanz zwischen zwei Punkten in Metern (Haversine-Formel). */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const dPhi = toRadians(lat2 - lat1);
  const dLambda = toRadians(lon2 - lon1);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Anfangs-Peilung (initial bearing) vom Start- zum Zielpunkt in Grad:
 * 0° = Nord, 90° = Ost, im Uhrzeigersinn, Ergebnis in [0, 360).
 */
export function bearingDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const dLambda = toRadians(lon2 - lon1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = (Math.atan2(y, x) * 180) / Math.PI;
  return (theta + 360) % 360;
}

/** Distanz formatieren: unter 1 km in Metern, sonst km mit einer Nachkommastelle. */
export function formatDistance(meters: number, lang: Language = "de"): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = new Intl.NumberFormat(LOCALE_TAGS[lang], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(meters / 1000);
  return `${km} km`;
}

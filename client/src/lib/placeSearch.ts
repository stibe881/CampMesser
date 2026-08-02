/**
 * Ortssuche über die Open-Meteo-Geocoding-API (gleiche Datenquelle wie das
 * Wetter) – genutzt vom Wetter-Vergleich und vom Heim-Standort im Profil.
 */
import type { Language } from "@shared/i18n";

export interface PlaceResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  /** Region/Land als Zusatzinfo, z. B. «Ticino, Schweiz» */
  region: string;
}

export async function searchPlaces(
  query: string,
  lang: Language
): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    name: query,
    count: "6",
    language: lang,
    format: "json",
  });
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
  );
  if (!res.ok) throw new Error(`geocoding error ${res.status}`);
  const json = (await res.json()) as { results?: unknown };
  if (!Array.isArray(json.results)) return [];
  const places: PlaceResult[] = [];
  json.results.forEach((r, i) => {
    if (!r || typeof r !== "object") return;
    const entry = r as Record<string, unknown>;
    const name = typeof entry.name === "string" ? entry.name : "";
    const latitude = entry.latitude;
    const longitude = entry.longitude;
    if (
      !name ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude)
    ) {
      return;
    }
    places.push({
      id: typeof entry.id === "number" ? entry.id : i,
      name,
      latitude,
      longitude,
      region: [entry.admin1, entry.country]
        .filter((p): p is string => typeof p === "string" && p.length > 0)
        .join(", "),
    });
  });
  return places;
}

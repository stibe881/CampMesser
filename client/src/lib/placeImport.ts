/**
 * GPX/KML-Import für Merkorte (#632): Wegpunkte aus den zwei üblichen
 * Export-Formaten lesen – GPX-`<wpt>` (Garmin, Outdooractive & Co.) und
 * KML-`<Placemark>` mit `<Point>` (Google My Maps). Nur PUNKTE werden
 * übernommen; Tracks und Routen gehören in die Wanderungen, nicht in
 * die Merkorte. Kaputte Dateien ergeben `[]` statt eines Absturzes.
 */
import { SAVED_PLACE_NAME_MAX_LENGTH } from "@shared/savedPlaces";

export interface ImportedPlace {
  name: string;
  latitude: number;
  longitude: number;
}

/** Obergrenze pro Import – schützt vor «ganz Europa als Datei». */
export const MAX_IMPORT_PLACES = 50;

function validCoords(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}

function cleanName(raw: string | null | undefined, fallback: string): string {
  const name = (raw ?? "").trim();
  return (name || fallback).slice(0, SAVED_PLACE_NAME_MAX_LENGTH);
}

/** GPX- oder KML-Text in Wegpunkte übersetzen; unlesbar ergibt `[]`. */
export function parsePlacesFile(text: string): ImportedPlace[] {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(text, "text/xml");
  } catch {
    return [];
  }
  if (doc.querySelector("parsererror")) return [];
  const places: ImportedPlace[] = [];

  // GPX: <wpt lat="…" lon="…"><name>…</name></wpt>
  doc.querySelectorAll("wpt").forEach(wpt => {
    if (places.length >= MAX_IMPORT_PLACES) return;
    const lat = Number(wpt.getAttribute("lat"));
    const lon = Number(wpt.getAttribute("lon"));
    if (!validCoords(lat, lon)) return;
    places.push({
      name: cleanName(
        wpt.querySelector("name")?.textContent,
        `Wegpunkt ${places.length + 1}`
      ),
      latitude: lat,
      longitude: lon,
    });
  });

  // KML: <Placemark><name>…</name><Point><coordinates>lon,lat[,ele]
  doc.querySelectorAll("Placemark").forEach(mark => {
    if (places.length >= MAX_IMPORT_PLACES) return;
    const coords = mark
      .querySelector("Point > coordinates")
      ?.textContent?.trim();
    if (!coords) return;
    const [lonRaw, latRaw] = coords.split(/[,\s]+/);
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (!validCoords(lat, lon)) return;
    places.push({
      name: cleanName(
        mark.querySelector("name")?.textContent,
        `Wegpunkt ${places.length + 1}`
      ),
      latitude: lat,
      longitude: lon,
    });
  });

  return places;
}

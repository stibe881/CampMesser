/**
 * Geteilte Orte (#584): Wer in einer Karten-App auf «Teilen» tippt, schickt
 * uns Titel/Text/URL – hier steckt der Versuch, daraus einen Punkt mit
 * Koordinaten zu lesen. Verstanden werden geo:-URIs, Google-Maps- und
 * OpenStreetMap-Links sowie nackte «47.05, 8.31»-Koordinaten im Text.
 *
 * BEWUSST OHNE NETZ: Kurzlinks (maps.app.goo.gl) tragen die Koordinaten
 * nicht im Link – sie aufzulösen hiesse, jeden geteilten Link an Google zu
 * schicken. Dann lieber ehrlich «nichts erkannt» zeigen.
 */

export interface SharedPlace {
  /** Ortsname aus dem Link oder Titel; leer, wenn nichts Brauchbares da ist. */
  name: string;
  latitude: number;
  longitude: number;
}

const COORD = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

function valid(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    // 0,0 liegt im Golf von Guinea – geteilt wird das nie, geliefert von
    // kaputten Links dafür oft (geo:0,0?q=…).
    (latitude !== 0 || longitude !== 0)
  );
}

/** «Zermatt+Matterhorn» → «Zermatt Matterhorn», URL-Prozent aufgelöst. */
function cleanName(raw: string): string {
  let text = raw.replace(/\+/g, " ");
  try {
    text = decodeURIComponent(text);
  } catch {
    // Kaputtes Prozent-Encoding – dann eben der rohe Text
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Erster Koordinaten-Treffer eines Musters mit zwei Fanggruppen. */
function matchCoords(text: string, pattern: RegExp): [number, number] | null {
  const match = pattern.exec(text);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return valid(latitude, longitude) ? [latitude, longitude] : null;
}

/**
 * Titel/Text/URL einer Teilen-Aktion in einen Ort übersetzen; null, wenn
 * nirgends Koordinaten stecken. Die Felder dürfen fehlen – Karten-Apps
 * füllen sie sehr unterschiedlich.
 */
export function parseSharedPlace(
  title?: string | null,
  text?: string | null,
  url?: string | null
): SharedPlace | null {
  // Alles zusammenkippen: Manche Apps packen den Link in «text» statt «url».
  const haystack = [url, text, title]
    .filter((part): part is string => Boolean(part))
    .join("\n");
  if (!haystack.trim()) return null;

  let coords: [number, number] | null = null;
  let name = "";

  // geo:-URI – mit Label in q= («geo:0,0?q=47.05,8.31(Rigi)») oder direkt
  const geoLabeled = matchCoords(
    haystack,
    new RegExp(String.raw`geo:[^\s]*\?q=${COORD},${COORD}`)
  );
  const geoPlain = matchCoords(haystack, new RegExp(`geo:${COORD},${COORD}`));
  coords = geoLabeled ?? geoPlain;
  if (coords) {
    const label = /geo:[^\s]*\(([^)]+)\)/.exec(haystack);
    if (label) name = cleanName(label[1]);
  }

  // Google Maps: /place/<Name>/ liefert den Namen, die Koordinaten stehen
  // je nach Link in @lat,lng, in q=lat,lng oder im Daten-Blob (!3d…!4d…).
  if (/google\.[^\s/]+\/maps|maps\.google\./.test(haystack)) {
    coords =
      coords ??
      matchCoords(haystack, new RegExp(String.raw`!3d${COORD}!4d${COORD}`)) ??
      matchCoords(haystack, new RegExp(String.raw`@${COORD},${COORD}`)) ??
      matchCoords(haystack, new RegExp(String.raw`[?&]q=${COORD},${COORD}`));
    const place = /\/maps\/place\/([^/@?\s]+)/.exec(haystack);
    if (place && !name) name = cleanName(place[1]);
  }

  // OpenStreetMap: Marker (mlat/mlon) schlägt den Karten-Ausschnitt (#map=)
  if (/openstreetmap\.org/.test(haystack)) {
    coords =
      coords ??
      matchCoords(
        haystack,
        new RegExp(String.raw`mlat=${COORD}&mlon=${COORD}`)
      ) ??
      matchCoords(haystack, new RegExp(String.raw`#map=\d+/${COORD}/${COORD}`));
  }

  // Nackte Koordinaten im Text («47.0502, 8.3093») – zuletzt, damit keine
  // Hausnummern oder Preise versehentlich zu Orten werden: verlangt sind
  // Dezimalpunkte auf beiden Seiten.
  coords =
    coords ??
    matchCoords(
      haystack,
      new RegExp(String.raw`(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)`)
    );

  if (!coords) return null;
  if (!name && title) {
    const trimmed = title.trim();
    // Titel, die selbst nur der Link oder die Koordinaten sind, taugen nicht
    if (trimmed && !/https?:|geo:|^-?\d/.test(trimmed)) {
      name = cleanName(trimmed);
    }
  }
  return { name, latitude: coords[0], longitude: coords[1] };
}

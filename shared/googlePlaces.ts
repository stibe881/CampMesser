/**
 * Orte von Google (Places API New) – die reine Logik ohne Abruf.
 *
 * WOFÜR: «Einkaufen in der Nähe» und «Rast unterwegs» kamen bisher aus
 * OpenStreetMap. Das funktioniert, hat aber eine Lücke, die man am
 * Zeltplatz sofort merkt: ÖFFNUNGSZEITEN. In OSM sind sie bei den
 * meisten Läden schlicht nicht erfasst – auf einem Bildschirm mit fünf
 * Treffern stand viermal «Öffnungszeiten nicht erfasst». Google hat sie,
 * und für die Frage «hat der Coop jetzt noch offen» ist das der ganze
 * Unterschied.
 *
 * OSM BLEIBT ALS RÜCKFALL, nicht aus Nostalgie: Ohne Schlüssel in der
 * Server-`.env` läuft die App weiter wie bisher, und ein Hofladen ist in
 * OSM oft erfasst, wo Google nichts kennt – eine Ladenart, für die es
 * bei Google gar keinen Typ gibt.
 *
 * NUR LISTE, NIE KARTE. Die Nutzungsbedingungen von Google untersagen
 * es, ihre Inhalte zusammen mit einer fremden Karte zu zeigen; ReiseKompass
 * zeichnet auf Leaflet mit OSM-Kacheln. Die Treffer bleiben deshalb in
 * der Liste, und die Karte zeigt weiter, was aus OSM kommt. Dieselbe
 * Linie wie bei den Fahrzeiten (siehe shared/googleRoutes.ts).
 *
 * QUELLENANGABE IST PFLICHT: Wo Google-Treffer stehen, steht «Powered by
 * Google» darunter. Dafür gibt es `GOOGLE_ATTRIBUTION`.
 *
 * Der Schlüssel steht in der Server-`.env` und kommt nie in den Browser;
 * diese Datei baut nur die Anfrage und liest die Antwort.
 */

/** Endpunkt der Umkreissuche (Places API New). */
export const GOOGLE_PLACES_URL =
  "https://places.googleapis.com/v1/places:searchNearby";

/**
 * Feldmaske: Google verlangt, dass man die gewünschten Felder benennt,
 * und rechnet danach ab. Je mehr Felder, desto teurer die Abfrage.
 *
 * ÖFFNUNGSZEITEN, TELEFON UND WEBSEITE LIEGEN IM TEUERSTEN TOPF
 * («Enterprise»). Sie stehen trotzdem drin, denn genau dafür wird der
 * Dienst überhaupt gefragt – ein Laden ohne Öffnungszeiten kann OSM auch.
 * Gespart wird stattdessen an der Menge: wenige Treffer, kräftig
 * zwischengespeichert.
 */
export const GOOGLE_PLACES_FIELD_MASK = [
  "places.id",
  "places.location",
  "places.displayName",
  "places.primaryType",
  "places.types",
  "places.regularOpeningHours.openNow",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.websiteUri",
  "places.nationalPhoneNumber",
].join(",");

/** Quellenangabe, wie sie unter jeder Google-Liste stehen muss. */
export const GOOGLE_ATTRIBUTION = "Powered by Google";

/**
 * Höchstzahl Treffer je Abfrage. Google erlaubt 20; wir nehmen weniger,
 * weil die Liste am Handy ohnehin niemand bis unten liest und jede
 * Abfrage Geld kostet.
 */
export const GOOGLE_PLACES_MAX_RESULTS = 12;

/** Ein Ort, wie ihn die App braucht – schon aufgeräumt. */
export interface GooglePlace {
  /** Place-Id. Als Einzige darf sie laut Google dauerhaft abgelegt werden. */
  id: string;
  lat: number;
  lon: number;
  name: string;
  /** Google-Typen, unverändert – die Zuordnung macht der Aufrufer. */
  types: string[];
  /** Hat der Ort JETZT offen? null = Google weiss es nicht. */
  openNow: boolean | null;
  /** Öffnungszeiten als fertige Zeilen, wie Google sie formuliert. */
  hours: string[];
  website: string | null;
  phone: string | null;
}

/**
 * Ladenarten der App auf Google-Typen abbilden.
 *
 * KEIN HOFLADEN: Dafür gibt es bei Google keinen Typ. Wer Hofläden sucht,
 * ist mit OSM besser bedient – ein Grund mehr, den Rückfall zu behalten.
 */
export const GOOGLE_SHOP_TYPES = [
  "supermarket",
  "grocery_store",
  "convenience_store",
  "bakery",
  "butcher_shop",
] as const;

/**
 * Rastplätze. `park` ist bewusst NICHT dabei: Damit käme jede Grünfläche
 * der Stadt mit, und «Rast unterwegs» meint den Tisch an der Landstrasse.
 */
export const GOOGLE_PICNIC_TYPES = ["picnic_ground", "rest_stop"] as const;

/** Anfrage-Körper für die Umkreissuche. */
export function googlePlacesBody(
  lat: number,
  lon: number,
  radiusM: number,
  types: readonly string[],
  maxResults = GOOGLE_PLACES_MAX_RESULTS,
  languageCode = "de"
): Record<string, unknown> {
  return {
    includedTypes: types.slice(),
    maxResultCount: Math.max(1, Math.min(20, Math.round(maxResults))),
    languageCode,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lon },
        // Google nimmt höchstens 50 km
        radius: Math.max(1, Math.min(50000, Math.round(radiusM))),
      },
    },
    // Nach Entfernung, nicht nach «Beliebtheit»: Am Zeltplatz zählt, was
    // zu Fuss erreichbar ist, und nicht, was die meisten Bewertungen hat.
    rankPreference: "DISTANCE",
  };
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Antwort lesen. Alles, was nicht passt, fällt weg statt eine halbe Zeile
 * zu erzeugen – ein Treffer ohne Koordinaten lässt sich weder einordnen
 * noch ansteuern.
 */
export function parseGooglePlaces(json: unknown): GooglePlace[] {
  if (!json || typeof json !== "object") return [];
  const raw = (json as { places?: unknown }).places;
  if (!Array.isArray(raw)) return [];
  const result: GooglePlace[] = [];
  raw.forEach(entry => {
    if (!entry || typeof entry !== "object") return;
    const place = entry as {
      id?: unknown;
      location?: { latitude?: unknown; longitude?: unknown };
      displayName?: { text?: unknown };
      primaryType?: unknown;
      types?: unknown;
      regularOpeningHours?: {
        openNow?: unknown;
        weekdayDescriptions?: unknown;
      };
      websiteUri?: unknown;
      nationalPhoneNumber?: unknown;
    };
    const id = str(place.id);
    const lat = place.location?.latitude;
    const lon = place.location?.longitude;
    if (!id || typeof lat !== "number" || typeof lon !== "number") return;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const types: string[] = [];
    const primary = str(place.primaryType);
    if (primary) types.push(primary);
    if (Array.isArray(place.types)) {
      place.types.forEach(type => {
        const value = str(type);
        if (value && types.indexOf(value) === -1) types.push(value);
      });
    }
    const hours: string[] = [];
    const descriptions = place.regularOpeningHours?.weekdayDescriptions;
    if (Array.isArray(descriptions)) {
      descriptions.forEach(line => {
        const value = str(line);
        if (value) hours.push(value);
      });
    }
    const openNow = place.regularOpeningHours?.openNow;
    result.push({
      id,
      lat,
      lon,
      name: str(place.displayName?.text) ?? "",
      types,
      openNow: typeof openNow === "boolean" ? openNow : null,
      hours,
      website: str(place.websiteUri),
      phone: str(place.nationalPhoneNumber),
    });
  });
  return result;
}

/** Google-Typen auf unsere Ladenarten abbilden; null = passt zu keiner. */
export function googleShopKind(
  types: readonly string[]
): "supermarket" | "convenience" | "bakery" | "butcher" | null {
  if (types.indexOf("bakery") !== -1) return "bakery";
  if (types.indexOf("butcher_shop") !== -1) return "butcher";
  if (types.indexOf("convenience_store") !== -1) return "convenience";
  if (types.indexOf("supermarket") !== -1) return "supermarket";
  if (types.indexOf("grocery_store") !== -1) return "supermarket";
  return null;
}

/** Google-Typen auf unsere Rastplatz-Arten abbilden. */
export function googlePicnicKind(
  types: readonly string[]
): "site" | "table" | null {
  if (types.indexOf("rest_stop") !== -1) return "site";
  if (types.indexOf("picnic_ground") !== -1) return "table";
  return null;
}

/**
 * Schlüssel für den Zwischenspeicher. Auf drei Nachkommastellen gerundet
 * (rund 100 m): Wer denselben Platz zweimal anschaut, soll dieselben
 * Treffer bekommen, ohne dass ein GPS-Zittern eine neue Abfrage auslöst.
 */
export function placesCacheKey(
  lat: number,
  lon: number,
  radiusM: number,
  types: readonly string[]
): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}|${Math.round(radiusM)}|${types
    .slice()
    .sort()
    .join(",")}`;
}

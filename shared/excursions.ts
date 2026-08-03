/**
 * Ausflugfinder-Anbindung (#271): Aufbereitung der Ausflugsziele aus der
 * eigenen Ausflugfinder-App (Supabase/PostgREST) für Karte und Platz-Dossier.
 *
 * Diese Datei enthält NUR reine Logik – kein Netz, kein DOM: den Bau der
 * PostgREST-Abfrage, das defensive Lesen der Antwort und alles, was die
 * Anzeige braucht (Saisonen, Kostenstufe, Titelbild, Distanz-Sortierung).
 * Der eigentliche Abruf samt Zwischenspeicher liegt in server/excursions.ts,
 * die Texte der Ausflüge selbst sind Nutzerdaten und bleiben einsprachig
 * Deutsch – übersetzt wird nur die UI rundherum.
 *
 * Defensiv gelesen wird aus zwei Gründen: Die Tabelle wird von einer anderen
 * App gepflegt (Felder können dazukommen oder null sein), und die eingebetteten
 * Beziehungen liefert PostgREST je nach Abfrage in verschiedenen Formen.
 */
import { distanceMeters } from "./geo";

/** Tabellen- und Spaltennamen der Ausflugfinder-Datenbank (PostgREST). */
export const EXCURSIONS_TABLE = "ausfluege";

/**
 * Ein Abruf holt alles: Ausflug, Fotos und Kategorien über die
 * Verknüpfungstabelle. Mehr Abrufe würde die Quelle unnötig belasten.
 */
export const EXCURSIONS_SELECT =
  "*,ausfluege_fotos(full_url,is_primary),ausflug_kategorien(kategorien(name))";

/**
 * Ausweich-Abfrage ohne Kategorien: Sollte die verschachtelte Einbettung von
 * der Quelle abgelehnt werden (umbenannte Verknüpfungstabelle, fehlende
 * Beziehung), kommen wenigstens Ausflüge und Fotos an. Als Kategorie dient
 * dann das Textfeld `kategorie_alt`.
 */
export const EXCURSIONS_SELECT_WITHOUT_CATEGORIES =
  "*,ausfluege_fotos(full_url,is_primary)";

/**
 * Obergrenze eines Abrufs. Die Datenbank umfasst derzeit gut 70 Ziele – das
 * Limit ist reine Vorsorge, damit ein Abruf nie unbegrenzt gross wird.
 */
export const EXCURSIONS_FETCH_LIMIT = 500;

/** Kein Filter auf `status`: Ausdrücklicher Wunsch – ALLE Ziele erscheinen. */
export function excursionsRequestUrl(
  baseUrl: string,
  select: string = EXCURSIONS_SELECT,
  limit: number = EXCURSIONS_FETCH_LIMIT
): string {
  // Sowohl «https://xy.supabase.co» als auch «https://xy.supabase.co/rest/v1/»
  // sollen funktionieren – der Wert steht in einer .env von Hand.
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  const root = /\/rest\/v1$/.test(trimmed) ? trimmed : `${trimmed}/rest/v1`;
  const params = new URLSearchParams({
    select,
    order: "name.asc",
    limit: String(limit),
  });
  return `${root}/${EXCURSIONS_TABLE}?${params.toString()}`;
}

// ---- Saisonen --------------------------------------------------------------

/** Jahreszeiten-Schlüssel, wie sie die Ausflugfinder-App in einem CSV-Feld ablegt. */
export const SEASON_KEYS = ["spring", "summer", "autumn", "winter"] as const;

export type SeasonKey = (typeof SEASON_KEYS)[number];

/** Schreibweisen, die in den Daten vorkommen können, auf den Schlüssel abbilden. */
const SEASON_ALIASES: Record<string, SeasonKey> = {
  spring: "spring",
  fruehling: "spring",
  frühling: "spring",
  summer: "summer",
  sommer: "summer",
  autumn: "autumn",
  fall: "autumn",
  herbst: "autumn",
  winter: "winter",
};

/**
 * Das CSV-Feld `jahreszeiten` («spring,summer,autumn») in Schlüssel übersetzen.
 * Unbekannte Bruchstücke werden verworfen statt geraten, Doppelte fallen weg,
 * die Reihenfolge ist immer die des Jahres – nicht die der Zeichenkette.
 */
export function parseSeasons(value: unknown): SeasonKey[] {
  if (typeof value !== "string") return [];
  const found = new Set<SeasonKey>();
  value.split(/[,;/|]/).forEach(part => {
    const key = SEASON_ALIASES[part.trim().toLowerCase()];
    if (key) found.add(key);
  });
  return SEASON_KEYS.filter(key => found.has(key));
}

// ---- Kostenstufe -----------------------------------------------------------

/** Höchste Kostenstufe der Ausflugfinder-App (0 = gratis, 4 = teuer). */
export const MAX_COST_LEVEL = 4;

/** Kostenstufe säubern: alles ausserhalb 0–4 oder Unbrauchbares wird `null`. */
export function normalizeCostLevel(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : value;
  if (typeof num !== "number" || !Number.isFinite(num)) return null;
  const rounded = Math.round(num);
  if (rounded < 0 || rounded > MAX_COST_LEVEL) return null;
  return rounded;
}

/**
 * Kostenstufe als «CHF»-Symbole: 3 → «CHF CHF CHF». Stufe 0 ergibt eine leere
 * Zeichenkette (die Oberfläche schreibt dort «gratis»), unbekannt ergibt
 * `null` – dann steht gar nichts da statt einer geratenen Stufe.
 */
export function costLevelSymbols(
  level: number | null | undefined
): string | null {
  const normalized = normalizeCostLevel(level ?? null);
  if (normalized === null) return null;
  return new Array(normalized).fill("CHF").join(" ");
}

// ---- Rohdaten lesen --------------------------------------------------------

/** Form der Tour, sofern die Daten sie kennen. */
export type TourShape = "loop" | "aToB";

/** Ein Ausflugsziel, fertig aufbereitet für Karte und Dossier. */
export interface Excursion {
  /** Id der Quelle als Zeichenkette – sie dient nur als Schlüssel. */
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  country: string | null;
  region: string | null;
  /** Kategorien-Namen, ohne Doppelte; Ersatz ist das Textfeld `kategorie_alt`. */
  categories: string[];
  seasons: SeasonKey[];
  /** 0–4, oder `null` wenn die Quelle nichts sagt. */
  costLevel: number | null;
  parking: string | null;
  parkingFree: boolean | null;
  websiteUrl: string | null;
  latitude: number;
  longitude: number;
  niceToKnow: string | null;
  openingHours: string | null;
  /** Länge der Tour in Kilometern, sofern gepflegt. */
  lengthKm: number | null;
  tourShape: TourShape | null;
  ageAdvice: string | null;
  suitableForBabies: boolean;
  /** Titelbild: das als «primary» markierte Foto, sonst das erste. */
  photoUrl: string | null;
  /** Alle Bild-Adressen (Titelbild zuerst). */
  photoUrls: string[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Text säubern: leere und reine Leerzeichen-Felder gelten als «nicht gepflegt». */
function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function num(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

function bool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * Nur http(s) wird als Website übernommen – so landet kein `javascript:`-Link
 * aus den Daten in einem Anker der Oberfläche.
 */
function webUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : null;
}

/**
 * Titelbild wählen: das mit `is_primary` markierte Foto gewinnt, sonst das
 * erste mit brauchbarer Adresse. Ohne Fotos bleibt es bei `null`.
 */
export function primaryPhotoUrl(photos: unknown): string | null {
  return photoUrls(photos)[0] ?? null;
}

/** Alle Bild-Adressen, Titelbild zuerst, ohne Doppelte und ohne Leereinträge. */
export function photoUrls(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  const primary: string[] = [];
  const rest: string[] = [];
  photos.forEach(entry => {
    const row = asRecord(entry);
    if (!row) return;
    const url = webUrl(row.full_url);
    if (!url) return;
    if (bool(row.is_primary) === true) primary.push(url);
    else rest.push(url);
  });
  const seen = new Set<string>();
  const result: string[] = [];
  primary.concat(rest).forEach(url => {
    if (seen.has(url)) return;
    seen.add(url);
    result.push(url);
  });
  return result;
}

/**
 * Kategorien aus der Antwort klauben. PostgREST liefert die Verknüpfung je
 * nach Abfrage als `ausflug_kategorien: [{ kategorien: { name } }]` oder
 * direkt als `kategorien: [{ name }]` – beides wird gelesen. Fehlt beides,
 * dient das Textfeld `kategorie_alt` als Ersatz.
 */
export function excursionCategories(row: Record<string, unknown>): string[] {
  const names: string[] = [];
  const collect = (value: unknown): void => {
    const record = asRecord(value);
    if (!record) return;
    const name = text(record.name);
    if (name) names.push(name);
  };
  const links = row.ausflug_kategorien;
  if (Array.isArray(links)) {
    links.forEach(link => {
      const record = asRecord(link);
      if (!record) return;
      const nested = record.kategorien;
      if (Array.isArray(nested)) nested.forEach(collect);
      else collect(nested);
    });
  }
  const direct = row.kategorien;
  if (Array.isArray(direct)) direct.forEach(collect);
  else if (direct !== undefined) collect(direct);

  if (names.length === 0) {
    const fallback = text(row.kategorie_alt);
    if (fallback) names.push(fallback);
  }
  const seen = new Set<string>();
  return names.filter(name => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Rundtour oder von A nach B – nur wenn die Daten eindeutig sind. */
function tourShapeOf(row: Record<string, unknown>): TourShape | null {
  if (bool(row.is_rundtour) === true) return "loop";
  if (bool(row.is_von_a_nach_b) === true) return "aToB";
  return null;
}

/** Eine einzelne Zeile lesen – ohne Name oder ohne Koordinaten: unbrauchbar. */
export function parseExcursion(value: unknown): Excursion | null {
  const row = asRecord(value);
  if (!row) return null;
  const latitude = num(row.lat);
  const longitude = num(row.lng);
  if (latitude === null || longitude === null) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const name = text(row.name);
  if (!name) return null;
  const id = text(row.id) ?? (num(row.id) !== null ? String(row.id) : null);
  if (!id) return null;
  const urls = photoUrls(row.ausfluege_fotos);
  return {
    id,
    name,
    description: text(row.beschreibung),
    address: text(row.adresse),
    country: text(row.land),
    region: text(row.region),
    categories: excursionCategories(row),
    seasons: parseSeasons(row.jahreszeiten),
    costLevel: normalizeCostLevel(row.kosten_stufe),
    parking: text(row.parkplatz),
    parkingFree: bool(row.parkplatz_kostenlos),
    websiteUrl: webUrl(row.website_url),
    latitude,
    longitude,
    niceToKnow: text(row.nice_to_know),
    openingHours: text(row.opening_hours),
    lengthKm: num(row.distanz_km),
    tourShape: tourShapeOf(row),
    ageAdvice: text(row.altersempfehlung),
    suitableForBabies: bool(row.suitable_for_babies) === true,
    photoUrl: urls[0] ?? null,
    photoUrls: urls,
  };
}

/**
 * Antwort der Quelle lesen. Unbrauchbare Zeilen (kein Name, keine Koordinaten)
 * fallen still weg – lieber ein Ziel weniger als ein Pin im Nirgendwo.
 */
export function parseExcursions(value: unknown): Excursion[] {
  if (!Array.isArray(value)) return [];
  const result: Excursion[] = [];
  value.forEach(entry => {
    const excursion = parseExcursion(entry);
    if (excursion) result.push(excursion);
  });
  return result;
}

// ---- Distanz & Auswahl -----------------------------------------------------

/** Ein Ausflug samt Luftlinie zum Bezugspunkt. */
export interface ExcursionDistance {
  excursion: Excursion;
  /** Luftlinie in Metern. */
  distanceM: number;
}

/** Luftlinie vom Bezugspunkt zum Ausflug in Metern. */
export function excursionDistanceM(
  excursion: Excursion,
  latitude: number,
  longitude: number
): number {
  return distanceMeters(
    latitude,
    longitude,
    excursion.latitude,
    excursion.longitude
  );
}

/**
 * Alle Ausflüge nach Luftlinie zum Bezugspunkt sortieren. Bei gleicher Distanz
 * entscheidet der Name, damit die Reihenfolge stabil bleibt.
 */
export function sortByDistance(
  list: readonly Excursion[],
  latitude: number,
  longitude: number
): ExcursionDistance[] {
  return list
    .map(excursion => ({
      excursion,
      distanceM: excursionDistanceM(excursion, latitude, longitude),
    }))
    .sort(
      (a, b) =>
        a.distanceM - b.distanceM ||
        a.excursion.name.localeCompare(b.excursion.name)
    );
}

/** Die nächstgelegenen Ausflüge – für den Abschnitt im Platz-Dossier. */
export function nearestExcursions(
  list: readonly Excursion[],
  latitude: number,
  longitude: number,
  limit: number
): ExcursionDistance[] {
  if (limit <= 0) return [];
  return sortByDistance(list, latitude, longitude).slice(0, limit);
}

/**
 * Ausflugfinder-Anbindung (#271): Abruf der Ausflugsziele aus der Supabase-
 * Datenbank der eigenen Ausflugfinder-App – serverseitig, nie aus dem Browser.
 *
 * Serverseitig aus drei Gründen: Der Zugriffsschlüssel bleibt auf dem Server
 * und steht nicht im Bundle; ein Abruf dient allen Geräten gleichzeitig
 * (Zwischenspeicher im Prozess, wie bei ISS-Überflügen und Hydrodaten); und
 * die Rohantwort wird hier auf das reduziert, was die Oberfläche wirklich
 * braucht.
 *
 * Ohne die beiden Umgebungsvariablen ist das Feature schlicht nicht
 * eingerichtet: `isExcursionsConfigured()` meldet `false`, die Oberfläche
 * blendet den Bereich komplett aus – kein Fehlerzustand, keine leere Liste
 * mit Fragezeichen.
 */
import { ENV } from "./_core/env";
import {
  excursionsRequestUrl,
  parseExcursions,
  EXCURSIONS_SELECT,
  EXCURSIONS_SELECT_WITHOUT_CATEGORIES,
  type Excursion,
} from "@shared/excursions";

/**
 * Wie lange ein Abruf gilt. Ausflugsziele ändern selten – zwölf Minuten sind
 * frisch genug und halten die Quelle aus dem Weg.
 */
const CACHE_TTL_MS = 12 * 60 * 1000;

/** Zeitlimit des Abrufs: lieber ohne Ausflüge als mit hängender Seite. */
const FETCH_TIMEOUT_MS = 8000;

interface CacheEntry {
  expiresAt: number;
  excursions: Excursion[];
}

/**
 * Ein einziger Eintrag – anders als bei ortsabhängigen Quellen holt dieser
 * Abruf immer denselben, vollständigen Datenbestand.
 */
let cache: CacheEntry | null = null;

/**
 * Läuft gerade ein Abruf, hängen sich weitere Anfragen an ihn an, statt die
 * Quelle mehrfach parallel zu treffen (typisch beim Öffnen der Karte auf
 * mehreren Geräten kurz nacheinander).
 */
let inFlight: Promise<Excursion[]> | null = null;

/** Ist die Anbindung überhaupt eingerichtet (beide Umgebungsvariablen gesetzt)? */
export function isExcursionsConfigured(): boolean {
  return (
    ENV.excursionsUrl.trim().length > 0 &&
    ENV.excursionsAnonKey.trim().length > 0
  );
}

/** Nur für Tests und Entwicklung: Zwischenspeicher leeren. */
export function clearExcursionsCache(): void {
  cache = null;
  inFlight = null;
}

/** Ein PostgREST-Abruf mit dem gewünschten `select`. */
async function requestExcursions(select: string): Promise<Excursion[]> {
  const res = await fetch(excursionsRequestUrl(ENV.excursionsUrl, select), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      accept: "application/json",
      apikey: ENV.excursionsAnonKey,
      authorization: `Bearer ${ENV.excursionsAnonKey}`,
    },
  });
  if (!res.ok) throw new Error(`ausflugfinder ${res.status}`);
  return parseExcursions(await res.json());
}

/** Frisch bei der Quelle nachfragen – mit Ausweich-Abfrage ohne Kategorien. */
async function loadExcursions(): Promise<Excursion[]> {
  try {
    return await requestExcursions(EXCURSIONS_SELECT);
  } catch {
    // Die verschachtelte Kategorien-Einbettung ist der einzige Teil der
    // Abfrage, der an der Datenbank scheitern kann. Ohne sie sind Ausflüge
    // und Fotos immer noch da – als Kategorie dient dann `kategorie_alt`.
    return await requestExcursions(EXCURSIONS_SELECT_WITHOUT_CATEGORIES);
  }
}

/**
 * Alle Ausflugsziele holen. Nicht eingerichtet oder Quelle stumm heisst leere
 * Liste; ein vorhandener, gerade abgelaufener Stand ist besser als nichts.
 */
export async function fetchExcursions(): Promise<Excursion[]> {
  if (!isExcursionsConfigured()) return [];
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.excursions;
  if (inFlight) return inFlight;

  const stale = cache;
  inFlight = loadExcursions()
    .then(excursions => {
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, excursions };
      return excursions;
    })
    .catch(() => {
      // Ein Ausfall der Quelle darf Karte und Dossier nicht mitreissen.
      if (stale) return stale.excursions;
      return [];
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

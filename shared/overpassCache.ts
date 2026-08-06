/**
 * Warum die Feuerstellen auf der Karte langsam waren – und was hilft (#339).
 *
 * DREI URSACHEN, alle unabhängig voneinander:
 *
 * 1. JEDE SUCHE WAR EINE NEUE ANFRAGE. Wer den Ausschnitt verschob und
 *    zurückkam, wartete wieder von vorn. Overpass rechnet je nach Gebiet
 *    Sekunden, und die Antwort war eine Sekunde vorher schon da gewesen.
 *
 * 2. DREI EBENEN = DREI ANFRAGEN. Zeltplätze, Feuerstellen und
 *    Familien-Orte gingen als drei getrennte Abfragen an DENSELBEN
 *    Spiegel-Server, gleichzeitig. Overpass begrenzt pro IP; zwei davon
 *    liefen also ins Rate-Limit, warteten den Timeout ab und fingen beim
 *    nächsten Spiegel von vorn an. Aus einer Suche wurden bis
 *    zu neun Anfragen. Overpass kann alle drei Arten in EINER Abfrage
 *    beantworten – die Element-Liste wird schlicht aneinandergehängt.
 *
 * 3. DIE SPIEGEL WURDEN IMMER IN DERSELBEN REIHENFOLGE PROBIERT. Ist der
 *    erste an diesem Tag lahm, zahlt jede einzelne Suche seinen ganzen
 *    Timeout, bevor der zweite drankommt.
 *
 * DIESE DATEI löst 1 und 3: Schlüssel für den Zwischenspeicher, Ablauf,
 * Verdrängung und die Merkregel für den zuletzt schnellen Spiegel. Der
 * Speicher selbst (localStorage) und der Abruf stehen im Client – hier
 * ist nur die Rechnung, damit sie geprüft werden kann.
 *
 * WARUM DER AUSSCHNITT GERUNDET WIRD: Eine Karte liefert bei jedem
 * Verschieben andere Nachkommastellen. Ohne Rundung wäre jeder Schlüssel
 * neu und der Zwischenspeicher nutzlos. Gerundet wird auf ein Raster von
 * `BBOX_GRID_DEG`, und zwar nach AUSSEN – der gespeicherte Ausschnitt ist
 * also immer mindestens so gross wie der gefragte, nie kleiner. Ein zu
 * kleiner Ausschnitt liesse am Rand Stellen fehlen, ohne dass es auffällt.
 */

/**
 * Rasterweite in Grad, auf die ein Ausschnitt gerundet wird.
 *
 * 0,02° sind in der Schweiz gut 2 km in Nord-Süd-Richtung – fein genug,
 * dass der Zwischenspeicher nicht ein halbes Land umfasst, grob genug,
 * dass kleines Schieben denselben Schlüssel trifft.
 */
export const BBOX_GRID_DEG = 0.02;

/** So lange gilt eine Antwort als frisch. Feuerstellen wandern nicht. */
export const OVERPASS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Mehr Einträge behält der Zwischenspeicher nicht. */
export const OVERPASS_CACHE_LIMIT = 30;

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

const floorTo = (value: number, grid: number) =>
  Math.floor(value / grid) * grid;
const ceilTo = (value: number, grid: number) => Math.ceil(value / grid) * grid;

/**
 * Den Ausschnitt nach aussen auf das Raster runden.
 *
 * Der gerundete Ausschnitt enthält den ursprünglichen vollständig – so
 * fehlt am Rand nichts, wenn eine gespeicherte Antwort wiederverwendet
 * wird.
 */
export function snapBBox(box: BBox, grid = BBOX_GRID_DEG): BBox {
  return {
    south: floorTo(box.south, grid),
    west: floorTo(box.west, grid),
    north: ceilTo(box.north, grid),
    east: ceilTo(box.east, grid),
  };
}

/** Schlüssel für Ausschnitt + abgefragte Arten. */
export function overpassCacheKey(box: BBox, kinds: readonly string[]): string {
  const s = snapBBox(box);
  const round = (v: number) => v.toFixed(3);
  return [
    [...kinds].sort().join("+"),
    round(s.south),
    round(s.west),
    round(s.north),
    round(s.east),
  ].join("|");
}

export interface CacheEntry<T> {
  at: number;
  data: T;
}

/** Ist der Eintrag noch frisch? */
export function isFresh(
  entry: { at: number } | undefined,
  now: number,
  ttlMs = OVERPASS_CACHE_TTL_MS
): boolean {
  if (!entry) return false;
  // Ein Eintrag aus der Zukunft ist kaputt (Uhr verstellt) – lieber neu
  // holen als ihn ewig für frisch zu halten.
  if (entry.at > now) return false;
  return now - entry.at < ttlMs;
}

/**
 * Einen Eintrag hinzufügen und den Speicher begrenzen.
 *
 * Verdrängt wird der ÄLTESTE, nicht der zuletzt ungenutzte: Wer die Karte
 * benutzt, schaut sich meist eine Gegend an; die Reihenfolge des
 * Hinzufügens bildet das gut genug ab, ohne dass bei jedem Treffer
 * geschrieben werden muss.
 */
export function putCacheEntry<T>(
  store: Record<string, CacheEntry<T>>,
  key: string,
  data: T,
  now: number,
  limit = OVERPASS_CACHE_LIMIT
): Record<string, CacheEntry<T>> {
  const next: Record<string, CacheEntry<T>> = {
    ...store,
    [key]: { at: now, data },
  };
  const keys = Object.keys(next);
  if (keys.length <= limit) return next;
  const oldest = keys
    .sort((a, b) => next[a].at - next[b].at)
    .slice(0, keys.length - limit);
  for (const key of oldest) delete next[key];
  return next;
}

/**
 * Die Spiegel-Server so ordnen, dass der zuletzt erfolgreiche zuerst
 * kommt.
 *
 * Unbekannte oder abgeschaltete Adressen fallen weg: Ein gemerkter Name
 * ist nur ein Vorschlag, keine Erlaubnis, an der Liste vorbei zu fragen.
 */
export function orderEndpoints(
  endpoints: readonly string[],
  preferred: string | null
): string[] {
  if (!preferred || !endpoints.includes(preferred)) return [...endpoints];
  return [preferred, ...endpoints.filter(url => url !== preferred)];
}

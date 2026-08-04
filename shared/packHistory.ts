/**
 * Packvorschlag aus vergangenen Reisen (#277): «Das hattest du letztes
 * Mal am selben Platz dabei.»
 *
 * Der Nutzen liegt nicht in einer weiteren Standardliste – davon gibt es
 * genug –, sondern in der EIGENEN Erfahrung: Wer am Waldplatz jedes Mal
 * die Gummistiefel gebraucht hat und sie einmal vergessen hat, weiss es
 * beim nächsten Mal wieder nicht. Vorgeschlagen wird deshalb nur, was
 * auf FRÜHEREN Listen desselben Platzes wirklich stand.
 *
 * ZWEI ENTSCHEIDUNGEN prägen das Modul:
 *
 * 1. Gezählt wird pro REISE, nicht pro Eintrag. Ein Gegenstand, der auf
 *    einer Liste dreimal vorkommt («Batterien» in drei Kategorien), ist
 *    trotzdem eine Erfahrung und nicht drei.
 * 2. Verglichen wird über einen NORMALISIERTEN Namen (klein, ohne
 *    Mehrfach-Leerzeichen, ohne Umlaut-Unterschiede). «Gummistiefel» und
 *    «gummistiefel  » sind derselbe Gegenstand; alles Weitergehende
 *    (Wortstämme, Synonyme) würde raten.
 */

/** Ein Eintrag einer früheren Packliste, so weit hier relevant. */
export interface HistoryItem {
  listId: number;
  name: string;
  category: string;
}

/** Eine frühere Reise mit ihrer Packliste. */
export interface HistoryTrip {
  tripId: number;
  packListId: number;
  /** Anreise als ISO-Datum – bestimmt, was «letztes Mal» heisst. */
  startDate: string;
}

export interface PackSuggestion {
  name: string;
  category: string;
  /** Auf wie vielen früheren Reisen an diesem Platz der Gegenstand stand. */
  trips: number;
  /** Anreise-Datum der jüngsten Reise mit diesem Gegenstand. */
  lastSeen: string;
}

/** So viele Vorschläge zeigt die Ansicht – mehr ist keine Hilfe mehr. */
export const MAX_PACK_SUGGESTIONS = 15;

/**
 * Namen vergleichbar machen: klein, getrimmt, Mehrfach-Leerzeichen weg.
 * Umlaute werden gefaltet, damit «Müsli» und «Muesli» zusammenfallen –
 * dieselbe Faltung wie in der globalen Suche.
 */
export function normalizeItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}

/**
 * Vorschläge aus der Historie, ohne das, was schon auf der aktuellen
 * Liste steht.
 *
 * Sortiert nach Häufigkeit (was jedes Mal dabei war, steht oben), bei
 * Gleichstand nach dem jüngsten Vorkommen und zuletzt alphabetisch –
 * damit die Reihenfolge stabil bleibt und nicht von der Datenbank
 * abhängt.
 */
export function packSuggestions(
  trips: readonly HistoryTrip[],
  items: readonly HistoryItem[],
  currentItems: readonly { name: string }[],
  limit = MAX_PACK_SUGGESTIONS
): PackSuggestion[] {
  if (trips.length === 0 || items.length === 0) return [];

  const tripByList = new Map<number, HistoryTrip>();
  for (const trip of trips) tripByList.set(trip.packListId, trip);

  const already = new Set(
    currentItems.map(item => normalizeItemName(item.name))
  );

  /** Pro Gegenstand: die Reisen, auf denen er stand. */
  const byKey = new Map<
    string,
    { name: string; category: string; tripIds: Set<number>; lastSeen: string }
  >();

  for (const item of items) {
    const trip = tripByList.get(item.listId);
    if (!trip) continue;
    const key = normalizeItemName(item.name);
    if (key.length === 0 || already.has(key)) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.tripIds.add(trip.tripId);
      if (trip.startDate > existing.lastSeen) {
        existing.lastSeen = trip.startDate;
        // Die Schreibweise der jüngsten Reise gewinnt – so heisst der
        // Vorschlag so, wie man ihn zuletzt selbst geschrieben hat
        existing.name = item.name.trim();
        existing.category = item.category;
      }
    } else {
      byKey.set(key, {
        name: item.name.trim(),
        category: item.category,
        tripIds: new Set([trip.tripId]),
        lastSeen: trip.startDate,
      });
    }
  }

  const result: PackSuggestion[] = [];
  byKey.forEach(entry => {
    result.push({
      name: entry.name,
      category: entry.category,
      trips: entry.tripIds.size,
      lastSeen: entry.lastSeen,
    });
  });

  return result
    .sort(
      (a, b) =>
        b.trips - a.trips ||
        (a.lastSeen < b.lastSeen ? 1 : a.lastSeen > b.lastSeen ? -1 : 0) ||
        a.name.localeCompare(b.name)
    )
    .slice(0, Math.max(0, limit));
}

/**
 * Wie oft war der Gegenstand dabei – als Verhältnis zur Zahl der
 * ausgewerteten Reisen. Damit lässt sich «jedes Mal dabei» von
 * «einmal dabei» unterscheiden, ohne die Zahlen selbst zu deuten.
 */
export function suggestionShare(
  suggestion: PackSuggestion,
  tripCount: number
): number {
  if (tripCount <= 0) return 0;
  return Math.min(1, suggestion.trips / tripCount);
}

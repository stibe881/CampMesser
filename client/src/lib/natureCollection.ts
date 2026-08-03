/**
 * Arten-Sammelalbum: verknüpft die eigenen Beobachtungen mit den Einträgen des
 * Natur-Lexikons und leitet daraus den Sammel-Fortschritt ab («12 von 16 Arten
 * beobachtet»). Reine Logik ohne React – dadurch unabhängig testbar.
 */
import type { NatureEntry } from "@/data/nature";

/** Minimalform einer Beobachtung, wie sie sightings.list liefert. */
export interface CollectionSighting {
  /** Verknüpfter Lexikon-Eintrag – null, wenn frei erfasst. */
  entryId: string | null;
  /** Datum der Sichtung als ISO-String (YYYY-MM-DD). */
  sightedAt: string;
}

export interface CollectionItem {
  entry: NatureEntry;
  /** Datum der ERSTEN Sichtung (ISO) oder null, wenn noch nie beobachtet. */
  firstSeen: string | null;
  /** Anzahl Beobachtungen dieser Art. */
  count: number;
}

export interface CollectionProgress {
  /** Alle Lexikon-Arten in der Reihenfolge der Daten. */
  items: CollectionItem[];
  /** Anzahl beobachteter Arten. */
  seenCount: number;
  /** Anzahl Arten im Lexikon. */
  total: number;
  /** Anteil beobachteter Arten (0–1; 0 bei leerem Lexikon). */
  ratio: number;
}

/**
 * Sammel-Fortschritt aus Lexikon-Einträgen und Beobachtungen.
 * Beobachtungen ohne Verknüpfung oder mit unbekannter entryId werden bewusst
 * ignoriert – gezählt wird nur, was sich einer Lexikon-Art zuordnen lässt.
 * Bei mehreren Sichtungen derselben Art gewinnt die früheste als Datum
 * (ISO-Strings lassen sich dafür direkt vergleichen).
 */
export function collectionProgress(
  entries: NatureEntry[],
  sightings: CollectionSighting[]
): CollectionProgress {
  const known: Record<string, { first: string | null; count: number }> = {};
  entries.forEach(entry => {
    known[entry.id] = { first: null, count: 0 };
  });
  sightings.forEach(sighting => {
    if (!sighting.entryId) return;
    const slot = known[sighting.entryId];
    if (!slot) return;
    slot.count += 1;
    if (slot.first === null || sighting.sightedAt < slot.first) {
      slot.first = sighting.sightedAt;
    }
  });

  const items = entries.map(entry => ({
    entry,
    firstSeen: known[entry.id].first,
    count: known[entry.id].count,
  }));
  const seenCount = items.filter(item => item.firstSeen !== null).length;
  return {
    items,
    seenCount,
    total: entries.length,
    ratio: entries.length === 0 ? 0 : seenCount / entries.length,
  };
}

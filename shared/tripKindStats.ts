/**
 * Statistik nach Reise-Art (#467): Wie viele Reisen und Nächte stecken
 * pro Art im Tagebuch? Reine Rechnung auf der Reiseliste – Kosten
 * bleiben bewusst draussen, die hängen an der Reisekasse und nicht an
 * der Art.
 */
import { tripNights } from "./trips";
import { normalizeTripKind, TRIP_KINDS, type TripKind } from "./tripKind";

export interface TripKindRow {
  kind: TripKind;
  /** Anzahl Reisen dieser Art. */
  trips: number;
  /** Übernachtungen dieser Art (Tagesausflüge zählen 0). */
  nights: number;
}

/**
 * Reisen nach Art zusammenzählen – nur Arten, die vorkommen, sortiert
 * nach Nächten (dann Reisen) absteigend; bei Gleichstand entscheidet
 * die Katalog-Reihenfolge, damit das Ergebnis stabil und testbar ist.
 */
export function tripKindRows(
  trips: readonly {
    kind?: string | null;
    startDate: string;
    endDate: string;
  }[]
): TripKindRow[] {
  const rows = new Map<TripKind, TripKindRow>();
  for (const trip of trips) {
    const kind = normalizeTripKind(trip.kind);
    const row = rows.get(kind) ?? { kind, trips: 0, nights: 0 };
    row.trips += 1;
    row.nights += Math.max(0, tripNights(trip.startDate, trip.endDate));
    rows.set(kind, row);
  }
  const order = new Map(TRIP_KINDS.map((kind, index) => [kind, index]));
  return Array.from(rows.values()).sort(
    (a, b) =>
      b.nights - a.nights ||
      b.trips - a.trips ||
      (order.get(a.kind) ?? 0) - (order.get(b.kind) ?? 0)
  );
}

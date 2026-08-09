/**
 * Reiseziel-Ideen nach Monat (#654): «Wohin im Oktober?» – beantwortet
 * aus den EIGENEN Reisen, nicht aus einem Katalog. Wer im Oktober schon
 * dreimal im Tessin war, hat seine Antwort meist selbst gegeben; die
 * Liste ruft sie in Erinnerung, mit Nächten und letztem Besuchsjahr.
 *
 * Reine Logik ohne DOM – testbar in server/monthIdeas.test.ts.
 */
import { tripNights, type TripLike } from "./trips";

export interface MonthIdea {
  place: string;
  /** Wie oft war man in diesem Monat dort? */
  visits: number;
  /** Nächte über alle diese Besuche. */
  nights: number;
  /** Jahr des letzten Besuchs in diesem Monat. */
  lastYear: number;
}

/** Liegt mindestens ein Reisetag im Monat `month` (1–12)? */
export function tripTouchesMonth(trip: TripLike, month: number): boolean {
  const start = /^(\d{4})-(\d{2})/.exec(trip.startDate);
  const end = /^(\d{4})-(\d{2})/.exec(trip.endDate);
  if (!start || !end) return false;
  const startIndex = Number(start[1]) * 12 + Number(start[2]);
  const endIndex = Number(end[1]) * 12 + Number(end[2]);
  if (endIndex < startIndex) return false;
  // Über ein ganzes Jahr hinweg ist jeder Monat berührt
  if (endIndex - startIndex >= 11) return true;
  for (let i = startIndex; i <= endIndex; i++) {
    if (((i - 1) % 12) + 1 === month) return true;
  }
  return false;
}

/**
 * Ideen für den Monat: nach Platz zusammengefasst, meistbesuchte zuerst,
 * bei Gleichstand die mit mehr Nächten. Reisen ohne Platznamen zählen
 * nicht – eine Idee ohne Ort ist keine.
 */
export function ideasForMonth(
  trips: readonly TripLike[],
  month: number
): MonthIdea[] {
  const byPlace = new Map<string, MonthIdea>();
  trips.forEach(trip => {
    const place = (trip.placeName ?? "").trim();
    if (!place || !tripTouchesMonth(trip, month)) return;
    const year = Number(trip.startDate.slice(0, 4));
    const nights = Math.max(0, tripNights(trip.startDate, trip.endDate));
    const existing = byPlace.get(place);
    if (existing) {
      existing.visits += 1;
      existing.nights += nights;
      if (year > existing.lastYear) existing.lastYear = year;
      return;
    }
    byPlace.set(place, { place, visits: 1, nights, lastYear: year });
  });
  return Array.from(byPlace.values()).sort(
    (a, b) =>
      b.visits - a.visits || b.nights - a.nights || (a.place < b.place ? -1 : 1)
  );
}

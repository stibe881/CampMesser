import { trpc } from "@/lib/trpc";
import type { TripSectionCounts } from "@shared/tripSectionCounts";

/**
 * Die Zahl für den ZUGEKLAPPTEN Abschnitt einer Reise (#346).
 *
 * Jeder Abschnitt holt seine Einträge erst beim Aufklappen. Zugeklappt
 * wusste er darum nichts über sich – ein Dutzend gleich aussehender
 * Balken, von denen keiner verriet, ob etwas drin ist.
 *
 * Alle Abschnitte fragen hier dasselbe ab (ohne Eingabe, also derselbe
 * Schlüssel), und TanStack Query macht daraus EINE Anfrage für die ganze
 * Seite – auch bei zwanzig Reisen mit je fünf Balken.
 *
 * `undefined` heisst «noch nicht da», nicht «leer»: Der Aufrufer lässt das
 * Zeichen so lange weg, statt kurz eine 0 zu zeigen, die gleich wieder
 * verschwindet.
 */
export function useTripSectionCounts(
  tripId: number
): TripSectionCounts | undefined {
  const query = trpc.trips.counts.useQuery(undefined, { staleTime: 60_000 });
  return query.data?.find(row => row.tripId === tripId);
}

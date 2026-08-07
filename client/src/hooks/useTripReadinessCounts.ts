import { trpc } from "@/lib/trpc";
import { todayIso } from "@shared/localDate";
import type { TripReadinessCounts } from "@shared/tripReadinessCounts";

/**
 * Die Bereitschafts-Zahlen einer Reise, OHNE sie aufzuklappen (#362).
 *
 * Die Karte holt Packliste, Menüplan und Einkaufsliste erst beim
 * Aufklappen (`enabled: open`). Zugeklappt stand dort «Bereitschaft» und
 * sonst nichts – also klappte man jede Reise einzeln auf, nur um zu
 * sehen, wo noch etwas fehlt. Dieselbe Antwort wie beim
 * Reisekassen-Betrag (#345) und den Abschnitts-Zahlen (#346): EINE
 * Abfrage für ALLE Reisen, die sich alle Karten teilen.
 *
 * `today` gehört in den Abfrage-Schlüssel: Es begrenzt serverseitig auf
 * die noch nicht abgeschlossenen Reisen, und über Mitternacht hinweg soll
 * die Antwort nicht die von gestern bleiben.
 *
 * `undefined` heisst «noch nicht da», nicht «alles erledigt» – der
 * Aufrufer lässt das Zeichen so lange weg.
 */
export function useTripReadinessCounts(
  tripId: number
): TripReadinessCounts | undefined {
  const query = trpc.trips.readiness.useQuery(
    { today: todayIso() },
    { staleTime: 60_000 }
  );
  return query.data?.find(row => row.tripId === tripId);
}

/**
 * Die Höhe des laufenden Aufenthalts (#385).
 *
 * WOZU: `campSpots.elevationM` steht seit #212 in der Datenbank und wird
 * an genau einer Stelle gelesen. Wer auf 1800 m kocht, braucht diese Zahl
 * – aber er soll sie nicht suchen müssen, sondern die App soll wissen,
 * WO er gerade ist.
 *
 * GIBT NULL ZURÜCK, WENN NICHTS LÄUFT. Kein laufender Aufenthalt, kein
 * verknüpfter Platz, keine erfasste Höhe – in allen drei Fällen wird
 * nichts behauptet, und die Anzeige lässt den Hinweis weg. Eine
 * angenommene Höhe wäre schlechter als keine.
 *
 * DER TAG KOMMT AUS `useTodayIso` (#373/#375): Die App lebt in der
 * WebView tagelang, und ein einmal gelesenes Datum friert ein.
 */
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";
import { currentTripDay } from "@shared/trips";

export function useStayElevation(): {
  elevationM: number | null;
  spotName: string | null;
} {
  const today = useTodayIso();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    staleTime: 60_000,
  });

  const running = (tripsQuery.data ?? []).find(
    trip => currentTripDay(trip, today) !== null
  );
  if (!running?.spotId) return { elevationM: null, spotName: null };
  const spot = (spotsQuery.data ?? []).find(s => s.id === running.spotId);
  if (!spot || spot.elevationM === null || spot.elevationM === undefined) {
    return { elevationM: null, spotName: null };
  }
  return { elevationM: spot.elevationM, spotName: spot.name };
}

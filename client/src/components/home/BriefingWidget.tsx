/**
 * Aus Home.tsx herausgelöst (#419): Die Startseite war mit 2005 Zeilen
 * die grösste Datei im Client – die Widgets wohnen jetzt hier (Muster
 * wie Trips #322 und Profil #414).
 */
import MorningBriefing from "@/components/MorningBriefing";
import { currentTripDay } from "@shared/trips";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";

/**
 * Morgen-Briefing (#255): sucht den laufenden eigenen Aufenthalt und den
 * zugehörigen Zeltplatz und übergibt beides an die Karte. Läuft keine
 * Reise, wird gar nichts geladen – die Karte fragt sonst Menüplan und
 * Pinnwand einer Reise ab, die es nicht gibt.
 */
export default function BriefingWidget() {
  const { isAuthenticated } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = useTodayIso();
  const current = (tripsQuery.data ?? [])
    .filter(trip => trip.role === "owner")
    .filter(trip => currentTripDay(trip, today) !== null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  if (!current) return null;
  const spot =
    current.spotId != null
      ? spotsQuery.data?.find(s => s.id === current.spotId)
      : undefined;
  return (
    <MorningBriefing
      tripId={current.id}
      // Ohne Zeltplatz zählen die Reise-Koordinaten aus der Ortssuche
      // (#465) – Hotel- und Strandreisen bekommen so ihr Briefing-Wetter
      latitude={spot?.latitude ?? current.latitude ?? null}
      longitude={spot?.longitude ?? current.longitude ?? null}
      today={today}
      // Reise-Art (#475): Strandferien bekommen die Badewasser-Zeile
      tripKind={current.kind}
    />
  );
}

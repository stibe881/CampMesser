/**
 * Fahrzeit mit Verkehrslage (Nutzerwunsch 04.08.2026).
 *
 * Der Haken fragt den Server, der wiederum Google fragt – der Schlüssel
 * bleibt dort. Kommt nichts zurück (nicht eingerichtet, kein Netz, Dienst
 * antwortet nicht), meldet der Haken `durationS: null`, und die Ansicht
 * rechnet mit der OSRM-Fahrzeit weiter, die sie ohnehin schon hat.
 *
 * WAS VON GOOGLE KOMMT: Fahrzeit UND Streckenlänge – aber beides nur als
 * Zahl im Text. Die beiden gehören zusammen: Es ist DIE Route, die Google
 * gerechnet hat, und eine Fahrzeit von Google mit einer Streckenlänge von
 * OSRM danebenzustellen ergibt ein Tempo, das keiner der beiden Dienste je
 * behauptet hat.
 *
 * WAS NICHT VON GOOGLE KOMMT: der VERLAUF der Route. Alles, was auf der
 * Karte gezeichnet oder als Stützstelle abgetastet wird, stammt weiterhin
 * aus OSRM – die Nutzungsbedingungen von Google untersagen es, ihre
 * Geometrie auf einer fremden Karte zu zeigen (siehe
 * `shared/googleRoutes.ts`).
 */
import { trpc } from "@/lib/trpc";
import type { GeoPoint } from "@shared/hiking";

export interface DriveTimeResult {
  /** Fahrzeit in Sekunden mit Verkehr, oder null. */
  durationS: number | null;
  /** Länge DERSELBEN Route in Metern, oder null. */
  distanceM: number | null;
  /** Steckt in dieser Zahl die Verkehrslage? Gehört sichtbar dazugeschrieben. */
  withTraffic: boolean;
  /** Läuft die Abfrage gerade? */
  loading: boolean;
}

export function useDriveTime(
  from: GeoPoint | null,
  to: GeoPoint | null,
  options: { enabled?: boolean; departureAtMs?: number | null } = {}
): DriveTimeResult {
  const enabled = options.enabled !== false && from != null && to != null;
  const query = trpc.routing.driveTime.useQuery(
    {
      from: { lat: from?.lat ?? 0, lon: from?.lon ?? 0 },
      to: { lat: to?.lat ?? 0, lon: to?.lon ?? 0 },
      departureAtMs: options.departureAtMs ?? null,
    },
    {
      enabled,
      // Der Verkehr ändert sich – aber nicht im Sekundentakt. Fünf Minuten
      // frisch halten reicht und spart Abfragen beim Hin- und Herschalten.
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  );
  const durationS = query.data?.driveTime?.durationS ?? null;
  return {
    durationS,
    distanceM: query.data?.driveTime?.distanceM ?? null,
    withTraffic: durationS != null,
    loading: enabled && query.isLoading,
  };
}

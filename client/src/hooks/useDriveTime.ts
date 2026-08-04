/**
 * Fahrzeit mit Verkehrslage (Nutzerwunsch 04.08.2026).
 *
 * Der Haken fragt den Server, der wiederum Google fragt – der Schlüssel
 * bleibt dort. Kommt nichts zurück (nicht eingerichtet, kein Netz, Dienst
 * antwortet nicht), meldet der Haken `durationS: null`, und die Ansicht
 * rechnet mit der OSRM-Fahrzeit weiter, die sie ohnehin schon hat.
 *
 * WICHTIG für alle Aufrufer: Von Google kommt NUR diese Zahl. Strecke,
 * Verlauf und alles, was auf der Karte gezeichnet wird, stammt weiterhin
 * aus OSRM – siehe `shared/googleRoutes.ts`.
 */
import { trpc } from "@/lib/trpc";
import type { GeoPoint } from "@shared/hiking";

export interface DriveTimeResult {
  /** Fahrzeit in Sekunden mit Verkehr, oder null. */
  durationS: number | null;
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
    withTraffic: durationS != null,
    loading: enabled && query.isLoading,
  };
}

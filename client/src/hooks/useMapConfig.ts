/**
 * Karten-Konfiguration holen (Nutzerwunsch 04.08.2026).
 *
 * Der Browser-Schlüssel für Google Maps kommt vom Server, statt beim Bauen
 * ins Bündel geschrieben zu werden – so lässt er sich wechseln, ohne die
 * App neu zu bauen, und steht nicht im Repository.
 *
 * `ready` ist der Punkt, an dem eine Karte gebaut werden darf: entweder
 * ist der Schlüssel da, oder es steht fest, dass es keinen gibt (dann
 * zeichnet OpenStreetMap). Vorher zu bauen hiesse, die Karte gleich
 * wieder wegzuwerfen.
 */
import { trpc } from "@/lib/trpc";
import type { MapConfig } from "@/lib/mapEngine";

const NO_MAPS: MapConfig = { key: null, mapId: null };

export function useMapConfig(): { config: MapConfig; ready: boolean } {
  const query = trpc.routing.mapConfig.useQuery(undefined, {
    // Der Schlüssel ändert sich zwischen zwei Neustarts des Servers nicht
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
  return {
    config: query.data ?? NO_MAPS,
    // Auch ein Fehlschlag ist eine Antwort: dann eben OpenStreetMap
    ready: query.isSuccess || query.isError,
  };
}

/**
 * Wegstrecken für eine Fundort-Liste (#273, #247, #248, #238, #249, #271).
 *
 * Alle «in der Nähe»-Listen der App zeigten bisher die Luftlinie. Die ist
 * beim SUCHEN richtig (ein Radius um den Platz), beim ANZEIGEN aber
 * irreführend: Der Laden am anderen Flussufer ist fünfhundert Meter
 * entfernt und sechs Kilometer weit weg.
 *
 * Dieser Haken holt die Wegstrecken zu allen Treffern in EINER Abfrage
 * (OSRM-Tabellendienst) und liefert sie als Map. Die Liste selbst wird
 * mit `applyRouteDistances` (shared/routing.ts) neu geordnet – der
 * nächste Fundort ist der, zu dem man am wenigsten weit läuft oder fährt.
 *
 * Ohne Netz bleibt die Map leer; die Ansicht zeigt dann weiter die
 * Luftlinie und schreibt das auch dazu.
 */
import { useEffect, useRef, useState } from "react";
import { fetchPlaceDistances } from "@/lib/routing";
import type { RoutingProfile } from "@shared/routing";
import type { GeoPoint } from "@shared/hiking";

export interface RoutedDistances {
  /** Fundort-Id → Wegstrecke in Metern. Leer = keine Wegstrecken da. */
  byId: Map<string, number>;
  /** Läuft gerade eine Abfrage? */
  loading: boolean;
}

export function useRoutedDistances(
  origin: GeoPoint | null,
  targets: { id: string; lat: number; lon: number }[],
  profile: RoutingProfile
): RoutedDistances {
  const [byId, setById] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Die Liste selbst ändert bei jedem Rendern die Identität – verglichen
  // wird deshalb über die Ids, nicht über das Array
  const key = targets.map(t => t.id).join(",");

  useEffect(() => {
    abortRef.current?.abort();
    setById(new Map());
    if (!origin || targets.length === 0) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    void fetchPlaceDistances(origin, targets, profile, {
      signal: controller.signal,
    })
      .then(result => {
        if (!controller.signal.aborted) setById(result);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // targets steckt in `key`; origin wird über seine Koordinaten verglichen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, origin?.lat, origin?.lon, profile]);

  return { byId, loading };
}

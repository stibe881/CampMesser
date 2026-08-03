import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { LOCALE_TAGS, type Language } from "@shared/i18n";

/**
 * Höhe über Meer eines Zeltplatzes: Die Open-Meteo-Elevation-API liefert zu
 * Koordinaten die Geländehöhe in Metern. Der Wert ändert sich nie, deshalb
 * wird er einmalig geholt und still am Platz gespeichert – schlägt der Abruf
 * fehl, passiert schlicht nichts (kein Toast, keine Blockade).
 */

/** Anfrage-URL der Open-Meteo-Elevation-API (ohne Schlüssel nutzbar). */
export function elevationRequestUrl(
  latitude: number,
  longitude: number
): string {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
  });
  return `https://api.open-meteo.com/v1/elevation?${params.toString()}`;
}

/** Höhe in ganzen Metern – null bei Netz-, Format- oder Serverfehlern. */
export async function fetchElevation(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    const res = await fetch(elevationRequestUrl(latitude, longitude));
    if (!res.ok) return null;
    const json = await res.json();
    const raw = Array.isArray(json?.elevation) ? json.elevation[0] : undefined;
    if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
    return Math.round(raw);
  } catch {
    return null;
  }
}

/** Höhenangabe in der Zahlenschreibweise der App-Sprache (z. B. 1'240). */
export function formatElevation(elevationM: number, lang: Language): string {
  return new Intl.NumberFormat(LOCALE_TAGS[lang]).format(
    Math.round(elevationM)
  );
}

interface ElevationSpot {
  id: number;
  latitude: number;
  longitude: number;
  elevationM: number | null;
}

/**
 * Fehlt einem Platz die Höhe, wird sie im Hintergrund ermittelt und still
 * gespeichert. Pro Komponente wird jeder Platz höchstens einmal versucht;
 * der Erfolg landet direkt im Cache, damit kein Refetch-Karussell entsteht.
 */
export function useAutoElevation(spot: ElevationSpot | null | undefined): void {
  const utils = trpc.useUtils();
  const updateMutation = trpc.spots.update.useMutation();
  const attempted = useRef<Set<number>>(new Set());
  const mutateRef = useRef(updateMutation.mutate);
  mutateRef.current = updateMutation.mutate;
  const utilsRef = useRef(utils);
  utilsRef.current = utils;

  const id = spot?.id;
  const latitude = spot?.latitude;
  const longitude = spot?.longitude;
  const known = spot?.elevationM ?? null;

  useEffect(() => {
    if (
      id === undefined ||
      latitude === undefined ||
      longitude === undefined ||
      known !== null ||
      attempted.current.has(id)
    ) {
      return;
    }
    attempted.current.add(id);
    let cancelled = false;
    void fetchElevation(latitude, longitude).then(value => {
      if (cancelled || value === null) return;
      mutateRef.current(
        { id, elevationM: value },
        {
          onSuccess: () => {
            utilsRef.current.spots.list.setData(undefined, old =>
              old?.map(s => (s.id === id ? { ...s, elevationM: value } : s))
            );
          },
          onError: () => {
            // Höhe ist Beiwerk: still bleiben und beim nächsten Besuch erneut versuchen
          },
        }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [id, latitude, longitude, known]);
}

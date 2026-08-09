/**
 * Etappen einer Reise (#536): Eine Rundreise besteht aus mehreren Orten
 * mit je eigenem Von/Bis. Die Etappen hängen an der REISE (wie Journal
 * und Reisekasse) – Mitreisende dürfen mitplanen.
 *
 * Die Helfer hier sind reine Funktionen für Client, Server und Tests:
 * sortieren und «wo sind wir heute?» – die Heute-Ansicht nimmt die
 * Koordinaten der AKTUELLEN Etappe für Wetter und Umgebung.
 */

/** Obergrenze pro Reise – eine Rundreise, kein Streckenbuch. */
export const MAX_TRIP_STOPS = 12;
export const TRIP_STOP_NAME_MAX_LENGTH = 140;

export interface TripStopLike {
  startDate: string;
  endDate: string;
}

/** Nach Anreisedatum sortieren (bei Gleichstand nach Abreise) – stabil. */
export function sortTripStops<T extends TripStopLike>(stops: T[]): T[] {
  return stops
    .slice()
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        a.endDate.localeCompare(b.endDate)
    );
}

/**
 * Die Etappe, an der man HEUTE ist: ihr Zeitraum deckt den Tag ab
 * (An- und Abreisetag inklusive). Überlappen sich zwei – am Wechseltag
 * ist das der Normalfall –, gewinnt die später angetretene: Man ist am
 * zuletzt angefahrenen Ort, nicht mehr am verlassenen.
 */
export function currentTripStop<T extends TripStopLike>(
  stops: T[],
  todayIso: string
): T | null {
  let current: T | null = null;
  sortTripStops(stops).forEach(stop => {
    if (stop.startDate <= todayIso && todayIso <= stop.endDate) {
      current = stop;
    }
  });
  return current;
}

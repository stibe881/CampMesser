/**
 * Die Daten-Schritte des Offline-Pakets (#387), herausgelöst für #411.
 *
 * Zwei Aufrufer teilen sich dieselben Vorab-Ladungen: der Knopf in der
 * Reise (TripOfflinePrep, mit sichtbarem Zustand je Schritt) und das
 * stille Auffrischen beim App-Start kurz vor der Reise. Wären es zwei
 * Abschriften, holte eine davon irgendwann andere Daten als die andere –
 * und genau das merkt man erst im Funkloch.
 *
 * Der Zeitstempel je Reise liegt im localStorage: Er ist ein Merkmal
 * DIESES GERÄTS (welcher Browser hat die Daten im Speicher), nicht des
 * Kontos – auf dem Tablet daneben ist das Paket ja wirklich nicht da.
 */
import type { trpc } from "@/lib/trpc";

type TrpcUtils = ReturnType<typeof trpc.useUtils>;

const RECORDS_KEY = "campmesser.tripOfflineDataAt";

/** Je Reise: wann die Daten zuletzt geholt wurden (Millisekunden). */
export function loadPrepRecords(): Record<number, number> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return {};
    const records: Record<number, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (Number.isInteger(id) && typeof value === "number") {
        records[id] = value;
      }
    }
    return records;
  } catch {
    return {};
  }
}

/** Lauf festhalten – ein Fehler beim Speichern kostet nur die Frische. */
export function rememberPrepRun(tripId: number): void {
  try {
    const records = loadPrepRecords();
    records[tripId] = Date.now();
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Speicher blockiert – dann wird beim nächsten Öffnen erneut geholt
  }
}

/** Reise, Plätze, Mitreisende und die Fotos des Platzes vorladen. */
export async function prefetchTripCore(
  utils: TrpcUtils,
  tripId: number,
  spotId: number | null
): Promise<void> {
  await utils.trips.list.prefetch();
  await utils.spots.list.prefetch();
  await utils.trips.members.list.prefetch({ tripId });
  if (spotId !== null) {
    await utils.spots.photos.list.prefetch({ spotId });
  }
}

/** Packliste samt Fortschritt vorladen. */
export async function prefetchPackList(
  utils: TrpcUtils,
  listId: number
): Promise<void> {
  await utils.packing.items.prefetch({ listId });
  await utils.packing.progress.prefetch({ listId });
}

/** Menüplan samt Rezeptbuch vorladen – die Rezepte sind der Grund. */
export async function prefetchMenu(
  utils: TrpcUtils,
  tripId: number
): Promise<void> {
  await utils.menu.listByTrip.prefetch({ tripId });
  await utils.recipes.list.prefetch();
}

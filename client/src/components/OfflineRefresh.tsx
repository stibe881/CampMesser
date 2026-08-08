/**
 * Stilles Auffrischen des Offline-Pakets kurz vor der Reise (#411).
 *
 * WARUM NUR FÜR SCHON GEHOLTE PAKETE: Das erste Holen bleibt eine
 * Entscheidung (TripOfflinePrep sagt dazu ausdrücklich «kein
 * Automatismus» – Roaming). Wer es aber einmal gedrückt hat, will vor
 * der Abfahrt frische Daten, nicht die vom letzten Wochenende. Regeln
 * in shared/offlineRefresh.ts; erneuert werden nur die DATEN-Schritte,
 * keine Kartenkacheln.
 *
 * Läuft EINMAL je App-Start, sobald die Reiseliste da ist – und nur
 * online: offline würde das «Auffrischen» den Speicher mit Fehlern
 * fluten, während man gerade von den alten Daten lebt.
 */
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";
import {
  loadPrepRecords,
  prefetchMenu,
  prefetchPackList,
  prefetchTripCore,
  rememberPrepRun,
} from "@/lib/offlinePrep";
import { shouldRefreshOfflinePrep } from "@shared/offlineRefresh";

export default function OfflineRefresh() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const today = useTodayIso();
  // Einmal je App-Start gelesen: Wer den Knopf gerade eben drückt, hat
  // damit ein frisches Paket – das braucht keinen zweiten Lauf.
  const [records] = useState(loadPrepRecords);
  const ran = useRef(false);

  const hasRecords = Object.keys(records).length > 0;
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated && hasRecords,
    staleTime: 5 * 60_000,
  });

  const trips = tripsQuery.data;
  useEffect(() => {
    if (ran.current || !trips || !navigator.onLine) return;
    ran.current = true;
    const due = trips.filter(trip => {
      const savedAt = records[trip.id];
      return (
        savedAt !== undefined &&
        shouldRefreshOfflinePrep(trip, savedAt, Date.now(), today)
      );
    });
    void (async () => {
      for (const trip of due) {
        try {
          await prefetchTripCore(utils, trip.id, trip.spotId);
          if (trip.packListId !== null) {
            await prefetchPackList(utils, trip.packListId);
          }
          await prefetchMenu(utils, trip.id);
          rememberPrepRun(trip.id);
        } catch {
          // Netz weg mitten im Lauf: alter Stempel bleibt, nächster
          // App-Start versucht es erneut
        }
      }
    })();
  }, [trips, records, today, utils]);

  return null;
}

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { isNativeApp, NATIVE_MESSAGES, postToNative } from "@/lib/nativeBridge";
import {
  buildWidgetPayload,
  selectWidgetTrip,
  widgetPayloadChanged,
  type WidgetPayload,
} from "@shared/widgetData";

/**
 * Die Daten für die iPhone-Widgets an den nativen Rahmen schicken (#324).
 *
 * WARUM DIE WEB-APP SIE LIEFERT UND NICHT DAS WIDGET SIE HOLT: Ein
 * WidgetKit-Widget läuft in einer eigenen Erweiterung, ohne die Sitzung
 * der App. Es müsste sich also selbst anmelden – Zugangsdaten in einer
 * zweiten Ablage, ein zweiter Weg, der kaputtgehen kann, für zwei Zahlen.
 * Die Web-App hat alles ohnehin geladen; sie reicht es weiter.
 *
 * NUR IN DER NATIVEN APP: Im Browser passiert hier gar nichts, auch keine
 * Abfrage – die Daten würden sonst geholt, um sie wegzuwerfen.
 *
 * WANN GESCHICKT WIRD: sobald sich am ANGEZEIGTEN Text etwas ändert.
 * iOS führt für jede App ein Budget an Widget-Aktualisierungen; wer ohne
 * Grund nachlädt, wird gedrosselt und steht dann irgendwann mit einem
 * veralteten Widget da. Deshalb der Vergleich in `widgetPayloadChanged`.
 */
export default function WidgetSync() {
  const native = isNativeApp();
  const { isAuthenticated } = useAuth();
  const { lang } = useI18n();
  const enabled = native && isAuthenticated;

  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled,
    staleTime: 5 * 60_000,
  });
  const foodQuery = trpc.food.list.useQuery(undefined, {
    enabled,
    staleTime: 5 * 60_000,
  });
  const gearQuery = trpc.gear.list.useQuery(undefined, {
    enabled,
    staleTime: 5 * 60_000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const trips = tripsQuery.data ?? [];
  // Der Packstand gehört zur Reise, die auch im Widget steht – sonst
  // stünde dort der Fortschritt einer anderen Liste.
  const shown = enabled ? selectWidgetTrip(trips, today) : null;
  const packListId =
    shown && !shown.running ? (shown.trip.packListId ?? null) : null;
  const progressQuery = trpc.packing.progress.useQuery(
    { listId: packListId ?? 0 },
    { enabled: enabled && Boolean(packListId) }
  );

  /** Zuletzt geschickte Nutzlast – Grundlage für den Vergleich. */
  const sent = useRef<WidgetPayload | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // Erst schicken, wenn die drei Bestände einmal da waren: Sonst stünde
    // kurz nach dem Start «Keine Reise geplant» im Widget, bloss weil die
    // Liste noch unterwegs ist.
    if (!tripsQuery.data || !foodQuery.data || !gearQuery.data) return;
    if (packListId && !progressQuery.data) return;

    const payload = buildWidgetPayload({
      trips: tripsQuery.data,
      foodItems: foodQuery.data,
      gearTasks: gearQuery.data,
      packing: progressQuery.data ?? null,
      today,
      lang,
    });
    if (!widgetPayloadChanged(sent.current, payload)) return;
    sent.current = payload;
    postToNative(NATIVE_MESSAGES.setWidgetData, { payload });
  }, [
    enabled,
    lang,
    today,
    packListId,
    tripsQuery.data,
    foodQuery.data,
    gearQuery.data,
    progressQuery.data,
  ]);

  return null;
}

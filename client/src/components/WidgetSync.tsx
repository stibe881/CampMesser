import { useEffect, useMemo, useRef } from "react";
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
import { enqueueToggle } from "@/lib/offlineQueue";
import { parsePending } from "@shared/widgetActions";
import { WIDGET_ACTIONS_EVENT } from "@/lib/nativeBridge";
import { todayIso } from "@shared/localDate";

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
  const utils = trpc.useUtils();
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

  const today = todayIso();
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
  // Für die Liste zum Abhaken (#327): vor der Reise die Packliste, während
  // der Reise die heutigen Ämtli. Immer nur EINE der beiden Abfragen –
  // die andere bräuchte niemand, und Widget-Daten sind kein Grund, den
  // Server doppelt zu fragen.
  const running = shown?.running === true;
  const itemsQuery = trpc.packing.items.useQuery(
    { listId: packListId ?? 0 },
    { enabled: enabled && Boolean(packListId) && !running }
  );
  const choresQuery = trpc.chores.assignments.useQuery(
    { day: today },
    { enabled: enabled && running }
  );
  // Die Zuteilung kennt nur die Nummer des Ämtli; der Name steht in der
  // Ämtli-Liste. Zusammengeführt wird hier, weil das Widget einen fertigen
  // Text bekommt und keine zwei Tabellen.
  const choreListQuery = trpc.chores.list.useQuery(undefined, {
    enabled: enabled && running,
    staleTime: 5 * 60_000,
  });
  const chores = useMemo(() => {
    const names = new Map(
      (choreListQuery.data ?? []).map(chore => [chore.id, chore.title])
    );
    return (choresQuery.data ?? []).flatMap(row => {
      const title = names.get(row.choreId);
      // Ohne Namen keine Zeile: «(unbekannt)» im Widget hilft niemandem.
      return title ? [{ id: row.id, title, doneAt: row.doneAt }] : [];
    });
  }, [choresQuery.data, choreListQuery.data]);

  /** Zuletzt geschickte Nutzlast – Grundlage für den Vergleich. */
  const sent = useRef<WidgetPayload | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // Erst schicken, wenn die drei Bestände einmal da waren: Sonst stünde
    // kurz nach dem Start «Keine Reise geplant» im Widget, bloss weil die
    // Liste noch unterwegs ist.
    if (!tripsQuery.data || !foodQuery.data || !gearQuery.data) return;
    if (packListId && !progressQuery.data) return;
    // Dasselbe für die Liste zum Abhaken: Solange sie unterwegs ist, stünde
    // «Alles gepackt» im Widget – und genau das würde man glauben.
    if (running && (!choresQuery.data || !choreListQuery.data)) return;
    if (packListId && !running && !itemsQuery.data) return;

    const payload = buildWidgetPayload({
      trips: tripsQuery.data,
      foodItems: foodQuery.data,
      gearTasks: gearQuery.data,
      packing: progressQuery.data ?? null,
      packItems: itemsQuery.data?.items,
      chores,
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
    itemsQuery.data,
    choresQuery.data,
  ]);

  /**
   * Häkchen entgegennehmen, die im WIDGET gesetzt wurden (#327).
   *
   * Die Widget-Erweiterung hat die Sitzung der App nicht und kann den
   * Server nicht erreichen; sie merkt das Häkchen im gemeinsamen Ordner.
   * `App.js` reicht die Sammlung beim Start herüber, und hier landet sie
   * in derselben Warteschlange, die auch das Funkloch bedient – von dort
   * schickt `OfflineSync` sie weg. Ein zweiter Sendeweg wäre ein zweiter
   * Weg, der kaputtgehen kann.
   */
  useEffect(() => {
    if (!native) return;
    const handler = (event: Event) => {
      const actions = parsePending((event as CustomEvent).detail);
      if (actions.length === 0) return;
      // Älteste zuerst, damit am Ende der zuletzt gewählte Stand gewinnt.
      for (const entry of [...actions].sort((a, b) => a.at - b.at)) {
        enqueueToggle(entry.kind, entry.itemId, entry.checked);
      }
      // Der nächste Stand fürs Widget muss die Häkchen enthalten – sonst
      // springen sie beim nächsten Zeichnen zurück.
      sent.current = null;
      void utils.packing.items.invalidate();
      void utils.packing.progress.invalidate();
      void utils.chores.assignments.invalidate();
    };
    window.addEventListener(WIDGET_ACTIONS_EVENT, handler);
    return () => window.removeEventListener(WIDGET_ACTIONS_EVENT, handler);
  }, [native, utils]);

  return null;
}

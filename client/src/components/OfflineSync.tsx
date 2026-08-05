import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import {
  loadQueue,
  saveQueue,
  MAX_TRIES,
  type QueuedToggle,
} from "@/lib/offlineQueue";

/**
 * Schickt offline gesetzte Häkchen nach, sobald wieder Verbindung besteht.
 *
 * Sitzt ohne eigene Darstellung im AppShell, damit es unabhängig von der
 * offenen Seite läuft: Wer im Funkloch die Packliste abhakt und am nächsten
 * Morgen die App auf der Startseite öffnet, soll seine Häkchen trotzdem
 * loswerden.
 *
 * Fehlerbehandlung mit Unterschied: Antwortet der Server mit einem Fehler
 * (Eintrag gelöscht, kein Zugriff), ist die Sache erledigt – der Eintrag
 * fliegt raus. Kommt gar keine Antwort, war es die Verbindung; dann bleibt
 * er liegen und wird beim nächsten Mal erneut versucht, höchstens drei Mal.
 */
export default function OfflineSync() {
  const online = useOnlineStatus();
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const packToggle = trpc.packing.toggleItem.useMutation();
  const shopToggle = trpc.shopping.toggle.useMutation();
  /** Verhindert, dass zwei Durchläufe gleichzeitig senden. */
  const running = useRef(false);

  useEffect(() => {
    if (!online || running.current) return;
    const queue = loadQueue();
    if (queue.length === 0) return;
    running.current = true;

    const send = async (entry: QueuedToggle) => {
      const input = { id: entry.itemId, checked: entry.checked };
      if (entry.kind === "packing") await packToggle.mutateAsync(input);
      else await shopToggle.mutateAsync(input);
    };

    void (async () => {
      const remaining: QueuedToggle[] = [];
      let sent = 0;
      // Älteste zuerst: So gewinnt am Ende der zuletzt gewählte Stand.
      for (const entry of [...queue].sort((a, b) => a.at - b.at)) {
        try {
          await send(entry);
          sent += 1;
        } catch (error) {
          const answered = error instanceof TRPCClientError && !!error.data;
          if (answered) continue; // Server hat entschieden – nicht wiederholen
          const tries = entry.tries + 1;
          if (tries < MAX_TRIES) remaining.push({ ...entry, tries });
        }
      }
      saveQueue(remaining);
      if (sent > 0) {
        await Promise.all([
          utils.packing.items.invalidate(),
          utils.packing.progress.invalidate(),
          utils.shopping.list.invalidate(),
        ]);
        toast.success(t.offline.synced(sent));
      }
      running.current = false;
    })();
    // Bewusst nur an `online` gebunden: Mutationen und utils sind stabil,
    // und ein Durchlauf pro Verbindungswechsel genügt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return null;
}

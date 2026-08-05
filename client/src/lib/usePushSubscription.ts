/**
 * Gemeinsame Logik für den Push-Abo-Schalter dieses Geräts – genutzt vom
 * Unwetter-Opt-in auf der Zeltplatz-Seite und vom Abschnitt «Mitteilungen»
 * im Profil. Browser-Teil in pushClient.ts, Server-Teil im push-Router.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import {
  getExistingSubscription,
  pushSupported,
  subscribeBrowser,
  unsubscribeBrowser,
} from "@/lib/pushClient";

export function usePushSubscription() {
  const { lang, t } = useI18n();
  const vapidQuery = trpc.push.vapidKey.useQuery(undefined, {
    staleTime: Infinity,
  });
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setEnabled(false);
      return;
    }
    getExistingSubscription()
      .then(sub => {
        setEnabled(Boolean(sub));
        setEndpoint(sub?.endpoint ?? null);
      })
      .catch(() => setEnabled(false));
  }, []);

  /** Kann dieser Browser überhaupt Push? */
  const supported = pushSupported();
  /** Hat der Server VAPID-Schlüssel? (Erst nach configLoaded aussagekräftig.) */
  const configured = Boolean(vapidQuery.data?.publicKey);
  /** true, sobald die vapidKey-Abfrage beantwortet ist. */
  const configLoaded = vapidQuery.data !== undefined;

  /** Abo an-/abschalten; die Erfolgs-Toasts liefert die aufrufende Seite. */
  const toggle = async (
    next: boolean,
    messages: { enabled: string; disabled: string }
  ) => {
    if (busy || !configured) return;
    setBusy(true);
    try {
      if (next) {
        const sub = await subscribeBrowser(vapidQuery.data!.publicKey!, lang);
        // Sprache mitschicken (#313): Sie hängt am Abo, damit die Meldung
        // in der Sprache ankommt, in der das Gerät bedient wird.
        await subscribeMutation.mutateAsync({ ...sub, lang });
        setEnabled(true);
        setEndpoint(sub.endpoint);
        toast.success(messages.enabled);
      } else {
        const ep = await unsubscribeBrowser();
        if (ep) await unsubscribeMutation.mutateAsync({ endpoint: ep });
        setEnabled(false);
        setEndpoint(null);
        toast.success(messages.disabled);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.common.actionFailed
      );
    } finally {
      setBusy(false);
    }
  };

  return {
    supported,
    configured,
    configLoaded,
    enabled,
    endpoint,
    busy,
    toggle,
  };
}

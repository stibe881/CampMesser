import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useT } from "@/i18n";

/** Alle 30 Minuten aktiv nach einer neuen Service-Worker-Version suchen. */
const UPDATE_CHECK_INTERVAL_MS = 30 * 60_000;

/**
 * Dezenter, abweisbarer Update-Hinweis über der Bottom-Navigation (Muster
 * InstallPrompt): Sobald eine neue Service-Worker-Version installiert ist und
 * WARTET, erscheint «Neue Version verfügbar». Erst der Knopf «Aktualisieren»
 * aktiviert sie per SKIP_WAITING – bei controllerchange lädt die Seite genau
 * EINMAL neu (Ref-Guard gegen Reload-Schleifen). Zusätzlich wird periodisch
 * und beim Zurückkehren in den Tab nach Updates gesucht. Das Abweisen gilt nur
 * für die laufende Sitzung – beim nächsten echten Update kommt der Hinweis wieder.
 */
export default function UpdatePrompt() {
  const t = useT();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const reloadedRef = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let cancelled = false;
    let interval: number | undefined;
    let registration: ServiceWorkerRegistration | undefined;

    // Übernimmt der neue Worker die Kontrolle: die Seite EINMAL neu laden
    const onControllerChange = () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    // Beim Zurückkehren in den Tab gleich nach einer neuen Version suchen
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        registration?.update().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const watch = async () => {
      const reg = await navigator.serviceWorker.ready;
      if (cancelled) return;
      registration = reg;

      // Bereits wartende Version (z. B. aus einem früheren Besuch) melden
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaiting(reg.waiting);
      }
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        installing?.addEventListener("statechange", () => {
          // Nur echte Updates melden: ohne Controller ist es die Erst-Installation
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaiting(reg.waiting ?? installing);
            setDismissed(false);
          }
        });
      });

      // Browser prüfen sw.js sonst nur sporadisch – periodisch aktiv suchen
      interval = window.setInterval(() => {
        reg.update().catch(() => {});
      }, UPDATE_CHECK_INTERVAL_MS);
    };
    void watch();

    return () => {
      cancelled = true;
      if (interval !== undefined) window.clearInterval(interval);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const refresh = useCallback(() => {
    // Der wartende Worker aktiviert sich, controllerchange lädt dann neu
    waiting?.postMessage({ type: "SKIP_WAITING" });
  }, [waiting]);

  if (!waiting || dismissed) return null;

  return (
    <div
      role="status"
      aria-label={t.update.title}
      className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-4"
    >
      <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {t.update.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.update.description}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t.update.reloadButton}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t.update.dismiss}
          className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

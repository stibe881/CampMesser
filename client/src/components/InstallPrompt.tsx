import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { useT } from "@/i18n";
import {
  clearDeferredPrompt,
  countVisit,
  detectIosSafari,
  detectStandalone,
  getDeferredPrompt,
  isDismissed,
  markDismissed,
  MIN_USAGE_MS,
  msSinceAppStart,
  shouldShowInstallPrompt,
  subscribeInstallPrompt,
} from "@/lib/installPrompt";

/**
 * Dezenter, abweisbarer Install-Hinweis über der Bottom-Navigation.
 * Erscheint nur, wenn die App nicht installiert ist, der Hinweis nie
 * abgewiesen wurde und die Person die App schon etwas genutzt hat
 * (2. Besuch oder ~30 s). Android/Desktop-Chrome: nativer Install-Dialog
 * über das abgefangene beforeinstallprompt-Event; iOS Safari: Kurzanleitung
 * «Teilen → Zum Home-Bildschirm».
 */
export default function InstallPrompt() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"native" | "ios">("native");

  useEffect(() => {
    const visitCount = countVisit();
    let timer: number | undefined;

    const evaluate = () => {
      const hasInstallEvent = getDeferredPrompt() !== null;
      const state = {
        isStandalone: detectStandalone(),
        dismissed: isDismissed(),
        visitCount,
        msSinceStart: msSinceAppStart(),
        hasInstallEvent,
        isIos: detectIosSafari(navigator.userAgent, "standalone" in navigator),
      };
      if (shouldShowInstallPrompt(state)) {
        setMode(hasInstallEvent ? "native" : "ios");
        setVisible(true);
      } else if (!hasInstallEvent && state.dismissed) {
        setVisible(false);
      }
    };

    evaluate();
    const unsubscribe = subscribeInstallPrompt(evaluate);
    const remaining = MIN_USAGE_MS - msSinceAppStart();
    if (remaining > 0) timer = window.setTimeout(evaluate, remaining + 250);
    return () => {
      unsubscribe();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    markDismissed();
    setVisible(false);
  }, []);

  const install = useCallback(() => {
    const event = getDeferredPrompt();
    // Ergebnis egal – danach nie wieder zeigen
    markDismissed();
    setVisible(false);
    if (event) {
      clearDeferredPrompt();
      void event.prompt().catch(() => {
        /* egal */
      });
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t.install.title}
      className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-4"
    >
      <div className="mx-auto flex max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {t.install.title}
          </p>
          {mode === "native" ? (
            <>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.install.description}
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {t.install.installButton}
              </button>
            </>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t.install.iosStep1}{" "}
              <Share
                className="inline h-3.5 w-3.5 align-[-2px] text-foreground"
                aria-label={t.install.shareIcon}
                role="img"
              />{" "}
              {t.install.iosStep2}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.install.dismiss}
          className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

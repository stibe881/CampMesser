import { useEffect, useState } from "react";

/**
 * Screen Wake Lock: hält das Display an, solange die aufrufende Ansicht
 * aktiv ist (Kochmodus, Wasserwaage, Sonnen-Kompass). Wird der Tab in den
 * Hintergrund gelegt, gibt der Browser den Lock automatisch frei – bei
 * Rückkehr (visibilitychange) fordern wir ihn erneut an. Ohne Browser-
 * Unterstützung ist der Hook ein No-op ({supported: false}).
 */
export function useWakeLock(enabled = true): {
  supported: boolean;
  active: boolean;
} {
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!supported || !enabled) return;
    let cancelled = false;
    let sentinel: WakeLockSentinel | null = null;

    const request = async () => {
      if (document.visibilityState !== "visible") return;
      // Bereits gehalten? Dann nichts erneut anfordern.
      if (sentinel && !sentinel.released) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
        setActive(true);
        lock.addEventListener("release", () => {
          if (sentinel === lock) sentinel = null;
          if (!cancelled) setActive(false);
        });
      } catch {
        // Abgelehnt (z. B. Energiesparmodus) – die Ansicht funktioniert trotzdem
        if (!cancelled) setActive(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (sentinel) {
        sentinel.release().catch(() => {});
        sentinel = null;
      }
      setActive(false);
    };
  }, [supported, enabled]);

  return { supported, active: supported && active };
}

/**
 * Die Uhrzeit als Wert, der weiterläuft (#379).
 *
 * Dasselbe Muster wie `useTodayIso()` (#375), eine Stufe feiner: Die
 * Umkehrzeit auf der Wanderung ist ein Countdown, und ein Countdown, der
 * beim Laden der Seite einmal gerechnet wurde, ist keiner. Wer das Handy
 * eine Stunde in die Tasche steckt und wieder herausholt, muss die
 * richtige Restzeit sehen – nicht die von vorhin.
 *
 * DREI WEGE, weil kein einzelner reicht: ein Takt, `visibilitychange`
 * (iOS friert Zeitgeber im Hintergrund ein) und `focus`. Neu gezeichnet
 * wird nur, wenn sich die MINUTE geändert hat.
 */
import { useEffect, useState } from "react";

/** Minuten seit Mitternacht in der lokalen Zeitzone. */
function minutesNow(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** Wie oft nachgeschaut wird. Halbe Minute – der Takt darf schlampig sein. */
const TICK_MS = 30_000;

export function useNowMinutes(): number {
  const [minutes, setMinutes] = useState(() => minutesNow());

  useEffect(() => {
    const check = () =>
      setMinutes(prev => {
        const now = minutesNow();
        return now === prev ? prev : now;
      });
    const timer = setInterval(check, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  return minutes;
}

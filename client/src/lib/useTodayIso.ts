/**
 * «Welcher Tag ist gerade heute?» – als Wert, der sich von selbst
 * weiterdreht (#373).
 *
 * DER FEHLER, DEN DAS BEHEBT: `todayIso()` in einem Effekt aufzurufen
 * liest den Tag EINMAL – beim Laden der Seite. In einer Browser-Sitzung,
 * die man abends schliesst, fällt das nie auf. In der nativen App fällt es
 * sehr wohl auf: Der WebView bleibt beim Weglegen des Handys stehen und
 * wird tagelang nicht neu geladen. Was am Montag gerechnet wurde, gilt
 * dort auch noch am Donnerstag.
 *
 * WIE ER SICH DREHT, auf drei Wegen, weil kein einzelner verlässlich ist:
 *
 *   Wecker  auf die nächste Mitternacht – greift, solange die Seite läuft.
 *   Rückkehr (`visibilitychange`) – iOS friert Zeitgeber im Hintergrund
 *           ein; der Wecker von gestern Abend feuert dann verspätet oder
 *           gar nicht.
 *   Fokus   – dasselbe für Fenster, die nie «versteckt» waren.
 *
 * Der Zustand wird nur gesetzt, wenn der Tag WIRKLICH gewechselt hat –
 * sonst würde jeder App-Wechsel ein Neuzeichnen auslösen.
 */
import { useEffect, useState } from "react";
import { msUntilNextLocalDay, todayIso } from "@shared/localDate";

export function useTodayIso(): string {
  const [day, setDay] = useState(() => todayIso());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      setDay(prev => {
        const now = todayIso();
        return now === prev ? prev : now;
      });
      schedule();
    };
    const schedule = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(check, msUntilNextLocalDay());
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, []);

  return day;
}

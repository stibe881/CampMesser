import { useEffect, useState } from "react";

/**
 * Besteht gerade eine Verbindung?
 *
 * `navigator.onLine` ist bekanntlich optimistisch: Es meldet «online», sobald
 * das Gerät IRGENDWO angeschlossen ist – auch am WLAN eines Campingplatzes,
 * dessen Anmeldeseite man noch nicht ausgefüllt hat. Für die Anzeige genügt
 * das trotzdem, denn der umgekehrte Fall ist verlässlich: Meldet der Browser
 * «offline», ist auch wirklich nichts zu holen. Genau dann blenden wir das
 * Band ein. Falsch-positive «online» fallen nicht auf, weil die Seiten dann
 * einfach ihre gespeicherten Daten zeigen.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    // Beim Zurückkehren aus dem Hintergrund kann sich der Zustand geändert
    // haben, ohne dass ein Ereignis kam (iOS spart sich das gerne).
    const onVisible = () => {
      if (document.visibilityState === "visible") setOnline(navigator.onLine);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return online;
}

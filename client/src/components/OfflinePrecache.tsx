import { useEffect } from "react";

/**
 * Lädt alle Bilder der Wissens-Module (Natur, Knoten, Rezepte) im Hintergrund,
 * sobald der Service Worker aktiv ist. Der SW legt sie im Bild-Cache ab –
 * so sind die Module inklusive Bilder offline verfügbar, ohne dass jede
 * Seite vorher einzeln besucht werden muss.
 *
 * DIE DATEN WERDEN NACHGELADEN, NICHT MITGEBRACHT (#335): Diese Komponente
 * hängt in `App.tsx` und lag damit im Haupt-Bündel – zusammen mit den drei
 * grössten Datendateien des Projekts (Natur 2219 Zeilen, Knoten 738,
 * Rezepte 2065, alle in vier Sprachen). Gebraucht wird davon EIN Feld pro
 * Eintrag: die Bildadresse.
 *
 * Dass sie erst vier Sekunden nach dem Start etwas tut, machte es
 * schlimmer: Der Erstaufruf trug die Last, ohne dass sie in dieser Zeit
 * irgendjemandem nützte. `await import()` im Rumpf verschiebt sie dorthin,
 * wo sie gebraucht wird.
 */
export default function OfflinePrecache() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let cancelled = false;

    const run = async () => {
      try {
        await navigator.serviceWorker.ready;
        // Nur bei guter Verbindung und nicht im Datensparmodus vorladen
        const conn = (navigator as { connection?: { saveData?: boolean } })
          .connection;
        if (conn?.saveData) return;

        // Erst hier laden: Vorher hing das Haupt-Bündel daran.
        const [{ natureEntries }, { knots }, { recipes }] = await Promise.all([
          import("@/data/nature"),
          import("@/data/knots"),
          import("@/data/recipes"),
        ]);
        if (cancelled) return;

        const urls = [
          ...natureEntries.map(e => e.image),
          ...knots.map(k => k.image),
          ...recipes.map(r => r.image),
        ].filter((u): u is string => typeof u === "string" && u.length > 0);

        // Nacheinander mit kleinen Pausen, um die Verbindung nicht zu blockieren
        for (const url of urls) {
          if (cancelled) return;
          try {
            // Same-Origin-Fetch: läuft durch den Service Worker, der die
            // Bilder redirect-sicher in den Offline-Cache legt.
            await fetch(url);
          } catch {
            /* offline oder Fehler – beim nächsten Start erneut versuchen */
          }
          await new Promise(r => setTimeout(r, 150));
        }
      } catch {
        /* Service Worker nicht verfügbar */
      }
    };

    // Erst nach dem Laden der Seite starten, damit der App-Start nicht bremst
    const timer = window.setTimeout(run, 4000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}

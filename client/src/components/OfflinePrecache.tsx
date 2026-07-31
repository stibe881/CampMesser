import { useEffect } from "react";
import { natureEntries } from "@/data/nature";
import { knots } from "@/data/knots";
import { recipes } from "@/data/recipes";

/**
 * Lädt alle Bilder der Wissens-Module (Natur, Knoten, Rezepte) im Hintergrund,
 * sobald der Service Worker aktiv ist. Der SW legt sie im Bild-Cache ab –
 * so sind die Module inklusive Bilder offline verfügbar, ohne dass jede
 * Seite vorher einzeln besucht werden muss.
 */
export default function OfflinePrecache() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let cancelled = false;

    const run = async () => {
      try {
        await navigator.serviceWorker.ready;
        // Nur bei guter Verbindung und nicht im Datensparmodus vorladen
        const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
        if (conn?.saveData) return;

        const urls = [
          ...natureEntries.map(e => e.image),
          ...knots.map(k => k.image),
          ...recipes.map(r => r.image),
        ].filter((u): u is string => typeof u === "string" && u.length > 0);

        // Nacheinander mit kleinen Pausen, um die Verbindung nicht zu blockieren
        for (const url of urls) {
          if (cancelled) return;
          try {
            await fetch(url, { mode: "no-cors" });
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

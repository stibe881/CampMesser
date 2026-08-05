import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Inhalt erst einbauen, wenn er in die Nähe des Sichtfensters kommt.
 *
 * WOZU: Das Platz-Dossier zeigt gegen fünfzehn Abschnitte, die beim Öffnen
 * ALLE sofort Daten holten – Wanderungen, Feuerstellen, Familienplätze,
 * Läden, ÖV, Ausflüge, Badegewässer, Zecken, Dunkelheit, Wetter, beste
 * Reisezeit, Abfahrtszeit, Rast unterwegs, Verkehr. Ein Dutzend Abfragen
 * für jemanden, der bloss kurz die Telefonnummer des Platzes nachschaut.
 * Zwei davon kosten bei Google echtes Geld, mehrere andere laufen gegen das
 * mengenbegrenzte Overpass. Wer nie nach unten scrollt, zahlt trotzdem.
 *
 * Die Kinder werden deshalb erst gerendert, sobald der Platzhalter in die
 * Nähe des Sichtfensters gerät – und danach bleiben sie stehen (kein
 * Aus- und Wiedereinbauen beim Zurückscrollen, das würde alles neu laden).
 *
 * `minHeight` hält den Platz frei, damit die Seite beim Nachladen nicht
 * springt; ein grober Schätzwert genügt.
 *
 * Fehlt IntersectionObserver (sehr alte Browser), wird sofort gerendert –
 * lieber alles laden als gar nichts zeigen.
 */
export default function LazySection({
  children,
  minHeight = 120,
  /** Wie früh geladen wird: Vorlauf in Pixeln unterhalb des Fensters. */
  rootMargin = "300px",
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  if (visible) return <>{children}</>;
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}

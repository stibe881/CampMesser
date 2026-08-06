import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Die selteneren Abschnitte einer Reise hinter EINEN Schalter (#357).
 *
 * DAS PROBLEM: Eine Reise stapelte zwölf bis vierzehn gleich aussehende
 * graue Balken – Tagebuch, Reisekasse, Termin-Finder, Pinnwand, Verlauf,
 * Gästebuch, Reservation, Fotos, Collage. Alle gleich gross, alle gleich
 * wichtig aussehend. Wer während der Reise sein Journal schreiben wollte,
 * suchte es zwischen acht Nachbarn.
 *
 * DIE ANTWORT: Was man täglich braucht – Journal, Reisekasse, Pinnwand –
 * bleibt direkt sichtbar. Alles Übrige liegt hinter diesem einen
 * Schalter. Nichts ist weg, es ist nur einen Tipp weiter.
 *
 * WARUM NICHT NACH PHASE SORTIEREN: Weil «wann brauche ich das» sich
 * nicht sauber am Datum festmachen lässt – Fotos sortiert man auch drei
 * Wochen später, die Reservation sucht man auch mitten im Aufenthalt.
 * Häufig gegen selten zu trennen ist ehrlicher als geraten.
 *
 * ZUGEKLAPPT WIRD NICHTS GELADEN: Die Kinder werden erst gerendert, wenn
 * jemand aufklappt – die Fotogalerie etwa fragt sonst ungefragt Daten ab.
 */
export default function TripMoreSections({
  count,
  children,
}: {
  /** Wie viele Abschnitte dahinterliegen – steht als Zahl am Schalter. */
  count: number;
  children: ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (count <= 0) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <span className="min-w-0 flex-1 text-left font-medium">
          {t.trips.moreSections}
        </span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {count}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && children}
    </div>
  );
}

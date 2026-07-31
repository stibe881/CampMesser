import { useEffect } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scavengerHunts } from "@/data/familyActivities";

/**
 * Druckfreundliche Ansicht einer Schnitzeljagd: Stationen, Rätsel und
 * Buchstabenfelder zum Ausfüllen – ohne Lösungen, damit Kinder ohne Handy
 * auf die Suche gehen können. PDF entsteht über den Browser-Druckdialog.
 */
export default function HuntPrintPage() {
  const params = useParams<{ id: string }>();
  const hunt = scavengerHunts.find(h => h.id === params.id);

  useEffect(() => {
    document.title = hunt ? `${hunt.title} – Schnitzeljagd zum Ausdrucken` : "Schnitzeljagd";
    return () => {
      document.title = "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping";
    };
  }, [hunt]);

  if (!hunt) {
    return (
      <div className="container max-w-2xl py-8">
        <p className="text-muted-foreground">Diese Schnitzeljagd wurde nicht gefunden.</p>
        <Button variant="outline" className="mt-3" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Zurück
        </Button>
      </div>
    );
  }

  const letterCount = hunt.stations.filter(s => s.letter).length;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
      {/* Bedienleiste – wird nicht mitgedruckt */}
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Zurück
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Drucken / Als PDF sichern
        </Button>
      </div>

      <div className="print-sheet">
        <header className="mb-6 border-b-2 border-foreground pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest">
            CampMesser · Schnitzeljagd
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold">{hunt.title}</h1>
          <p className="mt-1 text-sm">
            {hunt.ageHint} · ca. {hunt.durationMinutes} Minuten · {hunt.stations.length} Stationen
          </p>
        </header>

        <section className="mb-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">Die Mission</h2>
          <p className="text-sm leading-relaxed">{hunt.intro}</p>
        </section>

        {hunt.preparation && (
          <section className="mb-5 rounded-lg border border-dashed border-foreground/40 p-3">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
              Für die Erwachsenen (vorher lesen)
            </h2>
            <p className="text-sm leading-relaxed">{hunt.preparation}</p>
          </section>
        )}

        <section className="space-y-4">
          {hunt.stations.map((station, i) => (
            <div key={i} className="print-station rounded-lg border border-foreground/30 p-4">
              <h3 className="font-serif text-lg font-bold">{station.title}</h3>
              <p className="mt-1 text-sm italic leading-relaxed">{station.story}</p>
              <p className="mt-2 text-sm leading-relaxed">
                <strong>Aufgabe:</strong> {station.task}
              </p>
              {station.hint && (
                <p className="mt-1.5 text-xs leading-relaxed">
                  <strong>Hinweis (nur wenn ihr feststeckt):</strong> {station.hint}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span>Geschafft? Abhaken:</span>
                <span className="inline-block h-5 w-5 rounded border-2 border-foreground" aria-hidden="true" />
                {station.letter && (
                  <span className="ml-auto flex items-center gap-2">
                    Euer Buchstabe:
                    <span className="inline-block h-8 w-8 rounded border-2 border-foreground" aria-hidden="true" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>

        {hunt.solutionWord && (
          <section className="mt-6 rounded-lg border-2 border-foreground p-4">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">Das Lösungswort</h2>
            <p className="mb-3 text-sm">
              Tragt die gesammelten Buchstaben der Reihe nach ein ({letterCount} Buchstaben):
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: hunt.solutionWord.length }, (_, i) => (
                <span
                  key={i}
                  className="inline-block h-10 w-10 rounded border-2 border-foreground"
                  aria-hidden="true"
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">Das Finale</h2>
          <p className="text-sm leading-relaxed">{hunt.finale}</p>
        </section>

        <footer className="mt-8 border-t border-foreground/30 pt-3 text-center text-xs">
          Viel Spass beim Entdecken! · CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping
        </footer>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Cable, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { knots, type Knot } from "@/data/knots";
import { cn } from "@/lib/utils";

const categories = ["Alle", "Befestigen", "Spannen", "Verbinden", "Schlaufen"] as const;

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Schwierigkeit ${level} von 3`}>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className={cn("h-1.5 w-1.5 rounded-full", i <= level ? "bg-primary" : "bg-border")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function KnotsPage() {
  const [category, setCategory] = useState<(typeof categories)[number]>("Alle");
  const [selected, setSelected] = useState<Knot | null>(null);

  const filtered = category === "Alle" ? knots : knots.filter(k => k.category === category);

  return (
    <div className="container py-6">
      <PageHeader
        title="Knoten-Bibliothek"
        subtitle="Die wichtigsten Outdoor-Knoten mit Schritt-für-Schritt-Anleitungen – offline verfügbar."
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        Alle Anleitungen sind in der App gespeichert und ohne Internetverbindung nutzbar.
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Nach Kategorie filtern">
        {categories.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={category === c}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(knot => (
          <button
            key={knot.id}
            type="button"
            onClick={() => setSelected(knot)}
            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            aria-label={`Anleitung für ${knot.name} öffnen`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Cable className="h-5 w-5" aria-hidden="true" />
              </span>
              <DifficultyDots level={knot.difficulty} />
            </div>
            <div>
              <p className="font-semibold">{knot.name}</p>
              {knot.altName && <p className="text-xs text-muted-foreground">auch: {knot.altName}</p>}
            </div>
            <Badge variant="secondary">{knot.category}</Badge>
            <p className="text-sm text-muted-foreground">{knot.useCase}</p>
          </button>
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {selected.name}
                  {selected.altName && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({selected.altName})
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription>{selected.useCase}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-lg bg-accent/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Beim Camping
                  </p>
                  <p className="mt-1 text-sm">{selected.campingUse}</p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Schritt für Schritt
                  </h3>
                  <ol className="space-y-2.5">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <p className="text-sm">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Profi-Tipp
                  </p>
                  <p className="mt-1 text-sm">{selected.proTip}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


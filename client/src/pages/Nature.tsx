import { useState } from "react";
import { PawPrint, Sparkles, TreePine, WifiOff, Lightbulb, HelpCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { natureCategories, natureEntries } from "@/data/nature";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PawPrint,
  Sparkles,
  TreePine,
};

export default function NaturePage() {
  const [category, setCategory] = useState<string>("tierspuren");
  const activeCategory = natureCategories.find(c => c.id === category)!;
  const entries = natureEntries.filter(e => e.category === category);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title="Natur-Entdecker"
        subtitle="Tierspuren, Sternbilder und Bäume – kindgerecht erklärt und offline verfügbar."
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        Das ganze Lexikon ist in der App gespeichert und ohne Internetverbindung nutzbar.
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2" role="group" aria-label="Kategorie wählen">
        {natureCategories.map(c => {
          const Icon = iconMap[c.icon] ?? TreePine;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3.5 transition-all",
                category === c.id
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
              aria-pressed={category === c.id}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm font-semibold">{c.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-5 text-sm text-muted-foreground">{activeCategory.intro}</p>

      <Accordion type="single" collapsible className="space-y-3">
        {entries.map(entry => (
          <AccordionItem
            key={entry.id}
            value={entry.id}
            className="overflow-hidden rounded-xl border border-border bg-card px-0"
          >
            <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
              <div className="text-left">
                <p className="font-semibold">{entry.name}</p>
                {entry.latinOrExtra && (
                  <p className="text-xs italic text-muted-foreground">{entry.latinOrExtra}</p>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {entry.image && (
                <img
                  src={entry.image}
                  alt={`Illustration: ${entry.name}`}
                  loading="lazy"
                  className="mb-4 aspect-[4/3] w-full rounded-lg border border-border object-cover"
                />
              )}
              <p className="mb-4 text-sm leading-relaxed">{entry.description}</p>

              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Erkennungsmerkmale
              </h3>
              <ul className="mb-4 space-y-1 text-sm">
                {entry.features.map(f => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mb-3 flex gap-2.5 rounded-lg bg-accent/60 p-3">
                <Lightbulb className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm">
                  <span className="font-semibold">Wusstest du?</span> {entry.funFact}
                </p>
              </div>

              <div className="flex gap-2.5 rounded-lg border border-chart-1/40 bg-chart-1/10 p-3">
                <HelpCircle className="h-4 w-4 shrink-0 text-amber-glow" aria-hidden="true" />
                <p className="text-sm">
                  <span className="font-semibold">Für Kinder:</span> {entry.kidQuestion}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Moon, PawPrint, Sparkles, TreePine, WifiOff, Lightbulb, HelpCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { natureCategories, natureEntries } from "@/data/nature";
import { getMoonInfo, nextFullMoons, nextNewMoons, stargazingQuality } from "@shared/moon";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PawPrint,
  Sparkles,
  TreePine,
};

const QUALITY_STYLES: Record<string, string> = {
  hervorragend: "bg-primary/15 text-primary",
  gut: "bg-chart-2/20 text-foreground",
  mittel: "bg-chart-4/20 text-foreground",
  schlecht: "bg-destructive/10 text-destructive",
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("de-CH", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Mondphasen-Kalender: aktuelle Phase, Sternbeobachtungs-Tipp und nächste Termine – rein offline berechnet. */
function MoonCalendar() {
  const [now] = useState(() => new Date());
  const moon = useMemo(() => getMoonInfo(now), [now]);
  const quality = useMemo(() => stargazingQuality(moon.illumination), [moon]);
  const fullMoons = useMemo(() => nextFullMoons(now, 3), [now]);
  const newMoons = useMemo(() => nextNewMoons(now, 3), [now]);

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4" aria-label="Mondphasen-Kalender">
      <div className="mb-3 flex items-center gap-2">
        <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">Mond heute Nacht</h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl" role="img" aria-label={moon.phaseLabel}>
          {moon.symbol}
        </span>
        <div>
          <p className="font-semibold">{moon.phaseLabel}</p>
          <p className="text-sm text-muted-foreground">
            Zu {Math.round(moon.illumination * 100)} % beleuchtet
          </p>
          <Badge className={cn("mt-1.5 border-0", QUALITY_STYLES[quality.score])}>
            Sterne schauen: {quality.score}
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{quality.note}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="mb-1.5 text-sm font-semibold">🌕 Nächste Vollmonde</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {fullMoons.map((d, i) => (
              <li key={i}>{fmtDate(d)}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Ideal für Nachtwanderungen – der Mond leuchtet den Weg.
          </p>
        </div>
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="mb-1.5 text-sm font-semibold">🌑 Nächste Neumonde</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {newMoons.map((d, i) => (
              <li key={i}>{fmtDate(d)}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Dunkelster Himmel – beste Nächte für Sternbilder und Milchstrasse.
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Berechnung erfolgt direkt auf dem Gerät (±1 Tag genau) – funktioniert auch offline.
      </p>
    </section>
  );
}

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

      <MoonCalendar />

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

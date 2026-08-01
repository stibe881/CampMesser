import { useState } from "react";
import {
  AlertTriangle,
  Baby,
  Bug,
  CircleDot,
  Cross,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  Slice,
  Snowflake,
  Sun,
  WifiOff,
  Zap,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { firstAidTopics, type FirstAidTopic } from "@/data/firstAid";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bug,
  Flame,
  Footprints,
  Slice,
  Snowflake,
  Sun,
  Zap,
  CircleDot,
  Droplets,
  HeartPulse,
};

const severityStyle: Record<FirstAidTopic["severity"], string> = {
  leicht: "bg-secondary text-secondary-foreground",
  mittel: "bg-chart-1/20 text-amber-glow",
  ernst: "bg-destructive/10 text-destructive",
};

export default function FirstAidPage() {
  const [filter, setFilter] = useState<"alle" | FirstAidTopic["severity"]>(
    "alle"
  );
  const topics =
    filter === "alle"
      ? firstAidTopics
      : firstAidTopics.filter(t => t.severity === filter);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title="Erste-Hilfe-Guide"
        subtitle="Kompakter Ratgeber für typische Outdoor-Verletzungen – vollständig offline verfügbar."
      />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        Alle Inhalte sind in der App gespeichert und ohne Internetverbindung
        nutzbar.
      </div>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Nach Schweregrad filtern"
      >
        {(["alle", "leicht", "mittel", "ernst"] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={filter === s}
          >
            {s === "alle" ? "Alle Themen" : s}
          </button>
        ))}
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {topics.map(topic => {
          const Icon = iconMap[topic.icon] ?? Cross;
          return (
            <AccordionItem
              key={topic.id}
              value={topic.id}
              className="overflow-hidden rounded-xl border border-border bg-card px-0"
            >
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{topic.title}</p>
                    <Badge
                      className={cn(
                        "mt-0.5 capitalize",
                        severityStyle[topic.severity]
                      )}
                    >
                      {topic.severity}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {topic.summary}
                </p>

                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Erkennen
                </h3>
                <ul className="mb-4 space-y-1 text-sm">
                  {topic.symptoms.map(s => (
                    <li key={s} className="flex gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      {s}
                    </li>
                  ))}
                </ul>

                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  So hilfst du
                </h3>
                <ol className="mb-4 space-y-2.5">
                  {topic.steps.map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {step.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mb-3 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle
                    className="h-4 w-4 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-foreground">{topic.warning}</p>
                </div>

                {topic.kidNote && (
                  <div className="flex gap-2.5 rounded-lg bg-accent/60 p-3">
                    <Baby
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm">{topic.kidNote}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Hinweis: Dieser Guide ersetzt keine ärztliche Beratung und keinen
        Erste-Hilfe-Kurs. Im Zweifel immer den Notruf 112 oder die Rega 1414
        kontaktieren.
      </p>
    </div>
  );
}

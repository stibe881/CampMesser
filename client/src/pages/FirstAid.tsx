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
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { pick } from "@shared/i18n";

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
  // Dunkler Text statt amber-glow: 4.5:1-Kontrast auf dem hellen Amber-Hintergrund
  mittel: "bg-chart-1/20 text-foreground",
  ernst: "bg-destructive/10 text-destructive",
};

export default function FirstAidPage() {
  const { lang, t } = useI18n();
  const [filter, setFilter] = useState<"alle" | FirstAidTopic["severity"]>(
    "alle"
  );
  const topics =
    filter === "alle"
      ? firstAidTopics
      : firstAidTopics.filter(topic => topic.severity === filter);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.firstAid.title} subtitle={t.firstAid.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.firstAid.offlineNote}
      </div>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label={t.firstAid.filterAria}
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
            {s === "alle" ? t.firstAid.filterAll : t.firstAid.severity[s]}
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
                    <p className="font-semibold">{pick(topic.title, lang)}</p>
                    <Badge
                      className={cn(
                        "mt-0.5 capitalize",
                        severityStyle[topic.severity]
                      )}
                    >
                      {t.firstAid.severity[topic.severity]}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {pick(topic.summary, lang)}
                </p>

                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.firstAid.recognizeTitle}
                </h3>
                <ul className="mb-4 space-y-1 text-sm">
                  {topic.symptoms.map(s => {
                    const text = pick(s, lang);
                    return (
                      <li key={text} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        {text}
                      </li>
                    );
                  })}
                </ul>

                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.firstAid.helpTitle}
                </h3>
                <ol className="mb-4 space-y-2.5">
                  {topic.steps.map((step, i) => (
                    <li key={step.title.de} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {pick(step.title, lang)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pick(step.text, lang)}
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
                  <p className="text-sm text-foreground">
                    {pick(topic.warning, lang)}
                  </p>
                </div>

                {topic.kidNote && (
                  <div className="flex gap-2.5 rounded-lg bg-accent/60 p-3">
                    <Baby
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm">{pick(topic.kidNote, lang)}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        {t.firstAid.disclaimer}
      </p>
    </div>
  );
}

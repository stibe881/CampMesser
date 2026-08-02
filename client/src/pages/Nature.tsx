import { useMemo, useState } from "react";
import {
  Moon,
  PawPrint,
  Sparkles,
  TreePine,
  WifiOff,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { natureCategories, natureEntries } from "@/data/nature";
import {
  getMoonInfo,
  nextFullMoons,
  nextNewMoons,
  stargazingQuality,
} from "@shared/moon";
import { upcomingShowers } from "@shared/astro";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import { useI18n } from "@/i18n";
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

function fmtDate(d: Date, lang: Language) {
  return d.toLocaleDateString(LOCALE_TAGS[lang], {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Mondphasen-Kalender: aktuelle Phase, Sternbeobachtungs-Tipp und nächste Termine – rein offline berechnet. */
function MoonCalendar() {
  const { lang, t } = useI18n();
  const [now] = useState(() => new Date());
  const moon = useMemo(() => getMoonInfo(now, lang), [now, lang]);
  const quality = useMemo(
    () => stargazingQuality(moon.illumination, lang),
    [moon, lang]
  );
  const fullMoons = useMemo(() => nextFullMoons(now, 3), [now]);
  const newMoons = useMemo(() => nextNewMoons(now, 3), [now]);

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={t.nature.moonSectionAria}
    >
      <div className="mb-3 flex items-center gap-2">
        <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">
          {t.nature.moonTitle}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl" role="img" aria-label={moon.phaseLabel}>
          {moon.symbol}
        </span>
        <div>
          <p className="font-semibold">{moon.phaseLabel}</p>
          <p className="text-sm text-muted-foreground">
            {t.nature.illuminated(Math.round(moon.illumination * 100))}
          </p>
          <Badge
            className={cn("mt-1.5 border-0", QUALITY_STYLES[quality.score])}
          >
            {t.nature.stargazing(t.nature.quality[quality.score])}
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{quality.note}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="mb-1.5 text-sm font-semibold">
            {t.nature.fullMoonsTitle}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {fullMoons.map((d, i) => (
              <li key={i}>{fmtDate(d, lang)}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.nature.fullMoonsNote}
          </p>
        </div>
        <div className="rounded-lg bg-accent/50 p-3">
          <p className="mb-1.5 text-sm font-semibold">
            {t.nature.newMoonsTitle}
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {newMoons.map((d, i) => (
              <li key={i}>{fmtDate(d, lang)}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t.nature.newMoonsNote}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t.nature.moonCalcNote}
      </p>
    </section>
  );
}

/** Sternschnuppen-Kalender: die nächsten Strom-Maxima inkl. Mondstörung – offline berechnet. */
function MeteorCalendar() {
  const { lang, t } = useI18n();
  const [now] = useState(() => new Date());
  const showers = useMemo(() => upcomingShowers(now, 4), [now]);

  return (
    <section
      className="mb-6 rounded-xl border border-border bg-card p-4"
      aria-label={t.nature.meteorSectionAria}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">
          {t.nature.meteorTitle}
        </h2>
      </div>
      <ul className="space-y-3">
        {showers.map(entry => (
          <li key={entry.shower.id} className="rounded-lg bg-accent/50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{pick(entry.shower.name, lang)}</p>
              {entry.activeNow && (
                <Badge className="border-0 bg-primary/15 text-primary">
                  {t.nature.activeNow}
                </Badge>
              )}
              <span className="ml-auto text-sm text-muted-foreground">
                {entry.daysUntilPeak === 0
                  ? t.nature.peakToday
                  : entry.daysUntilPeak === 1
                    ? t.nature.peakTomorrow
                    : t.nature.peakInDays(entry.daysUntilPeak)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {fmtDate(entry.peakDate, lang)} ·{" "}
              {t.nature.meteorRate(entry.shower.zhr)} ·{" "}
              {t.nature.radiantDirection(pick(entry.shower.radiant, lang))}
            </p>
            <p className="mt-1.5 text-sm">{pick(entry.shower.tip, lang)}</p>
            <p
              className={cn(
                "mt-1.5 text-xs",
                entry.moonInterferes
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {entry.moonInterferes
                ? t.nature.moonInterferes(
                    Math.round(entry.moonIllumination * 100)
                  )
                : t.nature.moonOk(Math.round(entry.moonIllumination * 100))}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {t.nature.meteorFootnote}
      </p>
    </section>
  );
}

export default function NaturePage() {
  const { lang, t } = useI18n();
  const [category, setCategory] = useState<string>("tierspuren");
  const activeCategory = natureCategories.find(c => c.id === category)!;
  const entries = natureEntries.filter(e => e.category === category);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.nature.title} subtitle={t.nature.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.nature.offlineNote}
      </div>

      <MoonCalendar />
      <MeteorCalendar />

      <div
        className="mb-4 grid grid-cols-3 gap-2"
        role="group"
        aria-label={t.nature.categoryAria}
      >
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
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
              aria-pressed={category === c.id}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm font-semibold">
                {pick(c.label, lang)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        {pick(activeCategory.intro, lang)}
      </p>

      <Accordion type="single" collapsible className="space-y-3">
        {entries.map(entry => (
          <AccordionItem
            key={entry.id}
            value={entry.id}
            className="overflow-hidden rounded-xl border border-border bg-card px-0"
          >
            <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
              <div className="text-left">
                <p className="font-semibold">{pick(entry.name, lang)}</p>
                {entry.latinOrExtra && (
                  <p className="text-xs italic text-muted-foreground">
                    {pick(entry.latinOrExtra, lang)}
                  </p>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {entry.image && (
                <img
                  src={entry.image}
                  alt={t.nature.imageAlt(pick(entry.name, lang))}
                  loading="lazy"
                  className="mb-4 aspect-[4/3] w-full rounded-lg border border-border object-cover"
                />
              )}
              <p className="mb-4 text-sm leading-relaxed">
                {pick(entry.description, lang)}
              </p>

              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t.nature.featuresTitle}
              </h3>
              <ul className="mb-4 space-y-1 text-sm">
                {entry.features.map(f => (
                  <li key={f.de} className="flex gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    {pick(f, lang)}
                  </li>
                ))}
              </ul>

              <div className="mb-3 flex gap-2.5 rounded-lg bg-accent/60 p-3">
                <Lightbulb
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-sm">
                  <span className="font-semibold">{t.nature.funFactTitle}</span>{" "}
                  {pick(entry.funFact, lang)}
                </p>
              </div>

              <div className="flex gap-2.5 rounded-lg border border-chart-1/40 bg-chart-1/10 p-3">
                <HelpCircle
                  className="h-4 w-4 shrink-0 text-amber-glow"
                  aria-hidden="true"
                />
                <p className="text-sm">
                  <span className="font-semibold">{t.nature.kidsTitle}</span>{" "}
                  {pick(entry.kidQuestion, lang)}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/**
 * Aus Home.tsx herausgelöst (#419): Die Startseite war mit 2005 Zeilen
 * die grösste Datei im Client – die Widgets wohnen jetzt hier (Muster
 * wie Trips #322 und Profil #414).
 */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { pick } from "@shared/i18n";
import { useI18n } from "@/i18n";
import {
  dailyTip,
  dayOfYear,
  type DailyTipIcon,
  type DayWeather,
} from "@shared/dailyTips";
import { getMoonInfo, stargazingQuality } from "@shared/moon";
import { isShowerActive, meteorShowers } from "@shared/astro";
import { useRecipes } from "@/hooks/useRecipes";
import {
  Bug,
  Cable,
  CloudRain,
  CookingPot,
  Cross,
  Droplets,
  Lightbulb,
  Moon,
  Sparkles,
  Sun,
  TreePine,
  Users,
  Wrench,
} from "lucide-react";
import { gearTaskDue } from "@shared/gearTasks";
import { tickObservationStatus } from "@shared/tickBites";
import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";

/** Icon-Schlüssel aus shared/dailyTips.ts auf lucide-Komponenten mappen. */
const TIP_ICONS: Record<DailyTipIcon, typeof Sparkles> = {
  sparkles: Sparkles,
  droplets: Droplets,
  cloudRain: CloudRain,
  moon: Moon,
  sun: Sun,
  cookingPot: CookingPot,
  cable: Cable,
  cross: Cross,
  users: Users,
  treePine: TreePine,
};

/**
 * «Tipp des Tages»: kleine Karte mit genau einem Tages-Tipp aus Wetter
 * (geteilte Daten des Wetter-Widgets), Mond/Astro (reine Berechnung) und
 * Datum – verlinkt aufs passende Modul. Ohne Standort/Wetter greifen die
 * wetterfreien Regeln bzw. die Fallback-Rotation.
 */
export function TipOfDayWidget({
  today,
  tomorrow,
}: {
  today?: DayWeather;
  tomorrow?: DayWeather;
}) {
  const { lang, t } = useI18n();
  const recipes = useRecipes();
  const tip = useMemo(() => {
    const now = new Date();
    const moon = getMoonInfo(now, lang);
    const active = meteorShowers.find(s => isShowerActive(s, now));
    const doy = dayOfYear(now);
    return dailyTip(
      {
        weatherToday: today,
        weatherTomorrow: tomorrow,
        moonIllumination: moon.illumination,
        stargazingQuality: stargazingQuality(moon.illumination, lang).score,
        activeMeteorShower: active ? pick(active.name, lang) : undefined,
        month: now.getMonth() + 1,
        dayOfYear: doy,
        recipeOfDay: recipes
          ? pick(recipes[doy % recipes.length].name, lang)
          : undefined,
      },
      lang
    );
  }, [today, tomorrow, lang, recipes]);
  const Icon = TIP_ICONS[tip.icon];
  return (
    <Link
      href={tip.path}
      className="mb-6 flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      aria-label={t.home.tipOfDayAria(tip.text)}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Lightbulb className="h-3 w-3" aria-hidden="true" />
          {t.home.tipOfDayTitle}
        </span>
        <span className="mt-0.5 block text-sm">{tip.text}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

/**
 * Dezenter Hinweis unter dem Tipp des Tages: Anzahl fälliger Ausrüstungs-
 * Pflege-Aufgaben (shared/gearTasks.ts), verlinkt aufs Inventar. Erscheint
 * nur angemeldet und nur, wenn tatsächlich etwas fällig ist.
 */
export function GearCareHint() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const query = trpc.gear.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = useTodayIso();
  const dueCount = useMemo(
    () =>
      (query.data ?? []).filter(task => gearTaskDue(task, today).due).length,
    [query.data, today]
  );
  if (!isAuthenticated || dueCount === 0) return null;
  return (
    <Link
      href="/inventar"
      className="mb-6 -mt-3 flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      aria-label={t.home.gearDueAria(dueCount)}
    >
      <Wrench className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        {t.home.gearDueText(dueCount)}
      </span>
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

/**
 * Dezente Zeile neben dem Pflege-Hinweis: Anzahl Zeckenstiche, deren
 * 14-Tage-Beobachtung (shared/tickBites.ts) noch läuft – verlinkt auf die
 * Erste Hilfe. Erscheint nur angemeldet und nur bei offenen Stichen.
 */
export function TickBiteHint() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const query = trpc.tickBites.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const today = useTodayIso();
  const openCount = useMemo(
    () =>
      (query.data ?? []).filter(
        bite => !tickObservationStatus(bite, today).done
      ).length,
    [query.data, today]
  );
  if (!isAuthenticated || openCount === 0) return null;
  return (
    <Link
      href="/erste-hilfe"
      className="mb-6 -mt-3 flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      aria-label={t.home.tickDueAria(openCount)}
    >
      <Bug className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        {t.home.tickDueText(openCount)}
      </span>
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}

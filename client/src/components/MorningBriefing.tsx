/**
 * Morgen-Briefing (#255): Was heute zählt, in einer Karte oben auf der
 * Startseite – Wetter am Platz, die geplanten Mahlzeiten, offene Aufgaben
 * von der Pinnwand und ein Satz zum Himmel.
 *
 * Sichtbar NUR morgens (4–12 Uhr Ortszeit) und nur, solange eine eigene
 * Reise läuft. Ein «Morgen-Briefing» am Abend ist keins, und daheim im
 * Winter braucht es keine Zusammenfassung des Zeltplatz-Tages; ein
 * dauerhaft sichtbarer Kasten würde zur Tapete. Wer ihn trotzdem nicht
 * mag, blendet ihn im Profil aus (Widget-Id «briefing»).
 *
 * Die Daten kommen aus dem, was es schon gibt: Tagesprognose von
 * Open-Meteo an den Zeltplatz-Koordinaten, Menüplan der Reise, Pinnwand
 * der Reise, Mondphase aus `shared/moon.ts`. Kein neuer Server-Endpunkt.
 *
 * Welche Zeilen erscheinen und in welcher Reihenfolge, entscheidet
 * `shared/briefing.ts` – dort steht auch, warum Leerzeilen wegfallen.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CloudSunRain,
  ListTodo,
  Moon as MoonIcon,
  Sunrise,
  UtensilsCrossed,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import { getMoonInfo } from "@shared/moon";
import { MEALS, MEAL_LABELS } from "@shared/menuPlan";
import { normalizeTripBoardKind } from "@shared/tripBoard";
import { recipes } from "@/data/recipes";
import { describeWeatherCode } from "@shared/weather";
import {
  briefingItems,
  briefingTasks,
  isBriefingTime,
  type BriefingKind,
} from "@shared/briefing";

/** Symbol je Zeilen-Art. */
const ICONS: Record<BriefingKind, typeof CloudSunRain> = {
  weather: CloudSunRain,
  meals: UtensilsCrossed,
  tasks: ListTodo,
  astro: MoonIcon,
};

interface DayWeather {
  maxC: number;
  minC: number;
  label: string;
}

/** Tagesprognose am Platz – ein Abruf, ohne Schlüssel, wie im Wetter-Modul. */
function useDayWeather(
  latitude: number | null,
  longitude: number | null,
  lang: ReturnType<typeof useI18n>["lang"]
): DayWeather | null {
  const [weather, setWeather] = useState<DayWeather | null>(null);
  useEffect(() => {
    if (latitude === null || longitude === null) return;
    let cancelled = false;
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: "1",
      daily: "temperature_2m_max,temperature_2m_min,weather_code",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error("no"))))
      .then(json => {
        if (cancelled) return;
        const max = json?.daily?.temperature_2m_max?.[0];
        const min = json?.daily?.temperature_2m_min?.[0];
        const code = json?.daily?.weather_code?.[0];
        if (typeof max !== "number" || typeof min !== "number") return;
        setWeather({
          maxC: max,
          minC: min,
          label:
            typeof code === "number"
              ? describeWeatherCode(code, lang).label
              : "",
        });
      })
      .catch(() => {
        // Ohne Netz bleibt die Wetter-Zeile einfach weg
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, lang]);
  return weather;
}

export default function MorningBriefing({
  tripId,
  latitude,
  longitude,
  today,
}: {
  tripId: number;
  latitude: number | null;
  longitude: number | null;
  today: string;
}) {
  const { lang, t } = useI18n();
  const tb = t.briefing;
  // Die Uhrzeit wird beim Rendern EINMAL gelesen: Die Startseite lebt
  // ohnehin nicht stundenlang offen, und ein Timer, der um Punkt zwölf die
  // Karte wegnimmt, wäre Aufwand für einen Moment, den niemand sieht.
  const morning = isBriefingTime(new Date().getHours());

  const weather = useDayWeather(morning ? latitude : null, longitude, lang);
  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId },
    { enabled: morning, staleTime: 60_000 }
  );
  const boardQuery = trpc.trips.board.list.useQuery(
    { tripId },
    { enabled: morning, staleTime: 60_000 }
  );
  const customRecipesQuery = trpc.recipes.list.useQuery(undefined, {
    enabled:
      morning &&
      (menuQuery.data?.entries ?? []).some(
        e => e.day === today && e.customRecipeId != null
      ),
    staleTime: 60_000,
  });

  if (!morning) return null;

  /** Anzeigetitel eines Menüplan-Eintrags in der aktiven Sprache. */
  const mealTitle = (entry: {
    recipeId: string | null;
    customRecipeId: number | null;
    freeText: string | null;
  }): string | null => {
    if (entry.recipeId) {
      const recipe = recipes.find(r => r.id === entry.recipeId);
      return recipe ? pick(recipe.name, lang) : entry.recipeId;
    }
    if (entry.customRecipeId != null) {
      return (
        customRecipesQuery.data?.find(r => r.id === entry.customRecipeId)
          ?.name ?? null
      );
    }
    return entry.freeText ?? null;
  };

  const todayEntries = (menuQuery.data?.entries ?? []).filter(
    e => e.day === today
  );
  const mealsLine = MEALS.map(meal => {
    const entry = todayEntries.find(e => e.meal === meal);
    if (!entry) return null;
    const title = mealTitle(entry);
    return title ? `${pick(MEAL_LABELS[meal], lang)}: ${title}` : null;
  })
    .filter((part): part is string => part !== null)
    .join(" · ");

  // Offene Aufgaben der Pinnwand – erledigte und reine Nachrichten fliegen
  // raus, sonst stünde morgens der Plausch von gestern in der Karte.
  const openTasks = (boardQuery.data ?? [])
    .filter(note => normalizeTripBoardKind(note.kind) === "task" && !note.done)
    .map(note => note.text);
  const { remaining } = briefingTasks(openTasks);

  const moon = getMoonInfo(new Date(), lang);
  const items = briefingItems({
    weather: weather
      ? `${Math.round(weather.minC)}–${Math.round(weather.maxC)} °C${
          weather.label ? `, ${weather.label}` : ""
        }`
      : null,
    meals: mealsLine,
    tasks: openTasks,
    astro: tb.astroLine(moon.phaseLabel, Math.round(moon.illumination * 100)),
  });

  if (items.length === 0) return null;

  return (
    <section
      className="relative mb-6 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
      aria-label={tb.sectionAria}
    >
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
        <Sunrise className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
        {tb.title}
      </h2>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, index) => {
          const Icon = ICONS[item.kind];
          return (
            <li
              key={`${item.kind}-${index}`}
              className="flex items-start gap-2 text-sm"
            >
              <Icon
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0">{item.text}</span>
            </li>
          );
        })}
      </ul>
      {remaining > 0 && (
        <p className="mt-1.5 pl-5.5 text-xs text-muted-foreground">
          {tb.moreTasks(remaining)}
        </p>
      )}
      {/* Das Briefing ist die Kurzfassung, «Heute» die Langfassung – wer
          hier liest, will meistens dorthin. Der Link trägt deshalb ein
          `after`, das die GANZE Karte überdeckt: Antippen wirkt überall,
          aber vorgelesen wird nach wie vor das Briefing und danach ein
          Link mit eigenem Text. Ein `aria-label` auf einer Karte-als-Link
          hätte den Inhalt für Screenreader verschluckt. */}
      <Link
        href="/heute"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary after:absolute after:inset-0 after:rounded-xl hover:underline"
      >
        {tb.openToday}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

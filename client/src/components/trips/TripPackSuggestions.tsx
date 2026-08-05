import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_FORECAST_DAYS } from "@/components/trips/shared";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  Clock,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Copy,
  Eye,
  EyeOff,
  CopyPlus,
  Download,
  Fuel,
  Gauge,
  GraduationCap,
  LayoutGrid,
  List,
  ListChecks,
  Loader2,
  LogOut,
  MapPin,
  MapPinned,
  MessageSquare,
  Moon,
  Pencil,
  Pin,
  Plus,
  Printer,
  Share2,
  ShoppingBasket,
  Signpost,
  Sparkles,
  Star,
  Tent,
  Trash2,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  expensesByCategory,
  budgetStatus,
  BUDGET_MAX_RAPPEN,
  expensesTotalRappen,
  normalizeExpenseCategory,
  settleUp,
  type ExpenseCategory,
} from "@shared/expenses";
import {
  computeTripStats,
  computeYearReview,
  daysUntilTrip,
  isUpcomingTrip,
  nightsPerYear,
  TRIP_JOURNAL_MAX_LENGTH,
  tripNights,
} from "@shared/trips";
import {
  TRIP_BOARD_KINDS,
  TRIP_BOARD_KIND_LABELS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  isValidTripBoardText,
  normalizeTripBoardKind,
  tripBoardCounts,
  type TripBoardKind,
} from "@shared/tripBoard";
import { buildTripIcs, icsFileName, type IcsTrip } from "@shared/ics";
import {
  countMainSlots,
  tripReadiness,
  type ReadinessKey,
} from "@shared/tripReadiness";
import {
  packingSuggestions,
  type ForecastDay,
  type PackSuggestion,
} from "@shared/packSuggestions";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";

export default function TripPackSuggestions({
  listId,
  latitude,
  longitude,
  startDate,
  endDate,
}: {
  listId: number;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
}) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [forecastDays, setForecastDays] = useState<ForecastDay[] | null>(null);
  const itemsQuery = trpc.packing.items.useQuery({ listId });

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    // Nur so viele Tage abrufen, wie bis zur Abreise nötig (max. Open-Meteo-Horizont)
    const horizon = Math.min(
      MAX_FORECAST_DAYS,
      Math.max(1, daysUntilTrip(endDate, today) + 1)
    );
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: String(horizon),
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res =>
        res.ok ? res.json() : Promise.reject(new Error("weather unavailable"))
      )
      .then(json => {
        if (cancelled) return;
        const days = (json.daily.time as string[])
          .map((date: string, i: number) => ({
            date,
            tMax: json.daily.temperature_2m_max[i] as number,
            tMin: json.daily.temperature_2m_min[i] as number,
            precipProb: (json.daily.precipitation_probability_max?.[i] ??
              0) as number,
            windMax: json.daily.wind_gusts_10m_max?.[i] as number | undefined,
          }))
          // Nur die Tage des Aufenthalts, und nur vollständige Werte
          .filter(
            d =>
              d.date >= startDate &&
              d.date <= endDate &&
              typeof d.tMax === "number" &&
              typeof d.tMin === "number"
          )
          .map(({ date: _date, ...day }) => day);
        setForecastDays(days);
      })
      .catch(() => {
        // Wetterdienst nicht erreichbar – Vorschläge still weglassen
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, startDate, endDate]);

  const suggestions = useMemo(
    () => (forecastDays ? packingSuggestions(forecastDays, lang) : []),
    [forecastDays, lang]
  );
  const listItems = itemsQuery.data?.items;
  // Namens-Abgleich case-insensitiv gegen die Einträge in der aktiven Sprache
  const missing = useMemo(() => {
    if (!listItems) return [];
    const onList = new Set(listItems.map(i => i.name.trim().toLowerCase()));
    return suggestions.filter(s => !onList.has(s.name.trim().toLowerCase()));
  }, [suggestions, listItems]);

  const addMutation = trpc.packing.addItems.useMutation({
    onSuccess: (_data, vars) => {
      utils.packing.items.invalidate({ listId });
      utils.packing.progress.invalidate({ listId });
      toast.success(
        vars.items.length === 1
          ? t.trips.packSuggestionsAdded(vars.items[0].name)
          : t.trips.packSuggestionsAddedAll(vars.items.length)
      );
    },
    onError: () => toast.error(t.trips.packSuggestionsAddFailed),
  });

  const addSuggestions = (toAdd: PackSuggestion[]) => {
    if (toAdd.length === 0) return;
    addMutation.mutate({
      listId,
      items: toAdd.map(s => ({
        name: s.name,
        category: s.category,
        quantity: 1,
      })),
    });
  };

  if (missing.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <CloudSun
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.trips.packSuggestionsTitle}
        </span>
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {t.trips.packSuggestionsBadge(missing.length)}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2.5">
          <p className="mb-2 text-xs text-muted-foreground">
            {t.trips.packSuggestionsHint}
          </p>
          <ul className="space-y-1.5">
            {missing.map(s => (
              <li key={s.name} className="flex items-center gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {s.reason}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  disabled={addMutation.isPending}
                  onClick={() => addSuggestions([s])}
                  aria-label={t.trips.packSuggestionsAddAria(s.name)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {t.trips.packSuggestionsAdd}
                </Button>
              </li>
            ))}
          </ul>
          {missing.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2.5"
              disabled={addMutation.isPending}
              onClick={() => addSuggestions(missing)}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.packSuggestionsAddAll}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Wetterarchiv eines vergangenen Aufenthalts: zeigt die gespeicherte
 * Zusammenfassung («31° / 12° · 2 Regentage»). Fehlt sie noch, werden die
 * historischen Tageswerte einmalig geholt (Open-Meteo-Archiv; bei ganz
 * frischen Trips die Forecast-API mit past_days, weil das Archiv die
 * jüngsten Tage noch nicht führt) und via trips.setWeather gespeichert –
 * einmal gespeichert wird nie wieder gefetcht. Fehler bleiben still.
 */

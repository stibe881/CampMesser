import { useEffect, useMemo, useRef, useState } from "react";
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
import { Link, useRoute, useSearch } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { findCountryRules, guessCountryCode } from "@/data/roadRules";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
import { cn } from "@/lib/utils";
import { tripWindow, type TripWindow } from "@shared/weatherWindow";
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
  TRIP_BOARD_KINDS,
  TRIP_BOARD_KIND_LABELS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  isValidTripBoardText,
  normalizeTripBoardKind,
  tripBoardCounts,
  type TripBoardKind,
} from "@shared/tripBoard";
import { buildTripIcs, icsFileName, type IcsTrip } from "@shared/ics";
import { tripDays } from "@shared/menuPlan";
import {
  countMainSlots,
  parseReadinessDone,
  tripReadiness,
  type ReadinessKey,
} from "@shared/tripReadiness";
import {
  packingSuggestions,
  type ForecastDay,
  type PackSuggestion,
} from "@shared/packSuggestions";
import { useTripReadinessCounts } from "@/hooks/useTripReadinessCounts";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";
import { fmtShort } from "@/lib/dateFormat";
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";

const READINESS_ICONS: Record<ReadinessKey, typeof ListChecks> = {
  packList: ListChecks,
  menuPlan: UtensilsCrossed,
  shopping: ShoppingBasket,
  spot: MapPin,
  arrivalTime: Clock,
};

/**
 * Reise-Cockpit: aufklappbare Bereitschafts-Karte pro geplantem Aufenthalt.
 * Packstand, Menüplan-Lücken, offene Reise-Einkäufe und fehlende Angaben in
 * einer Liste – je Zeile mit Status und Direktlink. Die Abfragen laufen
 * bewusst ERST beim Aufklappen (enabled), damit die Übersicht mit vielen
 * geplanten Reisen nicht unnötig lädt.
 */
export default function TripReadinessCard({
  trip,
  tripName,
  onEdit,
  latitude = null,
  longitude = null,
}: {
  trip: {
    id: number;
    startDate: string;
    endDate: string;
    packListId: number | null;
    spotId: number | null;
    arrivalTime: string | null;
    shared?: boolean;
    /** Von Hand erledigte Bereitschafts-Punkte (#667), JSON-Liste. */
    readinessDoneJson?: string | null;
    /** Für den Auslands-Hinweis (#524): Land aus Ort/Titel/Platz raten. */
    location?: string | null;
    title?: string | null;
    spotName?: string | null;
  };
  tripName: string;
  onEdit: () => void;
  /** Koordinaten für die Reisetage-Ampel (#587); null = keine Prognose. */
  latitude?: number | null;
  longitude?: number | null;
}) {
  const t = useT();
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  // Auslands-Hinweis (#524): Vignette/Maut nicht erst an der Grenze
  // entdecken – der Hinweis zeigt aufs Länder-Merkblatt.
  const abroad = useMemo(() => {
    const code = guessCountryCode(
      [trip.location, trip.title, trip.spotName].filter(Boolean).join(" ")
    );
    if (!code || code === "CH") return null;
    return findCountryRules(code);
  }, [trip.location, trip.title, trip.spotName]);

  // Feiertage des Reiselands (#539): erst beim Aufklappen und nur im
  // Ausland abgefragt; der Server cacht pro Land und Jahr.
  const holidaysQuery = trpc.trips.holidaysAbroad.useQuery(
    {
      country: abroad?.code ?? "CH",
      from: trip.startDate,
      to: trip.endDate,
    },
    { enabled: open && abroad !== null, staleTime: 24 * 60 * 60 * 1000 }
  );

  /**
   * Reisetage-Ampel (#587): Der Wetterfenster-Finder (#538) bewertet
   * hier DIE Tage dieser Reise – erst beim Aufklappen und nur mit
   * Koordinaten. Liegen erst einige Reisetage in der 16-Tage-Prognose,
   * sagt die Zeile ehrlich «vorläufig».
   */
  const [tripWx, setTripWx] = useState<TripWindow | null>(null);
  useEffect(() => {
    if (!open || latitude == null || longitude == null) return;
    let cancelled = false;
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      timezone: "auto",
      forecast_days: "16",
      daily:
        "temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max",
    });
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
      .then(res => (res.ok ? res.json() : null))
      .then(
        (
          json: {
            daily?: {
              time?: string[];
              temperature_2m_max?: number[];
              precipitation_sum?: number[];
              precipitation_probability_max?: number[];
              wind_gusts_10m_max?: number[];
            };
          } | null
        ) => {
          if (cancelled || !json?.daily?.time) return;
          const daily = json.daily;
          const days = daily.time!.map((date, i) => ({
            date,
            tempMaxC: daily.temperature_2m_max?.[i] ?? 0,
            precipitationSumMm: daily.precipitation_sum?.[i] ?? 0,
            precipitationProbabilityMax:
              daily.precipitation_probability_max?.[i],
            windGustsMaxKmh: daily.wind_gusts_10m_max?.[i],
          }));
          setTripWx(tripWindow(days, trip.startDate, trip.endDate));
        }
      )
      .catch(() => {
        // Ohne Netz bleibt die Zeile weg.
      });
    return () => {
      cancelled = true;
    };
  }, [open, latitude, longitude, trip.startDate, trip.endDate]);

  const packQuery = trpc.packing.progress.useQuery(
    { listId: trip.packListId ?? 0 },
    { enabled: open && trip.packListId != null }
  );
  const menuQuery = trpc.menu.listByTrip.useQuery(
    { tripId: trip.id },
    { enabled: open }
  );
  const shoppingQuery = trpc.tripShopping.listByTrip.useQuery(
    { tripId: trip.id },
    { enabled: open }
  );

  const days = useMemo(
    () => tripDays(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate]
  );

  /**
   * Von Hand erledigte Punkte (#667): Wer ohne Packliste und Menüplan
   * unterwegs ist, hakt hier selbst ab – die Ampel kann das nicht wissen.
   */
  const utils = trpc.useUtils();
  const manualDone = useMemo(
    () => parseReadinessDone(trip.readinessDoneJson ?? null),
    [trip.readinessDoneJson]
  );
  const setDone = trpc.trips.setReadinessDone.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      utils.trips.counts.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  /**
   * Der Stand aus der gebündelten Abfrage – er trägt die Zahl am
   * ZUGEKLAPPTEN Schalter (#362). Aufgeklappt gewinnen die eigenen
   * Abfragen: Sie stimmen sofort nach dem Abhaken, während die gebündelte
   * noch eine Minute lang die alte Antwort hält (`staleTime`).
   */
  const bundled = useTripReadinessCounts(trip.id);

  const loading =
    menuQuery.isLoading ||
    shoppingQuery.isLoading ||
    (trip.packListId != null && packQuery.isLoading);

  /** Sind die eigenen Abfragen da? Nur dann sind sie die bessere Quelle. */
  const liveReady = open && !loading && menuQuery.data && shoppingQuery.data;

  const readiness = useMemo(
    () =>
      tripReadiness({
        hasSpot: trip.spotId != null,
        hasArrivalTime: Boolean(trip.arrivalTime),
        packList: liveReady
          ? trip.packListId == null
            ? null
            : packQuery.data
              ? {
                  checked: packQuery.data.checked,
                  total: packQuery.data.total,
                }
              : { checked: 0, total: 0 }
          : (bundled?.packList ?? null),
        menu: liveReady
          ? menuQuery.data
            ? countMainSlots(days, menuQuery.data.entries)
            : null
          : (bundled?.menu ?? null),
        shopping: liveReady
          ? shoppingQuery.data
            ? {
                open: shoppingQuery.data.items.filter(i => !i.checked).length,
                total: shoppingQuery.data.items.length,
              }
            : null
          : (bundled?.shopping ?? null),
        sharedTrip: trip.shared === true,
        manualDone,
      }),
    [
      trip.spotId,
      trip.arrivalTime,
      trip.packListId,
      trip.shared,
      liveReady,
      bundled,
      packQuery.data,
      menuQuery.data,
      shoppingQuery.data,
      days,
      manualDone,
    ]
  );

  /**
   * Die Zahl steht neu AUCH zugeklappt da – genau dort ist sie am meisten
   * wert, weil man sonst jede Reise einzeln aufklappen muss (#362, wie der
   * Reisekassen-Betrag in #345). Solange nichts geladen ist, bleibt sie
   * weg, statt kurz eine erfundene Null zu zeigen.
   */
  const showCount = liveReady || bundled !== undefined;

  /** Beschriftung und Ziel einer Zeile – Texte bleiben hier im Client. */
  const rowText = (row: (typeof readiness.rows)[number]) => {
    switch (row.key) {
      case "packList":
        return {
          label: t.trips.readinessPackListLabel,
          detail:
            trip.packListId == null
              ? t.trips.readinessPackListMissing
              : row.status === "ok"
                ? t.trips.readinessPackListDone
                : t.trips.readinessPackListOpen(row.value),
          href:
            trip.packListId == null
              ? "/packlisten"
              : `/packlisten/${trip.packListId}`,
        };
      case "menuPlan":
        return {
          label: t.trips.readinessMenuLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessMenuDone
              : t.trips.readinessMenuOpen(row.value),
          href: `/menueplan/${trip.id}`,
        };
      case "shopping":
        return {
          label: t.trips.readinessShoppingLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessShoppingDone
              : t.trips.readinessShoppingOpen(row.value),
          href: `/menueplan/${trip.id}/einkauf`,
        };
      case "spot":
        return {
          label: t.trips.readinessSpotLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessSpotDone
              : t.trips.readinessSpotMissing,
          href: null,
        };
      case "arrivalTime":
      default:
        return {
          label: t.trips.readinessArrivalLabel,
          detail:
            row.status === "ok"
              ? t.trips.readinessArrivalDone
              : t.trips.readinessArrivalMissing,
          href: null,
        };
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={t.trips.readinessToggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Gauge className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {t.trips.readinessTitle}
        </span>
        {showCount && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              readiness.openCount === 0
                ? "bg-primary/15 text-primary"
                : "bg-accent text-accent-foreground"
            )}
          >
            {readiness.openCount === 0
              ? t.trips.readinessAllDone
              : t.trips.readinessOpenCount(readiness.openCount)}
          </span>
        )}
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
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.trips.readinessLoading}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {readiness.rows.map(row => {
                const { label, detail, href } = rowText(row);
                const Icon = READINESS_ICONS[row.key];
                return (
                  <li key={row.key} className="flex items-center gap-2 text-sm">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        row.status === "ok"
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{label}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {detail}
                      </span>
                    </span>
                    {/* Der Status ist neu ein SCHALTER (#667): antippen
                        hakt den Punkt von Hand ab – oder nimmt das
                        Häkchen wieder weg. Punkte, die ohnehin aus den
                        Daten erledigt sind, bleiben unantastbar: Sie
                        von Hand «offen» zu setzen hiesse, die eigenen
                        Daten zu verleugnen. */}
                    {row.status === "ok" && !row.manual ? (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
                        {t.trips.readinessStatusOk}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={setDone.isPending}
                        aria-pressed={row.status === "ok"}
                        aria-label={
                          row.status === "ok"
                            ? t.trips.readinessUndoneAria(label)
                            : t.trips.readinessMarkDoneAria(label)
                        }
                        title={
                          row.status === "ok"
                            ? t.trips.readinessManualHint
                            : t.trips.readinessMarkDoneHint
                        }
                        onClick={() =>
                          setDone.mutate({
                            tripId: trip.id,
                            key: row.key,
                            done: row.status !== "ok",
                          })
                        }
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium transition-colors",
                          row.status === "ok"
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {row.status === "ok"
                          ? t.trips.readinessStatusManual
                          : t.trips.readinessStatusOpen}
                      </button>
                    )}
                    {href ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs"
                      >
                        <Link
                          href={href}
                          aria-label={t.trips.readinessOpenAria(label)}
                        >
                          {t.trips.readinessOpenLink}
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 px-2 text-xs"
                        onClick={onEdit}
                        aria-label={t.trips.readinessEditAria(tripName)}
                      >
                        {t.trips.readinessEditLink}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {abroad && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t.trips.readinessAbroadHint(pick(abroad.name, lang))}{" "}
              <Link
                href={`/laender?land=${abroad.code}`}
                className="font-medium text-primary hover:underline"
              >
                {t.trips.readinessAbroadLink}
              </Link>
            </p>
          )}
          {/* Feiertage des Reiselands (#539): Läden zu, Strassen voll –
              das gehört in die Vorbereitung, nicht in die Überraschung. */}
          {(holidaysQuery.data?.length ?? 0) > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t.trips.readinessHolidaysTitle}{" "}
              {holidaysQuery.data!.slice(0, 3).map((h, idx) => (
                <span key={h.date}>
                  {idx > 0 && " · "}
                  <span className="font-medium text-foreground">
                    {fmtShort(new Date(`${h.date}T00:00:00`), lang)}
                  </span>{" "}
                  {h.localName}
                </span>
              ))}{" "}
              {t.trips.readinessHolidaysHint}
            </p>
          )}
          {/* Reisetage-Ampel (#587): das Wetterfenster für GENAU diese
              Reisetage, sobald sie in der 16-Tage-Prognose liegen. */}
          {tripWx && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  tripWx.verdict === "top"
                    ? "bg-primary"
                    : tripWx.verdict === "ok"
                      ? "bg-amber-500"
                      : "bg-destructive/70"
                )}
                aria-hidden="true"
              />
              <span>
                {t.trips.tripWindowLine(
                  t.weather.windowSummary(tripWx.tempMaxC, tripWx.rainMm)
                )}
                {!tripWx.complete &&
                  ` ${t.trips.tripWindowPartial(tripWx.coveredDays)}`}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Wetter-basierte Packvorschläge für einen geplanten Aufenthalt mit
 * verknüpfter Packliste und Zeltplatz-Koordinaten: lädt kurz vor der Anreise
 * die Tages-Prognose (Open-Meteo, Muster fetchSpotForecast) und zeigt nur
 * Vorschläge, die noch nicht auf der Liste stehen – dezent aufklappbar.
 * Fehler bleiben still (kein Netz/kein Wetterdienst → kein Abschnitt).
 */

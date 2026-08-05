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
}: {
  trip: {
    id: number;
    startDate: string;
    endDate: string;
    packListId: number | null;
    spotId: number | null;
    arrivalTime: string | null;
    shared?: boolean;
  };
  tripName: string;
  onEdit: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

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

  const readiness = useMemo(
    () =>
      tripReadiness({
        hasSpot: trip.spotId != null,
        hasArrivalTime: Boolean(trip.arrivalTime),
        packList:
          trip.packListId == null
            ? null
            : packQuery.data
              ? {
                  checked: packQuery.data.checked,
                  total: packQuery.data.total,
                }
              : { checked: 0, total: 0 },
        menu: menuQuery.data
          ? countMainSlots(days, menuQuery.data.entries)
          : null,
        shopping: shoppingQuery.data
          ? {
              open: shoppingQuery.data.items.filter(i => !i.checked).length,
              total: shoppingQuery.data.items.length,
            }
          : null,
        sharedTrip: trip.shared === true,
      }),
    [
      trip.spotId,
      trip.arrivalTime,
      trip.packListId,
      trip.shared,
      packQuery.data,
      menuQuery.data,
      shoppingQuery.data,
      days,
    ]
  );

  const loading =
    menuQuery.isLoading ||
    shoppingQuery.isLoading ||
    (trip.packListId != null && packQuery.isLoading);

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
        {open && !loading && (
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
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
                        row.status === "ok"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {row.status === "ok"
                        ? t.trips.readinessStatusOk
                        : t.trips.readinessStatusOpen}
                    </span>
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

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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
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
import { todayIso } from "@shared/localDate";

const DUPLICATE_OFFSET_DAYS = 30;
const DAY_MS = 86400000;

/** ISO-Datum (YYYY-MM-DD) um n Tage verschieben – UTC-basiert. */
function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Ganze Tage zwischen zwei ISO-Daten (endIso − startIso; ungültig = 0). */
function diffDaysIso(startIso: string, endIso: string): number {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / DAY_MS);
}

/**
 * Dialog «Reise duplizieren»: neue Von/Bis-Daten wählen (Vorschlag: gleiche
 * Dauer ab heute + 30 Tage), Bestätigen legt über trips.duplicate eine neue
 * geplante Reise an – Ort, Verknüpfungen und Menüplan werden übernommen,
 * Notizen/Bewertung/Fotos/Wetter nicht.
 */
export default function TripDuplicateDialog({
  trip,
  onClose,
}: {
  trip: { id: number; name: string; startDate: string; endDate: string } | null;
  onClose: () => void;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Beim Öffnen: gleiche Dauer wie das Original, Anreise heute + 30 Tage
  useEffect(() => {
    if (!trip) return;
    const today = todayIso();
    const start = addDaysIso(today, DUPLICATE_OFFSET_DAYS);
    setStartDate(start);
    setEndDate(
      addDaysIso(start, Math.max(0, diffDaysIso(trip.startDate, trip.endDate)))
    );
  }, [trip]);

  const duplicateMutation = trpc.trips.duplicate.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      toast.success(t.trips.duplicated);
      onClose();
    },
    onError: e => toast.error(e.message || t.trips.duplicateFailed),
  });

  return (
    <Dialog
      open={trip !== null}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">
            {t.trips.duplicateDialogTitle}
            {trip ? ` – ${trip.name}` : ""}
          </DialogTitle>
          <DialogDescription>{t.trips.duplicateDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="duplicate-start">{t.trips.arrivalLabel}</Label>
            <Input
              id="duplicate-start"
              type="date"
              value={startDate}
              onChange={e => {
                const value = e.target.value;
                // Dauer beibehalten: die Abreise wandert mit der Anreise mit
                const duration = Math.max(0, diffDaysIso(startDate, endDate));
                setStartDate(value);
                if (value) setEndDate(addDaysIso(value, duration));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duplicate-end">{t.trips.departureLabel}</Label>
            <Input
              id="duplicate-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            disabled={
              duplicateMutation.isPending ||
              !startDate ||
              !endDate ||
              endDate < startDate
            }
            onClick={() => {
              if (!trip) return;
              duplicateMutation.mutate({ tripId: trip.id, startDate, endDate });
            }}
          >
            <CopyPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.trips.duplicateSubmit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

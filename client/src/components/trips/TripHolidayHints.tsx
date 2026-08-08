import {
  fmtDayMonth,
  fmtMedium,
  fmtShort,
  fmtWeekdayLong,
} from "@/lib/dateFormat";
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
import { useI18n, useT } from "@/i18n";
import {
  CANTONS,
  holidayDisplayName,
  overlappingHolidays,
  type Holiday,
} from "@shared/holidays";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";

/** Landesweite Feiertage des geratenen Ziellandes (#469). */
export interface DestinationHolidays {
  countryName: string;
  holidays: Holiday[];
}

export default function TripHolidayHints({
  startDate,
  endDate,
  holidays,
  destination,
}: {
  startDate: string;
  endDate: string;
  holidays: CantonHolidays;
  destination?: DestinationHolidays | null;
}) {
  const { lang, t } = useI18n();
  // Gleiche Ferien können mehrfach vorkommen (Schulkreise) – Namen deduplizieren
  const schoolNames = Array.from(
    new Set(
      overlappingHolidays(startDate, endDate, holidays.school).map(h =>
        holidayDisplayName(h, lang)
      )
    )
  );
  const publicDays = overlappingHolidays(
    startDate,
    endDate,
    holidays.publicHolidays
  );
  const destinationDays = destination
    ? overlappingHolidays(startDate, endDate, destination.holidays)
    : [];
  if (
    schoolNames.length === 0 &&
    publicDays.length === 0 &&
    destinationDays.length === 0
  )
    return null;
  const fmtDay = (iso: string) =>
    fmtDayMonth(new Date(`${iso}T00:00:00`), lang);
  return (
    <p className="mt-1.5 flex flex-wrap gap-1.5">
      {schoolNames.map(name => (
        <span
          key={`schule-${name}`}
          className="flex items-center gap-1 rounded-full bg-chart-4/15 px-2.5 py-0.5 text-xs font-medium"
        >
          <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t.trips.holidaySchoolBadge(name)}
        </span>
      ))}
      {publicDays.map(h => (
        <span
          key={`feiertag-${h.id}`}
          className="flex items-center gap-1 rounded-full bg-chart-1/15 px-2.5 py-0.5 text-xs font-medium"
        >
          <Star className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t.trips.holidayPublicBadge(
            fmtDay(h.startDate),
            holidayDisplayName(h, lang)
          )}
        </span>
      ))}
      {destination &&
        destinationDays.map(h => (
          <span
            key={`zielland-${h.id}`}
            className="flex items-center gap-1 rounded-full bg-chart-2/15 px-2.5 py-0.5 text-xs font-medium"
          >
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            {t.trips.holidayDestinationBadge(
              destination.countryName,
              fmtDay(h.startDate),
              holidayDisplayName(h, lang)
            )}
          </span>
        ))}
    </p>
  );
}

/**
 * 5 klickbare Sterne als radiogroup – ein Klick auf den bereits gewählten
 * Stern wählt die Bewertung wieder ab (onChange(null)).
 */

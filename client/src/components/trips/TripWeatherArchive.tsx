import { useEffect, useMemo, useRef, useState } from "react";
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
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import {
  computeTripStats,
  computeYearReview,
  daysUntilTrip,
  isUpcomingTrip,
  nightsPerYear,
  TRIP_JOURNAL_MAX_LENGTH,
  tripNights,
} from "@shared/trips";
import { climateRequestUrl } from "@shared/climate";
import { todayIso } from "@shared/localDate";
import {
  parseTripWeather,
  summarizeTripWeather,
  TRIP_WEATHER_ARCHIVE_MIN_AGE_DAYS,
  tripWeatherDayList,
  weatherLuck,
} from "@shared/tripWeather";

export default function TripWeatherArchive({
  tripId,
  weatherJson,
  startDate,
  endDate,
  latitude,
  longitude,
}: {
  tripId: number;
  weatherJson: string | null;
  startDate: string;
  endDate: string;
  latitude: number;
  longitude: number;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const stored = useMemo(() => parseTripWeather(weatherJson), [weatherJson]);
  const setWeatherMutation = trpc.trips.setWeather.useMutation({
    onSuccess: () => utils.trips.list.invalidate(),
  });
  const mutateRef = useRef(setWeatherMutation.mutate);
  mutateRef.current = setWeatherMutation.mutate;
  // Pro Einhängen höchstens ein Abruf-Versuch – nach dem Speichern verhindert
  // das gefüllte weatherJson jeden weiteren.
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (stored || attemptedRef.current) return;
    const today = todayIso();
    // Nur abgeschlossene Aufenthalte haben ein vollständiges Archiv
    if (endDate >= today) return;
    attemptedRef.current = true;
    let cancelled = false;
    // Das Archiv hinkt einige Tage hinterher – frische Trips über die
    // Forecast-API mit past_days abdecken (Muster server/push.ts)
    const daysSinceEnd = daysUntilTrip(today, endDate);
    let url: string;
    if (daysSinceEnd >= TRIP_WEATHER_ARCHIVE_MIN_AGE_DAYS) {
      url = climateRequestUrl(latitude, longitude, startDate, endDate);
    } else {
      const pastDays = Math.min(
        92,
        Math.max(1, daysUntilTrip(today, startDate))
      );
      const params = new URLSearchParams({
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
        timezone: "auto",
        past_days: String(pastDays),
        forecast_days: "1",
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
      });
      url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    }
    fetch(url)
      .then(res =>
        res.ok ? res.json() : Promise.reject(new Error("weather unavailable"))
      )
      .then(json => {
        if (cancelled) return;
        const daily = json?.daily as
          | {
              time: string[];
              temperature_2m_max: (number | null)[];
              temperature_2m_min: (number | null)[];
              precipitation_sum: (number | null)[];
            }
          | undefined;
        if (!daily || !Array.isArray(daily.time)) return;
        // Nur die Tage des Aufenthalts zusammenfassen (die Forecast-Antwort
        // enthält auch Tage ausserhalb des Zeitraums)
        const inRange = daily.time
          .map((date, i) => ({ date, i }))
          .filter(d => d.date >= startDate && d.date <= endDate)
          .map(d => d.i);
        const rangeDaily = {
          temperature_2m_max: inRange.map(i => daily.temperature_2m_max?.[i]),
          temperature_2m_min: inRange.map(i => daily.temperature_2m_min?.[i]),
          precipitation_sum: inRange.map(i => daily.precipitation_sum?.[i]),
        };
        const summary = summarizeTripWeather(rangeDaily);
        // Noch lückenhaft (z. B. Archiv hinkt nach) → beim nächsten Besuch erneut
        if (summary) {
          // Tages-Wetter fürs Journal (#608) gleich mit archivieren
          mutateRef.current({
            id: tripId,
            summary,
            days: tripWeatherDayList(
              inRange.map(i => daily.time[i]),
              rangeDaily
            ),
          });
        }
      })
      .catch(() => {
        // Wetterdienst nicht erreichbar – still bleiben, später erneut versuchen
      });
    return () => {
      cancelled = true;
    };
  }, [stored, tripId, startDate, endDate, latitude, longitude]);

  if (!stored) return null;
  return (
    <p
      className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
      title={t.trips.weatherTitle}
    >
      <CloudSun className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t.trips.weatherTitle}: </span>
      {t.trips.weatherSummary(
        Math.round(stored.tMax),
        Math.round(stored.tMin)
      )}{" "}
      · {t.trips.weatherRainDays(stored.rainDays)}
    </p>
  );
}

/**
 * Tages-Journal einer Reise (#192): aufklappbarer Abschnitt «Reise-Tagebuch»
 * bei vergangenen UND laufenden Reisen. Pro Reisetag (chronologisch) eine
 * Zeile mit Datum + Wochentag; ein Stift öffnet das Textfeld für den Tag.
 * Mitreisende dürfen mitschreiben – bei gemeinsamen Reisen steht «von <Name>»
 * am Eintrag. Geladen wird erst beim Aufklappen (enabled-Flag).
 */

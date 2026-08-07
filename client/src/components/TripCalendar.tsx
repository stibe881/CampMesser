/**
 * Monats-Kalender der Reisen: Aufenthalte als farbige Balken (eigene vs.
 * gemeinsame Reisen), Schulferien des gewählten Kantons als dezente
 * Hintergrund-Markierung und Feiertage als Punkt. Reine Anzeige-Komponente –
 * die Gitter-Logik liegt in shared/calendar.ts, die Ferien-Daten kommen von
 * der Seite (bestehende holidays-Logik in Trips.tsx).
 */
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { addMonths, monthGrid } from "@shared/calendar";
import { holidayDisplayName, overlappingHolidays } from "@shared/holidays";
import type { CantonHolidays } from "@/lib/holidays";
import { cn } from "@/lib/utils";
import { useTodayIso } from "@/lib/useTodayIso";

/** Ein Aufenthalt, wie ihn der Kalender braucht (Auszug aus trips.list). */
export interface CalendarTrip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  /** true = gemeinsame Reise (Mitglied oder eigene mit Mitreisenden). */
  shared: boolean;
}

export default function TripCalendar({
  trips,
  holidays,
  onTripClick,
}: {
  trips: CalendarTrip[];
  holidays: CantonHolidays | null;
  onTripClick: (tripId: number) => void;
}) {
  const { lang, t } = useI18n();
  const today = new Date();
  const todayDay = useTodayIso();
  const [view, setView] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const weeks = useMemo(
    () => monthGrid(view.year, view.month),
    [view.year, view.month]
  );

  const monthLabel = new Date(
    Date.UTC(view.year, view.month - 1, 1)
  ).toLocaleDateString(LOCALE_TAGS[lang], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  /** Wochentags-Kopf aus der ersten Gitter-Zeile (beginnt immer am Montag). */
  const weekdayLabels = useMemo(
    () =>
      weeks[0].map(day =>
        new Date(`${day.iso}T00:00:00Z`).toLocaleDateString(LOCALE_TAGS[lang], {
          weekday: "short",
          timeZone: "UTC",
        })
      ),
    [weeks, lang]
  );

  const fmtDayLong = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(LOCALE_TAGS[lang], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      {/* Monats-Navigation */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setView(v => addMonths(v.year, v.month, -1))}
          aria-label={t.trips.calPrevMonth}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h3
          className="font-serif text-base font-semibold capitalize"
          aria-live="polite"
        >
          {monthLabel}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setView(v => addMonths(v.year, v.month, 1))}
          aria-label={t.trips.calNextMonth}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <table
        className="w-full table-fixed border-collapse"
        aria-label={t.trips.calGridAria(monthLabel)}
      >
        <thead>
          <tr>
            {weekdayLabels.map(label => (
              <th
                key={label}
                scope="col"
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map(week => (
            <tr key={week[0].iso}>
              {week.map(day => {
                const dayTrips = trips.filter(
                  trip => day.iso >= trip.startDate && day.iso <= trip.endDate
                );
                // Gleiche Ferien können mehrfach vorkommen (Schulkreise) –
                // Namen deduplizieren (Muster TripHolidayHints)
                const schoolNames = holidays
                  ? Array.from(
                      new Set(
                        overlappingHolidays(
                          day.iso,
                          day.iso,
                          holidays.school
                        ).map(h => holidayDisplayName(h, lang))
                      )
                    )
                  : [];
                const publicNames = holidays
                  ? Array.from(
                      new Set(
                        overlappingHolidays(
                          day.iso,
                          day.iso,
                          holidays.publicHolidays
                        ).map(h => holidayDisplayName(h, lang))
                      )
                    )
                  : [];
                const isToday = day.iso === todayDay;
                const ariaParts = [fmtDayLong(day.iso)];
                if (dayTrips.length > 0)
                  ariaParts.push(t.trips.calDayTrips(dayTrips.length));
                if (schoolNames.length > 0)
                  ariaParts.push(
                    t.trips.calSchoolHolidayTitle(schoolNames.join(", "))
                  );
                if (publicNames.length > 0)
                  ariaParts.push(
                    t.trips.calPublicHolidayTitle(publicNames.join(", "))
                  );
                const holidayTitle = [
                  ...schoolNames.map(name =>
                    t.trips.calSchoolHolidayTitle(name)
                  ),
                  ...publicNames.map(name =>
                    t.trips.calPublicHolidayTitle(name)
                  ),
                ].join(" · ");
                return (
                  <td
                    key={day.iso}
                    aria-label={ariaParts.join(", ")}
                    title={holidayTitle || undefined}
                    className={cn(
                      "h-14 border border-border/60 p-1 align-top sm:h-16",
                      !day.inMonth && "bg-muted/40",
                      day.inMonth && schoolNames.length > 0 && "bg-chart-4/10",
                      !day.inMonth && schoolNames.length > 0 && "bg-chart-4/5"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                          !day.inMonth && "text-muted-foreground/60",
                          isToday &&
                            "bg-primary font-semibold text-primary-foreground"
                        )}
                      >
                        {Number(day.iso.slice(8, 10))}
                      </span>
                      {publicNames.length > 0 && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-chart-1"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    {dayTrips.length > 0 && (
                      <span className="mt-1 flex flex-col gap-0.5">
                        {dayTrips.map(trip => (
                          <button
                            key={trip.id}
                            type="button"
                            onClick={() => onTripClick(trip.id)}
                            title={trip.name}
                            aria-label={t.trips.calTripAria(trip.name)}
                            className={cn(
                              "block h-2 w-full transition-opacity hover:opacity-80",
                              trip.shared ? "bg-chart-4" : "bg-primary",
                              day.iso === trip.startDate && "rounded-l-full",
                              day.iso === trip.endDate && "rounded-r-full"
                            )}
                          />
                        ))}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legende */}
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span
            className="h-2 w-5 rounded-full bg-primary"
            aria-hidden="true"
          />
          {t.trips.calLegendOwn}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-2 w-5 rounded-full bg-chart-4"
            aria-hidden="true"
          />
          {t.trips.calLegendShared}
        </li>
        {holidays && (
          <>
            <li className="flex items-center gap-1.5">
              <span
                className="h-3.5 w-5 rounded bg-chart-4/15"
                aria-hidden="true"
              />
              {t.trips.calLegendSchool}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-chart-1"
                aria-hidden="true"
              />
              {t.trips.calLegendPublic}
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

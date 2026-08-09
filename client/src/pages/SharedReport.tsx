/**
 * Geteilter Reise-BERICHT (#629): Journal, Fotos und Etappen als
 * schreibgeschützte Seite für Verwandte – der Link nutzt denselben
 * Teil-Token wie der Reise-Hub (/reise/<token>), zeigt aber die
 * ERINNERUNG statt der Organisation: Titelbild, Wetter-Zeile, Etappen,
 * Tages-Journal mit Fotos und die Galerie. Fotos laufen über die
 * Token-Routen /api/bericht/… – «Teilen beenden» macht alles ungültig.
 */
import { useMemo } from "react";
import { useParams } from "wouter";
import { CloudSun, Loader2, MapPin, Signpost, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fmtLong, fmtWeekdayLong } from "@/lib/dateFormat";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { tripNights } from "@shared/trips";
import { parseTripWeather } from "@shared/tripWeather";
import { cn } from "@/lib/utils";

export default function SharedReportPage() {
  const { lang, t } = useI18n();
  const tr = t.sharedReport;
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const query = trpc.trips.sharedReport.useQuery(
    { token },
    { enabled: token.length >= 8, retry: false }
  );

  const data = query.data;
  const weather = useMemo(
    () => parseTripWeather(data?.trip.weatherJson ?? null),
    [data?.trip.weatherJson]
  );

  const photoSrc = (fileName: string) =>
    `/api/bericht/${encodeURIComponent(token)}/fotos/${fileName}`;
  const journalPhotoSrc = (fileName: string) =>
    `/api/bericht/${encodeURIComponent(token)}/journal/${fileName}`;

  const fmtDay = (iso: string) =>
    fmtWeekdayLong(new Date(`${iso}T00:00:00`), lang);
  const fmtRange = (start: string, end: string) => {
    const fmt = (iso: string) => fmtLong(new Date(`${iso}T00:00:00`), lang);
    return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
  };

  if (query.isLoading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container max-w-2xl py-10 text-center">
        <p className="font-serif text-xl font-semibold">{tr.notFoundTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{tr.notFoundText}</p>
      </div>
    );
  }

  const name = data.trip.title || data.spotName || data.trip.location || "";
  const cover =
    data.trip.coverPhotoId != null
      ? (data.photos.find(p => p.id === data.trip.coverPhotoId) ?? null)
      : null;
  const galleryPhotos = data.photos.filter(p => p.id !== cover?.id);
  const nights = tripNights(data.trip.startDate, data.trip.endDate);

  return (
    <div className="container max-w-2xl py-6">
      {cover && (
        <img
          src={photoSrc(cover.fileName)}
          alt={tr.coverAlt(name)}
          className="mb-4 max-h-64 w-full rounded-xl object-cover"
        />
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {tr.kicker}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-bold">{name}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {data.spotName && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {data.spotName}
          </span>
        )}
        <span>{fmtRange(data.trip.startDate, data.trip.endDate)}</span>
        <span>{t.trips.nightsCount(nights)}</span>
      </p>
      {data.trip.rating != null && (
        <p
          className="mt-1.5 flex items-center gap-0.5"
          aria-label={tr.ratingAria(data.trip.rating)}
        >
          {[1, 2, 3, 4, 5].map(n => (
            <Star
              key={n}
              className={cn(
                "h-4 w-4",
                n <= (data.trip.rating ?? 0)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
              aria-hidden="true"
            />
          ))}
        </p>
      )}
      {weather && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CloudSun className="h-4 w-4" aria-hidden="true" />
          {t.trips.weatherSummary(
            Math.round(weather.tMax),
            Math.round(weather.tMin)
          )}{" "}
          · {t.trips.weatherRainDays(weather.rainDays)}
        </p>
      )}

      {data.trip.notes && (
        <Card className="mt-5">
          <CardContent className="pt-5">
            <p className="whitespace-pre-line text-sm">{data.trip.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Etappen der Rundreise */}
      {data.stops.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
            <Signpost className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
            {t.tripStops.title}
          </h2>
          <ul className="space-y-1.5">
            {data.stops.map((stop, index) => (
              <li
                key={`${stop.name}-${index}`}
                className="rounded-lg bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {index + 1}. {stop.name}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {fmtRange(stop.startDate, stop.endDate)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tages-Journal mit Fotos */}
      {data.journal.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-serif text-lg font-semibold">
            {t.trips.journalTitle}
          </h2>
          <ul className="space-y-3">
            {data.journal.map(entry => (
              <li key={entry.day} className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-xs font-semibold capitalize text-muted-foreground">
                  {fmtDay(entry.day)}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-sm">
                  {entry.text}
                </p>
                {entry.photoFileName && (
                  <img
                    src={journalPhotoSrc(entry.photoFileName)}
                    alt={tr.journalPhotoAlt(fmtDay(entry.day))}
                    loading="lazy"
                    className="mt-2 max-h-56 rounded-lg object-cover"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Foto-Galerie */}
      {galleryPhotos.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-serif text-lg font-semibold">
            {tr.photosTitle}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {galleryPhotos.map((photo, index) => (
              <img
                key={photo.id}
                src={photoSrc(photo.fileName)}
                alt={tr.photoAlt(index + 1, name)}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 border-t border-border pt-3 text-center text-xs text-muted-foreground">
        {tr.footer}
      </p>
    </div>
  );
}

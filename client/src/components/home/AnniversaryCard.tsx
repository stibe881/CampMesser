/**
 * Aus Home.tsx herausgelöst (#419): Die Startseite war mit 2005 Zeilen
 * die grösste Datei im Client – die Widgets wohnen jetzt hier (Muster
 * wie Trips #322 und Profil #414).
 */
import { Link } from "wouter";
import { fmtLong } from "@/lib/dateFormat";
import { ArrowRight, History as HistoryIcon, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { useMemo, useState } from "react";
import { anniversaryTrips, tripNights } from "@shared/trips";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";

/** Schlüssel des «für heute weggeklickt»-Merkers der Jahrestag-Karte. */
const ANNIVERSARY_DISMISSED_KEY = "campmesser.anniversaryDismissed";

/** Titelbild-Miniatur eines Jahrestag-Eintrags (nur wenn eines gesetzt ist). */
function AnniversaryThumb({
  tripId,
  coverPhotoId,
  alt,
}: {
  tripId: number;
  coverPhotoId: number;
  alt: string;
}) {
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const cover = photosQuery.data?.find(p => p.id === coverPhotoId);
  if (!cover) return null;
  return (
    <img
      src={`/api/trips/photos/${cover.fileName}`}
      alt={alt}
      loading="lazy"
      className="h-14 w-14 shrink-0 rounded-lg object-cover"
    />
  );
}

/**
 * «Vor einem Jahr»-Erinnerung: dezente Karte, wenn heute (±3 Tage) der
 * Jahrestag eines vergangenen Aufenthalts ist – die Auswahl trifft die reine
 * Funktion anniversaryTrips() aus shared/trips.ts (1 bis 5 Jahre zurück,
 * kleinster Abstand gewinnt). Gezeigt wird der nächstliegende Treffer mit
 * Ort, Nächten, Bewertung und – falls vorhanden – dem Titelbild. Nur
 * angemeldet, nur bei Treffern, und für den laufenden Tag wegklickbar
 * (sessionStorage merkt sich das Datum).
 */
export default function AnniversaryCard() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const today = useTodayIso();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ANNIVERSARY_DISMISSED_KEY) === today;
    } catch {
      return false;
    }
  });
  const enabled = isAuthenticated && !dismissed;
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
  });

  const hit = useMemo(
    () => anniversaryTrips(tripsQuery.data ?? [], today)[0],
    [tripsQuery.data, today]
  );

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(ANNIVERSARY_DISMISSED_KEY, today);
    } catch {
      // Speicher blockiert – die Karte bleibt nur für diese Ansicht weg
    }
  };

  if (!enabled || !hit) return null;
  const trip = hit.trip;
  const place =
    trip.title ||
    (trip.spotId != null
      ? (spotsQuery.data?.find(s => s.id === trip.spotId)?.name ??
        trip.spotName ??
        "")
      : (trip.location ?? "")) ||
    t.home.nextTripFallback;
  const nights = tripNights(trip.startDate, trip.endDate);
  const title =
    hit.yearsAgo === 1
      ? t.home.anniversaryTitleOne
      : t.home.anniversaryTitleMany(hit.yearsAgo);
  const started = fmtLong(new Date(`${trip.startDate}T00:00:00`), lang);

  return (
    <section
      className="mb-6 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        {trip.coverPhotoId != null && (
          <AnniversaryThumb
            tripId={trip.id}
            coverPhotoId={trip.coverPhotoId}
            alt={t.home.anniversaryPhotoAlt(place)}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <HistoryIcon className="h-3 w-3" aria-hidden="true" />
            {title}
          </p>
          <p className="mt-0.5 truncate font-semibold">{place}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {started}
            {nights > 0 && ` · ${t.home.anniversaryNights(nights)}`}
            {typeof trip.rating === "number" && (
              <>
                {" · "}
                <span aria-label={t.home.anniversaryRatingAria(trip.rating)}>
                  {"★".repeat(trip.rating)}
                </span>
              </>
            )}
          </p>
          <Link
            href="/tagebuch"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            aria-label={t.home.anniversaryLinkAria(place)}
          >
            {t.home.anniversaryLink}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
          aria-label={t.home.anniversaryDismissAria}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

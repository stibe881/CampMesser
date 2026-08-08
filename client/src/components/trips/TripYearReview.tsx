import { useMemo, useState } from "react";
import { CloudSun, Moon, Share2, Sparkles, Star, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { computeYearReview, tripNights, type TripLike } from "@shared/trips";
import { weatherLuck } from "@shared/tripWeather";
import { drawYearReview } from "@/lib/yearReviewImage";
import { tripPhotoSrc } from "@/components/trips/shared";

/**
 * Jahresrückblick eines Kalenderjahres (#62, herausgelöst in #350).
 *
 * WARUM EIGENE DATEI: `Trips.tsx` war mit 2740 Zeilen die grösste Datei
 * des Projekts. Der Rückblick ist der grösste Teil davon, der wirklich
 * für sich steht – er bringt seinen eigenen Zustand (das gewählte Jahr),
 * seine eigene Rechnerei und das Teilen als Bild mit und braucht von der
 * Seite nur die Reisen.
 *
 * `trips` sind die vollen Zeilen (fürs Titelbild und die Bewertung),
 * `tripLikes` die für die Statistik aufbereitete Form – die baut die
 * Seite ohnehin schon für Kennzahlen und Meilensteine, ein zweites Mal
 * wäre Verschwendung.
 */
export default function TripYearReview({
  trips,
  tripLikes,
}: {
  trips: {
    id: number;
    startDate: string;
    endDate: string;
    rating: number | null;
    coverPhotoId: number | null;
  }[];
  tripLikes: TripLike[];
}) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();

  /** Ø-Bewertung mit maximal einer Nachkommastelle in der aktiven Sprache. */
  const fmtRating = (value: number): string =>
    value.toLocaleString(LOCALE_TAGS[lang], { maximumFractionDigits: 1 });

  // Jahre mit vergangenen Trips, Vorgabe = aktuellstes Jahr
  const reviewYears = useMemo(() => {
    const years = new Set<number>();
    for (const trip of trips) years.add(Number(trip.startDate.slice(0, 4)));
    return Array.from(years).sort((a, b) => b - a);
  }, [trips]);
  const [reviewYearChoice, setReviewYearChoice] = useState<string>("");
  const reviewYear = reviewYears.includes(Number(reviewYearChoice))
    ? Number(reviewYearChoice)
    : reviewYears[0];
  const yearReview = useMemo(
    () =>
      reviewYear === undefined
        ? null
        : computeYearReview(tripLikes, reviewYear, lang),
    [tripLikes, reviewYear, lang]
  );
  // Wetter-Glück des gewählten Jahres (Trip zählt zum Start-Jahr)
  const yearLuck = useMemo(
    () =>
      reviewYear === undefined
        ? null
        : weatherLuck(
            tripLikes.filter(
              trip => trip.startDate.slice(0, 4) === String(reviewYear)
            )
          ),
    [tripLikes, reviewYear]
  );

  /**
   * Titelbild fürs Rückblick-Bild laden: einfache Priorität – zuerst der
   * best bewertete Trip des Jahres, sonst der längste; hat keiner der
   * beiden ein Titelbild (oder schlägt das Laden fehl), bleibt das Bild
   * weg. Geladen wird über die bestehende GET-Route (gleiche Origin) –
   * das Canvas bleibt dadurch untainted.
   */
  const loadReviewCoverImage = async (
    year: number
  ): Promise<HTMLImageElement | undefined> => {
    const inYear = trips.filter(
      trip => Number(trip.startDate.slice(0, 4)) === year
    );
    const rated = inYear.filter(trip => typeof trip.rating === "number");
    const bestRated =
      rated.length > 0
        ? [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
        : undefined;
    const longest =
      inYear.length > 0
        ? [...inYear].sort(
            (a, b) =>
              tripNights(b.startDate, b.endDate) -
              tripNights(a.startDate, a.endDate)
          )[0]
        : undefined;
    const coverTrip =
      bestRated?.coverPhotoId != null
        ? bestRated
        : longest?.coverPhotoId != null
          ? longest
          : undefined;
    if (!coverTrip || coverTrip.coverPhotoId == null) return undefined;
    try {
      const photos = await utils.trips.photos.list.fetch({
        tripId: coverTrip.id,
      });
      const photo = photos.find(p => p.id === coverTrip.coverPhotoId);
      if (!photo) return undefined;
      const img = new Image();
      img.src = tripPhotoSrc(photo.fileName);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Titelbild nicht ladbar"));
      });
      return img;
    } catch {
      // Ohne Titelbild weiterzeichnen – das Rückblick-Bild bleibt nutzbar
      return undefined;
    }
  };

  /**
   * Jahresrückblick als PNG teilen: Kennzahlen mit der Canvas-API zeichnen
   * (client/src/lib/yearReviewImage.ts), dann Web Share API Level 2 mit
   * Datei – wo nicht verfügbar, Download über einen a[download]-Link.
   */
  const shareYearReview = async () => {
    if (!yearReview) return;
    try {
      const coverImage = await loadReviewCoverImage(yearReview.year);
      const canvas = document.createElement("canvas");
      drawYearReview(
        canvas,
        {
          review: yearReview,
          coverImage,
          labels: {
            subtitle: `${t.trips.yearReviewTitle} ${yearReview.year}`,
            stays: t.trips.staysLabel,
            nights: t.trips.nightsTotal,
            places: t.trips.yearReviewPlaces,
            topPlace: t.trips.yearReviewTopPlace,
            longestStay: t.trips.yearReviewLongest,
            bestRated: t.trips.bestRatedLabel,
            nightsCount: t.trips.nightsCount,
            starsAvg: t.trips.starsAvg,
          },
        },
        lang
      );
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("Canvas lieferte kein Bild");
      const file = new File([blob], `campmesser-${yearReview.year}.png`, {
        type: "image/png",
      });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `ReiseKompass · ${t.trips.yearReviewTitle} ${yearReview.year}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t.trips.yearReviewImageSaved);
      }
    } catch (error) {
      // Abbruch des Teilen-Dialogs ist kein Fehler
      if ((error as DOMException)?.name === "AbortError") return;
      toast.error(t.trips.yearReviewShareFailed);
    }
  };

  // Ohne vergangenen Aufenthalt gibt es nichts zurückzublicken
  if (!yearReview) return null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-serif text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.trips.yearReviewTitle}
          </h2>
          <div className="flex items-center gap-2">
            <Select
              value={String(yearReview.year)}
              onValueChange={setReviewYearChoice}
            >
              <SelectTrigger
                className="w-28"
                aria-label={t.trips.yearReviewYearAria}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reviewYears.map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void shareYearReview()}
              aria-label={t.trips.yearReviewShareAria(yearReview.year)}
            >
              <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.yearReviewShare}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="font-serif text-2xl font-bold text-primary">
              {yearReview.trips}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.trips.staysLabel}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{yearReview.nights}</p>
            <p className="text-xs text-muted-foreground">
              {t.trips.nightsTotal}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{yearReview.places}</p>
            <p className="text-xs text-muted-foreground">
              {t.trips.yearReviewPlaces}
            </p>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
              <Trophy
                className="h-4 w-4 shrink-0 text-chart-1"
                aria-hidden="true"
              />
              <span className="truncate">
                {yearReview.topPlace?.name ?? "–"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t.trips.yearReviewTopPlace}
              {yearReview.topPlace
                ? ` · ${t.trips.nightsCount(yearReview.topPlace.nights)}`
                : ""}
            </p>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
              <Moon
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate">
                {yearReview.longestStay?.name ?? "–"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t.trips.yearReviewLongest}
              {yearReview.longestStay
                ? ` · ${t.trips.nightsCount(yearReview.longestStay.nights)}`
                : ""}
            </p>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
              <Star
                className="h-4 w-4 shrink-0 fill-chart-1 text-chart-1"
                aria-hidden="true"
              />
              <span className="truncate">
                {yearReview.bestRated?.name ?? "–"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t.trips.bestRatedLabel}
              {yearReview.bestRated
                ? ` · ${t.trips.starsAvg(fmtRating(yearReview.bestRated.rating))}`
                : ""}
            </p>
          </div>
        </div>
        {/* Wetter-Glück des Jahres (nur mit Wetterarchiv-Daten) */}
        {yearLuck && (
          <p className="mt-4 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <CloudSun
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            {t.trips.weatherLuckYear(
              Math.round(yearLuck.dryShare * 100),
              Math.round(yearLuck.avgTMax)
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

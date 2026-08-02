import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  ListChecks,
  Loader2,
  MapPin,
  Moon,
  Plus,
  Sparkles,
  Tent,
  Trash2,
  Trophy,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resizeImageForUpload } from "@/lib/imageResize";
import { MAX_PHOTOS_PER_TRIP } from "@shared/tripPhotos";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  computeTripStats,
  computeYearReview,
  daysUntilTrip,
  isUpcomingTrip,
  tripNights,
} from "@shared/trips";

/** Auswahlwert für «Ort frei eintragen» im Zeltplatz-Select. */
const FREE_LOCATION = "frei";

/** Pack-Fortschritt einer verknüpften Liste, z. B. «12 von 19 gepackt». */
function PackProgress({ listId }: { listId: number }) {
  const t = useT();
  const progress = trpc.packing.progress.useQuery({ listId });
  if (!progress.data) return null;
  const { name, total, checked } = progress.data;
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  return (
    <Link
      href={`/packlisten/${listId}`}
      className="mt-2 flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-sm transition-colors hover:bg-accent"
    >
      <ListChecks
        className="h-4 w-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">
        {t.trips.packProgress(name, checked, total)}
      </span>
      <span className="font-mono text-xs font-semibold">{pct} %</span>
    </Link>
  );
}

/**
 * Foto-Galerie eines Tagebuch-Eintrags: Thumbnails, Upload (clientseitig
 * verkleinert), Vollbild-Dialog mit Navigation und Löschen pro Foto.
 */
function TripPhotos({
  tripId,
  tripName,
}: {
  tripId: number;
  tripName: string;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const photos = photosQuery.data ?? [];
  const [uploadingCount, setUploadingCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeMutation = trpc.trips.photos.remove.useMutation({
    onSuccess: () => {
      utils.trips.photos.list.invalidate({ tripId });
      setLightboxIndex(null);
      toast.success(t.trips.photoDeleted);
    },
    onError: () => toast.error(t.common.deleteFailed),
  });

  const photoUrl = (fileName: string) => `/api/trips/photos/${fileName}`;

  /** Server-Fehlercode bzw. HTTP-Status auf eine übersetzte Meldung abbilden. */
  const uploadErrorMessage = (
    code: string | null,
    status: number,
    fileName: string
  ): string => {
    if (code === "limitReached")
      return t.trips.photoLimitReached(MAX_PHOTOS_PER_TRIP);
    if (code === "heicNotSupported") return t.trips.photoHeic(fileName);
    if (code === "unsupportedType")
      return t.trips.photoUnsupportedType(fileName);
    if (code === "tooLarge" || status === 413)
      return t.trips.photoTooLarge(fileName);
    return t.trips.photoUploadFailed(fileName);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const freeSlots = MAX_PHOTOS_PER_TRIP - photos.length;
    if (freeSlots <= 0) {
      toast.error(t.trips.photoLimitReached(MAX_PHOTOS_PER_TRIP));
      return;
    }
    const selected = files.slice(0, freeSlots);
    if (files.length > freeSlots) {
      toast.error(t.trips.photoLimitReached(MAX_PHOTOS_PER_TRIP));
    }
    setUploadingCount(selected.length);
    let savedCount = 0;
    for (const file of selected) {
      try {
        let blob: Blob;
        try {
          blob = await resizeImageForUpload(file);
        } catch {
          // Dekodieren fehlgeschlagen – bei HEIC/HEIF gezielt darauf hinweisen
          const isHeic =
            /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
          toast.error(
            isHeic
              ? t.trips.photoHeic(file.name)
              : t.trips.photoReadFailed(file.name)
          );
          continue;
        }
        const response = await fetch(`/api/trips/${tripId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: blob,
          credentials: "include",
        });
        if (response.ok) {
          savedCount += 1;
        } else {
          const code = await response
            .json()
            .then((data: { error?: string }) => data.error ?? null)
            .catch(() => null);
          toast.error(uploadErrorMessage(code, response.status, file.name));
          if (code === "limitReached") break;
        }
      } catch {
        toast.error(t.trips.photoUploadFailed(file.name));
      } finally {
        setUploadingCount(n => Math.max(0, n - 1));
      }
    }
    setUploadingCount(0);
    if (savedCount > 0) {
      toast.success(t.trips.photoUploaded(savedCount));
      utils.trips.photos.list.invalidate({ tripId });
    }
  };

  const showPrev = () =>
    setLightboxIndex(i =>
      i === null ? null : (i - 1 + photos.length) % photos.length
    );
  const showNext = () =>
    setLightboxIndex(i => (i === null ? null : (i + 1) % photos.length));
  const lightboxPhoto =
    lightboxIndex !== null ? (photos[lightboxIndex] ?? null) : null;

  return (
    <div className="mt-2">
      {photosQuery.isError && (
        <p className="text-xs text-destructive">{t.trips.photosLoadFailed}</p>
      )}
      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative">
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={t.trips.photoOpenAria(index + 1, tripName)}
                className="block overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80"
              >
                <img
                  src={photoUrl(photo.fileName)}
                  alt={t.trips.photoAlt(index + 1, tripName)}
                  loading="lazy"
                  className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t.trips.photoDeleteConfirm)) {
                    removeMutation.mutate({ photoId: photo.id });
                  }
                }}
                disabled={removeMutation.isPending}
                aria-label={t.trips.photoDeleteAria(index + 1)}
                className="absolute -right-1.5 -top-1.5 rounded-full border border-border bg-background p-0.5 text-muted-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={e => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploadingCount > 0 || photos.length >= MAX_PHOTOS_PER_TRIP}
          onClick={() => fileInputRef.current?.click()}
          aria-label={t.trips.addPhotosAria(tripName)}
        >
          {uploadingCount > 0 ? (
            <Loader2
              className="mr-1.5 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          )}
          {uploadingCount > 0
            ? t.trips.photoUploading(uploadingCount)
            : t.trips.addPhotos}
        </Button>
        {photos.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {t.trips.photoCountHint(photos.length, MAX_PHOTOS_PER_TRIP)}
          </span>
        )}
      </div>

      {/* Vollbild-Dialog mit Vor/Zurück-Navigation */}
      <Dialog
        open={lightboxPhoto !== null}
        onOpenChange={open => {
          if (!open) setLightboxIndex(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t.trips.galleryTitle(tripName)}</DialogTitle>
            <DialogDescription>
              {lightboxIndex !== null &&
                t.trips.galleryCounter(lightboxIndex + 1, photos.length)}
            </DialogDescription>
          </DialogHeader>
          {lightboxPhoto && (
            <img
              src={photoUrl(lightboxPhoto.fileName)}
              alt={t.trips.photoAlt((lightboxIndex ?? 0) + 1, tripName)}
              className="max-h-[70vh] w-full rounded-lg bg-muted object-contain"
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={showPrev}
              disabled={photos.length < 2}
              aria-label={t.trips.galleryPrev}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={removeMutation.isPending || !lightboxPhoto}
              onClick={() => {
                if (
                  lightboxPhoto &&
                  window.confirm(t.trips.photoDeleteConfirm)
                ) {
                  removeMutation.mutate({ photoId: lightboxPhoto.id });
                }
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t.trips.photoDeleteAria((lightboxIndex ?? 0) + 1)}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={showNext}
              disabled={photos.length < 2}
              aria-label={t.trips.galleryNext}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TripsPage() {
  const { lang, t } = useI18n();
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const listsQuery = trpc.packing.lists.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const formatRange = (startDate: string, endDate: string): string => {
    const fmt = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    if (startDate === endDate) return fmt(startDate);
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  };

  const today = new Date().toISOString().slice(0, 10);
  const [spotChoice, setSpotChoice] = useState<string>(FREE_LOCATION);
  // "keine" = ohne Packliste, sonst Listen-ID
  const [packListChoice, setPackListChoice] = useState<string>("keine");
  const [form, setForm] = useState({
    location: "",
    title: "",
    notes: "",
    startDate: today,
    endDate: today,
  });

  const addMutation = trpc.trips.add.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      setForm(f => ({ ...f, location: "", title: "", notes: "" }));
      toast.success(t.trips.entrySaved);
    },
    onError: e => toast.error(e.message || t.trips.entrySaveFailed),
  });

  const removeMutation = trpc.trips.remove.useMutation({
    onSuccess: () => utils.trips.list.invalidate(),
    onError: () => toast.error(t.common.deleteFailed),
  });

  const spots = spotsQuery.data ?? [];
  const allTrips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);
  // Geplante Aufenthalte (Anreise heute oder später) separat oben anzeigen
  const plannedTrips = useMemo(
    () =>
      allTrips
        .filter(t => isUpcomingTrip(t.startDate, today))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [allTrips, today]
  );
  const trips = useMemo(
    () => allTrips.filter(t => !isUpcomingTrip(t.startDate, today)),
    [allTrips, today]
  );

  /** Anzeigename eines Eintrags: verknüpfter Favorit, sonst Freitext-Ort. */
  const placeName = (trip: (typeof trips)[number]): string => {
    if (trip.spotId != null) {
      const spot = spots.find(s => s.id === trip.spotId);
      if (spot) return spot.name;
    }
    return trip.location ?? t.trips.unknownPlace;
  };

  const pastTripLikes = useMemo(
    () =>
      trips.map(t => ({
        startDate: t.startDate,
        endDate: t.endDate,
        placeName: placeName(t),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trips, spots]
  );
  const stats = useMemo(
    () => computeTripStats(pastTripLikes, lang),
    [pastTripLikes, lang]
  );
  const currentYear = new Date().getFullYear();

  // Jahresrückblick: Jahre mit vergangenen Trips, Default = aktuellstes Jahr
  const reviewYears = useMemo(() => {
    const years = new Set<number>();
    for (const t of trips) years.add(Number(t.startDate.slice(0, 4)));
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
        : computeYearReview(pastTripLikes, reviewYear, lang),
    [pastTripLikes, reviewYear, lang]
  );

  if (loading || (isAuthenticated && tripsQuery.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader title={t.trips.title} subtitle={t.trips.subtitle} />
        <LoginPrompt feature={t.trips.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.trips.title} subtitle={t.trips.subtitle} />

      {/* Statistik */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="font-serif text-2xl font-bold text-primary">
                {stats.nightsByYear[currentYear] ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.trips.nightsInYear(currentYear)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalNights}</p>
              <p className="text-xs text-muted-foreground">
                {t.trips.nightsTotal}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalTrips}</p>
              <p className="text-xs text-muted-foreground">
                {t.trips.staysLabel}
              </p>
            </div>
            <div className="text-center">
              <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
                <Trophy
                  className="h-4 w-4 shrink-0 text-chart-1"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {stats.topPlaces[0]?.name ?? "–"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {t.trips.favoriteLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jahresrückblick: nur wenn mindestens ein vergangener Trip existiert */}
      {yearReview && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-serif text-base font-semibold">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                {t.trips.yearReviewTitle}
              </h2>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Neuer Eintrag */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-base font-semibold">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.trips.newEntryTitle}
          </h2>
          <form
            className="grid gap-3"
            onSubmit={e => {
              e.preventDefault();
              const spotId =
                spotChoice === FREE_LOCATION ? null : Number(spotChoice);
              if (spotId === null && !form.location.trim()) {
                toast.error(t.trips.choosePlaceError);
                return;
              }
              addMutation.mutate({
                spotId,
                packListId:
                  packListChoice === "keine" ? null : Number(packListChoice),
                location: spotId === null ? form.location.trim() : null,
                title: form.title.trim() || null,
                notes: form.notes.trim() || null,
                startDate: form.startDate,
                endDate: form.endDate,
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="trip-spot">{t.trips.placeLabel}</Label>
                <Select value={spotChoice} onValueChange={setSpotChoice}>
                  <SelectTrigger id="trip-spot" className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FREE_LOCATION}>
                      {t.trips.freeLocationOption}
                    </SelectItem>
                    {spots.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {spotChoice === FREE_LOCATION && (
                <div>
                  <Label htmlFor="trip-location">
                    {t.trips.locationNameLabel}
                  </Label>
                  <Input
                    id="trip-location"
                    className="mt-1.5"
                    placeholder={t.trips.locationPlaceholder}
                    value={form.location}
                    onChange={e =>
                      setForm(f => ({ ...f, location: e.target.value }))
                    }
                  />
                </div>
              )}
              <div>
                <Label htmlFor="trip-packlist">{t.trips.packListLabel}</Label>
                <Select
                  value={packListChoice}
                  onValueChange={setPackListChoice}
                >
                  <SelectTrigger id="trip-packlist" className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keine">{t.trips.noPackList}</SelectItem>
                    {(listsQuery.data ?? []).map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trip-start">{t.trips.arrivalLabel}</Label>
                <Input
                  id="trip-start"
                  className="mt-1.5"
                  type="date"
                  value={form.startDate}
                  max={form.endDate}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      startDate: e.target.value,
                      // Abreise automatisch nachziehen, wenn sie vor der Anreise läge
                      endDate:
                        f.endDate < e.target.value ? e.target.value : f.endDate,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="trip-end">{t.trips.departureLabel}</Label>
                <Input
                  id="trip-end"
                  className="mt-1.5"
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e =>
                    setForm(f => ({ ...f, endDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="trip-title">{t.trips.titleLabel}</Label>
              <Input
                id="trip-title"
                className="mt-1.5"
                placeholder={t.trips.titlePlaceholder}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="trip-notes">{t.trips.notesLabel}</Label>
              <Textarea
                id="trip-notes"
                className="mt-1.5"
                rows={3}
                placeholder={t.trips.notesPlaceholder}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="justify-self-start"
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {addMutation.isPending ? t.common.saving : t.trips.submit}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Geplante Aufenthalte: Trips mit Anreise heute oder später */}
      {plannedTrips.length > 0 && (
        <>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
            <CalendarClock
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            {t.trips.plannedTitle}
          </h2>
          <ul className="mb-8 space-y-3">
            {plannedTrips.map(trip => {
              const days = daysUntilTrip(trip.startDate, today);
              const nights = tripNights(trip.startDate, trip.endDate);
              return (
                <li
                  key={trip.id}
                  className="rounded-xl border border-primary/40 bg-accent/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Tent className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {trip.title || placeName(trip)}
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {t.trips.countdown(days)}
                        </span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {trip.title && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {placeName(trip)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarDays
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          {formatRange(trip.startDate, trip.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Moon className="h-3 w-3" aria-hidden="true" />
                          {t.trips.nightsCount(nights)}
                        </span>
                      </p>
                      {trip.packListId != null && (
                        <PackProgress listId={trip.packListId} />
                      )}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <Link
                          href={`/menueplan/${trip.id}`}
                          aria-label={t.trips.menuPlanAria(
                            trip.title || placeName(trip)
                          )}
                        >
                          <UtensilsCrossed
                            className="mr-1.5 h-4 w-4"
                            aria-hidden="true"
                          />
                          {t.trips.menuPlanButton}
                        </Link>
                      </Button>
                      {trip.notes && (
                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                          {trip.notes}
                        </p>
                      )}
                      <TripPhotos
                        tripId={trip.id}
                        tripName={trip.title || placeName(trip)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                      onClick={() => removeMutation.mutate({ id: trip.id })}
                      aria-label={t.trips.deletePlannedAria(
                        trip.title || placeName(trip)
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Einträge */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.trips.entriesTitle}
      </h2>
      {trips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.trips.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {trips.map(trip => {
            const nights = tripNights(trip.startDate, trip.endDate);
            return (
              <li
                key={trip.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    {trip.spotId != null ? (
                      <Tent className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {trip.title || placeName(trip)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {trip.title && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {placeName(trip)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {formatRange(trip.startDate, trip.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3" aria-hidden="true" />
                        {t.trips.nightsCount(nights)}
                      </span>
                    </p>
                    {trip.notes && (
                      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                        {trip.notes}
                      </p>
                    )}
                    <TripPhotos
                      tripId={trip.id}
                      tripName={trip.title || placeName(trip)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                    onClick={() => removeMutation.mutate({ id: trip.id })}
                    aria-label={t.trips.deleteEntryAria(
                      trip.title || placeName(trip)
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

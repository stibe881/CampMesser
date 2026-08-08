/**
 * Kleine Reise-Bausteine (#514): Packlisten-Fortschritt, Titelbild-Banner,
 * «Läuft gerade»-Badge und die Foto-Galerie eines Eintrags – aus
 * Trips.tsx herausgelöst, Verhalten unverändert. Jeder Baustein hängt
 * nur an seiner Reise-Id und seinen Queries, nichts am Seiten-Zustand.
 */
import { Link } from "wouter";
import { ListChecks, Tent } from "lucide-react";
import { toast } from "sonner";
import PhotoGallery from "@/components/PhotoGallery";
import { tripPhotoSrc } from "@/components/trips/shared";
import { MAX_PHOTOS_PER_TRIP } from "@shared/tripPhotos";
import { currentTripDay } from "@shared/trips";
import { trpc } from "@/lib/trpc";
import { useT } from "@/i18n";

/**
 * Stellplatz-Details eines Aufenthalts (#252): Parzellennummer, WLAN und
 * Notizen zum Platz. Erscheint nur, wenn etwas erfasst ist – ein leerer
 * Kasten an jeder Reise wäre reines Rauschen.
 *
 * Das WLAN-Passwort steht standardmässig verdeckt: Man liest es am Platz
 * auch mal, während jemand über die Schulter schaut. Ein Knopf zeigt es,
 * ein zweiter kopiert es.
 */
export function PackProgress({ listId }: { listId: number }) {
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

/** Icon pro Bereitschafts-Zeile des Reise-Cockpits. */

/**
 * Titelbild-Banner eines Tagebuch-Eintrags: zeigt das als Titelbild
 * markierte Foto oben am Eintrag. Nutzt dieselbe Foto-Query wie die Galerie
 * darunter (react-query dedupliziert – kein zweiter Fetch).
 */
export function TripCoverBanner({
  tripId,
  coverPhotoId,
  tripName,
}: {
  tripId: number;
  coverPhotoId: number | null;
  tripName: string;
}) {
  const t = useT();
  const photosQuery = trpc.trips.photos.list.useQuery(
    { tripId },
    { enabled: coverPhotoId !== null }
  );
  if (coverPhotoId === null) return null;
  const cover = photosQuery.data?.find(p => p.id === coverPhotoId);
  if (!cover) return null;
  return (
    <img
      src={tripPhotoSrc(cover.fileName)}
      alt={t.trips.coverAlt(tripName)}
      loading="lazy"
      className="mb-3 max-h-44 w-full rounded-lg object-cover"
    />
  );
}

/**
 * Foto-Galerie eines Tagebuch-Eintrags: nutzt die gemeinsame PhotoGallery
 * (Upload, Thumbnails, Vollbild-Dialog) mit den Trip-Endpoints und -Texten;
 * zusätzlich lässt sich hier ein Foto als Titelbild markieren.
 */
/**
 * «Läuft gerade · Tag 2 von 3» am Reise-Titel (#348).
 *
 * Eine Reise, die begonnen hat, gilt nicht mehr als geplant und rutscht in
 * die Liste «Deine Aufenthalte». Dort stand sie ohne jedes Zeichen zwischen
 * den abgeschlossenen. Dass man gerade auf dem Platz ist, wussten die
 * Startseite und die «Heute»-Ansicht, nur die Reiseliste nicht. Seit #363
 * landet sie schon am Anreisetag dort – umso wichtiger, dass sie sich von
 * den vergangenen unterscheidet.
 *
 * Gibt `null` zurück, sobald der Aufenthalt vorbei oder noch nicht
 * begonnen ist – dafür ist `currentTripDay` schon zuständig.
 */
export function RunningBadge({
  trip,
  today,
}: {
  trip: { startDate: string; endDate: string };
  today: string;
}) {
  const t = useT();
  const progress = currentTripDay(trip, today);
  if (!progress) return null;
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
      <Tent className="h-3 w-3" aria-hidden="true" />
      {t.trips.runningBadge(progress.day, progress.total)}
    </span>
  );
}

export function TripPhotos({
  tripId,
  tripName,
  coverPhotoId,
}: {
  tripId: number;
  tripName: string;
  coverPhotoId: number | null;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const removeMutation = trpc.trips.photos.remove.useMutation({
    // Wird das Titelbild gelöscht, setzt der Server coverPhotoId zurück
    onSuccess: () => utils.trips.list.invalidate(),
  });
  const setCoverMutation = trpc.trips.setCoverPhoto.useMutation({
    onSuccess: (_data, vars) => {
      utils.trips.list.invalidate();
      toast.success(
        vars.photoId === null ? t.trips.coverRemoved : t.trips.coverSet
      );
    },
    onError: () => toast.error(t.trips.coverSaveFailed),
  });

  return (
    <PhotoGallery
      photos={photosQuery.data ?? []}
      loadFailed={photosQuery.isError}
      name={tripName}
      maxPhotos={MAX_PHOTOS_PER_TRIP}
      uploadUrl={`/api/trips/${tripId}/photos`}
      photoSrc={tripPhotoSrc}
      onChanged={() => utils.trips.photos.list.invalidate({ tripId })}
      deletePhoto={photoId => removeMutation.mutateAsync({ photoId })}
      cover={{
        coverPhotoId,
        pending: setCoverMutation.isPending,
        onSetCover: photoId => setCoverMutation.mutate({ tripId, photoId }),
        texts: {
          setButton: t.trips.coverSetButton,
          removeButton: t.trips.coverRemoveButton,
          badge: t.trips.coverBadge,
        },
      }}
      texts={{
        addPhotos: t.trips.addPhotos,
        addPhotosAria: t.trips.addPhotosAria,
        photoCountHint: t.trips.photoCountHint,
        photoUploading: t.trips.photoUploading,
        photoUploaded: t.trips.photoUploaded,
        photoLimitReached: t.trips.photoLimitReached,
        photoTooLarge: t.trips.photoTooLarge,
        photoUnsupportedType: t.trips.photoUnsupportedType,
        photoHeic: t.trips.photoHeic,
        photoReadFailed: t.trips.photoReadFailed,
        photoUploadFailed: t.trips.photoUploadFailed,
        photosLoadFailed: t.trips.photosLoadFailed,
        photoDeleteConfirm: t.trips.photoDeleteConfirm,
        photoDeleted: t.trips.photoDeleted,
        photoDeleteAria: t.trips.photoDeleteAria,
        photoAlt: t.trips.photoAlt,
        photoOpenAria: t.trips.photoOpenAria,
        galleryTitle: t.trips.galleryTitle,
        galleryCounter: t.trips.galleryCounter,
        galleryPrev: t.trips.galleryPrev,
        galleryNext: t.trips.galleryNext,
        deleteFailed: t.common.deleteFailed,
      }}
    />
  );
}

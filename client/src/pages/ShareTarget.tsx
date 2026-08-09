/**
 * Share Target (/teilen): nimmt Fotos aus dem System-Teilen-Dialog entgegen.
 * Der Service Worker legt die per POST geteilten Dateien in den Cache
 * «campmesser-share» und leitet mit 303 hierher um – die Seite liest die
 * Dateien EINMAL aus, leert den Cache und lädt die Bilder nach Auswahl der
 * Reise über die bestehende Trip-Foto-Route hoch (Client-Resize wie überall).
 * Ohne geteilte Dateien (z. B. direkt aufgerufen oder mit altem Service
 * Worker) zeigt die Seite einen Hinweis, wie das Teilen funktioniert.
 *
 * Geteilte ORTE (#584): Steckt im geteilten Text/Link ein Punkt mit
 * Koordinaten (geo:, Google Maps, OSM – shared/sharedPlace.ts), bietet die
 * Seite an, ihn als Merkort zu speichern.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Share2,
  Star,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { tripDisplayName } from "@shared/tripName";
import { LOCALE_TAGS } from "@shared/i18n";
import { resizeImageForUpload } from "@/lib/imageResize";
import { trpc } from "@/lib/trpc";
import { parseSharedPlace, type SharedPlace } from "@shared/sharedPlace";
import { SAVED_PLACE_NAME_MAX_LENGTH } from "@shared/savedPlaces";

/** Muss zum Cache-Namen im Service Worker (client/public/sw.js) passen. */
const SHARE_CACHE = "campmesser-share";

interface SharedPhoto {
  id: number;
  blob: Blob;
  url: string;
}

/**
 * Geteilte Dateien aus dem Share-Cache lesen und den Cache danach leeren –
 * jede Teilen-Aktion wird genau einmal konsumiert. Fehler (kein Cache-API,
 * alter Service Worker) liefern schlicht eine leere Liste.
 */
async function readSharedPhotos(): Promise<Blob[]> {
  if (!("caches" in window)) return [];
  try {
    const cache = await caches.open(SHARE_CACHE);
    // Reihenfolge der Teilen-Auswahl beibehalten (share-photo-0, -1, …);
    // der Text-Eintrag (#584) liegt im selben Cache und bleibt hier aussen vor
    const keys = Array.from(await cache.keys())
      .filter(key => key.url.includes("share-photo"))
      .sort((a, b) => a.url.localeCompare(b.url, undefined, { numeric: true }));
    const blobs: Blob[] = [];
    for (let i = 0; i < keys.length; i += 1) {
      const response = await cache.match(keys[i]);
      if (response) blobs.push(await response.blob());
    }
    await Promise.all(keys.map(key => cache.delete(key)));
    return blobs;
  } catch {
    return [];
  }
}

/**
 * Geteilten Text (#584) aus dem Share-Cache lesen und in einen Ort
 * übersetzen – wie die Fotos wird der Eintrag genau einmal konsumiert.
 */
async function readSharedPlace(): Promise<SharedPlace | null> {
  if (!("caches" in window)) return null;
  try {
    const cache = await caches.open(SHARE_CACHE);
    const response = await cache.match("/teilen/share-text");
    if (!response) return null;
    const shared = (await response.json()) as {
      title?: string;
      text?: string;
      url?: string;
    };
    await cache.delete("/teilen/share-text");
    return parseSharedPlace(shared.title, shared.text, shared.url);
  } catch {
    return null;
  }
}

export default function ShareTargetPage() {
  const { lang, t } = useI18n();
  const ts = t.shareTarget;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // null = Cache wird noch gelesen
  const [photos, setPhotos] = useState<SharedPhoto[] | null>(null);
  const [tripId, setTripId] = useState<string>("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);
  // Geteilter Ort (#584): erkannter Punkt samt editierbarem Namen
  const [place, setPlace] = useState<SharedPlace | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [placeSaved, setPlaceSaved] = useState(false);
  const readRef = useRef(false);

  const utils = trpc.useUtils();
  const savePlaceMutation = trpc.savedPlaces.add.useMutation({
    onSuccess: () => {
      setPlaceSaved(true);
      void utils.savedPlaces.list.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  // Geteilte Dateien genau EINMAL aus dem Cache übernehmen (StrictMode-fest)
  useEffect(() => {
    if (readRef.current) return;
    readRef.current = true;
    void readSharedPhotos().then(blobs => {
      setPhotos(
        blobs.map((blob, index) => ({
          id: index,
          blob,
          url: URL.createObjectURL(blob),
        }))
      );
    });
    void readSharedPlace().then(found => {
      if (found) {
        setPlace(found);
        setPlaceName(found.name);
      }
    });
  }, []);

  // Objekt-URLs beim Verlassen der Seite freigeben
  useEffect(() => {
    return () => {
      setPhotos(prev => {
        prev?.forEach(photo => URL.revokeObjectURL(photo.url));
        return prev;
      });
    };
  }, []);

  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);

  // Vorauswahl: laufende Reise, sonst die neueste (Liste ist absteigend sortiert)
  useEffect(() => {
    if (tripId || trips.length === 0) return;
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const current = trips.find(
      trip => trip.startDate <= iso && trip.endDate >= iso
    );
    setTripId(String((current ?? trips[0]).id));
  }, [trips, tripId]);

  const fmtRange = (start: string, end: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    const from = new Date(`${start}T00:00:00`).toLocaleDateString(
      LOCALE_TAGS[lang],
      options
    );
    const to = new Date(`${end}T00:00:00`).toLocaleDateString(
      LOCALE_TAGS[lang],
      options
    );
    return `${from} – ${to}`;
  };

  const tripLabel = (trip: (typeof trips)[number]) =>
    tripDisplayName(trip, lang);

  const removePhoto = (id: number) => {
    setPhotos(prev => {
      if (!prev) return prev;
      const removed = prev.find(photo => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter(photo => photo.id !== id);
    });
  };

  /** Alle (verbleibenden) Fotos nacheinander zur gewählten Reise hochladen. */
  const upload = async () => {
    const targetId = Number(tripId);
    if (!photos || photos.length === 0 || !Number.isInteger(targetId)) return;
    let ok = 0;
    let failed = 0;
    let limit = false;
    for (let i = 0; i < photos.length; i += 1) {
      setUploadingIndex(i);
      try {
        // Client-Resize wie bei allen Foto-Uploads (max. 1600 px, JPEG)
        const blob = await resizeImageForUpload(photos[i].blob);
        const response = await fetch(`/api/trips/${targetId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: blob,
          credentials: "include",
        });
        if (response.ok) {
          ok += 1;
        } else {
          failed += 1;
          if (response.status === 409) limit = true;
        }
      } catch {
        failed += 1;
      }
    }
    setUploadingIndex(null);
    if (limit) toast.error(ts.limitReached);
    else if (failed > 0) toast.error(ts.uploadFailed(failed));
    if (ok > 0) {
      photos.forEach(photo => URL.revokeObjectURL(photo.url));
      setPhotos([]);
      setUploadedCount(ok);
    }
  };

  const uploading = uploadingIndex !== null;

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={ts.title} subtitle={ts.subtitle} />

      {!authLoading && !isAuthenticated ? (
        <LoginPrompt feature={ts.loginFeature} />
      ) : authLoading || photos === null ? (
        <div className="flex justify-center py-16">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t.common.loading}
          />
        </div>
      ) : uploadedCount !== null ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <CheckCircle2
            className="mx-auto mb-3 h-10 w-10 text-primary"
            aria-hidden="true"
          />
          <p className="font-serif text-lg font-semibold">{ts.successTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {ts.successText(uploadedCount)}
          </p>
          <Button asChild className="mt-4">
            <Link href="/tagebuch">{ts.toTrip}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {place && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                {ts.placeTitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
              </p>
              {placeSaved ? (
                <p className="mt-3 flex items-center gap-2 text-sm">
                  <CheckCircle2
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  {ts.placeSaved}
                  <Link
                    href="/karte"
                    className="font-medium text-primary hover:underline"
                  >
                    {ts.placeToMap}
                  </Link>
                </p>
              ) : (
                <>
                  <div className="mt-3">
                    <Label htmlFor="share-place-name">
                      {ts.placeNameLabel}
                    </Label>
                    <Input
                      id="share-place-name"
                      value={placeName}
                      maxLength={SAVED_PLACE_NAME_MAX_LENGTH}
                      placeholder={ts.placeNamePlaceholder}
                      onChange={e => setPlaceName(e.target.value)}
                    />
                  </div>
                  <Button
                    className="mt-3"
                    disabled={savePlaceMutation.isPending || !placeName.trim()}
                    onClick={() =>
                      savePlaceMutation.mutate({
                        name: placeName.trim(),
                        latitude: place.latitude,
                        longitude: place.longitude,
                      })
                    }
                  >
                    {savePlaceMutation.isPending ? (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Star className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {ts.placeSave}
                  </Button>
                </>
              )}
            </div>
          )}
          {photos.length === 0 ? (
            place ? null : (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                <Share2
                  className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <p className="font-medium">{ts.emptyTitle}</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {ts.emptyText}
                </p>
              </div>
            )
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">
                  {ts.photosCount(photos.length)}
                </p>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <li key={photo.id} className="relative">
                      <img
                        src={photo.url}
                        alt={ts.photoAlt(index + 1)}
                        className="aspect-square w-full rounded-lg border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        disabled={uploading}
                        aria-label={ts.removePhotoAria(index + 1)}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground shadow hover:text-destructive"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {tripsQuery.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2
                    className="h-5 w-5 animate-spin text-muted-foreground"
                    aria-label={t.common.loading}
                  />
                </div>
              ) : trips.length === 0 ? (
                <div className="rounded-lg bg-accent/50 p-4 text-sm">
                  <p className="text-muted-foreground">{ts.noTrips}</p>
                  <Link
                    href="/tagebuch"
                    className="mt-1.5 inline-block font-medium text-primary hover:underline"
                  >
                    {ts.toTrips}
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="share-trip">{ts.tripLabel}</Label>
                    <Select
                      value={tripId}
                      onValueChange={setTripId}
                      disabled={uploading}
                    >
                      <SelectTrigger id="share-trip" aria-label={ts.tripAria}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {trips.map(trip => (
                          <SelectItem key={trip.id} value={String(trip.id)}>
                            {tripLabel(trip)} ·{" "}
                            {fmtRange(trip.startDate, trip.endDate)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => void upload()}
                    disabled={uploading || !tripId}
                  >
                    {uploading ? (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {uploading
                      ? ts.uploading((uploadingIndex ?? 0) + 1, photos.length)
                      : ts.upload}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

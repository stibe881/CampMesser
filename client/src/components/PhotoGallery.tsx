/**
 * Wiederverwendbare Foto-Galerie: Thumbnails, Upload (clientseitig
 * verkleinert), Vollbild-Dialog mit Navigation und Löschen pro Foto.
 * Genutzt vom Reise-Tagebuch (Trips.tsx) und vom Platz-Dossier
 * (SpotDetail.tsx) – Endpoints und Texte kommen von der jeweiligen Seite.
 */
import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resizeImageForUpload } from "@/lib/imageResize";

/** Übersetzte Texte der Galerie – aus dem Namespace der aufrufenden Seite. */
export interface PhotoGalleryTexts {
  addPhotos: string;
  addPhotosAria: (name: string) => string;
  photoCountHint: (n: number, max: number) => string;
  photoUploading: (n: number) => string;
  photoUploaded: (n: number) => string;
  photoLimitReached: (max: number) => string;
  photoTooLarge: (fileName: string) => string;
  photoUnsupportedType: (fileName: string) => string;
  photoHeic: (fileName: string) => string;
  photoReadFailed: (fileName: string) => string;
  photoUploadFailed: (fileName: string) => string;
  photosLoadFailed: string;
  photoDeleteConfirm: string;
  photoDeleted: string;
  photoDeleteAria: (n: number) => string;
  photoAlt: (n: number, name: string) => string;
  photoOpenAria: (n: number, name: string) => string;
  galleryTitle: (name: string) => string;
  galleryCounter: (n: number, total: number) => string;
  galleryPrev: string;
  galleryNext: string;
  deleteFailed: string;
}

export interface GalleryPhoto {
  id: number;
  fileName: string;
}

export default function PhotoGallery({
  photos,
  loadFailed,
  name,
  maxPhotos,
  uploadUrl,
  photoSrc,
  onChanged,
  deletePhoto,
  texts,
}: {
  photos: GalleryPhoto[];
  /** true, wenn die Foto-Liste nicht geladen werden konnte */
  loadFailed: boolean;
  /** Anzeigename (Aufenthalt/Platz) für aria-Texte und den Dialog-Titel */
  name: string;
  maxPhotos: number;
  /** POST-Ziel für Uploads (Raw-Body, image/jpeg) */
  uploadUrl: string;
  /** URL eines Fotos anhand des Dateinamens */
  photoSrc: (fileName: string) => string;
  /** Nach Upload/Löschen aufrufen (Liste neu laden) */
  onChanged: () => void;
  /** Foto löschen; muss bei Fehlern werfen */
  deletePhoto: (photoId: number) => Promise<unknown>;
  texts: PhotoGalleryTexts;
}) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletePending, setDeletePending] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removePhoto = async (photoId: number) => {
    if (!window.confirm(texts.photoDeleteConfirm)) return;
    setDeletePending(true);
    try {
      await deletePhoto(photoId);
      setLightboxIndex(null);
      toast.success(texts.photoDeleted);
      onChanged();
    } catch {
      toast.error(texts.deleteFailed);
    } finally {
      setDeletePending(false);
    }
  };

  /** Server-Fehlercode bzw. HTTP-Status auf eine übersetzte Meldung abbilden. */
  const uploadErrorMessage = (
    code: string | null,
    status: number,
    fileName: string
  ): string => {
    if (code === "limitReached") return texts.photoLimitReached(maxPhotos);
    if (code === "heicNotSupported") return texts.photoHeic(fileName);
    if (code === "unsupportedType") return texts.photoUnsupportedType(fileName);
    if (code === "tooLarge" || status === 413)
      return texts.photoTooLarge(fileName);
    return texts.photoUploadFailed(fileName);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const freeSlots = maxPhotos - photos.length;
    if (freeSlots <= 0) {
      toast.error(texts.photoLimitReached(maxPhotos));
      return;
    }
    const selected = files.slice(0, freeSlots);
    if (files.length > freeSlots) {
      toast.error(texts.photoLimitReached(maxPhotos));
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
              ? texts.photoHeic(file.name)
              : texts.photoReadFailed(file.name)
          );
          continue;
        }
        const response = await fetch(uploadUrl, {
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
        toast.error(texts.photoUploadFailed(file.name));
      } finally {
        setUploadingCount(n => Math.max(0, n - 1));
      }
    }
    setUploadingCount(0);
    if (savedCount > 0) {
      toast.success(texts.photoUploaded(savedCount));
      onChanged();
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
      {loadFailed && (
        <p className="text-xs text-destructive">{texts.photosLoadFailed}</p>
      )}
      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative">
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={texts.photoOpenAria(index + 1, name)}
                className="block overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-80"
              >
                <img
                  src={photoSrc(photo.fileName)}
                  alt={texts.photoAlt(index + 1, name)}
                  loading="lazy"
                  className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                />
              </button>
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                disabled={deletePending}
                aria-label={texts.photoDeleteAria(index + 1)}
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
          disabled={uploadingCount > 0 || photos.length >= maxPhotos}
          onClick={() => fileInputRef.current?.click()}
          aria-label={texts.addPhotosAria(name)}
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
            ? texts.photoUploading(uploadingCount)
            : texts.addPhotos}
        </Button>
        {photos.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {texts.photoCountHint(photos.length, maxPhotos)}
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
            <DialogTitle>{texts.galleryTitle(name)}</DialogTitle>
            <DialogDescription>
              {lightboxIndex !== null &&
                texts.galleryCounter(lightboxIndex + 1, photos.length)}
            </DialogDescription>
          </DialogHeader>
          {lightboxPhoto && (
            <img
              src={photoSrc(lightboxPhoto.fileName)}
              alt={texts.photoAlt((lightboxIndex ?? 0) + 1, name)}
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
              aria-label={texts.galleryPrev}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deletePending || !lightboxPhoto}
              onClick={() => {
                if (lightboxPhoto) void removePhoto(lightboxPhoto.id);
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {texts.photoDeleteAria((lightboxIndex ?? 0) + 1)}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={showNext}
              disabled={photos.length < 2}
              aria-label={texts.galleryNext}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

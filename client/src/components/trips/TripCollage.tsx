import { useEffect, useMemo, useRef, useState } from "react";
import { formatTripRange, tripPhotoSrc } from "@/components/trips/shared";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
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
import { Link, useRoute, useSearch } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";
import { LOCALE_TAGS, pick, type Language } from "@shared/i18n";
import {
  COLLAGE_LAYOUTS,
  collageCapacity,
  type CollageLayoutId,
} from "@shared/collageLayout";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_MAX_RAPPEN,
  EXPENSE_PAID_BY_MAX_LENGTH,
  expensesByCategory,
  budgetStatus,
  BUDGET_MAX_RAPPEN,
  expensesTotalRappen,
  normalizeExpenseCategory,
  settleUp,
  type ExpenseCategory,
} from "@shared/expenses";
import {
  TRIP_BOARD_KINDS,
  TRIP_BOARD_KIND_LABELS,
  TRIP_BOARD_TEXT_MAX_LENGTH,
  isValidTripBoardText,
  normalizeTripBoardKind,
  tripBoardCounts,
  type TripBoardKind,
} from "@shared/tripBoard";
import { buildTripIcs, icsFileName, type IcsTrip } from "@shared/ics";
import {
  countMainSlots,
  tripReadiness,
  type ReadinessKey,
} from "@shared/tripReadiness";
import {
  packingSuggestions,
  type ForecastDay,
  type PackSuggestion,
} from "@shared/packSuggestions";
import { loadCantonHolidays, type CantonHolidays } from "@/lib/holidays";
import { drawCollage } from "@/lib/collageImage";
import TripCalendar, { type CalendarTrip } from "@/components/TripCalendar";

export default function TripCollage({
  tripId,
  tripName,
  startDate,
  endDate,
}: {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
}) {
  const { lang, t } = useI18n();
  const photosQuery = trpc.trips.photos.list.useQuery({ tripId });
  const photos = photosQuery.data ?? [];
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<CollageLayoutId>("grid2");
  /** Ausgewählte Foto-Ids in der Reihenfolge des Antippens. */
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const capacity = collageCapacity(layout);
  /** Nur die ersten `capacity` Fotos landen im Bild – der Rest bleibt weg. */
  const used = selected.slice(0, capacity);

  const openDialog = () => {
    setSelected(photos.slice(0, collageCapacity(layout)).map(p => p.id));
    setOpen(true);
  };

  const togglePhoto = (photoId: number) => {
    setSelected(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  /** Ein Foto laden; scheitert es, fällt es still aus der Collage. */
  const loadPhoto = (fileName: string): Promise<HTMLImageElement | null> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = tripPhotoSrc(fileName);
    });

  /** Die Collage zeichnen und als PNG-Blob zurückgeben. */
  const buildBlob = async (): Promise<Blob> => {
    const files = used
      .map(id => photos.find(photo => photo.id === id))
      .filter((photo): photo is (typeof photos)[number] => photo !== undefined);
    const loaded = await Promise.all(files.map(p => loadPhoto(p.fileName)));
    const images = loaded.filter(
      (img): img is HTMLImageElement => img !== null
    );
    if (images.length === 0) throw new Error("Kein Foto ladbar");
    const canvas = document.createElement("canvas");
    drawCollage(canvas, {
      photos: images,
      layout,
      title: tripName,
      subtitle: formatTripRange(startDate, endDate, lang),
    });
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("Canvas lieferte kein Bild");
    return blob;
  };

  const fileName = `campmesser-collage-${startDate}.png`;

  /** Herunterladen über einen a[download]-Link. */
  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t.trips.collageSaved);
  };

  /** Teilen per Web Share API Level 2, sonst herunterladen. */
  const shareCollage = async () => {
    setBusy(true);
    try {
      const blob = await buildBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `CampMesser · ${tripName}`,
        });
      } else {
        downloadBlob(blob);
      }
    } catch (error) {
      // Abbruch des Teilen-Dialogs ist kein Fehler
      if ((error as DOMException)?.name !== "AbortError") {
        toast.error(t.trips.collageFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  const downloadCollage = async () => {
    setBusy(true);
    try {
      downloadBlob(await buildBlob());
    } catch {
      toast.error(t.trips.collageFailed);
    } finally {
      setBusy(false);
    }
  };

  if (photos.length === 0) return null;

  return (
    <div className="mt-2">
      <Button type="button" variant="outline" size="sm" onClick={openDialog}>
        <LayoutGrid className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t.trips.collageButton}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.trips.collageTitle}</DialogTitle>
            <DialogDescription>{t.trips.collageDescription}</DialogDescription>
          </DialogHeader>

          {/* Anordnung */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t.trips.collageLayoutLabel}
            </p>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={t.trips.collageLayoutLabel}
            >
              {COLLAGE_LAYOUTS.map(entry => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setLayout(entry.id)}
                  aria-pressed={layout === entry.id}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    layout === entry.id
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.trips.collageLayoutNames[entry.id]}
                </button>
              ))}
            </div>
          </div>

          {/* Fotos wählen – die Zahl zeigt die Reihenfolge in der Collage */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t.trips.collageSelected(used.length, capacity)}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {photos.map(photo => {
                const rank = selected.indexOf(photo.id);
                const inCollage = rank >= 0 && rank < capacity;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    aria-pressed={rank >= 0}
                    aria-label={t.trips.collageSelectAria(tripName)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                      inCollage
                        ? "border-primary"
                        : "border-transparent opacity-60"
                    )}
                  >
                    <img
                      src={tripPhotoSrc(photo.fileName)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {rank >= 0 && (
                      <span
                        className={cn(
                          "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground",
                          inCollage ? "bg-primary" : "bg-muted-foreground"
                        )}
                      >
                        {rank + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selected.length > capacity && (
              <p className="text-xs text-muted-foreground">
                {t.trips.collageTooMany(capacity)}
              </p>
            )}
            {used.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t.trips.collageNone}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              disabled={busy || used.length === 0}
              onClick={() => void shareCollage()}
            >
              {busy ? (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {busy ? t.trips.collageBusy : t.trips.collageShare}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || used.length === 0}
              onClick={() => void downloadCollage()}
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.trips.collageDownload}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Dialog «Mitreisende» (nur für eigene Reisen): zeigt die Mitglieder-Liste
 * (Entfernen für die Besitzerin/den Besitzer), erzeugt/kopiert den
 * Einladungs-Link samt QR-Code (Muster der Teilen-Dialoge) und widerruft ihn.
 */

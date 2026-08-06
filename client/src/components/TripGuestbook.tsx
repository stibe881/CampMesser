/**
 * Gästebuch pro Reise (#254): Grüsse zur Reise, aufklappbar in der
 * Reise-Karte. Mitreisende schreiben aus dem Konto heraus und dürfen ein
 * Foto aus der Reise-Galerie anhängen; wer nur den Teil-Link hat, schreibt
 * auf der geteilten Seite (`SharedTrip`) und bekommt kein Foto-Feld – ein
 * anonymer Upload-Pfad wäre eine offene Tür.
 *
 * Abgrenzung zu den Nachbarn: Die Pinnwand ist fürs Organisieren
 * («Kohle mitnehmen»), das Tages-Journal für den Verlauf des Aufenthalts.
 * Hier stehen Grüsse und Erinnerungen – auch von Leuten, die gar nicht
 * dabei waren.
 *
 * Sortierung, Zählung und die Trennung Konto/Gast liegen in
 * `shared/guestbook.ts` und sind getestet.
 */
import { useMemo, useState } from "react";
import { BookHeart, ChevronDown, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useTripSectionCounts } from "@/hooks/useTripSectionCounts";
import { useHashSection } from "@/hooks/useHashSection";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  guestbookAuthorLabel,
  guestbookSummary,
  isValidGuestbookMessage,
  MAX_GUESTBOOK_MESSAGE_LENGTH,
  sortGuestbookEntries,
} from "@shared/guestbook";
import { cn } from "@/lib/utils";

/** Ohne Foto-Auswahl im Aufklapp-Menü: «kein Bild». */
const NO_PHOTO = "none";

export default function TripGuestbook({
  tripId,
  tripName,
}: {
  tripId: number;
  tripName: string;
}) {
  const { lang, t } = useI18n();
  const gb = t.guestbook;
  const utils = trpc.useUtils();
  // Tiefer Link aus der Suche (#349): /tagebuch/12#gaestebuch
  const { matched: deepLinked, ref: cardRef } = useHashSection("#gaestebuch");
  const [open, setOpen] = useState(deepLinked);
  const [message, setMessage] = useState("");
  const [photoValue, setPhotoValue] = useState<string>(NO_PHOTO);

  const query = trpc.trips.guestbook.list.useQuery(
    { tripId },
    { enabled: open }
  );
  // Fotos erst laden, wenn das Gästebuch offen ist – die Galerie ist gross
  const photosQuery = trpc.trips.photos.list.useQuery(
    { tripId },
    { enabled: open }
  );

  const addMutation = trpc.trips.guestbook.add.useMutation({
    onSuccess: () => {
      utils.trips.guestbook.list.invalidate({ tripId });
      utils.trips.counts.invalidate();
      setMessage("");
      setPhotoValue(NO_PHOTO);
      toast.success(gb.added);
    },
    onError: e => toast.error(e.message || gb.addFailed),
  });
  const removeMutation = trpc.trips.guestbook.remove.useMutation({
    onSuccess: () => {
      utils.trips.guestbook.list.invalidate({ tripId });
      utils.trips.counts.invalidate();
      toast.success(gb.removed);
    },
    onError: e => toast.error(e.message || gb.removeFailed),
  });

  const entries = useMemo(
    () => sortGuestbookEntries(query.data?.entries ?? []),
    [query.data]
  );
  const summary = guestbookSummary(entries);
  // Zugeklappt kommt die Zahl aus dem gemeinsamen Zähler (#346)
  const stored = useTripSectionCounts(tripId);
  const badgeTotal =
    open && !query.isLoading ? summary.total : (stored?.guestbook ?? 0);
  const photos = photosQuery.data ?? [];
  const photoUrl = (photoId: number) => {
    const photo = photos.find(p => p.id === photoId);
    return photo ? `/api/trips/photos/${photo.fileName}` : null;
  };

  const formatDate = (value: Date | string) =>
    new Intl.DateTimeFormat(LOCALE_TAGS[lang], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value instanceof Date ? value : new Date(value));

  const submit = () => {
    if (!isValidGuestbookMessage(message)) {
      toast.error(gb.messageRequired);
      return;
    }
    addMutation.mutate({
      tripId,
      message,
      photoId: photoValue === NO_PHOTO ? null : Number(photoValue),
    });
  };

  return (
    <div ref={cardRef} className="mt-2 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={gb.toggleAria(tripName)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <BookHeart
          className="h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {gb.title}
        </span>
        {badgeTotal > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {gb.count(badgeTotal)}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border px-3 py-2.5">
          <p className="mb-2 text-xs text-muted-foreground">{gb.hint}</p>

          <div className="mb-3">
            <Textarea
              value={message}
              rows={3}
              maxLength={MAX_GUESTBOOK_MESSAGE_LENGTH}
              placeholder={gb.messagePlaceholder}
              aria-label={gb.messageAria}
              onChange={e => setMessage(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {photos.length > 0 && (
                <Select value={photoValue} onValueChange={setPhotoValue}>
                  <SelectTrigger
                    className="w-48"
                    aria-label={gb.photoSelectAria}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PHOTO}>{gb.noPhoto}</SelectItem>
                    {photos.map((photo, index) => (
                      <SelectItem key={photo.id} value={String(photo.id)}>
                        {gb.photoOption(index + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                size="sm"
                disabled={addMutation.isPending}
                onClick={submit}
              >
                {gb.addButton}
              </Button>
            </div>
          </div>

          {query.isLoading && (
            <Skeleton
              className="h-20 w-full rounded-lg"
              aria-label={gb.title}
            />
          )}

          {!query.isLoading && entries.length === 0 && (
            <p className="text-sm text-muted-foreground">{gb.empty}</p>
          )}

          {entries.length > 0 && (
            <ul className="space-y-2">
              {entries.map(entry => {
                const mine =
                  entry.userId != null && entry.userId === query.data?.myUserId;
                const url =
                  entry.photoId != null ? photoUrl(entry.photoId) : null;
                return (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium">
                        {guestbookAuthorLabel(entry, gb.guestFallback)}
                      </span>
                      {entry.userId == null && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] text-muted-foreground">
                          {gb.viaLink}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </span>
                      {(query.data?.isOwner || mine) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto h-7 w-7 text-muted-foreground/60 hover:text-destructive"
                          onClick={() =>
                            removeMutation.mutate({ entryId: entry.id })
                          }
                          aria-label={gb.removeAria(
                            guestbookAuthorLabel(entry, gb.guestFallback)
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {entry.message}
                    </p>
                    {url && (
                      <img
                        src={url}
                        alt={gb.photoAlt(
                          guestbookAuthorLabel(entry, gb.guestFallback)
                        )}
                        loading="lazy"
                        className="mt-2 max-h-48 w-full rounded-lg object-cover"
                      />
                    )}
                    {entry.photoId != null && !url && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3" aria-hidden="true" />
                        {gb.photoGone}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

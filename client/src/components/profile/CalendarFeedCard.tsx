/**
 * Profil-Karte «CalendarFeedCard» – aus Profile.tsx herausgelöst (#414).
 * Die Seite war nach #408 über 1600 Zeilen; die fünf grossen Karten
 * wohnen jetzt hier (Muster wie die Aufteilung von Trips.tsx, #322).
 */
import CollapsibleCard from "@/components/CollapsibleCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calendarFeedUrl, calendarWebcalUrl } from "@shared/calendarFeed";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

/**
 * Kalender-Abo (#377).
 *
 * WARUM NEBEN DEM DOWNLOAD: Die `.ics`-Datei (#244) ist eine Momentaufnahme
 * – verschiebt sich eine Reise, steht im Handy-Kalender weiterhin der alte
 * Termin, und niemand denkt daran, die Datei erneut zu holen. Ein falscher
 * Termin ist schlimmer als gar keiner. Das Abo holt sich der Kalender
 * selbst; was hier steht, gilt.
 *
 * DER LINK IST DAS PASSWORT – Kalender-Programme können sich nicht
 * anmelden. Deshalb steht «neu erzeugen» direkt daneben und nicht in einer
 * Ecke: Wer ihn versehentlich weitergegeben hat, braucht genau diesen
 * Knopf, und zwar sofort.
 */
export default function CalendarFeedCard() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const ask = useConfirm();
  const feedQuery = trpc.calendar.feed.useQuery(undefined, {
    staleTime: Infinity,
  });
  const resetMutation = trpc.calendar.reset.useMutation({
    onSuccess: () => {
      toast.success(t.profile.calendarReset);
      void utils.calendar.feed.invalidate();
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const token = feedQuery.data?.token ?? null;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const httpsUrl = token ? calendarFeedUrl(origin, token) : "";
  const webcalUrl = token ? calendarWebcalUrl(origin, token) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      toast.success(t.profile.calendarCopied);
    } catch {
      toast.error(t.profile.calendarCopyFailed);
    }
  };

  return (
    <CollapsibleCard
      className="mb-5"
      icon={
        <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
      }
      title={t.profile.calendarTitle}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {t.profile.calendarIntro}
      </p>
      {token === null ? (
        <p className="text-xs text-muted-foreground">{t.common.loading} …</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="flex-1">
              <a href={webcalUrl}>{t.profile.calendarSubscribe}</a>
            </Button>
            <Button type="button" variant="outline" onClick={copy}>
              {t.profile.calendarCopy}
            </Button>
          </div>
          <p className="mt-2 break-all rounded-md border border-border bg-muted/40 p-2 text-[11px] text-muted-foreground">
            {httpsUrl}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              {t.profile.calendarSecretHint}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              disabled={resetMutation.isPending}
              onClick={async () => {
                if (
                  await ask({
                    title: t.profile.calendarResetConfirm,
                    confirmLabel: t.profile.calendarResetButton,
                  })
                ) {
                  resetMutation.mutate();
                }
              }}
            >
              {t.profile.calendarResetButton}
            </Button>
          </div>
        </>
      )}
    </CollapsibleCard>
  );
}

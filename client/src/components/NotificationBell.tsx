/**
 * Die Benachrichtigungs-Glocke in der Kopfzeile (#374, Nutzerwunsch).
 *
 * WO DAS HER KOMMT: Der Verlauf der Mitteilungen (#201) lag im Profil,
 * unten in der Mitteilungs-Karte, hinter einem Aufklapper. Ins Profil geht
 * man, um Einstellungen zu ÄNDERN – nicht, um zu schauen, was gemeldet
 * wurde. Ein Push, den man auf dem Sperrbildschirm weggewischt hat, war
 * damit praktisch verloren. Er gehört dorthin, wo man ihn sucht: oben
 * rechts, an die Stelle, an der zuvor die Sprachwahl sass. Die Sprache
 * ist eine Einstellung und steht jetzt im Profil – sie wechselt einmal im
 * Leben, Mitteilungen kommen täglich.
 *
 * DER PUNKT AN DER GLOCKE zählt, was seit dem letzten Öffnen dazukam.
 * Gemerkt wird dafür EIN Zeitpunkt im localStorage; warum es dafür keine
 * Lese-Spalte in der Datenbank gibt, steht in `shared/pushInbox.ts`.
 *
 * GELADEN WIRD FÜR DEN PUNKT AUCH ZU. Sonst wüsste die Glocke nicht, dass
 * etwas anliegt – und eine Glocke, die erst beim Antippen weiss, ob sie
 * läuten müsste, ist keine. Der Verlauf ist auf 50 Einträge begrenzt und
 * bleibt fünf Minuten frisch; das ist eine kleine Abfrage.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Backpack,
  Bell,
  CloudLightning,
  Pin,
  Refrigerator,
  Sparkles,
  SunMedium,
  Tent,
  Users,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  newestSentAt,
  unreadBadgeLabel,
  unreadPushCount,
} from "@shared/pushInbox";
import { loadPushSeenAt, savePushSeenAt } from "@/lib/pushSeen";

/** Symbol je Mitteilungs-Art (unbekannte Arten: Glocke). */
const PUSH_KIND_ICONS: Record<string, LucideIcon> = {
  weather: CloudLightning,
  food: Refrigerator,
  trip: Tent,
  drying: Wind,
  astro: Sparkles,
  gear: Wrench,
  evepack: Backpack,
  heat: SunMedium,
  board: Pin,
  join: Users,
};

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { lang, t } = useI18n();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(() => loadPushSeenAt());

  const logQuery = trpc.push.log.useQuery(
    {},
    { enabled: isAuthenticated, staleTime: 5 * 60_000 }
  );
  const entries = useMemo(() => logQuery.data ?? [], [logQuery.data]);
  const unread = unreadPushCount(entries, seenAt);

  /**
   * Beim Öffnen ist alles gesehen. Gemerkt wird der JÜNGSTE Zeitpunkt der
   * Liste und nicht «jetzt»: Käme unmittelbar danach eine ältere Meldung
   * nach, wäre sie sonst schon abgehakt, bevor man sie hatte.
   */
  useEffect(() => {
    if (!open) return;
    const newest = newestSentAt(entries);
    if (!newest || newest === seenAt) return;
    setSeenAt(newest);
    savePushSeenAt(newest);
  }, [open, entries, seenAt]);

  // Abgemeldet gibt es keinen Verlauf – und nichts, was eine Glocke
  // ankündigen könnte.
  if (!isAuthenticated) return null;

  /** Art-Bezeichnung, mit Rückfall auf den rohen Schlüssel. */
  const kindLabel = (kind: string) =>
    t.profile.historyKind[kind as keyof typeof t.profile.historyKind] ?? kind;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        aria-label={
          unread > 0
            ? t.shell.notificationsUnread(unread)
            : t.shell.notificationsMenu
        }
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
            aria-hidden="true"
          >
            {unreadBadgeLabel(unread)}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto p-3"
      >
        <p className="mb-2 text-sm font-semibold">
          {t.shell.notificationsTitle}
        </p>
        {logQuery.isPending ? (
          <p className="text-xs text-muted-foreground">{t.common.loading} …</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t.profile.historyEmpty}
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {t.profile.historyHint}
            </p>
            <ul className="space-y-1.5">
              {entries.map(entry => {
                const Icon = PUSH_KIND_ICONS[entry.kind] ?? Bell;
                const url = entry.url;
                const content = (
                  <>
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {entry.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {entry.body}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {kindLabel(entry.kind)} ·{" "}
                        {new Date(entry.sentAt).toLocaleString(
                          LOCALE_TAGS[lang],
                          { dateStyle: "short", timeStyle: "short" }
                        )}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={entry.id}>
                    {url ? (
                      <button
                        type="button"
                        className="flex w-full gap-2 rounded-md border border-border p-2 text-left hover:bg-accent"
                        aria-label={t.profile.historyOpenAria(entry.title)}
                        onClick={() => {
                          setOpen(false);
                          navigate(url);
                        }}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className="flex w-full gap-2 rounded-md border border-border p-2">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

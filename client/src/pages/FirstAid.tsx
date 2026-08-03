import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Baby,
  Bug,
  Check,
  ChevronDown,
  CircleDot,
  Cross,
  Droplets,
  Eye,
  Flame,
  Footprints,
  GlassWater,
  HeartPulse,
  Loader2,
  Plus,
  RotateCcw,
  Slice,
  Snowflake,
  Sun,
  SunMedium,
  Trash2,
  WifiOff,
  Wind,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { firstAidTopics, type FirstAidTopic } from "@/data/firstAid";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import {
  MAX_TICK_BODY_PART_LENGTH,
  MAX_TICK_NOTE_LENGTH,
  tickObservationStatus,
} from "@shared/tickBites";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bug,
  Flame,
  Footprints,
  Slice,
  Snowflake,
  Sun,
  SunMedium,
  Zap,
  CircleDot,
  Droplets,
  Eye,
  GlassWater,
  HeartPulse,
  Wind,
};

const severityStyle: Record<FirstAidTopic["severity"], string> = {
  leicht: "bg-secondary text-secondary-foreground",
  // Dunkler Text statt amber-glow: 4.5:1-Kontrast auf dem hellen Amber-Hintergrund
  mittel: "bg-chart-1/20 text-foreground",
  ernst: "bg-destructive/10 text-destructive",
};

export default function FirstAidPage() {
  const { lang, t } = useI18n();
  const [filter, setFilter] = useState<"alle" | FirstAidTopic["severity"]>(
    "alle"
  );
  const topics =
    filter === "alle"
      ? firstAidTopics
      : firstAidTopics.filter(topic => topic.severity === filter);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.firstAid.title} subtitle={t.firstAid.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.firstAid.offlineNote}
      </div>

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label={t.firstAid.filterAria}
      >
        {(["alle", "leicht", "mittel", "ernst"] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={filter === s}
          >
            {s === "alle" ? t.firstAid.filterAll : t.firstAid.severity[s]}
          </button>
        ))}
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {topics.map(topic => {
          const Icon = iconMap[topic.icon] ?? Cross;
          return (
            <AccordionItem
              key={topic.id}
              value={topic.id}
              className="overflow-hidden rounded-xl border border-border bg-card px-0"
            >
              <AccordionTrigger className="px-4 py-3.5 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{pick(topic.title, lang)}</p>
                    <Badge
                      className={cn(
                        "mt-0.5 capitalize",
                        severityStyle[topic.severity]
                      )}
                    >
                      {t.firstAid.severity[topic.severity]}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {pick(topic.summary, lang)}
                </p>

                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.firstAid.recognizeTitle}
                </h3>
                <ul className="mb-4 space-y-1 text-sm">
                  {topic.symptoms.map(s => {
                    const text = pick(s, lang);
                    return (
                      <li key={text} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        {text}
                      </li>
                    );
                  })}
                </ul>

                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.firstAid.helpTitle}
                </h3>
                <ol className="mb-4 space-y-2.5">
                  {topic.steps.map((step, i) => (
                    <li key={step.title.de} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {pick(step.title, lang)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pick(step.text, lang)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mb-3 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <AlertTriangle
                    className="h-4 w-4 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-foreground">
                    {pick(topic.warning, lang)}
                  </p>
                </div>

                {topic.kidNote && (
                  <div className="flex gap-2.5 rounded-lg bg-accent/60 p-3">
                    <Baby
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm">{pick(topic.kidNote, lang)}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <TickBiteSection />

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        {t.firstAid.disclaimer}
      </p>
    </div>
  );
}

/**
 * Zeckenstich-Merker (#179): erfasste Stiche mit Beobachtungsfenster
 * (shared/tickBites.ts). Angemeldet lässt sich ein Stich erfassen, die
 * offenen Stiche zeigen «noch X Tage beobachten» und einen Erledigt-Knopf;
 * abgehakte Stiche stehen in einem aufklappbaren Abschnitt darunter.
 * Gäste sehen nur einen Hinweis. Der medizinische Hinweis steht bewusst
 * immer sichtbar über der Liste.
 */
function TickBiteSection() {
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const today = new Date().toISOString().slice(0, 10);
  const query = trpc.tickBites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [bitAt, setBitAt] = useState(today);
  const [bodyPart, setBodyPart] = useState("");
  const [note, setNote] = useState("");
  const [doneOpen, setDoneOpen] = useState(false);

  const addMutation = trpc.tickBites.add.useMutation({
    onSuccess: () => {
      utils.tickBites.list.invalidate();
      setBitAt(today);
      setBodyPart("");
      setNote("");
      toast.success(t.firstAid.tickAdded);
    },
    onError: () => toast.error(t.firstAid.tickAddFailed),
  });
  const resolveMutation = trpc.tickBites.resolve.useMutation({
    onSuccess: (_data, vars) => {
      utils.tickBites.list.invalidate();
      if (vars.today !== null) toast.success(t.firstAid.tickResolved);
    },
    onError: () => toast.error(t.firstAid.tickResolveFailed),
  });
  const removeMutation = trpc.tickBites.remove.useMutation({
    onSuccess: () => {
      utils.tickBites.list.invalidate();
      toast.success(t.firstAid.tickDeleted);
    },
    onError: () => toast.error(t.common.deleteFailed),
  });

  const bites = useMemo(() => query.data ?? [], [query.data]);
  const open = bites.filter(b => !tickObservationStatus(b, today).done);
  const done = bites.filter(b => tickObservationStatus(b, today).done);

  const fmtDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
        <Bug className="h-5 w-5 text-primary" aria-hidden="true" />
        {t.firstAid.tickTitle}
      </h2>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">
        {t.firstAid.tickSubtitle}
      </p>

      <div className="mb-4 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <AlertTriangle
          className="h-4 w-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <p className="text-sm text-foreground">{t.firstAid.tickMedicalNote}</p>
      </div>

      {!isAuthenticated ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t.firstAid.tickGuestHint}
        </p>
      ) : (
        <>
          {/* Stich erfassen */}
          <div className="mb-4 rounded-xl border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="tick-date">{t.firstAid.tickDateLabel}</Label>
                <Input
                  id="tick-date"
                  type="date"
                  className="mt-1.5"
                  value={bitAt}
                  max={today}
                  onChange={e => setBitAt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tick-body">
                  {t.firstAid.tickBodyPartLabel}
                </Label>
                <Input
                  id="tick-body"
                  className="mt-1.5"
                  value={bodyPart}
                  maxLength={MAX_TICK_BODY_PART_LENGTH}
                  placeholder={t.firstAid.tickBodyPartPlaceholder}
                  onChange={e => setBodyPart(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="tick-note">{t.firstAid.tickNoteLabel}</Label>
              <Textarea
                id="tick-note"
                className="mt-1.5"
                rows={2}
                value={note}
                maxLength={MAX_TICK_NOTE_LENGTH}
                placeholder={t.firstAid.tickNotePlaceholder}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            <Button
              className="mt-3"
              disabled={!bitAt || addMutation.isPending}
              onClick={() => addMutation.mutate({ bitAt, bodyPart, note })}
            >
              {addMutation.isPending ? (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {t.firstAid.tickAddButton}
            </Button>
          </div>

          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.firstAid.tickOpenTitle}
          </h3>
          {query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : open.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t.firstAid.tickOpenEmpty}
            </p>
          ) : (
            <ul className="space-y-2">
              {open.map(bite => {
                const status = tickObservationStatus(bite, today);
                const date = fmtDate(bite.bitAt);
                return (
                  <li
                    key={bite.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {bite.bodyPart || t.firstAid.tickBitAt(date)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {bite.bodyPart
                          ? `${t.firstAid.tickBitAt(date)} · `
                          : ""}
                        {t.firstAid.tickDaysLeft(status.daysLeft)}
                      </p>
                      {bite.note && (
                        <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                          {bite.note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={resolveMutation.isPending}
                        onClick={() =>
                          resolveMutation.mutate({ id: bite.id, today })
                        }
                        aria-label={t.firstAid.tickResolveAria(date)}
                      >
                        <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        {t.firstAid.tickResolveButton}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                        onClick={() => {
                          if (confirm(t.firstAid.tickDeleteConfirm)) {
                            removeMutation.mutate({ id: bite.id });
                          }
                        }}
                        aria-label={t.firstAid.tickDeleteAria(date)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Erledigte Stiche – standardmässig eingeklappt */}
          {done.length > 0 && (
            <div className="mt-3 rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setDoneOpen(o => !o)}
                aria-expanded={doneOpen}
                aria-label={t.firstAid.tickDoneToggleAria}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm"
              >
                <Check
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-left font-medium">
                  {t.firstAid.tickDoneTitle(done.length)}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    doneOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              {doneOpen && (
                <ul className="space-y-2 border-t border-border px-4 py-3">
                  {done.map(bite => {
                    const date = fmtDate(bite.bitAt);
                    return (
                      <li
                        key={bite.id}
                        className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {bite.bodyPart || t.firstAid.tickBitAt(date)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t.firstAid.tickBitAt(date)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                            disabled={resolveMutation.isPending}
                            onClick={() =>
                              resolveMutation.mutate({
                                id: bite.id,
                                today: null,
                              })
                            }
                            aria-label={t.firstAid.tickReopenAria(date)}
                          >
                            <RotateCcw
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                            onClick={() => {
                              if (confirm(t.firstAid.tickDeleteConfirm)) {
                                removeMutation.mutate({ id: bite.id });
                              }
                            }}
                            aria-label={t.firstAid.tickDeleteAria(date)}
                          >
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

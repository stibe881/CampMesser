/**
 * Gute-Nacht-Geschichten (#241).
 *
 * Ein Abschnitt im Familien-Modus: kurze Vorlesegeschichten rund um Natur
 * und Camping, gefiltert nach Jahreszeit (voreingestellt die aktuelle) und
 * Alter. Der Merker «schon vorgelesen» liegt in localStorage
 * (lib/storyProgress.ts), die Jahreszeiten-Logik in shared/season.ts.
 *
 * Der Vorlese-Modus ist derselbe wie bei den Schnitzeljagden (#125):
 * useSpeech() aus lib/speech.ts, gleicher Knopf, gleiche Bedienung – wer
 * das eine kennt, kennt das andere. Ohne SpeechSynthesis im Browser
 * verschwindet der Knopf, statt kaputt dazustehen.
 */
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, Moon, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bedtimeStories, type BedtimeStory } from "@/data/bedtimeStories";
import { pick } from "@shared/i18n";
import { SEASON_KEYS, seasonKeyForDate, type SeasonKey } from "@shared/season";
import { useI18n } from "@/i18n";
import { useSpeech } from "@/lib/speech";
import {
  loadReadStories,
  storeReadStories,
  toggleReadStory,
} from "@/lib/storyProgress";
import { cn } from "@/lib/utils";

/** «alle» als zusätzliche Wahl neben den vier Jahreszeiten. */
type SeasonFilter = SeasonKey | "all";

/** Altersstufen des Filters; 0 = keine Einschränkung. */
const AGE_STEPS = [0, 3, 5, 7] as const;

export default function BedtimeStories() {
  const { lang, t } = useI18n();
  const bs = t.bedtimeStories;
  const speech = useSpeech();
  // Voreinstellung: die Jahreszeit, in der wir gerade sind
  const [season, setSeason] = useState<SeasonFilter>(() =>
    seasonKeyForDate(new Date())
  );
  const [maxAge, setMaxAge] = useState<number>(0);
  const [read, setRead] = useState<string[]>(() => loadReadStories());
  const [open, setOpen] = useState<BedtimeStory | null>(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    storeReadStories(read);
  }, [read]);

  // Beim Schliessen des Dialogs darf niemand weiterplappern
  useEffect(() => {
    if (!speech.speaking) setSpeaking(false);
  }, [speech.speaking]);

  const visible = useMemo(
    () =>
      bedtimeStories.filter(story => {
        // Ganzjährige Geschichten (ohne Jahreszeit) sind immer dabei
        if (season !== "all" && story.season && story.season !== season) {
          return false;
        }
        if (maxAge > 0 && story.minAge > maxAge) return false;
        return true;
      }),
    [season, maxAge]
  );

  const closeDialog = () => {
    speech.stop();
    setSpeaking(false);
    setOpen(null);
  };

  const toggleSpeak = (story: BedtimeStory) => {
    if (speaking) {
      speech.stop();
      setSpeaking(false);
      return;
    }
    speech.speak(pick(story.text, lang), lang);
    setSpeaking(true);
  };

  /** Jahreszeit-Etikett einer Geschichte («ganzjährig» ohne Angabe). */
  const seasonLabel = (story: BedtimeStory): string =>
    story.season ? bs.season[story.season] : bs.seasonAllYear;

  return (
    <section className="mb-8">
      <h2 className="mb-1 font-serif text-xl font-semibold">{bs.title}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{bs.subtitle}</p>

      {/* Filter: Jahreszeit und Alter */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {bs.seasonFilterLabel}
          </span>
          {SEASON_KEYS.map(key => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={season === key ? "default" : "outline"}
              aria-pressed={season === key}
              onClick={() => setSeason(key)}
            >
              {bs.season[key]}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={season === "all" ? "default" : "outline"}
            aria-pressed={season === "all"}
            onClick={() => setSeason("all")}
          >
            {bs.seasonAll}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {bs.ageFilterLabel}
          </span>
          {AGE_STEPS.map(age => (
            <Button
              key={age}
              type="button"
              size="sm"
              variant={maxAge === age ? "default" : "outline"}
              aria-pressed={maxAge === age}
              onClick={() => setMaxAge(age)}
            >
              {age === 0 ? bs.ageAll : bs.ageOption(age)}
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          {bs.empty}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map(story => {
            const isRead = read.includes(story.id);
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => setOpen(story)}
                aria-label={bs.openAria(pick(story.title, lang))}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    isRead
                      ? "bg-primary/15 text-primary"
                      : "bg-accent text-accent-foreground"
                  )}
                >
                  {isRead ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Moon className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {pick(story.title, lang)}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{seasonLabel(story)}</Badge>
                    <Badge variant="outline">{bs.ageBadge(story.minAge)}</Badge>
                    <Badge variant="outline">
                      {bs.minutesBadge(story.minutes)}
                    </Badge>
                    {isRead && <Badge variant="outline">{bs.readBadge}</Badge>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={open !== null}
        onOpenChange={value => !value && closeDialog()}
      >
        {open && (
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {pick(open.title, lang)}
              </DialogTitle>
              <DialogDescription>
                {`${seasonLabel(open)} · ${bs.ageBadge(open.minAge)} · ${bs.minutesBadge(open.minutes)}`}
              </DialogDescription>
            </DialogHeader>

            {speech.supported && (
              <Button
                variant={speaking ? "default" : "outline"}
                size="sm"
                className="self-start"
                aria-pressed={speaking}
                aria-label={
                  speaking
                    ? bs.readAloudStopAria(pick(open.title, lang))
                    : bs.readAloudAria(pick(open.title, lang))
                }
                onClick={() => toggleSpeak(open)}
              >
                {speaking ? (
                  <VolumeX className="mr-1.5 h-4 w-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                )}
                {speaking ? bs.readAloudStop : bs.readAloud}
              </Button>
            )}

            <div className="space-y-3 text-[0.95rem] leading-relaxed">
              {pick(open.text, lang)
                .split("\n\n")
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="flex-1"
                aria-pressed={read.includes(open.id)}
                onClick={() => setRead(prev => toggleReadStory(prev, open.id))}
              >
                <BookOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {read.includes(open.id) ? bs.markUnread : bs.markRead}
              </Button>
              <Button className="flex-1" onClick={closeDialog}>
                {t.family.done}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

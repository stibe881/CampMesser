/**
 * Erzählwürfel (#268): Symbole würfeln und daraus reihum eine Geschichte
 * erfinden.
 *
 * Gewürfelt wird je ein Symbol pro Kategorie (wer, wo, womit …), nicht
 * blind aus einem Topf – die Begründung steht in shared/storyDice.ts.
 * Einzelne Würfel lassen sich neu werfen, wenn ein Symbol partout nicht
 * passen will; das gehört zum Spiel und ist kein Schummeln.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Baby,
  Bird,
  Cable,
  CloudLightning,
  Compass,
  CookingPot,
  Dices,
  Dog,
  DoorClosed,
  DoorOpen,
  Droplets,
  EyeOff,
  Flag,
  Flashlight,
  Footprints,
  Gem,
  Ghost,
  Key,
  Map as MapIcon,
  MessageCircle,
  Moon,
  Mountain,
  PawPrint,
  RotateCcw,
  Search,
  Shield,
  Smile,
  Sparkles,
  Tent,
  TreePine,
  Trophy,
  UserRound,
  Users,
  Volume2,
  Waves,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { storyDiceFaces } from "@/data/storyDice";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { pick, type L4 } from "@shared/i18n";
import {
  MAX_STORY_DICE,
  MIN_STORY_DICE,
  pickStarter,
  rerollFace,
  rollStoryDice,
  STORY_CATEGORY_LABELS,
  type StoryFace,
} from "@shared/storyDice";

/** Icon-Namen aus den Daten auf echte Komponenten abbilden. */
const icons: Record<string, typeof Dices> = {
  Baby,
  Bird,
  Cable,
  CloudLightning,
  Compass,
  CookingPot,
  Dog,
  DoorClosed,
  DoorOpen,
  Droplets,
  EyeOff,
  Flag,
  Flashlight,
  Footprints,
  Gem,
  Ghost,
  Key,
  Map: MapIcon,
  MessageCircle,
  Moon,
  Mountain,
  PawPrint,
  RotateCcw,
  Search,
  Shield,
  Smile,
  Sparkles,
  Tent,
  TreePine,
  Trophy,
  UserRound,
  Users,
  Volume2,
  Waves,
};

export default function StoryDicePage() {
  const { lang, t } = useI18n();
  const ts = t.storyDice;
  const [count, setCount] = useState(4);
  const [faces, setFaces] = useState<StoryFace[]>([]);
  const [starter, setStarter] = useState<L4 | null>(null);

  const roll = useCallback((dice: number) => {
    setFaces(rollStoryDice(storyDiceFaces, dice, Math.random));
    setStarter(pickStarter(Math.random));
  }, []);

  // Beim Öffnen liegt schon ein Wurf da – ein leerer Tisch lädt nicht ein
  useEffect(() => {
    roll(count);
    // Absichtlich nur beim ersten Rendern; danach würfelt der Knopf
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={ts.title} subtitle={ts.subtitle} />

      <div className="mb-5 rounded-lg border border-border bg-muted/50 p-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {ts.howToTitle}
        </p>
        <p className="mt-1 text-sm">{ts.howToText}</p>
      </div>

      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label={ts.countAria}
      >
        <span className="text-sm text-muted-foreground">{ts.countLabel}</span>
        {Array.from(
          { length: MAX_STORY_DICE - MIN_STORY_DICE + 1 },
          (_, i) => MIN_STORY_DICE + i
        ).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setCount(n);
              roll(n);
            }}
            className={cn(
              "h-9 w-9 rounded-full text-sm font-medium transition-colors",
              count === n
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={count === n}
          >
            {n}
          </button>
        ))}
      </div>

      <Button className="mb-6 w-full" onClick={() => roll(count)}>
        <Dices className="mr-1.5 h-5 w-5" aria-hidden="true" />
        {ts.rollButton}
      </Button>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {faces.map((face, index) => {
          const Icon = icons[face.icon] ?? Dices;
          const word = pick(face.word, lang);
          return (
            <button
              key={`${face.category}-${index}`}
              type="button"
              onClick={() =>
                setFaces(current =>
                  current.map((f, i) =>
                    i === index ? rerollFace(storyDiceFaces, f, Math.random) : f
                  )
                )
              }
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
              aria-label={ts.rerollAria(word)}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {pick(STORY_CATEGORY_LABELS[face.category], lang)}
              </span>
              <Icon className="h-9 w-9 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold">{word}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {ts.rerollHint}
      </p>

      {starter && (
        <div className="mt-6 rounded-xl border border-primary/40 bg-accent/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {ts.starterTitle}
          </p>
          <p className="mt-1 font-serif text-lg">{pick(starter, lang)}</p>
        </div>
      )}
    </div>
  );
}

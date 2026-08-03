import { useMemo, useState } from "react";
import { Copy, Languages, Search, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  phraseGroupLabels,
  phraseGroups,
  phrases,
  type Phrase,
} from "@/data/phrases";
import { useI18n } from "@/i18n";
import { useSpeech } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { LANGUAGE_LABELS, LANGUAGES, pick, type Language } from "@shared/i18n";

const TARGET_STORAGE_KEY = "campmesser.phrasebookTarget";

/**
 * Zuletzt gewählte Zielsprache laden. Ohne gespeicherte Wahl wird eine
 * Sprache vorgeschlagen, die NICHT die App-Sprache ist – sonst stünde
 * links und rechts derselbe Satz.
 */
function loadTargetLanguage(appLang: Language): Language {
  const fallback = LANGUAGES.find(l => l !== appLang) ?? "fr";
  try {
    const stored = localStorage.getItem(TARGET_STORAGE_KEY);
    if (stored && (LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
  } catch {
    // localStorage blockiert: Vorschlag genügt
  }
  return fallback;
}

/** Eine Karte pro Satz: gross in der Zielsprache, klein in der App-Sprache. */
function PhraseCard({
  phrase,
  target,
  onSpeak,
  speaking,
  speechSupported,
}: {
  phrase: Phrase;
  target: Language;
  onSpeak: (text: string) => void;
  speaking: boolean;
  speechSupported: boolean;
}) {
  const { lang, t } = useI18n();
  const targetText = pick(phrase.text, target);
  const meaning = pick(phrase.text, lang);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(targetText);
      toast.success(t.phrasebook.copied);
    } catch {
      toast.error(t.phrasebook.copyFailed);
    }
  };

  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg leading-snug" lang={target}>
            {targetText}
          </p>
          {target !== lang && (
            <p className="mt-1 text-sm text-muted-foreground" lang={lang}>
              {meaning}
            </p>
          )}
          {phrase.note && (
            <p className="mt-1.5 text-xs italic text-muted-foreground">
              {pick(phrase.note, lang)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {speechSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSpeak(targetText)}
              aria-label={
                speaking
                  ? t.phrasebook.stopAria
                  : t.phrasebook.speakAria(targetText)
              }
            >
              {speaking ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={copy}
            aria-label={t.phrasebook.copyAria(targetText)}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PhrasebookPage() {
  const { lang, t } = useI18n();
  const [target, setTarget] = useState<Language>(() =>
    loadTargetLanguage(lang)
  );
  const [query, setQuery] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const speech = useSpeech();

  const chooseTarget = (next: Language) => {
    setTarget(next);
    speech.stop();
    setSpeakingId(null);
    try {
      localStorage.setItem(TARGET_STORAGE_KEY, next);
    } catch {
      // localStorage blockiert: Auswahl gilt nur für diesen Besuch
    }
  };

  const speakPhrase = (id: string, text: string) => {
    if (speakingId === id && speech.speaking) {
      speech.stop();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    speech.speak(text, target);
  };

  // Suche über beide Sprachen: was du auf Deutsch tippst, findet den Satz
  // ebenso wie ein Wort aus der Zielsprache.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return phrases;
    return phrases.filter(
      p =>
        pick(p.text, lang).toLowerCase().includes(q) ||
        pick(p.text, target).toLowerCase().includes(q) ||
        (p.note ? pick(p.note, lang).toLowerCase().includes(q) : false)
    );
  }, [query, lang, target]);

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={t.phrasebook.title} subtitle={t.phrasebook.subtitle} />

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/60 px-3.5 py-2.5 text-sm text-accent-foreground">
        <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.phrasebook.offlineNote}
      </div>

      <div className="mb-4">
        <Label className="mb-1.5 block">{t.phrasebook.targetLabel}</Label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t.phrasebook.targetAria}
        >
          {LANGUAGES.map(code => {
            const active = code === target;
            return (
              <button
                key={code}
                type="button"
                onClick={() => chooseTarget(code)}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {LANGUAGE_LABELS[code]}
              </button>
            );
          })}
        </div>
        {target === lang && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t.phrasebook.sameLanguageHint}
          </p>
        )}
      </div>

      <div className="relative mb-5">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.phrasebook.searchPlaceholder}
          aria-label={t.phrasebook.searchAria}
          className="pl-9"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          {t.phrasebook.searchEmpty}
        </p>
      ) : (
        <div className="space-y-6">
          {phraseGroups.map(group => {
            const inGroup = visible.filter(p => p.group === group);
            if (inGroup.length === 0) return null;
            return (
              <section key={group}>
                <h2 className="mb-2 font-serif text-lg font-semibold">
                  {pick(phraseGroupLabels[group], lang)}
                </h2>
                <div className="space-y-2">
                  {inGroup.map(phrase => (
                    <PhraseCard
                      key={phrase.id}
                      phrase={phrase}
                      target={target}
                      speechSupported={speech.supported}
                      speaking={speakingId === phrase.id && speech.speaking}
                      onSpeak={text => speakPhrase(phrase.id, text)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        {t.phrasebook.countLine(visible.length)}
      </p>
    </div>
  );
}

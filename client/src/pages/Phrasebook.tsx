import { useMemo, useState } from "react";
import {
  Copy,
  Languages,
  Plus,
  Search,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
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

/** Eigene Sätze (#545): lokal gespeichert und über das Konto gesynct. */
const CUSTOM_STORAGE_KEY = "campmesser.phrasebookCustom";
/** Obergrenzen: mehr wäre keine Sprachhilfe mehr, sondern ein Wörterbuch. */
const CUSTOM_MAX_ENTRIES = 100;
const CUSTOM_MAX_LENGTH = 200;

export interface CustomPhrase {
  id: string;
  /** Der Satz in der eigenen Sprache («Wo ist die nächste Apotheke?»). */
  meaning: string;
  /** Die Übersetzung in der Zielsprache. */
  translation: string;
  /** Zielsprache, für die die Übersetzung gilt. */
  target: Language;
}

/** Unbekanntes (alte Stände, fremde Geräte) auf brauchbare Einträge filtern. */
function sanitizeCustomPhrases(value: unknown): CustomPhrase[] {
  if (!Array.isArray(value)) return [];
  const clean: CustomPhrase[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      typeof e.meaning !== "string" ||
      typeof e.translation !== "string" ||
      !(LANGUAGES as readonly string[]).includes(e.target as string)
    )
      continue;
    const meaning = e.meaning.trim().slice(0, CUSTOM_MAX_LENGTH);
    const translation = e.translation.trim().slice(0, CUSTOM_MAX_LENGTH);
    if (!meaning || !translation) continue;
    clean.push({
      id: e.id,
      meaning,
      translation,
      target: e.target as Language,
    });
    if (clean.length >= CUSTOM_MAX_ENTRIES) break;
  }
  return clean;
}

function loadCustomPhrases(): CustomPhrase[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return raw ? sanitizeCustomPhrases(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function saveCustomPhrases(list: CustomPhrase[]) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage nicht verfügbar
  }
}

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

  // Eigene Sätze (#545): lokal + Geräte-Sync (Muster Einkaufs-Verlauf)
  const [custom, setCustom] = useState<CustomPhrase[]>(() =>
    loadCustomPhrases()
  );
  const customSync = useSyncedSetting<CustomPhrase[]>(
    "phrasebookCustom",
    value => {
      const clean = sanitizeCustomPhrases(value);
      setCustom(clean);
      saveCustomPhrases(clean);
    }
  );
  const updateCustom = (next: CustomPhrase[]) => {
    setCustom(next);
    saveCustomPhrases(next);
    customSync.push(next);
  };
  const [customMeaning, setCustomMeaning] = useState("");
  const [customTranslation, setCustomTranslation] = useState("");
  const addCustom = () => {
    const meaning = customMeaning.trim().slice(0, CUSTOM_MAX_LENGTH);
    const translation = customTranslation.trim().slice(0, CUSTOM_MAX_LENGTH);
    if (!meaning || !translation) return;
    if (custom.length >= CUSTOM_MAX_ENTRIES) {
      toast.error(t.phrasebook.customFull);
      return;
    }
    updateCustom([
      ...custom,
      { id: crypto.randomUUID(), meaning, translation, target },
    ]);
    setCustomMeaning("");
    setCustomTranslation("");
  };
  /** Eigene Sätze der GEWÄHLTEN Zielsprache – andere bleiben gespeichert. */
  const customForTarget = custom.filter(entry => entry.target === target);

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

      {/* Eigene Sätze (#545): was DIR auf dieser Reise wichtig ist */}
      <section className="mb-6">
        <h2 className="mb-1 font-serif text-lg font-semibold">
          {t.phrasebook.customTitle}
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          {t.phrasebook.customHint}
        </p>
        {customForTarget.length > 0 && (
          <div className="mb-3 space-y-2">
            {customForTarget.map(entry => (
              <Card key={entry.id}>
                <CardContent className="flex items-start justify-between gap-2 p-3.5">
                  <div className="min-w-0">
                    <p className="font-medium">{entry.translation}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.meaning}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {speech.supported && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={t.phrasebook.speakAria(entry.translation)}
                        onClick={() => speakPhrase(entry.id, entry.translation)}
                      >
                        {speakingId === entry.id && speech.speaking ? (
                          <VolumeX className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Volume2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={t.phrasebook.customDeleteAria(
                        entry.translation
                      )}
                      onClick={() =>
                        updateCustom(custom.filter(e => e.id !== entry.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={e => {
            e.preventDefault();
            addCustom();
          }}
        >
          <Input
            value={customMeaning}
            onChange={e => setCustomMeaning(e.target.value)}
            placeholder={t.phrasebook.customMeaningPlaceholder}
            maxLength={CUSTOM_MAX_LENGTH}
            aria-label={t.phrasebook.customMeaningPlaceholder}
          />
          <Input
            value={customTranslation}
            onChange={e => setCustomTranslation(e.target.value)}
            placeholder={t.phrasebook.customTranslationPlaceholder(
              LANGUAGE_LABELS[target]
            )}
            maxLength={CUSTOM_MAX_LENGTH}
            aria-label={t.phrasebook.customTranslationPlaceholder(
              LANGUAGE_LABELS[target]
            )}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!customMeaning.trim() || !customTranslation.trim()}
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.phrasebook.customAdd}
          </Button>
        </form>
      </section>

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

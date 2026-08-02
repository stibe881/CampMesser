import { useCallback, useEffect, useRef, useState } from "react";
import { LOCALE_TAGS, type Language } from "@shared/i18n";

/**
 * Vorlesen per Web Speech API (speechSynthesis): Stimme passend zur
 * App-Sprache wählen, Vorlesen starten/stoppen und den «spricht gerade»-
 * Zustand als Hook bereitstellen. Ohne Browser-Unterstützung liefert
 * useSpeech() {supported: false} – Aufrufer blenden ihre Knöpfe dann aus.
 */

/** Nur die für die Auswahl nötigen Felder einer SpeechSynthesisVoice. */
export interface VoiceLike {
  lang: string;
  default?: boolean;
}

/**
 * Beste Stimme zur App-Sprache wählen (reine Funktion, testbar):
 * 1. exakter Locale-Treffer (de-CH), 2. gleiche Primärsprache (de-*,
 * Standard-Stimme bevorzugt), 3. erste verfügbare Stimme, sonst null.
 */
export function pickVoiceIndex(
  voices: readonly VoiceLike[],
  lang: Language
): number {
  if (voices.length === 0) return -1;
  const target = LOCALE_TAGS[lang].toLowerCase();
  const primary = target.split("-")[0];
  const normalized = voices.map(v =>
    (v.lang ?? "").toLowerCase().replace("_", "-")
  );
  const exact = normalized.findIndex(l => l === target);
  if (exact !== -1) return exact;
  const samePrimary = voices
    .map((v, i) => ({ v, i }))
    .filter(({ i }) => normalized[i]?.split("-")[0] === primary);
  if (samePrimary.length > 0) {
    const preferred = samePrimary.find(({ v }) => v.default === true);
    return (preferred ?? samePrimary[0]!).i;
  }
  return 0;
}

const speechSupported = (): boolean =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance !== "undefined";

/** speak(text, lang) liest vor, stop() bricht ab, speaking = spricht gerade. */
export function useSpeech(): {
  supported: boolean;
  speaking: boolean;
  speak: (text: string, lang: Language) => void;
  stop: () => void;
} {
  const supported = speechSupported();
  const [speaking, setSpeaking] = useState(false);
  // Aktive Utterance festhalten, damit Chrome sie nicht vorzeitig
  // wegräumt (Garbage Collection beendet sonst die onend-Meldung).
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, lang: Language) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LOCALE_TAGS[lang];
      const voices = window.speechSynthesis.getVoices();
      const index = pickVoiceIndex(voices, lang);
      if (index !== -1) utterance.voice = voices[index] ?? null;
      const finish = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setSpeaking(false);
        }
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      utteranceRef.current = utterance;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [supported]
  );

  // Beim Verlassen der Ansicht nicht weiterplappern
  useEffect(() => {
    if (!supported) return;
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  return { supported, speaking, speak, stop };
}

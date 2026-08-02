/**
 * Sprach-Infrastruktur: Provider mit localStorage-Persistenz und Geräte-Sync.
 * Deutsch ist im Haupt-Bundle, die übrigen Wörterbücher laden als eigene
 * Chunks nach (und bleiben dank Service Worker offline verfügbar).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LANGUAGES, detectLanguage, type Language } from "@shared/i18n";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { de, type Translation } from "./de";

const STORAGE_KEY = "campmesser.language";

const cache: Partial<Record<Language, Translation>> = { de };

async function loadDictionary(lang: Language): Promise<Translation> {
  if (cache[lang]) return cache[lang]!;
  let dict: Translation;
  switch (lang) {
    case "fr":
      dict = (await import("./fr")).fr;
      break;
    case "it":
      dict = (await import("./it")).it;
      break;
    case "en":
      dict = (await import("./en")).en;
      break;
    default:
      dict = de;
  }
  cache[lang] = dict;
  return dict;
}

export function getStoredLanguage(): Language {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && (LANGUAGES as readonly string[]).includes(value)) {
      return value as Language;
    }
  } catch {
    /* Standard */
  }
  // Echter Erstbesuch ohne gespeicherte Wahl: Browsersprache erkennen.
  // Bewusst NICHT sofort in localStorage schreiben – das erledigt der
  // erste applyLang-Durchlauf des Providers (bzw. der Geräte-Sync, dessen
  // Server-Wert weiterhin gewinnt).
  try {
    const navLangs =
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language];
    return detectLanguage(navLangs.filter(Boolean));
  } catch {
    return "de";
  }
}

interface I18nContextValue {
  lang: Language;
  t: Translation;
  setLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "de",
  t: de,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => getStoredLanguage());
  const [t, setT] = useState<Translation>(
    () => cache[getStoredLanguage()] ?? de
  );

  const applyLang = useCallback(async (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Sitzung reicht */
    }
    document.documentElement.lang = next === "de" ? "de-CH" : next;
    try {
      setT(await loadDictionary(next));
    } catch {
      // Chunk offline nicht ladbar: Deutsch als Fallback anzeigen
      setT(de);
    }
  }, []);

  // Geräte-Sync: Server-Stand gewinnt beim Laden, Wechsel wird gepusht
  const sync = useSyncedSetting<Language>("language", value => {
    if ((LANGUAGES as readonly string[]).includes(value)) void applyLang(value);
  });

  useEffect(() => {
    void applyLang(getStoredLanguage());
  }, [applyLang]);

  const setLang = useCallback(
    (next: Language) => {
      void applyLang(next);
      sync.push(next);
    },
    // sync.push ist über eine Ref stabil
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyLang]
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Aktuelle Sprache, Wörterbuch und Umschalter. */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

/** Nur das Wörterbuch – für Komponenten, die keine Umschaltung brauchen. */
export function useT(): Translation {
  return useContext(I18nContext).t;
}

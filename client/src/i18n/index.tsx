/**
 * Sprach-Infrastruktur: Provider mit localStorage-Persistenz und Geräte-Sync.
 *
 * ALLE VIER WÖRTERBÜCHER LADEN NACH (#332). Vorher war Deutsch fest im
 * Haupt-Bundle und nur die anderen drei waren eigene Chunks. Das hiess:
 * Wer die App auf Französisch benutzt, lud BEIDES – das deutsche
 * Wörterbuch im Haupt-Bundle (rund 230 kB unkomprimiert, ein Fünftel
 * davon) und danach das französische. Ein Wörterbuch, das nie jemand
 * liest, ist die teuerste Art von totem Gewicht: Es wird nicht nur
 * übertragen, sondern auch geparst.
 *
 * WAS DAS KOSTET, offen gesagt: Deutschsprachige Nutzer zahlen jetzt
 * einen zusätzlichen Rundlauf, den sie vorher nicht hatten. Der Abruf
 * startet deshalb beim LADEN dieses Moduls und nicht erst in einem
 * Effekt – so überlappt er mit allem, was der Haupt-Chunk sonst noch
 * aufsetzt. Beim zweiten Besuch liegt der Chunk ohnehin im Service
 * Worker.
 *
 * BIS DAS WÖRTERBUCH DA IST, zeigt der Provider nichts. Das ist derselbe
 * leere Zustand wie vor dem Start von React – es blitzt also nichts
 * Falsches auf, sondern der bestehende Moment dauert etwas länger. Ein
 * halb übersetztes Gerüst wäre die schlechtere Wahl.
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
import type { Translation } from "./de";

export type { Translation };

const STORAGE_KEY = "campmesser.language";

const cache: Partial<Record<Language, Translation>> = {};

async function loadDictionary(lang: Language): Promise<Translation> {
  const cached = cache[lang];
  if (cached) return cached;
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
      dict = (await import("./de")).de;
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

/**
 * Der Abruf beginnt HIER, beim Auswerten des Moduls – nicht im Effekt des
 * Providers. Sonst startete er erst nach dem ersten Rendern und läge damit
 * hinter allem anderen, was der Haupt-Chunk aufsetzt, statt daneben.
 */
const bootLanguage = getStoredLanguage();
const bootPromise = loadDictionary(bootLanguage).catch(
  () =>
    // Ohne Netz und ohne Chunk gibt es nichts anzuzeigen; der Provider
    // versucht es beim nächsten Start erneut.
    null
);

interface I18nContextValue {
  lang: Language;
  t: Translation;
  setLang: (lang: Language) => void;
}

/**
 * Der Standardwert wird nie benutzt: Der Provider zeigt seine Kinder erst,
 * wenn ein Wörterbuch da ist. Er existiert nur, weil `createContext` einen
 * verlangt – deshalb ein leeres Objekt statt eines zweiten Wörterbuchs.
 */
const I18nContext = createContext<I18nContextValue>({
  lang: "de",
  t: {} as Translation,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(bootLanguage);
  const [t, setT] = useState<Translation | null>(
    () => cache[bootLanguage] ?? null
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
      // Chunk offline nicht ladbar: beim bisherigen Wörterbuch bleiben.
      // Vorher stand hier «Deutsch als Rückfall» – das riss einer
      // französischen Nutzerin die Oberfläche unter den Füssen weg, bloss
      // weil ein Chunk fehlte.
      setT(current => current);
    }
  }, []);

  // Geräte-Sync: Server-Stand gewinnt beim Laden, Wechsel wird gepusht
  const sync = useSyncedSetting<Language>("language", value => {
    if ((LANGUAGES as readonly string[]).includes(value)) void applyLang(value);
  });

  // Das beim Modul-Laden gestartete Wörterbuch übernehmen, sobald es da
  // ist. `applyLang` würde denselben Chunk ein zweites Mal anfordern.
  useEffect(() => {
    let cancelled = false;
    void bootPromise.then(dict => {
      if (!cancelled && dict) setT(current => current ?? dict);
    });
    document.documentElement.lang =
      bootLanguage === "de" ? "de-CH" : bootLanguage;
    try {
      localStorage.setItem(STORAGE_KEY, bootLanguage);
    } catch {
      /* Sitzung reicht */
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback(
    (next: Language) => {
      void applyLang(next);
      sync.push(next);
    },
    // sync.push ist über eine Ref stabil
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyLang]
  );

  // Ohne Wörterbuch gibt es nichts zu zeigen – siehe Kopf der Datei.
  if (!t) return null;

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

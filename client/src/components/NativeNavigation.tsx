import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  isNativeApp,
  NATIVE_MESSAGES,
  NATIVE_NAVIGATE_EVENT,
  postToNative,
} from "@/lib/nativeBridge";
import { useI18n } from "@/i18n";
import { shortcutsFor } from "@shared/shortcuts";

/**
 * Sprünge aus der nativen App entgegennehmen (#315/#316).
 *
 * ZWEI ABSENDER, EIN WEG: Wer eine Mitteilung antippt, will an die Stelle,
 * von der die Mitteilung handelt – nicht auf die Startseite. Wer das
 * App-Icon lange drückt und «Packliste» wählt, ebenso. Beides landet in
 * `expo-app/App.js` als Ziel-Adresse und kommt von dort als ein Ereignis
 * hier an.
 *
 * WARUM NICHT `location.href`: Das wäre ein vollständiger Neuladen der App –
 * mehrere Sekunden am Handy, und ohne Empfang scheitert es womöglich ganz.
 * Über den Router ist der Sprung sofort da, und der Zwischenspeicher bleibt
 * stehen. Genau deshalb ist der Weg ein Ereignis und keine Adresszeile.
 *
 * NUR EIGENE PFADE: Es wird ausschliesslich zu Adressen gesprungen, die mit
 * «/» beginnen. Ein Ziel wie `https://…` oder `javascript:` wird verworfen –
 * die Brücke soll die App bedienen, nicht sie irgendwohin schicken.
 */
export default function NativeNavigation() {
  const [, navigate] = useLocation();
  const { lang } = useI18n();

  // Kurzbefehle in der eingestellten Sprache an die App melden (#316).
  // In `app.json` stehen sie fest auf Deutsch – das gilt nur bis zum ersten
  // Start; danach zählt, was hier geschickt wird.
  useEffect(() => {
    if (!isNativeApp()) return;
    postToNative(NATIVE_MESSAGES.setQuickActions, {
      items: shortcutsFor(lang),
    });
  }, [lang]);

  useEffect(() => {
    const handler = (event: Event) => {
      const target = (event as CustomEvent<string>).detail;
      if (typeof target !== "string") return;
      if (!target.startsWith("/") || target.startsWith("//")) return;
      navigate(target);
    };
    window.addEventListener(NATIVE_NAVIGATE_EVENT, handler);
    return () => window.removeEventListener(NATIVE_NAVIGATE_EVENT, handler);
  }, [navigate]);

  return null;
}

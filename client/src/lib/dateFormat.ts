import { LOCALE_TAGS, type Language } from "@shared/i18n";

/**
 * Datum mit Wochentag, ausgeschriebenem Monat und Jahr – z. B.
 * «Do, 7. August 2026».
 *
 * Gemeinsam genutzt vom Natur-Modul (Beobachtungen, Sammelalbum) und den
 * Himmels-Abschnitten (Mondphasen, Sternschnuppen, ISS). Lag früher als
 * lokale Hilfsfunktion in Nature.tsx; seit die beiden Bereiche getrennte
 * Seiten sind, gehört sie an einen Ort, an dem beide sie finden. Das
 * Format ist unverändert übernommen, damit sich keine Anzeige ändert.
 */
export function fmtDate(d: Date, lang: Language): string {
  return d.toLocaleDateString(LOCALE_TAGS[lang], {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

import { useTheme } from "@/contexts/ThemeContext";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  isThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "@/lib/themePreference";
import { saveMapsPreference, type MapsPreference } from "@/lib/directions";
import {
  applyFontScale,
  isFontScale,
  saveFontScale,
  type FontScale,
} from "@/lib/fontScale";

/**
 * Design und Karten-App vom Konto übernehmen (#360).
 *
 * DER FEHLER, DEN DAS BEHEBT: Im Profil stehen zwei Einstellungen, die
 * NUR im localStorage lagen – «Design» (hell/dunkel/automatisch) und
 * «Karten-App für Routen». Alles andere im Profil hängt längst am Konto:
 * Push, Zuhause, Name, Schnellzugriff, Kachel-Reihenfolge. Wer im Profil
 * auf Dunkel stellte, hatte am zweiten Gerät wieder Hell – und suchte den
 * Fehler bei sich.
 *
 * WARUM APP-WEIT UND NICHT IM PROFIL: Das Design muss stimmen, sobald man
 * die App öffnet, nicht erst, wenn man ins Profil geht. Diese Komponente
 * hängt darum in der App-Hülle und zeigt selbst nichts an.
 *
 * WAS MAN SIEHT, ehrlich: Auf einem neuen Gerät startet die App mit dem
 * lokalen Stand (sonst blitzt bei jedem Start kurz Weiss auf, während der
 * Server antwortet) und schaltet um, sobald die Antwort da ist – einmal,
 * kurz nach dem Anmelden. Das ist der Preis dafür, dass der Start ohne
 * Netz sofort richtig aussieht.
 */
export default function SettingsSync() {
  const { setPreference } = useTheme();

  useSyncedSetting<ThemePreference>("theme", value => {
    if (!isThemePreference(value)) return;
    saveThemePreference(value);
    setPreference?.(value);
  });

  useSyncedSetting<MapsPreference>("mapsApp", value => {
    if (value !== "apple" && value !== "google" && value !== "ask") return;
    saveMapsPreference(value);
  });

  // Schriftgrösse (#611): wie das Design – am zweiten Gerät soll die
  // gewählte Stufe gelten, sobald das Konto antwortet.
  useSyncedSetting<FontScale>("fontScale", value => {
    if (!isFontScale(value)) return;
    saveFontScale(value);
    applyFontScale(value);
  });

  // Die Karten-App braucht kein eigenes Zutun: `openDirections` liest die
  // Wahl bei jedem Klick frisch aus dem localStorage.
  return null;
}

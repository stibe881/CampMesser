/**
 * Notruf-Satz zum Vorlesen (#448): Wer im Ausland die 112 wählt, muss
 * seine Position in einer Sprache durchgeben, die die Zentrale versteht.
 * Ein vorbereiteter Satz mit den Koordinaten – in allen vier Sprachen –
 * nimmt genau diesen Stress weg: vorlesen statt formulieren.
 *
 * Die Zahlen bleiben mit PUNKT als Dezimaltrenner («46.94712»): so
 * stehen sie auf jedem GPS-Gerät, und Leitstellen kennen das Format.
 */
import type { Language } from "./i18n";

/** Fünf Nachkommastellen ≈ 1 m – mehr ist am Telefon nur Rauschen. */
export function emergencyCoord(value: number): string {
  return value.toFixed(5);
}

/** Der Satz, den man der Notrufzentrale vorliest. */
export function emergencyPhrase(
  lang: Language,
  lat: number,
  lng: number
): string {
  const la = emergencyCoord(lat);
  const lo = emergencyCoord(lng);
  switch (lang) {
    case "de":
      return `Ich brauche Hilfe. Meine Position ist: Breite ${la}, Länge ${lo}.`;
    case "fr":
      return `J'ai besoin d'aide. Ma position est : latitude ${la}, longitude ${lo}.`;
    case "it":
      return `Ho bisogno di aiuto. La mia posizione è: latitudine ${la}, longitudine ${lo}.`;
    case "en":
      return `I need help. My position is: latitude ${la}, longitude ${lo}.`;
  }
}

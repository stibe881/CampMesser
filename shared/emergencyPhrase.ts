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

/** LV95-Metrenwert mit Apostroph-Gruppierung («2'600'123») – Schweizer Schreibweise. */
export function formatLv95(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/**
 * Der Satz, den man der Notrufzentrale vorliest.
 *
 * In der Schweiz (#547) hängt der Satz zusätzlich die LV95-Koordinaten an –
 * die Einsatzzentralen arbeiten mit genau diesen Zahlen, und «zwei Millionen
 * sechshunderttausend …» ist am Telefon eindeutiger als Dezimalgrade.
 */
export function emergencyPhrase(
  lang: Language,
  lat: number,
  lng: number,
  lv95?: { east: number; north: number } | null
): string {
  const la = emergencyCoord(lat);
  const lo = emergencyCoord(lng);
  const ch = lv95
    ? ` ${formatLv95(lv95.east)} / ${formatLv95(lv95.north)}`
    : "";
  switch (lang) {
    case "de":
      return `Ich brauche Hilfe. Meine Position ist: Breite ${la}, Länge ${lo}.${ch ? ` Schweizer Koordinaten:${ch}.` : ""}`;
    case "fr":
      return `J'ai besoin d'aide. Ma position est : latitude ${la}, longitude ${lo}.${ch ? ` Coordonnées suisses :${ch}.` : ""}`;
    case "it":
      return `Ho bisogno di aiuto. La mia posizione è: latitudine ${la}, longitudine ${lo}.${ch ? ` Coordinate svizzere:${ch}.` : ""}`;
    case "en":
      return `I need help. My position is: latitude ${la}, longitude ${lo}.${ch ? ` Swiss coordinates:${ch}.` : ""}`;
  }
}

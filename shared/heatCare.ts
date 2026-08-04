/**
 * Sonnencreme- und Trink-Erinnerung (#260, #261): An heissen, sonnigen
 * Tagen erinnert die App morgens einmal ans Eincremen und ans Trinken.
 *
 * Beides hängt am selben Tag und an derselben Prognose, deshalb rechnet es
 * dieselbe Datei – und deshalb verschickt der Server auch EINE Meldung
 * statt zweier. Zwei Mitteilungen am selben Sommermorgen, beide über
 * dasselbe Wetter, wären Lärm; wer nach der zweiten die Erinnerungen
 * abschaltet, bekommt auch die erste nie wieder.
 *
 * Zu den Schwellen: Die WHO empfiehlt Sonnenschutz schon ab UV 3. Als
 * Auslöser für eine MITTEILUNG taugt das nicht – im Schweizer Sommer wäre
 * das fast jeder Tag, und eine Erinnerung, die immer kommt, liest niemand
 * mehr. Deshalb beginnt die Erinnerung bei UV 6 («hoch»), also dort, wo
 * ungeschützte Haut in weniger als einer halben Stunde rot wird. Der
 * Hinweis im Wetter-Modul bleibt davon unberührt und erscheint weiterhin
 * ab Stufe «hoch» der WHO-Skala.
 *
 * Reine Rechnerei ohne Abruf – Client, Server und Tests teilen sie.
 */

/** Ab diesem UV-Index wird ans Eincremen erinnert (WHO-Stufe «hoch»). */
export const SUNSCREEN_UV_THRESHOLD = 6;

/** Ab dieser Tageshöchsttemperatur wird ans Trinken erinnert. */
export const HYDRATION_TEMP_THRESHOLD_C = 28;

/**
 * Nachcreme-Abstand in Minuten. Die zwei Stunden sind der Richtwert für
 * normale Verhältnisse; je höher der UV-Index, desto kürzer – nicht weil
 * die Creme schneller altert, sondern weil ein Fehler teurer wird.
 * Baden und Abtrocknen setzen den Schutz ohnehin zurück; das steht im Text
 * und nicht in der Rechnung, weil die App nicht weiss, ob jemand im Wasser war.
 */
export function reapplyMinutes(uvIndex: number): number {
  const uv = Number.isFinite(uvIndex) ? uvIndex : 0;
  if (uv >= 11) return 45;
  if (uv >= 8) return 60;
  if (uv >= 6) return 90;
  return 120;
}

/**
 * Zeit bis zum Sonnenbrand auf ungeschützter Haut, grob für mitteleuropäische
 * Haut (Typ II) in Minuten. Faustformel der WHO-Skala: 200 / UV-Index,
 * gedeckelt bei 120 Minuten, damit bei UV 1 keine Fantasiezahl steht.
 * Bewusst eine GROBE Zahl – Hauttyp, Höhe, Wasser und Schnee verschieben
 * das erheblich, und eine Nachkommastelle würde eine Genauigkeit vortäuschen,
 * die es nicht gibt.
 */
export function burnMinutes(uvIndex: number): number {
  const uv = Number.isFinite(uvIndex) && uvIndex > 0 ? uvIndex : 0;
  if (uv <= 0) return 120;
  return Math.max(5, Math.min(120, Math.round(200 / uv)));
}

/**
 * Trinkmenge pro Erwachsener und Tag in Litern – dieselbe Formel wie im
 * Trinkwasser-Rechner (Basis 2 l, +0.5 l je angefangene 5 °C über 20 °C),
 * damit Erinnerung und Rechner nicht zwei verschiedene Zahlen nennen.
 */
export function drinkingLitersPerAdult(maxTempC: number): number {
  const temp = Number.isFinite(maxTempC) ? maxTempC : 20;
  const surcharge = Math.max(0, Math.ceil((temp - 20) / 5)) * 0.5;
  return 2 + surcharge;
}

export interface HeatAdvice {
  /** UV ist hoch genug fürs Eincremen. */
  sunscreen: boolean;
  /** Es wird heiss genug für den Trink-Hinweis. */
  hydration: boolean;
  uvIndex: number;
  maxTempC: number;
  /** Nachcremen alle … Minuten (nur bei `sunscreen` sinnvoll). */
  reapplyMinutes: number;
  /** Sonnenbrand-Zeit auf ungeschützter Haut in Minuten. */
  burnMinutes: number;
  /** Empfohlene Trinkmenge pro Erwachsener und Tag. */
  litersPerAdult: number;
}

/**
 * Braucht der Tag eine Erinnerung? Gibt null zurück, wenn weder die Sonne
 * noch die Hitze einen Hinweis rechtfertigen – dann wird nichts verschickt
 * und nichts angezeigt.
 */
export function heatAdvice(
  uvIndexMax: number,
  maxTempC: number
): HeatAdvice | null {
  const uv = Number.isFinite(uvIndexMax) ? uvIndexMax : 0;
  const temp = Number.isFinite(maxTempC) ? maxTempC : 0;
  const sunscreen = uv >= SUNSCREEN_UV_THRESHOLD;
  const hydration = temp >= HYDRATION_TEMP_THRESHOLD_C;
  if (!sunscreen && !hydration) return null;
  return {
    sunscreen,
    hydration,
    uvIndex: uv,
    maxTempC: temp,
    reapplyMinutes: reapplyMinutes(uv),
    burnMinutes: burnMinutes(uv),
    litersPerAdult: drinkingLitersPerAdult(temp),
  };
}

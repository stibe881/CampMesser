/**
 * Gemeinsame Form der Pflege- und Reparatur-Ratgeber (#265, #266).
 *
 * Die Typen stehen hier für sich, damit Zeltpflege und Ausrüstungs-
 * Reparatur dieselbe Anleitung-Struktur teilen, ohne dass eine Datei die
 * Inhalte der anderen kennen muss.
 *
 * Aufbau jeder Anleitung – bewusst in dieser Reihenfolge:
 * WANN merkt man, dass es fällig ist → WAS braucht man dafür → WIE geht
 * es Schritt für Schritt → und zuletzt der HÄUFIGSTE FEHLER. Der Fehler
 * steht am Schluss und nicht als Warnung zuoberst: Wer die Anleitung
 * gelesen hat, versteht ihn; wer nur die Warnung liest, macht ihn trotzdem.
 */
import { type L4 } from "@shared/i18n";

export interface CareStep {
  title: L4;
  text: L4;
}

export interface CareGuide {
  id: string;
  title: L4;
  /** Worum es geht, in einem Satz. */
  summary: L4;
  /** Woran man merkt, dass es Zeit dafür ist. */
  when: L4;
  /** Was man dazu braucht – Material und Werkzeug. */
  materials: L4[];
  steps: CareStep[];
  /** Der häufigste Fehler bei genau dieser Arbeit. */
  mistake: L4;
  /**
   * Aktive Arbeitszeit in Minuten, ohne Trocknungs- oder Wartezeiten –
   * die stehen im jeweiligen Schritt, weil sie stark schwanken.
   */
  minutes: number;
  /**
   * Sinnvolles Wiederhol-Intervall in Monaten; null, wenn die Arbeit
   * anlassbezogen ist (ein Riss kommt nicht nach Kalender).
   */
  intervalMonths: number | null;
}

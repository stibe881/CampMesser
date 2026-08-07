/**
 * Die Höhe ändert das Kochen (#385).
 *
 * WAS FEHLTE: `campSpots.elevationM` steht seit #212 in der Datenbank und
 * wird an genau EINER Stelle gelesen – beim Zeckenrisiko. Dabei ist die
 * Höhe der Grund, warum das Nachtessen auf 2000 m nicht fertig wird:
 * Wasser siedet dort bei rund 93 °C, und was bei 100 °C zwölf Minuten
 * braucht, braucht hier spürbar länger. Wer das nicht weiss, hält sich
 * ans Rezept und isst harte Teigwaren.
 *
 * DIE PHYSIK IST EINFACH, die Küche nicht. Der Siedepunkt lässt sich gut
 * abschätzen; wie viel länger ein Gericht dann WIRKLICH braucht, hängt an
 * Stückgrösse, Deckel und Topf. Deshalb ist der Faktor hier ausdrücklich
 * ein RICHTWERT und keine Physik – und die Anzeige sagt das auch.
 *
 * NUR FÜR DAS, WAS IM WASSER GART. Ein Kuchen im Omnia-Ofen und ein
 * Steak in der Pfanne kennen keinen Siedepunkt; dort wäre der Faktor
 * schlicht falsch. Deshalb `affectsCookTime`: Unterhalb der Schwelle
 * wird gar nichts behauptet.
 *
 * DIE SCHWELLE: unter 500 m ist der Unterschied kleiner als die
 * Ungenauigkeit jeder Herdplatte. Ein Hinweis, der im Flachland bei jedem
 * Rezept steht, ist Lärm.
 */

/** Ab hier lohnt sich der Hinweis überhaupt. */
export const ALTITUDE_HINT_MIN_M = 500;
/** Ab hier wird aus «etwas länger» ein Unterschied, den man merkt. */
export const ALTITUDE_STRONG_M = 1500;

/**
 * Siedepunkt des Wassers in °C.
 *
 * Faustformel: rund 1 °C weniger je 300 Höhenmeter. Sie stimmt bis weit
 * über die Alpen hinaus auf ein Zehntelgrad genau genug – und ein
 * Zehntelgrad entscheidet über kein Nachtessen.
 */
export function boilingPointC(elevationM: number): number {
  const clean = Math.max(0, elevationM);
  return Math.round((100 - clean / 300) * 10) / 10;
}

/**
 * Verlängerungsfaktor für Garzeiten IM WASSER.
 *
 * Erfahrungswerte aus der Bergküche, nicht aus einer Formel: rund 5 %
 * je 500 Höhenmeter, gedeckelt bei 1.6. Der Deckel ist Absicht – wer auf
 * 4000 m Linsen kocht, braucht keinen Faktor, sondern einen Dampfkochtopf,
 * und den empfiehlt der Hinweis unten.
 */
export function cookTimeFactor(elevationM: number): number {
  if (elevationM < ALTITUDE_HINT_MIN_M) return 1;
  const factor = 1 + (elevationM / 500) * 0.05;
  return Math.round(Math.min(1.6, factor) * 100) / 100;
}

/** Lohnt sich der Hinweis auf dieser Höhe? */
export function affectsCookTime(elevationM: number | null): boolean {
  return elevationM !== null && elevationM >= ALTITUDE_HINT_MIN_M;
}

/**
 * Angepasste Garzeit in Minuten, aufgerundet auf ganze Minuten.
 *
 * AUFGERUNDET UND NICHT GERUNDET: Zu lang gekochte Teigwaren sind
 * unschön, zu kurz gekochte Linsen sind ungeniessbar.
 */
export function adjustedMinutes(
  minutes: number,
  elevationM: number | null
): number {
  if (!affectsCookTime(elevationM)) return Math.round(minutes);
  return Math.ceil(minutes * cookTimeFactor(elevationM as number));
}

/** Wie deutlich der Unterschied ist – steuert den Ton der Anzeige. */
export type AltitudeLevel = "none" | "mild" | "strong";

export function altitudeLevel(elevationM: number | null): AltitudeLevel {
  if (!affectsCookTime(elevationM)) return "none";
  return (elevationM as number) >= ALTITUDE_STRONG_M ? "strong" : "mild";
}

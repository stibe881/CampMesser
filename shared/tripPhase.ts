/**
 * In welcher Phase steckt ein Aufenthalt – geplant, laufend, vorbei? (#361)
 *
 * DER ANLASS: In «Meine Reisen» standen der Packstand-Balken («gepackt»)
 * und der Wetter-Packvorschlag auch dann noch da, wenn die Reise längst
 * begonnen hatte. Wer auf dem Platz steht, packt nicht mehr – die beiden
 * Karten waren dort nur noch Beiwerk zwischen den Dingen, die man während
 * der Reise tatsächlich braucht.
 *
 * WARUM DAS HIER STEHT UND NICHT IN DER SEITE: «Hat die Reise begonnen»
 * klingt nach einem Einzeiler, hat aber drei Fälle und eine Kante am
 * Anreisetag. Als reine Funktion lässt es sich prüfen; in einer JSX-Zeile
 * nicht.
 *
 * DIE REGEL, wörtlich nach dem Nutzerwunsch («wenn das Datum und die Zeit
 * erreicht ist»):
 *
 *   Anreisetag noch nicht erreicht  → geplant
 *   Anreisetag vorbei               → begonnen
 *   Anreisetag ist heute            → die Ankunftszeit entscheidet;
 *                                     ohne Zeitangabe zählt das Datum,
 *                                     also gilt der Tag als begonnen
 *
 * Der letzte Fall ist eine bewusste Wahl: Ohne Uhrzeit weiss die App
 * nichts Genaueres als den Tag, und der ist erreicht. Wer den Balken am
 * Anreisemorgen noch sehen will, trägt eine Ankunftszeit ein – dann
 * verschwindet er auf die Minute genau.
 */

/** «HH:MM» in Minuten seit Mitternacht; null bei unbrauchbarer Angabe. */
export function parseHhMm(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Minuten seit Mitternacht in der lokalen Zeitzone. */
export function localMinutes(at: Date = new Date()): number {
  return at.getHours() * 60 + at.getMinutes();
}

export interface TripPhaseInput {
  /** Anreisetag als ISO-Tag (YYYY-MM-DD). */
  startDate: string;
  /** Geplante Ankunftszeit «HH:MM»; null = keine Angabe. */
  arrivalTime?: string | null;
}

/**
 * Hat der Aufenthalt begonnen? `today` und `nowMinutes` kommen vom
 * Aufrufer – so bleibt die Funktion ohne Uhr und damit prüfbar.
 */
export function tripHasStarted(
  trip: TripPhaseInput,
  today: string,
  nowMinutes: number
): boolean {
  if (today > trip.startDate) return true;
  if (today < trip.startDate) return false;
  const arrival = parseHhMm(trip.arrivalTime);
  // Ohne (oder mit kaputter) Zeitangabe zählt allein das Datum.
  if (arrival === null) return true;
  return nowMinutes >= arrival;
}

/**
 * Sind Packstand und Packvorschlag jetzt noch von Nutzen?
 *
 * Genau die Umkehrung von `tripHasStarted` – als eigener Name, weil an den
 * Aufrufstellen «brauchen wir das noch» gefragt wird und nicht «läuft die
 * Reise schon». Ein `!` an der falschen Stelle liest niemand.
 */
export function packingStillMatters(
  trip: TripPhaseInput,
  today: string,
  nowMinutes: number
): boolean {
  return !tripHasStarted(trip, today, nowMinutes);
}

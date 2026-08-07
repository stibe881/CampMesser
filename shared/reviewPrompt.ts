/**
 * Die Rückblick-Erinnerung nach der Heimkehr (#390).
 *
 * WAS FEHLTE: Der Rückblick (#381) verbessert die Packliste nur, wenn
 * ihn jemand ausfüllt – und eine Woche nach der Heimkehr weiss niemand
 * mehr, was gefehlt hat. Er wohnt bei den vergangenen Reisen hinter
 * einem «Mehr»-Schalter; wer nicht daran denkt, findet ihn nie.
 *
 * EINE KARTE AUF DER STARTSEITE, KEIN PUSH: Nach der Heimkehr kommt
 * bereits die Trocknungs-Erinnerung (#89), und eine zweite Meldung im
 * selben Moment wäre Lärm – Lärm schaltet man ab, und dann ist auch die
 * nützliche weg. Die Karte erscheint, wo man ohnehin hinschaut.
 *
 * SIE GIBT WIEDER RUHE: nach REVIEW_PROMPT_DAYS Tagen verschwindet sie
 * von selbst (dann ist die Erinnerung ohnehin verblasst und der
 * Rückblick nichts mehr wert), nach dem Ausfüllen sowieso, und ein
 * Wegklicken gilt JE REISE – wer die Frage zu dieser Reise verneint
 * hat, soll sie zur nächsten trotzdem sehen.
 *
 * NUR EIGENE REISEN: Der Rückblick hängt am Konto der Besitzerin/des
 * Besitzers (packing.feedback.save prüft den Besitz) – Mitglieder eine
 * Karte sehen zu lassen, die beim Speichern scheitert, wäre eine Falle.
 */

/** So viele Tage nach der Abreise lohnt die Erinnerung noch. */
export const REVIEW_PROMPT_DAYS = 7;

/** Eine Reise, so weit sie hier zählt. */
export interface ReviewableTrip {
  id: number;
  endDate: string;
  role?: "owner" | "member";
}

/** ISO-Tag um Tage verschieben – ohne Zeitzonen-Umweg (#333). */
function shiftIsoDay(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Die Reise, an deren Rückblick erinnert werden soll – oder null.
 *
 * DIE JÜNGSTE ABREISE GEWINNT: Kommen zwei Reisen kurz nacheinander
 * heim, ist die frische die, zu der man noch etwas weiss. Zwei Karten
 * übereinander wären eine Liste, und Listen füllt niemand aus.
 */
export function reviewCandidate<T extends ReviewableTrip>(
  trips: readonly T[],
  today: string,
  /** Reisen, zu denen schon ein Rückblick gespeichert ist. */
  reviewedTripIds: ReadonlySet<number>,
  /** Je Reise weggeklickte Erinnerungen. */
  dismissedTripIds: ReadonlySet<number>
): T | null {
  let best: T | null = null;
  for (const trip of trips) {
    if (trip.role === "member") continue;
    // Streng NACH der Abreise: Am Abreisetag selbst packt man aus und
    // hat Besseres zu tun als Formulare.
    if (trip.endDate >= today) continue;
    if (today > shiftIsoDay(trip.endDate, REVIEW_PROMPT_DAYS)) continue;
    if (reviewedTripIds.has(trip.id)) continue;
    if (dismissedTripIds.has(trip.id)) continue;
    if (!best || trip.endDate > best.endDate) best = trip;
  }
  return best;
}

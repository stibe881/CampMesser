/**
 * «Welcher Tag ist heute» – aus den LOKALEN Feldern, nicht über UTC (#333).
 *
 * DER FEHLER, DEN DAS BEHEBT: An 37 Stellen stand
 * `new Date().toISOString().slice(0, 10)`. `toISOString()` rechnet nach
 * UTC, die Schweiz liegt zwei Stunden davor – zwischen Mitternacht und
 * zwei Uhr morgens liefert das den VORTAG:
 *
 *     Ortszeit                     7.8.2026, 00:30
 *     toISOString().slice(0,10)    2026-08-06   ← falsch
 *     lokale Felder                2026-08-07
 *
 * Was daraus folgte, war kein Schönheitsfehler: Wer um halb eins am Feuer
 * sass und «Heute» öffnete, sah die Ämtli von gestern, das Menü von
 * gestern und einen Reisetag zu wenig. Der Ämtli-Plan verteilte auf den
 * falschen Tag und überschrieb dabei die Häkchen, die schon gesetzt
 * waren. In einer Camping-App sind späte Abende die Regel, nicht die
 * Ausnahme.
 *
 * DIE FUNKTION GAB ES SCHON, in `shared/tripHistory.ts`, samt Kommentar
 * über genau dieses Problem – benutzt wurde sie an einer einzigen
 * Stelle. Deshalb steht sie jetzt hier, wo Client, Server und die
 * geteilte Logik sie finden.
 *
 * WAS DAS NICHT LÖST: Der Server hat seine eigene Zeitzone. Ein Tag, den
 * der Client schickt, bleibt der Tag des Clients – und das ist richtig
 * so, denn es zählt, welcher Tag am Zeltplatz ist. Die Cron-Jobs
 * dagegen rechnen mit der Zeitzone des Servers; `TZ` steht deshalb im
 * Deploy auf `Europe/Zurich`.
 */

const pad = (value: number) => String(value).padStart(2, "0");

/** ISO-Tag (YYYY-MM-DD) eines Zeitpunkts in der lokalen Zeitzone. */
export function localDay(at: Date | number = new Date()): string {
  const date = at instanceof Date ? at : new Date(at);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Heutiger ISO-Tag in der lokalen Zeitzone – der häufigste Fall. */
export function todayIso(): string {
  return localDay(new Date());
}

/**
 * ISO-Tag mit einem Versatz in Tagen («morgen», «vor einer Woche»).
 *
 * Über die lokalen Felder gerechnet und nicht über Millisekunden: An den
 * beiden Umstellungstagen der Sommerzeit hat ein Tag 23 bzw. 25 Stunden,
 * und `+ 24 * 60 * 60 * 1000` landet dann auf demselben oder auf dem
 * übernächsten Tag.
 */
export function shiftIsoDay(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  return localDay(new Date(year, month - 1, date + days));
}

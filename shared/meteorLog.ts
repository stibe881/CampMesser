/**
 * Sternschnuppen-Protokoll (#294): eine Beobachtungsnacht mitzählen.
 *
 * WARUM MITZÄHLEN UND NICHT NUR SCHAUEN: Eine Nacht unter den Perseiden
 * ist am nächsten Morgen ein Gefühl («viele!»), kein Ergebnis. Wer
 * mitzählt, hat eine Zahl, kann Nächte vergleichen und merkt nach zwei
 * Jahren, dass die eine August-Nacht wirklich aussergewöhnlich war.
 *
 * EIN TIPP PRO STERNSCHNUPPE, UND DIE ZEIT KOMMT VON SELBST. Wer im
 * Liegestuhl liegt, schreibt nichts auf. Deshalb ist der Zähl-Knopf
 * zugleich die Richtungswahl: Man tippt dorthin, wo sie hergekommen ist –
 * das ergibt Zeit und Richtung in einem Griff. Wer die Richtung nicht
 * sagen kann, tippt in die Mitte; eine Sternschnuppe ohne Richtung ist
 * mehr wert als eine, die man nicht erfasst hat.
 *
 * DIE NACHT ENDET NICHT UM MITTERNACHT. Was um 01:30 Uhr fällt, gehört
 * zur Nacht des Vorabends – sonst zerfällt jede Beobachtung in zwei
 * halbe. Deshalb läuft eine «Nacht» hier von Mittag bis Mittag.
 *
 * DIE RATE IST NUR EHRLICH MIT PAUSEN. Wer zwischendurch Tee holt,
 * beobachtet nicht. Gezählt wird darum die effektive Beobachtungszeit,
 * und unter einer Viertelstunde gibt es gar keine Rate: Aus einer
 * Sternschnuppe in zwei Minuten dreissig pro Stunde zu machen, wäre
 * Zahlenspielerei.
 */

/** Acht Himmelsrichtungen – als Azimut-Index 0 (N) bis 7 (NW). */
export const SECTOR_COUNT = 8;

/** Grad pro Sektor – für `compassDirection()` aus shared/solar.ts. */
export const SECTOR_DEGREES = 360 / SECTOR_COUNT;

/**
 * Ab dieser Stunde (lokal) beginnt eine neue Beobachtungsnacht. Mittag
 * ist der einzige Zeitpunkt, an dem garantiert niemand Sternschnuppen
 * zählt.
 */
export const NIGHT_CUTOFF_HOUR = 12;

/**
 * Unter dieser effektiven Beobachtungszeit wird keine Stundenrate
 * ausgewiesen.
 */
export const MIN_RATE_MS = 15 * 60 * 1000;

/** Eine einzelne Sternschnuppe. */
export interface MeteorSighting {
  /** Zeitpunkt in Millisekunden. */
  at: number;
  /** Richtung als Sektor 0–7, oder null für «unklar». */
  sector: number | null;
}

/** Ein Beobachtungsabschnitt; `to === null` heisst: läuft noch. */
export interface ObservationSpan {
  from: number;
  to: number | null;
}

export interface MeteorSession {
  id: string;
  /** Nacht als ISO-Datum des ABENDS (siehe `nightKey`). */
  night: string;
  /** Strom-Id aus shared/astro.ts – null, wenn unbestimmt. */
  showerId: string | null;
  spans: ObservationSpan[];
  sightings: MeteorSighting[];
}

const pad = (value: number) => String(value).padStart(2, "0");

/** ISO-Datum aus den LOKALEN Feldern – nicht über UTC, sonst kippt es nachts. */
function isoLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Zu welcher Nacht gehört dieser Zeitpunkt? Alles vor Mittag zählt zum
 * Vorabend – damit bleibt eine Beobachtung von 22:00 bis 02:00 EINE
 * Nacht und nicht zwei halbe.
 */
export function nightKey(at: number): string {
  const date = new Date(at);
  if (date.getHours() < NIGHT_CUTOFF_HOUR) {
    date.setDate(date.getDate() - 1);
  }
  return isoLocalDate(date);
}

/** Eine leere Sitzung für die Nacht, in der `now` liegt. */
export function newSession(id: string, now: number): MeteorSession {
  return {
    id,
    night: nightKey(now),
    showerId: null,
    spans: [{ from: now, to: null }],
    sightings: [],
  };
}

/** Läuft die Beobachtung gerade? */
export function isObserving(session: MeteorSession): boolean {
  const last = session.spans[session.spans.length - 1];
  return last != null && last.to === null;
}

/** Pause: den offenen Abschnitt schliessen. Schon pausiert = unverändert. */
export function pauseSession(
  session: MeteorSession,
  at: number
): MeteorSession {
  if (!isObserving(session)) return session;
  const spans = session.spans.slice();
  spans[spans.length - 1] = { from: spans[spans.length - 1].from, to: at };
  return { ...session, spans };
}

/** Weiter: einen neuen Abschnitt öffnen. Läuft schon = unverändert. */
export function resumeSession(
  session: MeteorSession,
  at: number
): MeteorSession {
  if (isObserving(session)) return session;
  return { ...session, spans: session.spans.concat({ from: at, to: null }) };
}

/**
 * Eine Sternschnuppe eintragen.
 *
 * WÄHREND EINER PAUSE zählt sie trotzdem – wer eine sieht, hat
 * offensichtlich hingeschaut – und die Beobachtung läuft ab diesem
 * Moment weiter. Die Pause davor bleibt Pause: Sie in die Zeit
 * einzurechnen, würde die Rate kleinrechnen.
 */
export function addSighting(
  session: MeteorSession,
  sector: number | null,
  at: number
): MeteorSession {
  const clean =
    sector == null || sector < 0 || sector >= SECTOR_COUNT
      ? null
      : Math.floor(sector);
  const running = isObserving(session) ? session : resumeSession(session, at);
  return {
    ...running,
    sightings: running.sightings.concat({ at, sector: clean }),
  };
}

/** Die letzte Sternschnuppe zurücknehmen – Vertipper passieren im Dunkeln. */
export function undoSighting(session: MeteorSession): MeteorSession {
  if (session.sightings.length === 0) return session;
  return { ...session, sightings: session.sightings.slice(0, -1) };
}

/** Beobachtete Zeit in Millisekunden; der offene Abschnitt zählt bis `now`. */
export function effectiveMs(session: MeteorSession, now: number): number {
  return session.spans.reduce((sum, span) => {
    const end = span.to ?? now;
    return sum + Math.max(0, end - span.from);
  }, 0);
}

export interface SectorCount {
  /** Sektor 0–7, oder null für «unklar». */
  sector: number | null;
  count: number;
}

/**
 * Wie viele kamen aus welcher Richtung? Alle acht Sektoren stehen drin,
 * auch die leeren – eine Verteilung mit Lücken liest sich falsch.
 * «Unklar» hängt hinten an, sofern es vorkommt.
 */
export function sectorCounts(session: MeteorSession): SectorCount[] {
  const counts: SectorCount[] = [];
  for (let sector = 0; sector < SECTOR_COUNT; sector++) {
    counts.push({ sector, count: 0 });
  }
  let unknown = 0;
  session.sightings.forEach(sighting => {
    if (sighting.sector == null) unknown += 1;
    else counts[sighting.sector].count += 1;
  });
  if (unknown > 0) counts.push({ sector: null, count: unknown });
  return counts;
}

/**
 * Die Richtung, aus der es auffällig oft kam – oder null.
 *
 * «Auffällig» heisst: mindestens drei Stück und mehr als doppelt so
 * viele wie im Schnitt der übrigen Sektoren. Bei fünf Sternschnuppen aus
 * fünf Richtungen von einem Radianten zu sprechen, wäre geraten.
 */
export function dominantSector(session: MeteorSession): number | null {
  const known = session.sightings.filter(s => s.sector != null);
  if (known.length < 3) return null;
  const counts = sectorCounts(session).filter(entry => entry.sector != null);
  let best = counts[0];
  counts.forEach(entry => {
    if (entry.count > best.count) best = entry;
  });
  if (best.count < 3) return null;
  const rest = known.length - best.count;
  const average = rest / (SECTOR_COUNT - 1);
  return best.count > 2 * average ? best.sector : null;
}

export interface SessionStats {
  count: number;
  /** Effektive Beobachtungszeit in Millisekunden. */
  observedMs: number;
  /** Sternschnuppen pro Stunde – null unter `MIN_RATE_MS`. */
  perHour: number | null;
  /** Erste und letzte Sternschnuppe; null, solange keine da ist. */
  firstAt: number | null;
  lastAt: number | null;
  /** Auffällige Richtung, sonst null. */
  dominant: number | null;
  observing: boolean;
}

export function sessionStats(
  session: MeteorSession,
  now: number
): SessionStats {
  const observedMs = effectiveMs(session, now);
  const times = session.sightings.map(s => s.at);
  return {
    count: session.sightings.length,
    observedMs,
    perHour:
      observedMs >= MIN_RATE_MS
        ? (session.sightings.length * 3600000) / observedMs
        : null,
    firstAt: times.length > 0 ? Math.min.apply(null, times) : null,
    lastAt: times.length > 0 ? Math.max.apply(null, times) : null,
    dominant: dominantSector(session),
    observing: isObserving(session),
  };
}

/** Eine abgeschlossene Nacht in der Übersicht. */
export interface NightSummary {
  night: string;
  showerId: string | null;
  count: number;
  observedMs: number;
  perHour: number | null;
}

/**
 * Die Nächte für die Liste, neueste zuerst. Nächte ohne eine einzige
 * Sternschnuppe bleiben drin: Dass nichts kam, ist auch ein Ergebnis –
 * und ohne die Null-Nächte sieht jede Statistik zu gut aus.
 */
export function nightSummaries(
  sessions: readonly MeteorSession[],
  now: number
): NightSummary[] {
  return sessions
    .map(session => {
      const stats = sessionStats(session, now);
      return {
        night: session.night,
        showerId: session.showerId,
        count: stats.count,
        observedMs: stats.observedMs,
        perHour: stats.perHour,
      };
    })
    .sort((a, b) => (a.night < b.night ? 1 : a.night > b.night ? -1 : 0));
}

/** Summe über alle Nächte – für die Kopfzeile der Übersicht. */
export function logTotals(
  sessions: readonly MeteorSession[],
  now: number
): { nights: number; count: number; observedMs: number } {
  return sessions.reduce(
    (total, session) => {
      const stats = sessionStats(session, now);
      return {
        nights: total.nights + 1,
        count: total.count + stats.count,
        observedMs: total.observedMs + stats.observedMs,
      };
    },
    { nights: 0, count: 0, observedMs: 0 }
  );
}

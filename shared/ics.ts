/**
 * Kalender-Export (#244): Reisen als iCalendar-Datei (.ics) zum Herunterladen.
 *
 * Reiner String-Bau ohne Bibliothek, ohne DOM und ohne `Date.now()` – der
 * Zeitstempel (DTSTAMP) kommt immer von aussen herein, damit sich die Ausgabe
 * Zeichen für Zeichen testen lässt.
 *
 * Was der Standard (RFC 5545) verlangt und hier eingehalten wird:
 * - Zeilenenden sind CRLF, die Datei endet mit einem CRLF.
 * - Zeilen über 75 Oktette werden gefaltet: Umbruch, dann ein Leerzeichen.
 *   Gezählt werden UTF-8-Oktette, nicht Zeichen – «Nächte» ist länger, als es
 *   aussieht –, und ein Zeichen wird nie mitten im Byte-Paar zerschnitten.
 * - In Textwerten sind Backslash, Semikolon, Komma und Zeilenumbruch zu
 *   maskieren (GEO ist KEIN Textwert und wird deshalb nicht maskiert).
 * - DTEND ist EXKLUSIV: eine Abreise am 15. heisst DTEND 16. – sonst zeigen
 *   Kalender einen Tag zu wenig an.
 *
 * Bewusste Festlegungen:
 * - Ganztägig ist der Normalfall. Nur wenn BEIDE Zeiten aus #154 gesetzt und
 *   plausibel sind (Ende nach Beginn), entsteht ein zeitgenaues Ereignis.
 * - Zeitgenaue Ereignisse laufen als «schwebende» Ortszeit (ohne TZID und ohne
 *   Z): 14:00 bleibt 14:00, egal in welcher Zeitzone der Kalender steht. Eine
 *   VTIMEZONE-Komponente mitzuliefern wäre für eine Ankunftszeit am Zeltplatz
 *   deutlich mehr Aufwand als Nutzen.
 * - Die UID ist pro Reise stabil (`trip-<id>@campmesser.ch`): ein zweiter
 *   Import aktualisiert den Eintrag, statt ihn zu verdoppeln.
 */
import { l4, pick, type L4, type Language } from "./i18n";
import { tripNights } from "./trips";

/**
 * Domain der stabilen UIDs – bleibt beim alten Wert, obwohl die App heute
 * unter meinreisekompass.ch läuft: Die UID ist die IDENTITÄT eines Eintrags.
 * Änderte sie sich, sähe jeder Kalender nach dem Namenswechsel lauter neue
 * Ereignisse und die alten blieben als Duplikate stehen.
 */
export const ICS_UID_DOMAIN = "campmesser.ch";

/** Link, der in jeder Beschreibung steht. */
export const APP_PUBLIC_URL = "https://meinreisekompass.ch";

/** Maximale Zeilenlänge in Oktetten (RFC 5545). */
const MAX_LINE_OCTETS = 75;

/** Minimalform einer Reise für den Kalender-Export. */
export interface IcsTrip {
  /** Reise-Id – steckt in der stabilen UID */
  id: number;
  /** Titel des Ereignisses: Reisename, sonst Platzname */
  title: string;
  /** Anreise als ISO-Tag (YYYY-MM-DD) */
  startDate: string;
  /** Abreise als ISO-Tag (YYYY-MM-DD) – im Ereignis exklusiv gerechnet */
  endDate: string;
  /** Geplante Ankunftszeit «HH:MM» (#154); null = keine Angabe */
  arrivalTime?: string | null;
  /** Geplante Abreisezeit «HH:MM» (#154); null = keine Angabe */
  departureTime?: string | null;
  /** Name des Zeltplatzes bzw. Freitext-Ort für LOCATION */
  placeName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const PLANNED_WITH: L4 = l4(
  "Geplant mit ReiseKompass",
  "Prévu avec ReiseKompass",
  "Pianificato con ReiseKompass",
  "Planned with ReiseKompass"
);

const NIGHTS_LABEL: Record<Language, (n: number) => string> = {
  de: n => (n === 1 ? "1 Nacht" : `${n} Nächte`),
  fr: n => (n === 1 ? "1 nuit" : `${n} nuits`),
  it: n => (n === 1 ? "1 notte" : `${n} notti`),
  en: n => (n === 1 ? "1 night" : `${n} nights`),
};

/** Ersatzname, wenn eine Reise weder Titel noch Ort hat. */
const FALLBACK_TITLE: L4 = l4("Reise", "Séjour", "Viaggio", "Trip");

// ── Bausteine ─────────────────────────────────────────────────────────────

/**
 * Textwert für iCalendar maskieren. Reihenfolge zählt: erst der Backslash
 * selbst, sonst würden die gleich erzeugten Fluchtzeichen nochmals maskiert.
 * CRLF und einzelne Zeilenumbrüche werden beide zu «\n».
 */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\\n")
    .replace(/[\r\n]/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** UTF-8-Länge eines einzelnen Zeichens (Code Point) in Oktetten. */
function octetsOf(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/**
 * Lange Zeile nach RFC 5545 falten: höchstens 75 Oktette pro Zeile, jede
 * Folgezeile beginnt mit einem Leerzeichen (das zu den 75 zählt). Gezählt
 * wird in UTF-8-Oktetten, geschnitten aber nur zwischen ganzen Zeichen –
 * Umlaute und Emoji bleiben heil.
 */
export function foldIcsLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let used = 0;
  let limit = MAX_LINE_OCTETS;
  let i = 0;
  while (i < line.length) {
    const codePoint = line.codePointAt(i);
    if (codePoint === undefined) break;
    const char = String.fromCodePoint(codePoint);
    const size = octetsOf(codePoint);
    if (used + size > limit && current !== "") {
      parts.push(current);
      current = "";
      used = 0;
      // Folgezeilen tragen ein führendes Leerzeichen, das mitzählt
      limit = MAX_LINE_OCTETS - 1;
    }
    current += char;
    used += size;
    i += char.length;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/**
 * Ist das ein ISO-Tag (YYYY-MM-DD) mit gültigem Datum? Der Rückweg über
 * toISOString entlarvt Tage, die es gar nicht gibt: «2026-02-30» rutscht beim
 * Parsen auf den 2. März und fällt so auf.
 */
function isIsoDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(ms)) return false;
  return new Date(ms).toISOString().slice(0, 10) === value;
}

/** ISO-Tag um Tage verschieben (UTC, damit keine Sommerzeit hineinredet). */
export function addDaysIso(iso: string, days: number): string {
  const base = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(base)) return iso;
  return new Date(base + days * 86400000).toISOString().slice(0, 10);
}

/** ISO-Tag als iCalendar-DATE: «2026-08-10» → «20260810». */
export function icsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** Zeitpunkt als UTC-DATE-TIME für DTSTAMP: «20260803T190000Z». */
export function icsUtcStamp(at: Date): string {
  const iso = new Date(at).toISOString();
  return `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}T${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
}

/** «HH:MM» prüfen – alles andere gilt als «keine Angabe». */
function parseHhMm(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? `${match[1]}${match[2]}00` : null;
}

/** ISO-Tag plus «HHMMSS» als schwebende Ortszeit: «20260810T140000». */
function icsLocalDateTime(iso: string, hhmmss: string): string {
  return `${icsDate(iso)}T${hhmmss}`;
}

/** Koordinate für die GEO-Eigenschaft; null bei fehlenden/unsinnigen Werten. */
function geoValue(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): string | null {
  if (typeof latitude !== "number" || typeof longitude !== "number")
    return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;
  return `${latitude.toFixed(6)};${longitude.toFixed(6)}`;
}

// ── Ereignis und Kalender ─────────────────────────────────────────────────

/**
 * Die Zeilen EINES VEVENT (ungefaltet). null, wenn die Daten unbrauchbar sind
 * (kaputtes Datum, Abreise vor Anreise) – eine solche Reise fällt einfach aus
 * der Datei, statt sie unlesbar zu machen.
 */
export function tripEventLines(
  trip: IcsTrip,
  options: { dtstamp: Date; lang?: Language }
): string[] | null {
  const lang = options.lang ?? "de";
  if (!isIsoDay(trip.startDate) || !isIsoDay(trip.endDate)) return null;
  if (trip.endDate < trip.startDate) return null;

  const place = trip.placeName?.trim() ?? "";
  const title = trip.title.trim() || place || pick(FALLBACK_TITLE, lang);

  const lines: string[] = ["BEGIN:VEVENT"];
  lines.push(`UID:trip-${trip.id}@${ICS_UID_DOMAIN}`);
  lines.push(`DTSTAMP:${icsUtcStamp(options.dtstamp)}`);
  lines.push(`SUMMARY:${escapeIcsText(title)}`);

  // Zeitgenau nur, wenn beide Zeiten gesetzt sind UND das Ende nach dem
  // Beginn liegt; sonst bleibt es beim ganztägigen Ereignis.
  const arrival = parseHhMm(trip.arrivalTime);
  const departure = parseHhMm(trip.departureTime);
  const start = arrival ? icsLocalDateTime(trip.startDate, arrival) : null;
  const end = departure ? icsLocalDateTime(trip.endDate, departure) : null;
  if (start !== null && end !== null && end > start) {
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
  } else {
    // DTEND ist exklusiv: Abreisetag + 1
    lines.push(`DTSTART;VALUE=DATE:${icsDate(trip.startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDate(addDaysIso(trip.endDate, 1))}`);
  }

  if (place) lines.push(`LOCATION:${escapeIcsText(place)}`);
  const geo = geoValue(trip.latitude, trip.longitude);
  if (geo !== null) lines.push(`GEO:${geo}`);

  const nights = tripNights(trip.startDate, trip.endDate);
  const descriptionParts = [
    ...(nights > 0 ? [NIGHTS_LABEL[lang](nights)] : []),
    pick(PLANNED_WITH, lang),
  ];
  lines.push(
    `DESCRIPTION:${escapeIcsText(`${descriptionParts.join(" · ")}\n${APP_PUBLIC_URL}`)}`
  );
  lines.push(`URL:${APP_PUBLIC_URL}`);
  lines.push("END:VEVENT");
  return lines;
}

/**
 * Vollständige .ics-Datei mit einem VEVENT je Reise. Der Zeitstempel kommt von
 * aussen (kein Date.now hier drin), die Sprache steuert nur die Beschreibung.
 * Eine Datei ohne brauchbare Reise ist trotzdem ein gültiger, leerer Kalender.
 */
export function buildTripIcs(
  trips: IcsTrip[],
  options: { dtstamp: Date; lang?: Language }
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ReiseKompass//Reisen//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const trip of trips) {
    const event = tripEventLines(trip, options);
    if (event !== null) lines.push(...event);
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

/**
 * Dateiname für den Download: Sonderzeichen raus, Anreisedatum davor –
 * gleiches Muster wie beim GPX-Export der Wanderungen.
 */
export function icsFileName(
  name: string,
  isoDate: string,
  fallback = "reise"
): string {
  const slug =
    name
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || fallback;
  const date = isIsoDay(isoDate) ? isoDate : "0000-00-00";
  return `${date}-${slug}.ics`;
}

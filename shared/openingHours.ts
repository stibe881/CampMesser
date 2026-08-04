/**
 * Öffnungszeiten aus OpenStreetMap auswerten (#273).
 *
 * WICHTIG ZUR EHRLICHKEIT: Das `opening_hours`-Format von OSM ist eine
 * eigene kleine Sprache – mit Feiertagen, Monaten, Schulferien,
 * Sonnenauf- und -untergang, «Mo-Fr 08:00-12:00,13:30-18:30 open
 * "Mittag geschlossen"». Dieses Modul versteht davon bewusst nur den
 * HÄUFIGEN, EINFACHEN Teil: Wochentage, Uhrzeiten, «24/7» und «off».
 *
 * Alles andere gibt `null` – also «weiss ich nicht» – statt zu raten. Ein
 * falsches «jetzt offen» schickt jemanden mit dem Velo zehn Kilometer weit
 * vor eine geschlossene Tür; ein «Zeiten prüfen» kostet einen Blick auf
 * die Rohangabe, die die Ansicht daneben zeigt.
 */

/** Wochentage in der Reihenfolge, die OSM verwendet (Mo = 0). */
const DAYS = ["mo", "tu", "we", "th", "fr", "sa", "su"];

/** Ein Zeitfenster in Minuten seit Mitternacht. */
export interface TimeSpan {
  from: number;
  to: number;
}

export interface OpeningRule {
  /** Betroffene Wochentage als Index 0–6 (Mo–So). */
  days: number[];
  /** Zeitfenster; leer bedeutet «an diesen Tagen geschlossen». */
  spans: TimeSpan[];
}

/** «HH:MM» in Minuten seit Mitternacht; null bei Unsinn. */
function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Tagesangabe («Mo-Fr», «Sa,Su») in Indizes; null bei Unbekanntem. */
function parseDays(value: string): number[] | null {
  const days: number[] = [];
  for (const part of value.split(",")) {
    const range = part.trim().toLowerCase();
    if (range.length === 0) return null;
    const dash = range.split("-");
    if (dash.length === 1) {
      const index = DAYS.indexOf(dash[0]);
      if (index === -1) return null;
      days.push(index);
    } else if (dash.length === 2) {
      const from = DAYS.indexOf(dash[0].trim());
      const to = DAYS.indexOf(dash[1].trim());
      if (from === -1 || to === -1) return null;
      // Über den Sonntag hinaus («Sa-Mo») ist erlaubt und wird umgebrochen
      for (let i = 0; i <= (to - from + 7) % 7; i++) {
        days.push((from + i) % 7);
      }
    } else {
      return null;
    }
  }
  return days;
}

/** Zeitfenster-Liste («08:00-12:00,13:30-18:30»); null bei Unbekanntem. */
function parseSpans(value: string): TimeSpan[] | null {
  const spans: TimeSpan[] = [];
  for (const part of value.split(",")) {
    const range = part.trim();
    const dash = range.split("-");
    if (dash.length !== 2) return null;
    const from = parseTime(dash[0]);
    const to = parseTime(dash[1]);
    if (from === null || to === null) return null;
    spans.push({ from, to });
  }
  return spans;
}

/**
 * Eine Angabe in Regeln übersetzen. `null` heisst: Diese Angabe enthält
 * etwas, das dieses Modul NICHT versteht – dann wird auch nichts behauptet.
 */
export function parseOpeningHours(spec: string): OpeningRule[] | null {
  const text = spec.trim();
  if (text.length === 0) return null;
  // Anführungszeichen bedeuten einen Kommentar – dann steckt mehr drin,
  // als wir sicher deuten können
  if (text.includes('"')) return null;
  if (text.toLowerCase() === "24/7") {
    return [{ days: [0, 1, 2, 3, 4, 5, 6], spans: [{ from: 0, to: 1440 }] }];
  }

  const rules: OpeningRule[] = [];
  for (const raw of text.split(";")) {
    const rule = raw.trim();
    if (rule.length === 0) continue;
    // Ein Doppelpunkt, ein Plus oder eine Jahreszahl deuten auf
    // Monate, Wochen oder Sonnenstände – nicht unser Fall
    if (
      /\+|\bph\b|\bsh\b|sunrise|sunset|week|\d{4}|,\s*(off|closed)/i.test(rule)
    ) {
      return null;
    }
    const match = /^([A-Za-z,\- ]+?)\s+(.+)$/.exec(rule);
    if (!match) {
      // Nur Zeiten ohne Tagesangabe gelten für jeden Tag
      const spans = parseSpans(rule);
      if (!spans) return null;
      rules.push({ days: [0, 1, 2, 3, 4, 5, 6], spans });
      continue;
    }
    const days = parseDays(match[1]);
    if (!days) return null;
    const rest = match[2].trim().toLowerCase();
    if (rest === "off" || rest === "closed") {
      rules.push({ days, spans: [] });
      continue;
    }
    const spans = parseSpans(match[2]);
    if (!spans) return null;
    rules.push({ days, spans });
  }
  return rules.length > 0 ? rules : null;
}

/** Wochentag-Index (Mo = 0) eines Datums. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Ist zum Zeitpunkt `date` offen? `null` heisst «unbekannt» – entweder
 * fehlt die Angabe oder sie ist komplexer, als dieses Modul deuten kann.
 *
 * Spätere Regeln überschreiben frühere, so wie es die OSM-Spezifikation
 * vorsieht: «Mo-Sa 08:00-18:00; We 08:00-12:00» heisst mittwochs nur
 * vormittags, nicht beides.
 */
export function isOpenAt(spec: string | undefined, date: Date): boolean | null {
  if (!spec) return null;
  const rules = parseOpeningHours(spec);
  if (!rules) return null;
  const day = weekdayIndex(date);
  const minutes = date.getHours() * 60 + date.getMinutes();
  let result: boolean | null = null;
  for (const rule of rules) {
    if (!rule.days.includes(day)) continue;
    result = rule.spans.some(span => minutes >= span.from && minutes < span.to);
  }
  return result;
}

/**
 * Die Zeiten des angefragten Wochentags als Text («08:00–12:00, 13:30–18:30»)
 * oder null, wenn die Angabe nicht deutbar ist. Geschlossene Tage geben
 * einen leeren String – das ist ein Ergebnis, kein Fehler.
 */
export function hoursForDay(
  spec: string | undefined,
  date: Date
): string | null {
  if (!spec) return null;
  const rules = parseOpeningHours(spec);
  if (!rules) return null;
  const day = weekdayIndex(date);
  let spans: TimeSpan[] | null = null;
  for (const rule of rules) {
    if (rule.days.includes(day)) spans = rule.spans;
  }
  if (spans === null) return "";
  return spans
    .map(span => `${formatMinutes(span.from)}–${formatMinutes(span.to)}`)
    .join(", ");
}

/** Minuten seit Mitternacht als «HH:MM». */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

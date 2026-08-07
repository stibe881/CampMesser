/**
 * «Wohin am Wochenende?» – die Favoriten nach der Prognose ordnen (#383).
 *
 * WAS FEHLTE: Es gibt Zeltplatz-Favoriten, und für jeden einzelnen gibt
 * es eine Prognose. Wer wissen will, wo am Samstag die Sonne scheint,
 * muss zwölf Dossiers nacheinander aufmachen und sich die Zahlen merken.
 * Genau das tut niemand – man fährt dorthin, wo man immer hinfährt, und
 * steht dann im Regen, während es zwanzig Kilometer weiter trocken ist.
 *
 * #68 vergleicht die MONATE eines Platzes (Klima), #169 sammelt nur
 * WARNUNGEN. Die Frage «wohin fahren wir am Wochenende» hat bisher
 * nichts beantwortet.
 *
 * DREI TEILNOTEN STATT EINER ZAHL AUS DEM NICHTS. Wer eine Rangliste
 * sieht, will wissen, WARUM etwas oben steht – sonst glaubt er ihr nicht
 * und rechnet doch selbst nach. Deshalb bleiben Trockenheit, Wärme und
 * Wind einzeln sichtbar; die Gesamtnote ist nur ihre gewichtete Summe.
 *
 * DIE GEWICHTE: Regen entscheidet, OB man fährt (55 %). Die Temperatur
 * entscheidet, ob es angenehm wird (30 %). Wind ist selten das Thema,
 * kann aber ein Wochenende ruinieren (15 %) – ein Vorzelt bei 70 km/h
 * ist kein Vorzelt mehr.
 *
 * DIE FAHRZEIT WIRD NICHT EINGERECHNET. Sie steht daneben, und man kann
 * danach sortieren. Stunden und Grad in eine Zahl zu mischen hiesse, für
 * jemanden zu entscheiden, wie viel ihm eine Stunde Fahrt wert ist – das
 * weiss nur er selbst.
 *
 * ALLES HIER IST EINE PROGNOSE und keine Zusage. Über fünf Tage hinaus
 * ist die Reihenfolge eine Tendenz; das gehört in die Anzeige und nicht
 * nur in diesen Kommentar.
 */

/** Ein Prognosetag, so weit er hier zählt. */
export interface PickDay {
  /** ISO-Datum «2026-08-08». */
  date: string;
  tempMaxC: number;
  tempMinC: number;
  /** Regenwahrscheinlichkeit in Prozent (0–100). */
  precipProbability: number;
  /** Niederschlagsmenge des Tages in Millimetern. */
  precipitationMm: number;
  /** Höchste Windgeschwindigkeit des Tages in km/h. */
  windMaxKmh: number;
}

/** Die drei Teilnoten und ihre Summe, alle 0–100. */
export interface PickScore {
  dry: number;
  warmth: number;
  wind: number;
  total: number;
}

/** Gewichte der Teilnoten – Summe 1. */
export const PICK_WEIGHTS = { dry: 0.55, warmth: 0.3, wind: 0.15 } as const;

/**
 * Wohlfühlbereich der Tageshöchsttemperatur.
 *
 * 22–26 °C: warm genug für draussen, kühl genug fürs Zelt. Darüber wird
 * das Zelt am Nachmittag zum Backofen, darunter sitzt man in der Jacke.
 */
export const COMFORT_MIN_C = 22;
export const COMFORT_MAX_C = 26;
/** Ab hier wird die Nacht ungemütlich. */
export const COLD_NIGHT_C = 8;
/** Bis hierhin ist Wind Belüftung und kein Problem. */
export const CALM_WIND_KMH = 20;

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Trockenheit: Wahrscheinlichkeit UND Menge.
 *
 * Beide braucht es. 60 % mit einem halben Millimeter ist ein Schauer,
 * bei dem man kurz unters Vordach sitzt; 60 % mit 15 mm ist ein
 * verlorener Tag. Wer nur die Wahrscheinlichkeit anschaut, hält beides
 * für dasselbe.
 */
export function dryScore(day: PickDay): number {
  const fromProbability = clamp100(day.precipProbability) * 0.6;
  const fromAmount = Math.min(40, Math.max(0, day.precipitationMm) * 4);
  return clamp100(100 - fromProbability - fromAmount);
}

/**
 * Wärme: Abstand zum Wohlfühlbereich, plus Abzug für kalte Nächte.
 *
 * Zu kalt zieht stärker als zu warm (5 statt 4 pro Grad): Gegen Hitze
 * hilft Schatten und ein See, gegen 12 °C und Nieselregen hilft nur die
 * Heimfahrt.
 */
export function warmthScore(day: PickDay): number {
  let score = 100;
  if (day.tempMaxC < COMFORT_MIN_C) score -= (COMFORT_MIN_C - day.tempMaxC) * 5;
  else if (day.tempMaxC > COMFORT_MAX_C)
    score -= (day.tempMaxC - COMFORT_MAX_C) * 4;
  if (day.tempMinC < COLD_NIGHT_C) score -= (COLD_NIGHT_C - day.tempMinC) * 3;
  return clamp100(score);
}

/** Wind: bis 20 km/h keine Abzüge, danach 3 Punkte je km/h. */
export function windScore(day: PickDay): number {
  return clamp100(100 - Math.max(0, day.windMaxKmh - CALM_WIND_KMH) * 3);
}

/**
 * Die Note eines Zeitraums: Mittel der Tage.
 *
 * MITTEL UND NICHT DER SCHLECHTESTE TAG: Ein verregneter Sonntag macht
 * einen sonnigen Samstag nicht wertlos – man fährt einfach früher heim.
 * Ohne Tage gibt es keine Note (null), keine 0: «keine Daten» und
 * «schlecht» sind zweierlei.
 */
export function scoreDays(days: readonly PickDay[]): PickScore | null {
  if (days.length === 0) return null;
  const mean = (fn: (day: PickDay) => number) =>
    days.reduce((sum, day) => sum + fn(day), 0) / days.length;
  const dry = mean(dryScore);
  const warmth = mean(warmthScore);
  const wind = mean(windScore);
  return {
    dry: Math.round(dry),
    warmth: Math.round(warmth),
    wind: Math.round(wind),
    total: Math.round(
      dry * PICK_WEIGHTS.dry +
        warmth * PICK_WEIGHTS.warmth +
        wind * PICK_WEIGHTS.wind
    ),
  };
}

/** Ein Platz mit seiner Prognose, wie ihn die Rangliste bekommt. */
export interface PickCandidate<T> {
  spot: T;
  days: PickDay[];
  /** Fahrzeit von daheim in Sekunden; null = unbekannt oder kein Zuhause. */
  travelSeconds?: number | null;
}

export interface PickResult<T> {
  spot: T;
  score: PickScore | null;
  days: PickDay[];
  travelSeconds: number | null;
}

export type PickSort = "weather" | "travel";

/**
 * Rangliste bilden.
 *
 * Plätze OHNE Prognose fliegen nicht heraus, sondern rutschen ans Ende:
 * Ein Platz, den der Wetterdienst nicht kennt, verschwindet sonst
 * kommentarlos aus der eigenen Liste – und man sucht ihn.
 *
 * Bei «travel» landet ebenso hinten, wer keine Fahrzeit hat. Gleichstand
 * wird über den Namen aufgelöst, damit die Reihenfolge zwischen zwei
 * Aufrufen stabil bleibt.
 */
export function rankSpots<T extends { name: string }>(
  candidates: readonly PickCandidate<T>[],
  sort: PickSort = "weather"
): PickResult<T>[] {
  const results: PickResult<T>[] = candidates.map(entry => ({
    spot: entry.spot,
    score: scoreDays(entry.days),
    days: entry.days,
    travelSeconds: entry.travelSeconds ?? null,
  }));
  return results.sort((a, b) => {
    if (sort === "travel") {
      const at = a.travelSeconds;
      const bt = b.travelSeconds;
      if (at === null && bt === null)
        return a.spot.name.localeCompare(b.spot.name, "de");
      if (at === null) return 1;
      if (bt === null) return -1;
      if (at !== bt) return at - bt;
      return a.spot.name.localeCompare(b.spot.name, "de");
    }
    const as = a.score?.total ?? null;
    const bs = b.score?.total ?? null;
    if (as === null && bs === null)
      return a.spot.name.localeCompare(b.spot.name, "de");
    if (as === null) return 1;
    if (bs === null) return -1;
    if (as !== bs) return bs - as;
    return a.spot.name.localeCompare(b.spot.name, "de");
  });
}

/**
 * Das nächste Wochenende ab einem Tag: Samstag und Sonntag.
 *
 * AM SAMSTAG UND SONNTAG SELBST ist das laufende Wochenende gemeint und
 * nicht das übernächste – wer am Samstagmorgen fragt, will heute weg.
 * Gerechnet wird auf ISO-Datumsstrings ohne Zeitzonen-Umweg (#333).
 */
export function nextWeekend(todayIso: string): { from: string; to: string } {
  const [y, m, d] = todayIso.split("-").map(Number);
  const base = new Date(y, (m ?? 1) - 1, d ?? 1);
  const weekday = base.getDay(); // 0 = Sonntag
  // Sonntag: das Wochenende hat gestern begonnen.
  const toSaturday = weekday === 0 ? -1 : 6 - weekday;
  const saturday = new Date(y, (m ?? 1) - 1, (d ?? 1) + toSaturday);
  const sunday = new Date(y, (m ?? 1) - 1, (d ?? 1) + toSaturday + 1);
  return { from: isoOf(saturday), to: isoOf(sunday) };
}

function isoOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Tage auf einen Zeitraum eingrenzen (beide Grenzen einschliesslich). */
export function daysInRange(
  days: readonly PickDay[],
  from: string,
  to: string
): PickDay[] {
  return days.filter(day => day.date >= from && day.date <= to);
}

/** Fahrzeit als «1 h 20» bzw. «45 min»; null bleibt null. */
export function formatTravel(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds)) return null;
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Beste Abfahrtszeit (#285): aus der Check-in-Zeit rückwärts rechnen.
 *
 * WARUM: Die Rechnung selbst ist einfach – die Frage ist, welche Zahlen
 * man einsetzt. Wer «zwei Stunden Fahrt» sagt, meint die reine Fahrzeit
 * und vergisst zwei Pausen, das Tanken und den Stau vor dem Tunnel. Genau
 * deshalb kommt man zu spät an und steht vor einer geschlossenen
 * Rezeption.
 *
 * PAUSEN sind der Kern. Mit Kleinkindern hält man alle anderthalb Stunden
 * an, und zwar nicht fünf Minuten. Diese Pausen sind keine Störung des
 * Plans, sie SIND der Plan – wer sie nicht einrechnet, plant eine Fahrt,
 * die es so nicht gibt.
 *
 * FAHRZEIT: Gerechnet wird mit der Luftlinie und einem Schnitt von
 * 70 km/h. Die Strasse ist kurviger als die Luftlinie, dafür fährt man
 * auf der Autobahn schneller als 70 – die beiden Fehler heben sich
 * grob auf. Ein Routenplaner ist das nicht, und die Ansicht sagt das.
 */

/** Pausen-Muster. Der Unterschied zwischen «Erwachsene» und
 * «Kleinkinder» ist am Ende eine ganze Stunde. */
export const BREAK_PROFILES = {
  keine: { everyMinutes: 0, breakMinutes: 0 },
  erwachsene: { everyMinutes: 180, breakMinutes: 15 },
  kinder: { everyMinutes: 120, breakMinutes: 25 },
  kleinkinder: { everyMinutes: 90, breakMinutes: 30 },
} as const;

export type BreakProfile = keyof typeof BREAK_PROFILES;

/** Durchschnitts-Tempo über die Luftlinie in km/h. */
export const DRIVE_SPEED_KMH = 70;

/**
 * Zeitpuffer in Minuten. Vor der Schranke stehen, das Zelt aufstellen,
 * einen Znüni suchen – dreissig Minuten sind kein Luxus, sondern der
 * Unterschied zwischen «angekommen» und «gehetzt».
 */
export const DEFAULT_BUFFER_MINUTES = 30;

/** Reine Fahrzeit in Minuten aus der Luftlinie. */
export function driveMinutes(
  distanceKm: number,
  speedKmh = DRIVE_SPEED_KMH
): number {
  if (!(distanceKm > 0) || !(speedKmh > 0)) return 0;
  return Math.round((distanceKm / speedKmh) * 60);
}

/**
 * Anzahl Pausen auf einer Fahrt. Nach der LETZTEN Etappe wird nicht mehr
 * angehalten – wer nach zwei Stunden ankommt, macht keine Pause mehr
 * fünf Minuten vor dem Ziel. Deshalb `ceil(x) - 1` und nicht `floor(x)`.
 */
export function breakCount(minutes: number, profile: BreakProfile): number {
  const { everyMinutes } = BREAK_PROFILES[profile];
  if (everyMinutes <= 0 || minutes <= everyMinutes) return 0;
  return Math.ceil(minutes / everyMinutes) - 1;
}

/** Gesamte Pausenzeit in Minuten. */
export function breakMinutes(minutes: number, profile: BreakProfile): number {
  return breakCount(minutes, profile) * BREAK_PROFILES[profile].breakMinutes;
}

export interface DeparturePlan {
  /** Reine Fahrzeit. */
  driveMinutes: number;
  /** Anzahl Pausen und deren Gesamtdauer. */
  breaks: number;
  breakMinutes: number;
  /** Puffer für Schranke, Anmeldung, Verspätung. */
  bufferMinutes: number;
  /** Alles zusammen – so lange dauert die Reise wirklich. */
  totalMinutes: number;
  /** Empfohlene Abfahrt als «HH:MM». */
  departureTime: string;
  /**
   * Tage VOR dem Zieltag: 0 = am selben Tag, 1 = am Vortag. Bei langen
   * Fahrten mit früher Ankunft liegt die Abfahrt sonst «gestern», und das
   * muss dastehen, statt als 23:30 kommentarlos in die Nacht zu rutschen.
   */
  daysEarlier: number;
}

/** «HH:MM» in Minuten seit Mitternacht; ungültige Zeiten ergeben null. */
export function parseTime(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minuten seit Mitternacht als «HH:MM». */
export function formatTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Rückwärts rechnen: Wann muss man los, um zur Zielzeit da zu sein?
 *
 * Liefert null, wenn die Zielzeit unbrauchbar ist – lieber nichts sagen
 * als eine Abfahrtszeit erfinden.
 */
export function departurePlan(input: {
  /** Luftlinie in Kilometern. */
  distanceKm: number;
  /** Gewünschte Ankunft als «HH:MM» (z. B. die Check-in-Zeit). */
  arrivalTime: string;
  profile: BreakProfile;
  bufferMinutes?: number;
  speedKmh?: number;
}): DeparturePlan | null {
  const arrival = parseTime(input.arrivalTime);
  if (arrival === null) return null;
  const drive = driveMinutes(input.distanceKm, input.speedKmh);
  const breaks = breakCount(drive, input.profile);
  const pause = breakMinutes(drive, input.profile);
  const buffer = Math.max(
    0,
    Math.round(input.bufferMinutes ?? DEFAULT_BUFFER_MINUTES)
  );
  const totalMinutes = drive + pause + buffer;
  const rawDeparture = arrival - totalMinutes;
  return {
    driveMinutes: drive,
    breaks,
    breakMinutes: pause,
    bufferMinutes: buffer,
    totalMinutes,
    departureTime: formatTime(rawDeparture),
    daysEarlier: rawDeparture < 0 ? Math.ceil(-rawDeparture / 1440) : 0,
  };
}

/**
 * Vorwärts rechnen: Wann ist man da, wenn man um `departureTime` losfährt?
 * Gegenstück für die Rückreise – dieselben Pausen, dieselbe Fahrzeit.
 */
export function arrivalPlan(input: {
  distanceKm: number;
  departureTime: string;
  profile: BreakProfile;
  bufferMinutes?: number;
  speedKmh?: number;
}): (DeparturePlan & { arrivalTime: string; daysLater: number }) | null {
  const departure = parseTime(input.departureTime);
  if (departure === null) return null;
  const drive = driveMinutes(input.distanceKm, input.speedKmh);
  const breaks = breakCount(drive, input.profile);
  const pause = breakMinutes(drive, input.profile);
  const buffer = Math.max(
    0,
    Math.round(input.bufferMinutes ?? DEFAULT_BUFFER_MINUTES)
  );
  const totalMinutes = drive + pause + buffer;
  const rawArrival = departure + totalMinutes;
  return {
    driveMinutes: drive,
    breaks,
    breakMinutes: pause,
    bufferMinutes: buffer,
    totalMinutes,
    departureTime: formatTime(departure),
    daysEarlier: 0,
    arrivalTime: formatTime(rawArrival),
    daysLater: Math.floor(rawArrival / 1440),
  };
}

/**
 * Wo liegen die Pausen? Für jede Pause der Zeitpunkt, zu dem man anhält –
 * gerechnet ab der Abfahrt, inklusive der vorangegangenen Pausen.
 * «Halbzeit-Pause um 14:20» ist brauchbarer als «zwei Pausen».
 */
export function breakSchedule(
  departureTime: string,
  driveTotalMinutes: number,
  profile: BreakProfile
): string[] {
  const start = parseTime(departureTime);
  if (start === null) return [];
  const { everyMinutes, breakMinutes: pause } = BREAK_PROFILES[profile];
  const count = breakCount(driveTotalMinutes, profile);
  const stops: string[] = [];
  for (let i = 1; i <= count; i++) {
    // i Etappen gefahren, i-1 Pausen bereits gemacht
    stops.push(formatTime(start + i * everyMinutes + (i - 1) * pause));
  }
  return stops;
}

/**
 * Umkehrzeit auf der Wanderung (#379).
 *
 * DIE FRAGE, DIE MAN UNTERWEGS WIRKLICH HAT, lautet nicht «wie lange
 * dauert die Tour» – das steht auf jedem Wegweiser. Sie lautet: «Wenn
 * ich bis wann nicht oben bin, muss ich umkehren, um im Hellen
 * zurückzukommen.» Die App kennt beide Hälften der Antwort seit
 * längerem – den Sonnenuntergang (#144) und die Gehzeit nach SAC (#281)
 * –, hat sie aber nie zusammengebracht.
 *
 * ZWEI FÄLLE, und sie rechnen verschieden:
 *
 *   Hin und zurück («out-and-back»): Der Rückweg dauert ungefähr so
 *     lange wie der Hinweg. Von der verbleibenden Zeit gehört die Hälfte
 *     dem Rückweg – die Umkehrzeit liegt also in der Mitte.
 *
 *   Rundweg: Umkehren hilft nicht mehr, sobald man über die Hälfte ist.
 *     Hier ist die nützliche Zahl der SPÄTESTE START: Sonnenuntergang
 *     minus Reserve minus Gehzeit der ganzen Runde.
 *
 * DIE RESERVE IST KEINE HÖFLICHKEIT. In den Bergen wird es unten im Tal
 * dunkel, lange bevor die Sonne rechnerisch untergeht; dazu kommen
 * Pausen, ein Umweg, ein Kind, das nicht mehr mag. `DEFAULT_BUFFER_MIN`
 * ist deshalb grosszügig und nicht knapp – wer sie kürzt, tut das
 * bewusst.
 *
 * ABSICHTLICH KEINE WARNUNG BEI «SCHON ZU SPÄT»: Die Funktion sagt, was
 * gilt, und überlässt der Seite, wie deutlich sie es sagt. Ein
 * Rechenkern, der Text erzeugt, lässt sich nicht übersetzen.
 *
 * Reine Funktionen, ohne Uhr: Jeder Zeitpunkt kommt als Minute seit
 * Mitternacht von aussen. Sonst wäre der einzige Weg zu prüfen, ob die
 * Rechnung stimmt, das Warten auf den Abend.
 */

/** Vorgeschlagene Reserve vor Sonnenuntergang, in Minuten. */
export const DEFAULT_BUFFER_MIN = 45;
/** Kleinste erlaubte Reserve – darunter ist es keine Reserve mehr. */
export const MIN_BUFFER_MIN = 0;
/** Grösste sinnvolle Reserve (drei Stunden). */
export const MAX_BUFFER_MIN = 180;

/** Wegform: hin und zurück derselbe Weg, oder eine Runde. */
export type RouteShape = "outAndBack" | "loop";

export interface TurnaroundInput {
  /** Jetzt, als Minuten seit Mitternacht. */
  nowMinutes: number;
  /** Sonnenuntergang, als Minuten seit Mitternacht (null = unbekannt). */
  sunsetMinutes: number | null;
  /** Reserve vor Sonnenuntergang in Minuten. */
  bufferMinutes?: number;
  /** Gehzeit der GANZEN geplanten Tour in Minuten (für den Rundweg). */
  totalMinutes: number;
  shape: RouteShape;
}

export interface TurnaroundResult {
  /**
   * Späteste Umkehr, als Minuten seit Mitternacht – nur bei «hin und
   * zurück». Beim Rundweg null, weil Umkehren dort nichts spart.
   */
  turnaroundMinutes: number | null;
  /**
   * Spätester Start für die ganze Tour, als Minuten seit Mitternacht.
   * Auch beim Hin-und-Zurück nützlich: «wenn du jetzt losgehst, reicht
   * es noch».
   */
  latestStartMinutes: number | null;
  /** Verbleibende Zeit bis zur Umkehr bzw. bis zum Ende des Fensters. */
  minutesLeft: number | null;
  /** Reicht die Zeit für die geplante Tour überhaupt noch? */
  fits: boolean;
  /** Ist die Umkehrzeit schon vorbei? */
  overdue: boolean;
}

/** Reserve auf den erlaubten Bereich bringen. */
export function cleanBuffer(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_BUFFER_MIN;
  }
  return Math.min(MAX_BUFFER_MIN, Math.max(MIN_BUFFER_MIN, Math.round(value)));
}

/**
 * Die Rechnung.
 *
 * Ohne Sonnenuntergang (Polarsommer, kaputte Koordinate) kommt überall
 * null zurück und `fits` bleibt true: Eine erfundene Umkehrzeit wäre
 * schlimmer als keine.
 */
export function turnaroundTime(input: TurnaroundInput): TurnaroundResult {
  const buffer = cleanBuffer(input.bufferMinutes);
  const total = Math.max(0, Math.round(input.totalMinutes));
  if (input.sunsetMinutes === null) {
    return {
      turnaroundMinutes: null,
      latestStartMinutes: null,
      minutesLeft: null,
      fits: true,
      overdue: false,
    };
  }
  /** Bis hierher muss man zurück sein. */
  const deadline = input.sunsetMinutes - buffer;
  const available = deadline - input.nowMinutes;
  const latestStart = deadline - total;

  if (input.shape === "loop") {
    // Auf der Runde gibt es keine Umkehr, die Zeit spart – die einzige
    // ehrliche Zahl ist, ob es für die ganze Runde noch reicht.
    return {
      turnaroundMinutes: null,
      latestStartMinutes: latestStart,
      minutesLeft: available,
      fits: available >= total,
      overdue: available < 0,
    };
  }

  // Hin und zurück: Die Hälfte der verbleibenden Zeit gehört dem
  // Rückweg. Aufgerundet wird NICHT – lieber fünf Minuten zu früh
  // umkehren als fünf zu spät.
  const turnaround = input.nowMinutes + Math.floor(available / 2);
  return {
    turnaroundMinutes: turnaround,
    latestStartMinutes: latestStart,
    minutesLeft: turnaround - input.nowMinutes,
    fits: available >= total,
    overdue: available <= 0,
  };
}

/** Minuten seit Mitternacht als «HH:MM». */
export function formatMinutes(minutes: number): string {
  // Über Mitternacht hinaus soll nicht «25:10» stehen.
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const rest = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** Dauer in Minuten als «2 h 10 min» bzw. «40 min». */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

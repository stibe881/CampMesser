/**
 * Trockenzeiten-Berechnung für Wäsche und Camping-Ausrüstung.
 *
 * Modell: vereinfachte Verdunstungsformel. Die Basis-Trockenzeit eines Materials
 * (bei 20 °C, 60 % Luftfeuchte, leichtem Wind) wird mit Faktoren für
 * Temperatur, Luftfeuchtigkeit und Wind skaliert – gut genug für eine
 * praxisnahe Camp-Empfehlung («bis Sonnenuntergang trocken?»).
 */

export interface DryingItem {
  id: string;
  label: string;
  /** Basis-Trockenzeit in Stunden bei Referenzbedingungen (20 °C, 60 % rF, 5 km/h Wind) */
  baseHours: number;
  note: string;
}

export const DRYING_ITEMS: DryingItem[] = [
  { id: "handtuch-duenn", label: "Reisehandtuch (Mikrofaser)", baseHours: 1.5, note: "Trocknet am schnellsten von allen." },
  { id: "handtuch", label: "Frottee-Handtuch", baseHours: 4, note: "Dicke Schlaufen speichern viel Wasser." },
  { id: "tshirt", label: "T-Shirt / Funktionsshirt", baseHours: 2, note: "Synthetik trocknet deutlich schneller als Baumwolle." },
  { id: "jeans", label: "Jeans / dicke Hose", baseHours: 6, note: "Baumwolle hält Wasser hartnäckig fest." },
  { id: "socken", label: "Socken (Wolle/Synthetik)", baseHours: 3, note: "Auf die Leine, nicht auf den Boden legen." },
  { id: "zelt-aussen", label: "Zelt-Aussenhaut", baseHours: 1.5, note: "Aufgespannt trocknen lassen, nicht zusammengelegt." },
  { id: "zelt-boden", label: "Zeltboden / Footprint", baseHours: 2.5, note: "Über die Leine hängen, beide Seiten trocknen lassen." },
  { id: "schlafsack-synthetik", label: "Schlafsack (Kunstfaser)", baseHours: 5, note: "Offen und flach über zwei Leinen legen." },
  { id: "schlafsack-daune", label: "Schlafsack (Daune)", baseHours: 10, note: "Daune trocknet sehr langsam – unbedingt Sonne nutzen." },
  { id: "regenjacke", label: "Regenjacke", baseHours: 1, note: "Abtropfen lassen genügt meist." },
  { id: "badehose", label: "Badesachen", baseHours: 2, note: "Nach dem Schwimmen gut auswringen." },
];

export interface DryingConditions {
  /** Lufttemperatur in °C */
  temperature: number;
  /** Relative Luftfeuchtigkeit in % */
  humidity: number;
  /** Windgeschwindigkeit in km/h */
  windSpeed: number;
}

export interface DryingResult {
  /** Geschätzte Trockenzeit in Stunden */
  hours: number;
  /** Multiplikator gegenüber Referenzbedingungen */
  factor: number;
}

/**
 * Geschätzte Trockenzeit unter gegebenen Bedingungen.
 * Referenz: 20 °C, 60 % rF, 5 km/h Wind → Faktor 1.
 */
export function estimateDryingTime(baseHours: number, cond: DryingConditions): DryingResult {
  // Temperatur: pro 10 °C wärmer halbiert sich die Zeit grob (Sättigungsdampfdruck)
  const tempFactor = Math.pow(2, (20 - cond.temperature) / 10);
  // Luftfeuchte: Trocknungsantrieb ~ (100 - rF); Referenz 60 % → Antrieb 40
  const humidityDrive = Math.max(5, 100 - cond.humidity);
  const humidityFactor = 40 / humidityDrive;
  // Wind: verdoppelt die Verdunstung bei kräftigem Wind; Referenz 5 km/h
  const windFactor = 1 / Math.min(2.2, Math.max(0.55, 0.75 + Math.sqrt(Math.max(0, cond.windSpeed)) / 6));
  const factor = tempFactor * humidityFactor * windFactor;
  const hours = baseHours * factor;
  return { hours: Math.round(hours * 10) / 10, factor: Math.round(factor * 100) / 100 };
}

export interface SunsetVerdict {
  driesBeforeSunset: boolean;
  /** Verbleibende Stunden bis Sonnenuntergang */
  hoursUntilSunset: number;
  /** Klartext-Empfehlung */
  recommendation: string;
}

/** Empfehlung, ob das Teil bis Sonnenuntergang trocken wird oder reingeholt werden muss. */
export function sunsetVerdict(dryingHours: number, now: Date, sunset: Date): SunsetVerdict {
  const hoursUntilSunset = Math.max(0, (sunset.getTime() - now.getTime()) / 3600000);
  const rounded = Math.round(hoursUntilSunset * 10) / 10;
  if (hoursUntilSunset <= 0) {
    return {
      driesBeforeSunset: false,
      hoursUntilSunset: 0,
      recommendation:
        "Die Sonne ist bereits untergegangen – häng die Sachen ins Zelt oder unters Vordach, draussen werden sie durch den Tau wieder feucht.",
    };
  }
  // 30 Minuten Sicherheitsreserve vor Sonnenuntergang (Abendtau setzt früher ein)
  if (dryingHours <= hoursUntilSunset - 0.5) {
    return {
      driesBeforeSunset: true,
      hoursUntilSunset: rounded,
      recommendation: `Wird rechtzeitig trocken – noch ${formatHours(rounded)} bis Sonnenuntergang. Trotzdem vor der Dämmerung abnehmen.`,
    };
  }
  return {
    driesBeforeSunset: false,
    hoursUntilSunset: rounded,
    recommendation: `Wird bis Sonnenuntergang NICHT trocken (braucht ${formatHours(dryingHours)}, verbleibend ${formatHours(rounded)}). Vor dem Abendtau ins Zelt oder Auto holen und morgen weitertrocknen.`,
  };
}

export function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} Min.`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins === 0 ? `${whole} Std.` : `${whole} Std. ${mins} Min.`;
}

export interface HourlyConditions extends DryingConditions {
  /** Startzeit der Stunde */
  time: Date;
}

export interface ForecastDryingResult {
  /** Geschätzte Trockenzeit in Stunden (mit Prognose-Verlauf) */
  hours: number;
  /** Zeitpunkt, an dem das Teil trocken ist – null, wenn es innerhalb des Verlaufs nicht trocknet */
  dryAt: Date | null;
}

/**
 * Trocknungsberechnung mit stündlichem Prognose-Verlauf: Pro Stunde wird der
 * Trocknungsfortschritt unter den jeweiligen Bedingungen aufsummiert
 * (1 Stunde unter Bedingungen X erledigt 1/Trockenzeit(X) des Trocknens).
 * Deutlich genauer als eine Momentaufnahme, weil Nachmittags-Wärme oder
 * aufkommender Wind korrekt berücksichtigt werden.
 */
export function estimateDryingWithForecast(
  baseHours: number,
  hourly: HourlyConditions[],
  start: Date,
): ForecastDryingResult {
  const relevant = hourly
    .filter(h => h.time.getTime() + 3600000 > start.getTime())
    .sort((a, b) => a.time.getTime() - b.time.getTime());
  let progress = 0; // 1 = trocken
  let elapsed = 0; // Stunden seit Start
  for (const hour of relevant) {
    // Anteil der Stunde, der nach dem Start liegt
    const hourStart = Math.max(hour.time.getTime(), start.getTime());
    const hourEnd = hour.time.getTime() + 3600000;
    const fraction = Math.max(0, Math.min(1, (hourEnd - hourStart) / 3600000));
    if (fraction <= 0) continue;
    const { hours } = estimateDryingTime(baseHours, hour);
    const rate = hours > 0 ? 1 / hours : 1;
    const gained = rate * fraction;
    if (progress + gained >= 1) {
      const needed = (1 - progress) / rate; // Stunden innerhalb dieser Stunde
      elapsed += needed;
      return {
        hours: Math.round(elapsed * 10) / 10,
        dryAt: new Date(hourStart + needed * 3600000),
      };
    }
    progress += gained;
    elapsed += fraction;
  }
  return { hours: Math.round(elapsed * 10) / 10, dryAt: null };
}

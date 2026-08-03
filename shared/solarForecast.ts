/**
 * Solarertrag-Prognose (#230): Wie viele Wattstunden bringt die eigene
 * Solaranlage an den nächsten Tagen – und reicht das für den Verbrauch aus
 * dem Strom-Budget (#229), oder wird der Speicher leer?
 *
 * Datengrundlage ist die bestehende Wetter-Anbindung (Open-Meteo). Sie
 * liefert die Einstrahlung entweder als Tagessumme auf die Horizontale
 * (`shortwave_radiation_sum`, in MJ/m²) oder – wenn Neigung und Ausrichtung
 * bekannt sind – stündlich auf die geneigte Fläche
 * (`global_tilted_irradiance`, in W/m²). Mehr als diese Werte holen wir
 * nicht: derselbe Abruf, zwei Felder mehr.
 *
 * Vom Sonnenlicht auf dem Panel bis zur Ladung im Speicher gehen unterwegs
 * Prozente verloren. Diese Verluste stehen unten EINZELN in
 * SOLAR_LOSS_STEPS – der Systemwirkungsgrad ist ihr Produkt und damit
 * nachvollziehbar, statt als eine kommentarlose 0,7 im Code zu verschwinden.
 *
 * Reine Rechenlogik ohne DOM – offline und testbar.
 */

/** Ein Verlustposten der Anlage. */
export interface SolarLossStep {
  key: "controller" | "cable" | "temperature" | "soiling";
  /** Verlust dieses Schritts in Prozent. */
  lossPercent: number;
}

/**
 * Die Verlustkette einer Camping-Solaranlage (Anhaltspunkte aus der Praxis):
 * - `controller`: Laderegler und Wandlung (PWM verliert mehr als MPPT)
 * - `cable`: Kabel, Stecker, Sicherungen und Dioden
 * - `temperature`: warme Zellen liefern weniger, im Sommer der grösste Posten
 * - `soiling`: Staub, Pollen, Alterung und Fertigungstoleranz
 *
 * Zusammen bleiben rund 71 % der Einstrahlung übrig – der Wert deckt sich mit
 * der Faustregel «rechne mit 70 % der Nennleistung».
 */
export const SOLAR_LOSS_STEPS: SolarLossStep[] = [
  { key: "controller", lossPercent: 10 },
  { key: "cable", lossPercent: 3 },
  { key: "temperature", lossPercent: 12 },
  { key: "soiling", lossPercent: 8 },
];

/** Wirkungsgrad als Produkt der Verlustschritte (0…1). */
export function systemEfficiency(
  steps: SolarLossStep[] = SOLAR_LOSS_STEPS
): number {
  const factor = steps.reduce(
    (product, step) =>
      product * (1 - Math.max(0, Math.min(100, step.lossPercent)) / 100),
    1
  );
  return Math.round(factor * 10000) / 10000;
}

/** Vorgabe-Systemwirkungsgrad (≈ 0,71). */
export const DEFAULT_SYSTEM_EFFICIENCY = systemEfficiency();

/** Aufstellung der Anlage. */
export type PanelMount = "roof" | "portable";

/** Die eigene Solaranlage – so, wie sie gespeichert wird. */
export interface SolarPanelSetup {
  /** Nennleistung aller Panels zusammen in Watt; null = nicht erfasst. */
  watts: number | null;
  /**
   * `roof` = fest und flach auf dem Dach (die Einstrahlung zählt horizontal),
   * `portable` = frei aufgestellt und in die Sonne gedreht (dann rechnen wir
   * mit der Neigung und Ausrichtung aus der Ausrichtungshilfe).
   */
  mount: PanelMount;
}

export const MAX_PANEL_WATTS = 20000;

export const DEFAULT_SOLAR_PANEL: SolarPanelSetup = {
  watts: 400,
  mount: "roof",
};

/** Unbekannte Daten (localStorage/Geräte-Sync) in eine gültige Anlage überführen. */
export function sanitizeSolarPanel(value: unknown): SolarPanelSetup {
  if (!value || typeof value !== "object") return { ...DEFAULT_SOLAR_PANEL };
  const raw = value as Partial<SolarPanelSetup>;
  const watts =
    typeof raw.watts === "number" && Number.isFinite(raw.watts) && raw.watts > 0
      ? Math.min(MAX_PANEL_WATTS, Math.round(raw.watts))
      : null;
  return { watts, mount: raw.mount === "portable" ? "portable" : "roof" };
}

/** Panel-Ausrichtung, wie sie die Ausrichtungshilfe (shared/solar.ts) liefert. */
export interface PanelOrientation {
  /** Neigung gegen die Horizontale in Grad (0 = flach). */
  tilt: number;
  /** Ausrichtung in Grad, 0 = Nord, 90 = Ost, 180 = Süd (Kompass-Konvention). */
  azimuth: number;
}

/**
 * Kompass-Azimut (0 = Nord) in die Open-Meteo-Konvention übersetzen:
 * dort ist 0 = Süd, −90 = Ost und 90 = West, im Bereich −180…180.
 */
export function openMeteoAzimuth(compassAzimuth: number): number {
  let value = (compassAzimuth - 180) % 360;
  if (value > 180) value -= 360;
  if (value <= -180) value += 360;
  return Math.round(value);
}

/** Prognose-Tage, die wir abrufen – weiter voraus wird die Aussage beliebig. */
export const SOLAR_FORECAST_DAYS = 5;

/**
 * Request-URL der Open-Meteo-Prognose: Sonnenschein-Dauer und Einstrahlung im
 * selben Abruf. Ist die Ausrichtung bekannt (frei aufgestelltes Panel), kommt
 * zusätzlich die Einstrahlung auf die geneigte Fläche mit.
 */
export function solarForecastUrl(
  lat: number,
  lon: number,
  days: number = SOLAR_FORECAST_DAYS,
  orientation: PanelOrientation | null = null
): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    forecast_days: String(Math.max(1, Math.min(16, Math.round(days)))),
    daily: "sunshine_duration,shortwave_radiation_sum",
  });
  if (orientation) {
    params.set("hourly", "global_tilted_irradiance");
    params.set("tilt", String(Math.max(0, Math.min(90, orientation.tilt))));
    params.set("azimuth", String(openMeteoAzimuth(orientation.azimuth)));
  }
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

/** 1 kWh sind 3,6 MJ – die Tagessumme kommt in MJ/m². */
export const MJ_PER_KWH = 3.6;

/** Ein Prognose-Tag, wie ihn die Wetter-Anbindung liefert. */
export interface RadiationDay {
  /** Datum "YYYY-MM-DD". */
  date: string;
  /** Einstrahlung auf die Panel-Fläche in kWh/m². */
  irradiationKwhPerM2: number;
  /** Sonnenschein-Dauer in Stunden; null = nicht geliefert. */
  sunshineHours: number | null;
  /** true = Wert gilt für die geneigte Fläche, false = horizontal. */
  tilted: boolean;
}

function numberAt(list: unknown, index: number): number | null {
  if (!Array.isArray(list)) return null;
  const value = list[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Antwort der Wetter-Anbindung in Tageswerte übersetzen. Liegen stündliche
 * Werte für die geneigte Fläche bei, gewinnen sie – sie passen zur
 * tatsächlichen Aufstellung, während die Tagessumme immer horizontal gilt.
 */
export function parseSolarForecast(json: unknown): RadiationDay[] {
  if (!json || typeof json !== "object") return [];
  const root = json as {
    daily?: Record<string, unknown>;
    hourly?: Record<string, unknown>;
  };
  const dates = root.daily?.time;
  if (!Array.isArray(dates)) return [];

  // Stündliche Einstrahlung (W/m²) je Tag zu Wh/m² aufsummieren.
  // Bewusst ein einfaches Objekt statt einer Map: der tsconfig kennt kein
  // downlevelIteration, und Object.keys reicht hier völlig.
  const tiltedWhPerDay: Record<string, number> = {};
  const hourlyTimes = root.hourly?.time;
  const hourlyValues = root.hourly?.global_tilted_irradiance;
  if (Array.isArray(hourlyTimes) && Array.isArray(hourlyValues)) {
    for (let i = 0; i < hourlyTimes.length; i++) {
      const time = hourlyTimes[i];
      const value = numberAt(hourlyValues, i);
      if (typeof time !== "string" || value === null) continue;
      const day = time.slice(0, 10);
      tiltedWhPerDay[day] = (tiltedWhPerDay[day] ?? 0) + Math.max(0, value);
    }
  }

  const days: RadiationDay[] = [];
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (typeof date !== "string") continue;
    const sunshineSeconds = numberAt(root.daily?.sunshine_duration, i);
    const shortwaveMj = numberAt(root.daily?.shortwave_radiation_sum, i);
    const tiltedWh = tiltedWhPerDay[date];
    const tilted = typeof tiltedWh === "number";
    const irradiation = tilted
      ? tiltedWh / 1000
      : shortwaveMj !== null
        ? Math.max(0, shortwaveMj) / MJ_PER_KWH
        : 0;
    days.push({
      date,
      irradiationKwhPerM2: Math.round(irradiation * 100) / 100,
      sunshineHours:
        sunshineSeconds === null
          ? null
          : Math.round((Math.max(0, sunshineSeconds) / 3600) * 10) / 10,
      tilted,
    });
  }
  return days;
}

/**
 * Ertrag eines Tages in Wh: Nennleistung × Einstrahlung × Wirkungsgrad.
 *
 * Das ist das übliche Peak-Sonnenstunden-Modell: Ein Panel liefert seine
 * Nennleistung bei 1000 W/m², eine Einstrahlung von 1 kWh/m² entspricht also
 * einer Stunde Volllast. Was davon im Speicher ankommt, sagt der
 * Systemwirkungsgrad.
 */
export function dailyYieldWh(
  panelWatts: number,
  irradiationKwhPerM2: number,
  efficiency: number = DEFAULT_SYSTEM_EFFICIENCY
): number {
  if (!(panelWatts > 0) || !(irradiationKwhPerM2 > 0)) return 0;
  return Math.round(panelWatts * irradiationKwhPerM2 * efficiency);
}

/**
 * Ertrag aus effektiven Sonnenstunden – der Rückfall, solange keine Prognose
 * vorliegt (kein Standort, kein Netz, manueller Modus). Eine effektive
 * Sonnenstunde entspricht dabei 1 kWh/m².
 */
export function yieldFromSunHours(
  panelWatts: number,
  sunHoursPerDay: number,
  efficiency: number = DEFAULT_SYSTEM_EFFICIENCY
): number {
  return dailyYieldWh(panelWatts, Math.max(0, sunHoursPerDay), efficiency);
}

/** Ein Tag der Gegenüberstellung Ertrag ↔ Verbrauch. */
export interface SolarBalanceDay {
  date: string;
  /** Erwarteter Ertrag in Wh. */
  yieldWh: number;
  /** Verbrauch in Wh. */
  consumptionWh: number;
  /** Ertrag minus Verbrauch (negativ = der Speicher muss zuschiessen). */
  netWh: number;
  /** Nutzbarer Speicherstand am Abend in Wh; null = Speicher unbekannt. */
  batteryWh: number | null;
  /** Derselbe Stand in Prozent der nutzbaren Kapazität; null = unbekannt. */
  batteryPercent: number | null;
  /** Ertrag, der nicht mehr in den vollen Speicher passt, in Wh. */
  wastedWh: number;
  /** An diesem Tag ist der nutzbare Vorrat aufgebraucht. */
  empty: boolean;
}

export interface SolarBalanceResult {
  days: SolarBalanceDay[];
  totalYieldWh: number;
  totalConsumptionWh: number;
  /** Ertrag minus Verbrauch über alle Tage. */
  netWh: number;
  /** Ungenutzter Ertrag, weil der Speicher voll war. */
  wastedWh: number;
  /** Erster Tag, an dem der nutzbare Vorrat aufgebraucht ist; null = keiner. */
  firstEmptyDate: string | null;
  /** Zahl der Tage, die vor dem ersten leeren Tag liegen. */
  coveredDays: number;
  /** Der Speicher reicht über den ganzen Zeitraum. */
  covered: boolean;
}

export interface SolarBalanceInput {
  /** Erträge je Tag (in der Reihenfolge der Prognose). */
  days: { date: string; yieldWh: number }[];
  /** Verbrauch pro Tag in Wh (aus dem Strom-Budget). */
  dailyConsumptionWh: number;
  /** Nutzbarer Speicherstand zu Beginn in Wh; null = Speicher unbekannt. */
  startWh: number | null;
  /** Nutzbare Kapazität in Wh (Obergrenze fürs Nachladen); null = unbekannt. */
  usableWh: number | null;
}

/**
 * Ertrag und Verbrauch über mehrere Tage gegenüberstellen und den Speicher
 * mitlaufen lassen.
 *
 * Vereinfachung mit Ansage: Gerechnet wird tageweise, also Ertrag und
 * Verbrauch eines Tages gegeneinander – nicht stundenweise. Für die Frage
 * «reicht die Sonne über die Woche?» genügt das; ein Kühlschrank, der
 * nachts läuft, während die Sonne erst morgens wieder scheint, taucht in
 * dieser Auflösung nicht auf.
 *
 * Was nicht in den vollen Speicher passt, ist verloren (`wastedWh`) – ein
 * voller Akku nimmt nichts mehr an.
 */
export function solarBalance(input: SolarBalanceInput): SolarBalanceResult {
  const consumption = Math.max(0, input.dailyConsumptionWh);
  const usableWh =
    input.usableWh !== null && input.usableWh > 0 ? input.usableWh : null;
  let battery =
    usableWh === null || input.startWh === null
      ? null
      : Math.max(0, Math.min(usableWh, input.startWh));

  const days: SolarBalanceDay[] = [];
  let totalYieldWh = 0;
  let totalConsumptionWh = 0;
  let wastedTotal = 0;
  let firstEmptyDate: string | null = null;
  let coveredDays = 0;

  for (const day of input.days) {
    const yieldWh = Math.max(0, Math.round(day.yieldWh));
    const netWh = Math.round(yieldWh - consumption);
    totalYieldWh += yieldWh;
    totalConsumptionWh += consumption;

    let wastedWh = 0;
    let empty = false;
    if (battery !== null && usableWh !== null) {
      const raw = battery + netWh;
      if (raw > usableWh) {
        wastedWh = Math.round(raw - usableWh);
        battery = usableWh;
      } else if (raw <= 0) {
        empty = true;
        battery = 0;
      } else {
        battery = Math.round(raw);
      }
      wastedTotal += wastedWh;
    }

    if (empty && firstEmptyDate === null) firstEmptyDate = day.date;
    if (firstEmptyDate === null) coveredDays++;

    days.push({
      date: day.date,
      yieldWh,
      consumptionWh: Math.round(consumption),
      netWh,
      batteryWh: battery,
      batteryPercent:
        battery === null || usableWh === null
          ? null
          : Math.round((battery / usableWh) * 100),
      wastedWh,
      empty,
    });
  }

  return {
    days,
    totalYieldWh: Math.round(totalYieldWh),
    totalConsumptionWh: Math.round(totalConsumptionWh),
    netWh: Math.round(totalYieldWh - totalConsumptionWh),
    wastedWh: Math.round(wastedTotal),
    firstEmptyDate,
    coveredDays,
    covered: firstEmptyDate === null,
  };
}

/** Durchschnittlicher Ertrag pro Tag in Wh (0 ohne Tage). */
export function averageYieldWh(days: { yieldWh: number }[]): number {
  if (days.length === 0) return 0;
  const sum = days.reduce((total, day) => total + Math.max(0, day.yieldWh), 0);
  return Math.round(sum / days.length);
}

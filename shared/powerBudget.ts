/**
 * Strom-Budget (#229): «Wie lange reicht mein Strom?»
 *
 * Reine Rechenlogik ohne DOM – aus dem erfassten Speicher (Powerstation oder
 * Bordbatterie) und der Verbraucherliste entsteht der Verbrauch pro Tag, die
 * Reichweite in Tagen bzw. Stunden und die Restkapazität.
 *
 * Bewusst konservativ: Gerechnet wird nur mit dem NUTZBAREN Anteil des
 * Speichers. Eine Blei-Batterie gibt man nicht bis zum letzten Wh her (ca.
 * 50 %), LiFePO₄ verträgt deutlich mehr (ca. 90 %) – der Anteil ist als
 * Vorgabe je Bauart hinterlegt und von Hand übersteuerbar. Was unter der
 * Reserve liegt, taucht in der Rechnung gar nicht erst auf; wer sie anzapfen
 * müsste, bekommt die Tiefentladungs-Warnung.
 *
 * Fehlt eine Angabe (kein Speicher, Ah ohne Spannung, keine Verbraucher),
 * wird nichts geraten: Das Ergebnis steht dann auf «unknown» und sagt über
 * `missing`, was fehlt.
 */

/** Bauart des Speichers – sie bestimmt den nutzbaren Anteil (Entladetiefe). */
export type BatteryChemistry = "lead" | "agm" | "gel" | "lifepo4" | "liion";

export const BATTERY_CHEMISTRIES: BatteryChemistry[] = [
  "lifepo4",
  "liion",
  "agm",
  "gel",
  "lead",
];

/**
 * Nutzbarer Anteil je Bauart in Prozent (Anhaltspunkte aus der Praxis, nicht
 * vom Hersteller): Nass-Blei mag nur die halbe Kapazität hergeben, AGM und Gel
 * vertragen etwas mehr, LiFePO₄ und die Zellen der Powerstations fast alles.
 */
export const DEFAULT_USABLE_PERCENT: Record<BatteryChemistry, number> = {
  lead: 50,
  agm: 60,
  gel: 60,
  lifepo4: 90,
  liion: 85,
};

/** Übliche Bordspannungen für die Ah-Erfassung. */
export const COMMON_VOLTAGES = [12, 24, 48];

/** Wie die Kapazität erfasst wird: direkt in Wh oder über Ah und Spannung. */
export type CapacityMode = "wh" | "ah";

/** Der erfasste Speicher – so, wie er gespeichert wird. */
export interface PowerStorage {
  /** Bauart (bestimmt die Vorgabe für den nutzbaren Anteil). */
  chemistry: BatteryChemistry;
  /** Erfassungsart: Wh (Powerstation) oder Ah + Spannung (Bordbatterie). */
  mode: CapacityMode;
  /** Kapazität in Wh; null = nicht erfasst. */
  capacityWh: number | null;
  /** Kapazität in Ah; null = nicht erfasst. */
  capacityAh: number | null;
  /** Nennspannung in V; null = nicht erfasst (Ah allein ergeben keine Wh). */
  voltage: number | null;
  /** Nutzbarer Anteil in Prozent; null = Vorgabe der Bauart. */
  usablePercent: number | null;
  /** Ladezustand beim Start in Prozent der Nennkapazität. */
  chargePercent: number;
}

export const MAX_CAPACITY_WH = 100000;
export const MAX_CAPACITY_AH = 5000;
export const MAX_VOLTAGE = 120;
/** Unter 10 % nutzbarem Anteil wird die Rechnung sinnlos. */
export const MIN_USABLE_PERCENT = 10;

export const DEFAULT_POWER_STORAGE: PowerStorage = {
  chemistry: "lifepo4",
  mode: "wh",
  capacityWh: 1024,
  capacityAh: null,
  voltage: 12,
  usablePercent: null,
  chargePercent: 100,
};

function isChemistry(value: unknown): value is BatteryChemistry {
  return (
    value === "lead" ||
    value === "agm" ||
    value === "gel" ||
    value === "lifepo4" ||
    value === "liion"
  );
}

function positiveNumber(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.min(max, Math.round(value * 10) / 10);
}

function percentValue(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** Unbekannte Daten (localStorage/Geräte-Sync) in einen gültigen Speicher überführen. */
export function sanitizePowerStorage(value: unknown): PowerStorage {
  if (!value || typeof value !== "object") return { ...DEFAULT_POWER_STORAGE };
  const raw = value as Partial<PowerStorage>;
  const usableRaw = raw.usablePercent;
  return {
    chemistry: isChemistry(raw.chemistry)
      ? raw.chemistry
      : DEFAULT_POWER_STORAGE.chemistry,
    mode: raw.mode === "ah" ? "ah" : "wh",
    capacityWh: positiveNumber(raw.capacityWh, MAX_CAPACITY_WH),
    capacityAh: positiveNumber(raw.capacityAh, MAX_CAPACITY_AH),
    voltage: positiveNumber(raw.voltage, MAX_VOLTAGE),
    usablePercent:
      typeof usableRaw === "number" && Number.isFinite(usableRaw)
        ? percentValue(usableRaw, MIN_USABLE_PERCENT, MIN_USABLE_PERCENT, 100)
        : null,
    chargePercent: percentValue(
      raw.chargePercent,
      DEFAULT_POWER_STORAGE.chargePercent,
      0,
      100
    ),
  };
}

/**
 * Nennkapazität in Wh. Bei der Ah-Erfassung braucht es zwingend die Spannung –
 * Ah allein sind keine Energie, darum gibt es hier null statt einer Schätzung.
 */
export function storageCapacityWh(storage: PowerStorage | null): number | null {
  if (!storage) return null;
  if (storage.mode === "ah") {
    if (!storage.capacityAh || !storage.voltage) return null;
    return Math.round(storage.capacityAh * storage.voltage);
  }
  if (!storage.capacityWh) return null;
  return Math.round(storage.capacityWh);
}

/** Tatsächlich angesetzter nutzbarer Anteil in Prozent (eigener Wert schlägt Vorgabe). */
export function usablePercentOf(storage: PowerStorage | null): number {
  if (!storage) return DEFAULT_USABLE_PERCENT[DEFAULT_POWER_STORAGE.chemistry];
  const value =
    storage.usablePercent ?? DEFAULT_USABLE_PERCENT[storage.chemistry];
  return Math.max(MIN_USABLE_PERCENT, Math.min(100, Math.round(value)));
}

/**
 * Wirkungsgrad des Wechselrichters (#405): Ein 230-V-Gerät an der
 * 12-V-Anlage bezieht seine Watt HINTER dem Wechselrichter – der Speicher
 * gibt rund 15 % mehr her, als auf dem Typenschild steht. Wer das nicht
 * rechnet, wundert sich am dritten Tag über den leeren Akku.
 */
export const INVERTER_EFFICIENCY = 0.85;

/** Ein Verbraucher, wie er in die Rechnung eingeht. */
export interface PowerConsumer {
  name?: string;
  /** Leistungsaufnahme in Watt. */
  watts: number;
  /** Betriebsstunden pro Tag (Kompressorgeräte: Laufzeit, nicht Standzeit). */
  hoursPerDay: number;
  /** false = ausgeschaltet und damit nicht gerechnet. */
  enabled?: boolean;
  /** 230-V-Gerät am Wechselrichter – kostet den Umwandlungsverlust (#405). */
  inverter?: boolean;
  /**
   * Kühlgerät (#405): Die LAUFZEIT des Kompressors hängt an der
   * Aussentemperatur, nicht am Bauchgefühl – sie kommt dann aus der
   * Wetterprognose (`coolingHoursPerDay`) statt von Hand.
   */
  cooling?: boolean;
}

/** Verbrauch eines Verbrauchers in Wh pro Tag (nie negativ, max. 24 h). */
export function consumerDailyWh(consumer: PowerConsumer): number {
  if (consumer.enabled === false) return 0;
  const watts = Number.isFinite(consumer.watts)
    ? Math.max(0, consumer.watts)
    : 0;
  const hours = Number.isFinite(consumer.hoursPerDay)
    ? Math.max(0, Math.min(24, consumer.hoursPerDay))
    : 0;
  const raw = watts * hours;
  // Der Wechselrichter-Verlust kommt OBEN drauf: Das Typenschild nennt,
  // was das Gerät zieht – der Speicher liefert mehr.
  const withInverter = consumer.inverter ? raw / INVERTER_EFFICIENCY : raw;
  return Math.round(withInverter * 10) / 10;
}

// ── Kühlgeräte nach Wetter (#405) ──────────────────────────────────────────

/**
 * Kompressor-Laufzeit aus der Tageshöchsttemperatur.
 *
 * DIE GRÖSSTE UNGENAUIGKEIT des alten Rechners war genau diese Zahl: Ob
 * die Kühlbox 5 oder 12 Stunden läuft, macht bei 45 W mehr aus als jede
 * andere Angabe – und niemand weiss sie auswendig, weil sie vom Wetter
 * abhängt. Die Faustkurve: Bei 15 °C läuft der Kompressor rund 20 % der
 * Zeit, je Grad mehr etwa 2 Prozentpunkte länger; gedeckelt bei 70 %
 * (mehr schafft auch ein Sommer nicht, solange das Gerät passt).
 * Anhaltspunkte aus der Praxis, keine Herstellerangabe – deshalb bleibt
 * die Laufzeit von Hand übersteuerbar.
 */
export function coolingHoursPerDay(tempMaxC: number): number {
  if (!Number.isFinite(tempMaxC)) return 8;
  const duty = Math.max(0.15, Math.min(0.7, 0.2 + 0.02 * (tempMaxC - 15)));
  return Math.round(duty * 24 * 2) / 2;
}

/**
 * Kühlgeräten die Laufzeit aus dem Wetter geben. Ohne Temperatur (keine
 * Prognose geladen) bleibt der gespeicherte Wert stehen – lieber der alte
 * Richtwert als eine erfundene Zahl.
 */
export function applyWeatherToConsumers<T extends PowerConsumer>(
  consumers: readonly T[],
  tempMaxC: number | null
): T[] {
  if (tempMaxC === null) return consumers.slice();
  return consumers.map(consumer =>
    consumer.cooling
      ? { ...consumer, hoursPerDay: coolingHoursPerDay(tempMaxC) }
      : consumer
  );
}

export interface ConsumerShare {
  name: string;
  watts: number;
  hoursPerDay: number;
  dailyWh: number;
  /** Anteil am Tagesverbrauch in Prozent (0, wenn nichts verbraucht wird). */
  percent: number;
}

/**
 * Verbraucher nach Tagesverbrauch absteigend – so sieht man auf einen Blick,
 * wer den Speicher wirklich leert. Ausgeschaltete Geräte fallen weg.
 */
export function consumerBreakdown(consumers: PowerConsumer[]): ConsumerShare[] {
  const active = consumers
    .filter(c => c.enabled !== false)
    .map(c => ({
      name: c.name ?? "",
      watts: Math.max(0, c.watts),
      hoursPerDay: Math.max(0, Math.min(24, c.hoursPerDay)),
      dailyWh: consumerDailyWh(c),
      percent: 0,
    }))
    .filter(c => c.dailyWh > 0);
  const total = active.reduce((sum, c) => sum + c.dailyWh, 0);
  if (total > 0) {
    for (const entry of active) {
      entry.percent = Math.round((entry.dailyWh / total) * 100);
    }
  }
  return active.sort((a, b) => b.dailyWh - a.dailyWh);
}

/** Was für ein vollständiges Ergebnis fehlt. */
export type PowerBudgetMissing = "storage" | "voltage" | "consumers";

/**
 * Einordnung der Reichweite:
 * - `selfSufficient`: die Nachladung deckt den Verbrauch
 * - `ok`: mehr als zwei Tage
 * - `tight`: ein bis zwei Tage
 * - `critical`: keinen ganzen Tag mehr (Tiefentladung droht)
 * - `unknown`: es fehlen Angaben
 */
export type PowerBudgetStatus =
  "selfSufficient" | "ok" | "tight" | "critical" | "unknown";

/** Ab dieser Reichweite in Tagen ist es knapp. */
export const RUNTIME_TIGHT_DAYS = 2;

export interface PowerBudgetInput {
  storage: PowerStorage | null;
  consumers: PowerConsumer[];
  /** Tägliche Nachladung in Wh (Solarertrag #230, Landstrom, Lichtmaschine). */
  rechargeWhPerDay?: number;
}

export interface PowerBudgetResult {
  /** Verbrauch pro Tag in Wh. */
  dailyConsumptionWh: number;
  /** Zahl der eingeschalteten Verbraucher mit Verbrauch. */
  activeConsumers: number;
  /** Nennkapazität in Wh; null = nicht berechenbar. */
  nominalWh: number | null;
  /** Nutzbare Kapazität bei vollem Speicher in Wh; null = nicht berechenbar. */
  usableWh: number | null;
  /** Nutzbare Restkapazität beim aktuellen Ladestand in Wh. */
  availableWh: number | null;
  /** Reserve, die als Tiefentladungsschutz stehen bleibt, in Wh. */
  reserveWh: number | null;
  /** Angesetzter nutzbarer Anteil in Prozent. */
  usablePercent: number;
  /** Verbrauch minus Nachladung in Wh pro Tag (negativ = Überschuss). */
  netDailyWh: number;
  /** Reichweite in Tagen; null = unbegrenzt oder nicht berechenbar. */
  runtimeDays: number | null;
  /** Dieselbe Reichweite in Stunden; null = unbegrenzt oder nicht berechenbar. */
  runtimeHours: number | null;
  /** Die Nachladung deckt den Verbrauch vollständig. */
  selfSufficient: boolean;
  /** Der Speicher wäre noch am selben Tag an der Entladegrenze. */
  deepDischargeRisk: boolean;
  status: PowerBudgetStatus;
  missing: PowerBudgetMissing[];
}

/**
 * Ganze Rechnung: Tagesverbrauch, nutzbare Restkapazität und Reichweite.
 *
 * Der Ladestand zählt auf die NENNkapazität – die Reserve liegt darunter.
 * Ein Blei-Akku mit 50 % nutzbarem Anteil und 50 % Ladung hat also exakt
 * 0 Wh nutzbar übrig, nicht die halbe Restladung.
 */
export function evaluatePowerBudget(
  input: PowerBudgetInput
): PowerBudgetResult {
  const storage = input.storage;
  const missing: PowerBudgetMissing[] = [];

  const dailyConsumptionWh =
    Math.round(
      input.consumers.reduce((sum, c) => sum + consumerDailyWh(c), 0) * 10
    ) / 10;
  const activeConsumers = input.consumers.filter(
    c => c.enabled !== false && consumerDailyWh(c) > 0
  ).length;
  if (activeConsumers === 0) missing.push("consumers");

  const nominalWh = storageCapacityWh(storage);
  if (nominalWh === null) {
    // Ah ohne Spannung ist der häufigste Fall: die Angabe ist da, nur nicht rechenbar
    if (
      storage &&
      storage.mode === "ah" &&
      storage.capacityAh &&
      !storage.voltage
    )
      missing.push("voltage");
    else missing.push("storage");
  }

  const usablePercent = usablePercentOf(storage);
  const chargePercent = storage ? storage.chargePercent : 100;
  const usableWh =
    nominalWh === null ? null : Math.round((nominalWh * usablePercent) / 100);
  const reserveWh =
    nominalWh === null || usableWh === null ? null : nominalWh - usableWh;
  // Nutzbar ist nur, was über der Reserve liegt: Ladestand − (100 % − nutzbarer Anteil)
  const availableWh =
    nominalWh === null
      ? null
      : Math.max(
          0,
          Math.round(
            (nominalWh * Math.max(0, chargePercent - (100 - usablePercent))) /
              100
          )
        );

  const recharge = Math.max(0, input.rechargeWhPerDay ?? 0);
  const netDailyWh = Math.round((dailyConsumptionWh - recharge) * 10) / 10;
  const selfSufficient = dailyConsumptionWh > 0 && netDailyWh <= 0;

  let runtimeDays: number | null = null;
  let runtimeHours: number | null = null;
  if (availableWh !== null && netDailyWh > 0) {
    const exactDays = availableWh / netDailyWh;
    runtimeDays = Math.round(exactDays * 100) / 100;
    // Aus dem ungerundeten Wert, sonst schleppt sich der Rundungsfehler mit
    runtimeHours = Math.round(exactDays * 24 * 10) / 10;
  }

  const deepDischargeRisk = runtimeDays !== null && runtimeDays < 1;

  let status: PowerBudgetStatus;
  if (selfSufficient && nominalWh !== null) status = "selfSufficient";
  else if (missing.length > 0 || runtimeDays === null) status = "unknown";
  else if (runtimeDays < 1) status = "critical";
  else if (runtimeDays < RUNTIME_TIGHT_DAYS) status = "tight";
  else status = "ok";

  return {
    dailyConsumptionWh,
    activeConsumers,
    nominalWh,
    usableWh,
    availableWh,
    reserveWh,
    usablePercent,
    netDailyWh,
    runtimeDays,
    runtimeHours,
    selfSufficient,
    deepDischargeRisk,
    status,
    missing,
  };
}

/** Schlüssel der mitgelieferten Geräte-Vorlagen. */
export type ConsumerTemplateKey =
  | "fridge"
  | "coolbox"
  | "led"
  | "phone"
  | "laptop"
  | "pump"
  | "heater"
  | "fan"
  | "camera"
  | "drone"
  | "tv"
  | "router";

export interface ConsumerTemplate {
  key: ConsumerTemplateKey;
  watts: number;
  hoursPerDay: number;
  /** Kühlgerät: Laufzeit kommt aus dem Wetter (#405). */
  cooling?: boolean;
  /** Typisches 230-V-Gerät am Wechselrichter (#405). */
  inverter?: boolean;
}

/**
 * Vorlagen für typische Camping-Verbraucher. Die Werte sind ANHALTSPUNKTE aus
 * der Praxis, keine Herstellerangaben – bei Kompressorgeräten ist bereits die
 * Laufzeit gemeint (ein Kompressor läuft nicht rund um die Uhr), und was auf
 * dem Typenschild steht, gilt immer vor der Vorlage.
 */
export const CONSUMER_TEMPLATES: ConsumerTemplate[] = [
  { key: "fridge", watts: 60, hoursPerDay: 8, cooling: true },
  { key: "coolbox", watts: 45, hoursPerDay: 8, cooling: true },
  { key: "led", watts: 8, hoursPerDay: 4 },
  { key: "phone", watts: 15, hoursPerDay: 2 },
  { key: "laptop", watts: 60, hoursPerDay: 2, inverter: true },
  { key: "pump", watts: 50, hoursPerDay: 0.5 },
  { key: "heater", watts: 30, hoursPerDay: 6 },
  { key: "fan", watts: 15, hoursPerDay: 4 },
  { key: "camera", watts: 20, hoursPerDay: 1.5 },
  { key: "drone", watts: 90, hoursPerDay: 1 },
  { key: "tv", watts: 40, hoursPerDay: 2, inverter: true },
  { key: "router", watts: 10, hoursPerDay: 12 },
];

/** Wh-Wert menschenlesbar formatieren (ab 1000 Wh in kWh, Dezimalkomma ausser im Englischen). */
export function formatWh(wh: number, lang: string = "de"): string {
  const rounded = Math.round(wh);
  if (Math.abs(rounded) >= 1000) {
    const kwh = Math.round(rounded / 10) / 100;
    const text = kwh.toFixed(2);
    return `${lang === "en" ? text : text.replace(".", ",")} kWh`;
  }
  return `${rounded} Wh`;
}

/**
 * Reichweite als Zahl + Einheit aufbereiten: unter zwei Tagen in Stunden,
 * darüber in Tagen. Über `MAX_RUNTIME_DAYS` wird nicht mehr gerechnet – so
 * weit voraus sagt die Rechnung ohnehin nichts Verlässliches.
 */
export const MAX_RUNTIME_DAYS = 30;

export interface RuntimeDisplay {
  unit: "hours" | "days" | "overMax" | "none";
  value: number;
}

export function runtimeDisplay(result: PowerBudgetResult): RuntimeDisplay {
  if (result.runtimeDays === null) return { unit: "none", value: 0 };
  if (result.runtimeDays > MAX_RUNTIME_DAYS)
    return { unit: "overMax", value: MAX_RUNTIME_DAYS };
  if (result.runtimeDays < 2)
    return {
      unit: "hours",
      value: Math.round((result.runtimeHours ?? 0) * 10) / 10,
    };
  return { unit: "days", value: Math.round(result.runtimeDays * 10) / 10 };
}

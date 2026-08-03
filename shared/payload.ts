/**
 * Zuladungs-Rechner (#227): «Ist mein Gespann überladen?»
 *
 * Reine Rechenlogik ohne DOM – aus den Grenzwerten der Fahrzeug-Profile
 * (shared/vehicles.ts) und der geplanten Ladung entsteht je Grenzwert eine
 * Ampel mit «noch frei» bzw. «zu viel».
 *
 * Bewusst konservativ: Die Stützlast des Anhängers zählt beim Zugfahrzeug zum
 * Gesamtgewicht (sie liegt auf der Kupplung) und beim Anhänger zur
 * Anhängelast. Fehlt eine Angabe, bleibt die Ampel grau statt grün – geraten
 * wird nichts. Verbindlich sind Fahrzeugausweis und Waage.
 */

import type { VehicleProfile } from "./vehicles";

/** Wo eine Ladung liegt. */
export type LoadPosition = "tow" | "trailer";

/** Ampel-Stufe eines Grenzwerts. */
export type PayloadStatus = "ok" | "tight" | "over" | "unknown";

/** Ab dieser Auslastung wird es eng (gelb) – exakt am Limit gehört dazu. */
export const PAYLOAD_TIGHT_PERCENT = 95;

/** Faustregel Stützlast: Anteil des tatsächlichen Anhängergewichts in Prozent. */
export const NOSE_RULE_MIN_PERCENT = 4;
export const NOSE_RULE_MAX_PERCENT = 7;
/** Schätzwert, solange die Stützlast nicht gewogen wurde (Mitte der Faustregel). */
export const NOSE_ESTIMATE_PERCENT = 5;

/** Vorgabe-Gewicht pro Person in kg (Erwachsene mit Kleidung, grob gerundet). */
export const DEFAULT_PERSON_KG = 75;

/** Ein frei erfasster Ladungs-Posten (Wasser im Tank, Gasflasche, Velos …). */
export interface PayloadItem {
  id: string;
  label: string;
  kg: number;
  where: LoadPosition;
}

/** Alle Eingaben des Rechners – so, wie sie gespeichert werden. */
export interface PayloadPlan {
  /** Gewähltes Zugfahrzeug (Fahrzeug-Profil-Id); null = keins gewählt. */
  towVehicleId: string | null;
  /** Gewählter Anhänger (Fahrzeug-Profil-Id); null = ohne Anhänger. */
  trailerVehicleId: string | null;
  /** Anzahl mitfahrender Personen (sitzen im Zugfahrzeug). */
  personCount: number;
  /** Angenommenes Gewicht pro Person in kg. */
  personKg: number;
  /** Als Ladung übernommene Packliste; null = keine. */
  packListId: number | null;
  /** Wo die Packliste liegt. */
  packListWhere: LoadPosition;
  /** Gemessene Stützlast in kg; null = schätzen (Faustregel). */
  measuredNoseKg: number | null;
  /** Freie Posten. */
  items: PayloadItem[];
}

export const MAX_PAYLOAD_ITEMS = 40;
export const MAX_PAYLOAD_LABEL_LENGTH = 60;
export const MAX_PERSON_COUNT = 12;
export const MAX_PAYLOAD_ITEM_KG = 5000;

export const DEFAULT_PAYLOAD_PLAN: PayloadPlan = {
  towVehicleId: null,
  trailerVehicleId: null,
  personCount: 2,
  personKg: DEFAULT_PERSON_KG,
  packListId: null,
  packListWhere: "tow",
  measuredNoseKg: null,
  items: [],
};

function sanitizePosition(value: unknown): LoadPosition {
  return value === "trailer" ? "trailer" : "tow";
}

function sanitizeItemKg(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.min(MAX_PAYLOAD_ITEM_KG, Math.round(value * 10) / 10);
}

/** Unbekannte Daten (localStorage/Server-Sync) in einen gültigen Plan überführen. */
export function sanitizePayloadPlan(value: unknown): PayloadPlan {
  if (!value || typeof value !== "object") return { ...DEFAULT_PAYLOAD_PLAN };
  const raw = value as Partial<PayloadPlan>;
  const items: PayloadItem[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw.items)) {
    for (
      let i = 0;
      i < raw.items.length && items.length < MAX_PAYLOAD_ITEMS;
      i++
    ) {
      const entry = raw.items[i] as Partial<PayloadItem> | null;
      if (!entry || typeof entry !== "object") continue;
      const kg = sanitizeItemKg(entry.kg);
      if (kg === null) continue;
      const label =
        typeof entry.label === "string"
          ? entry.label.trim().slice(0, MAX_PAYLOAD_LABEL_LENGTH)
          : "";
      if (!label) continue;
      const id =
        typeof entry.id === "string" && entry.id.trim()
          ? entry.id.trim().slice(0, 64)
          : `item-${i}`;
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({ id, label, kg, where: sanitizePosition(entry.where) });
    }
  }
  const personCount =
    typeof raw.personCount === "number" && Number.isFinite(raw.personCount)
      ? Math.max(0, Math.min(MAX_PERSON_COUNT, Math.round(raw.personCount)))
      : DEFAULT_PAYLOAD_PLAN.personCount;
  const personKg = sanitizeItemKg(raw.personKg) ?? DEFAULT_PERSON_KG;
  return {
    towVehicleId:
      typeof raw.towVehicleId === "string" && raw.towVehicleId
        ? raw.towVehicleId.slice(0, 64)
        : null,
    trailerVehicleId:
      typeof raw.trailerVehicleId === "string" && raw.trailerVehicleId
        ? raw.trailerVehicleId.slice(0, 64)
        : null,
    personCount,
    personKg,
    packListId:
      typeof raw.packListId === "number" && Number.isInteger(raw.packListId)
        ? raw.packListId
        : null,
    packListWhere: sanitizePosition(raw.packListWhere),
    measuredNoseKg: sanitizeItemKg(raw.measuredNoseKg),
    items,
  };
}

/** Eine gewogene/berechnete Ladung, wie sie in die Rechnung eingeht. */
export interface PayloadLoad {
  kg: number;
  where: LoadPosition;
}

/** Ladung je Position aufsummieren (auf 0,1 kg gerundet). */
export function sumLoads(loads: PayloadLoad[]): Record<LoadPosition, number> {
  let tow = 0;
  let trailer = 0;
  for (const load of loads) {
    if (!Number.isFinite(load.kg) || load.kg <= 0) continue;
    if (load.where === "trailer") trailer += load.kg;
    else tow += load.kg;
  }
  return {
    tow: Math.round(tow * 10) / 10,
    trailer: Math.round(trailer * 10) / 10,
  };
}

/** Welche Grenzwerte geprüft werden. */
export type PayloadCheckKey =
  | "towGross"
  | "trailerGross"
  | "towCapacity"
  | "noseWeight"
  | "towAxle"
  | "trailerAxle";

export interface PayloadCheck {
  key: PayloadCheckKey;
  status: PayloadStatus;
  /** Tatsächlicher Wert in kg; null = nicht berechenbar. */
  actualKg: number | null;
  /** Grenzwert in kg; null = nicht erfasst. */
  limitKg: number | null;
  /** Noch frei in kg (nie negativ); null = nicht berechenbar. */
  freeKg: number | null;
  /** Überschreitung in kg (nie negativ); null = nicht berechenbar. */
  overKg: number | null;
  /** Auslastung in Prozent (kann über 100 liegen); null = nicht berechenbar. */
  percent: number | null;
  /** Wert beruht auf der Stützlast-Schätzung statt auf einer Messung. */
  estimated: boolean;
  /** Warum die Ampel grau ist: fehlende Angabe oder gar nicht berechenbar. */
  missing: "limit" | "value" | "notComputable" | null;
}

export interface PayloadInput {
  towing: VehicleProfile | null;
  trailer: VehicleProfile | null;
  /** Zuladung (ohne Leergewichte, ohne Stützlast). */
  loads: PayloadLoad[];
  /** Gemessene Stützlast in kg; null = Faustregel-Schätzung. */
  measuredNoseKg: number | null;
}

export interface PayloadResult {
  checks: PayloadCheck[];
  /** Schlechteste Ampel über alle geprüften Grenzwerte. */
  worst: PayloadStatus;
  /** Tatsächliches Gesamtgewicht Zugfahrzeug inkl. Stützlast; null = unbekannt. */
  towTotalKg: number | null;
  /** Tatsächliches Gesamtgewicht Anhänger inkl. Stützlast; null = unbekannt. */
  trailerTotalKg: number | null;
  /** Gesamtgewicht des Gespanns; null = unbekannt. */
  trainTotalKg: number | null;
  /** Zuladung je Position. */
  loadKg: Record<LoadPosition, number>;
  /** Angesetzte Stützlast; null = kein Anhänger oder nicht berechenbar. */
  noseKg: number | null;
  /** Stützlast ist geschätzt (Faustregel), nicht gewogen. */
  noseEstimated: boolean;
}

function rankStatus(status: PayloadStatus): number {
  if (status === "over") return 3;
  if (status === "tight") return 2;
  if (status === "unknown") return 1;
  return 0;
}

/** Einen Grenzwert prüfen: Ampel, «noch frei» und Überschreitung. */
export function checkLimit(
  key: PayloadCheckKey,
  actualKg: number | null,
  limitKg: number | null,
  options: { estimated?: boolean; notComputable?: boolean } = {}
): PayloadCheck {
  const estimated = options.estimated === true;
  if (options.notComputable) {
    return {
      key,
      status: "unknown",
      actualKg: null,
      limitKg,
      freeKg: null,
      overKg: null,
      percent: null,
      estimated,
      missing: "notComputable",
    };
  }
  if (actualKg === null || limitKg === null || limitKg <= 0) {
    return {
      key,
      status: "unknown",
      actualKg,
      limitKg,
      freeKg: null,
      overKg: null,
      percent: null,
      estimated,
      missing: limitKg === null || limitKg <= 0 ? "limit" : "value",
    };
  }
  const actual = Math.round(actualKg * 10) / 10;
  const percent = Math.round((actual / limitKg) * 100);
  const overKg = Math.max(0, Math.round((actual - limitKg) * 10) / 10);
  const freeKg = Math.max(0, Math.round((limitKg - actual) * 10) / 10);
  const status: PayloadStatus =
    overKg > 0 ? "over" : percent >= PAYLOAD_TIGHT_PERCENT ? "tight" : "ok";
  return {
    key,
    status,
    actualKg: actual,
    limitKg,
    freeKg,
    overKg,
    percent,
    estimated,
    missing: null,
  };
}

/**
 * Ganze Rechnung: Gesamtgewichte, Anhängelast, Stützlast und Achslasten.
 *
 * Ohne Zugfahrzeug entfallen dessen Ampeln, ohne Anhänger die des Anhängers –
 * ein Anhänger ohne Zugfahrzeug bleibt aber prüfbar (die Anhängelast steht
 * dann mangels Zugfahrzeug auf grau).
 */
export function evaluatePayload(input: PayloadInput): PayloadResult {
  const loadKg = sumLoads(input.loads);
  const towing = input.towing;
  const trailer = input.trailer;

  // Tatsächliches Anhängergewicht (inkl. Stützlast, die auf der Kupplung liegt)
  const trailerTotalKg =
    trailer && trailer.emptyKg !== null
      ? Math.round((trailer.emptyKg + loadKg.trailer) * 10) / 10
      : null;

  // Stützlast: gewogen schlägt geschätzt; ohne Anhänger gibt es keine.
  let noseKg: number | null = null;
  let noseEstimated = false;
  if (trailer) {
    if (input.measuredNoseKg !== null && input.measuredNoseKg >= 0) {
      noseKg = Math.round(input.measuredNoseKg * 10) / 10;
    } else if (trailerTotalKg !== null) {
      noseKg =
        Math.round(((trailerTotalKg * NOSE_ESTIMATE_PERCENT) / 100) * 10) / 10;
      noseEstimated = true;
    }
  }

  // Gesamtgewicht Zugfahrzeug: Leergewicht + Zuladung + Stützlast
  const towTotalKg =
    towing && towing.emptyKg !== null && (!trailer || noseKg !== null)
      ? Math.round((towing.emptyKg + loadKg.tow + (noseKg ?? 0)) * 10) / 10
      : null;

  const trainTotalKg =
    towTotalKg !== null && trailerTotalKg !== null
      ? Math.round((towTotalKg + trailerTotalKg) * 10) / 10
      : towTotalKg !== null && !trailer
        ? towTotalKg
        : null;

  const checks: PayloadCheck[] = [];

  if (towing) {
    checks.push(checkLimit("towGross", towTotalKg, towing.grossKg));
    if (towing.axleKg !== null) {
      // Wie sich das Gewicht auf Vorder- und Hinterachse verteilt, hängt an
      // Radstand und Ladeort – ohne Waage ist das nicht seriös zu rechnen.
      checks.push(
        checkLimit("towAxle", null, towing.axleKg, { notComputable: true })
      );
    }
  }

  if (trailer) {
    checks.push(checkLimit("trailerGross", trailerTotalKg, trailer.grossKg));
    checks.push(
      checkLimit("towCapacity", trailerTotalKg, towing ? towing.towKg : null)
    );
    // Zulässige Stützlast: der kleinere Wert von Kupplung und Deichsel gilt.
    const noseLimits = [towing?.noseKg ?? null, trailer.noseKg ?? null].filter(
      (v): v is number => v !== null
    );
    const noseLimit = noseLimits.length > 0 ? Math.min(...noseLimits) : null;
    checks.push(
      checkLimit("noseWeight", noseKg, noseLimit, { estimated: noseEstimated })
    );
    if (trailer.axleKg !== null) {
      // Einachser-Näherung: Was nicht auf der Kupplung liegt, trägt die Achse.
      const axleActual =
        trailerTotalKg !== null && noseKg !== null
          ? Math.round((trailerTotalKg - noseKg) * 10) / 10
          : null;
      checks.push(
        checkLimit("trailerAxle", axleActual, trailer.axleKg, {
          estimated: noseEstimated,
        })
      );
    }
  }

  let worst: PayloadStatus = "ok";
  for (const check of checks) {
    if (rankStatus(check.status) > rankStatus(worst)) worst = check.status;
  }

  return {
    checks,
    worst,
    towTotalKg,
    trailerTotalKg,
    trainTotalKg,
    loadKg,
    noseKg,
    noseEstimated,
  };
}

export interface NoseWeightRule {
  /** Untergrenze der Faustregel in kg (4 % des tatsächlichen Anhängergewichts). */
  minKg: number;
  /** Obergrenze der Faustregel in kg (7 %). */
  maxKg: number;
  /** Empfehlung: Faustregel-Fenster, nach oben durch den zulässigen Wert gekappt. */
  recommendedKg: number;
}

/**
 * Stützlast-Faustregel zum tatsächlichen Anhängergewicht: 4–7 % des Gewichts,
 * und die zulässige Stützlast möglichst ausnutzen – das beruhigt das Gespann.
 * Ohne Anhängergewicht gibt es nichts zu rechnen (null).
 */
export function noseWeightRule(
  trailerTotalKg: number | null,
  allowedNoseKg: number | null
): NoseWeightRule | null {
  if (trailerTotalKg === null || trailerTotalKg <= 0) return null;
  const minKg =
    Math.round(((trailerTotalKg * NOSE_RULE_MIN_PERCENT) / 100) * 10) / 10;
  const maxKg =
    Math.round(((trailerTotalKg * NOSE_RULE_MAX_PERCENT) / 100) * 10) / 10;
  const recommendedKg =
    allowedNoseKg !== null ? Math.min(allowedNoseKg, maxKg) : maxKg;
  return { minKg, maxKg, recommendedKg };
}

/** kg-Wert menschenlesbar formatieren (Dezimal-Komma ausser im Englischen). */
export function formatKg(kg: number, lang: string = "de"): string {
  const rounded = Math.round(kg * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${lang === "en" ? text : text.replace(".", ",")} kg`;
}

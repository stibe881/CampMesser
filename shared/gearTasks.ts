/**
 * Ausrüstungs-Pflege: reine Fälligkeits-Logik für wiederkehrende
 * Wartungsaufgaben (z. B. Zelt imprägnieren alle 24 Monate) plus der
 * Vorschlags-Katalog fürs Inventar. Testbar ohne DB – Daten kommen als
 * ISO-Strings (YYYY-MM-DD) bzw. Date aus der gearTasks-Tabelle.
 */
import { l4, type L4 } from "./i18n";
import { localDay } from "./localDate";

export const MAX_GEAR_TASK_TITLE_LENGTH = 120;
export const MIN_GEAR_INTERVAL_MONTHS = 1;
export const MAX_GEAR_INTERVAL_MONTHS = 120;

/** Innerhalb dieser Frist vor der Fälligkeit gilt eine Aufgabe als «bald fällig». */
export const GEAR_SOON_DAYS = 30;

/** Ein Pflege-Eintrag, soweit für die Fälligkeit relevant. */
export interface GearTaskLike {
  /** Wartungs-Intervall in Monaten */
  intervalMonths: number;
  /** Zuletzt erledigt (ISO-Datum); null = noch nie */
  lastDoneAt: string | null;
  /** Anlage-Zeitpunkt – Basis, solange die Aufgabe noch nie erledigt wurde */
  createdAt: Date | string;
}

export interface GearDueInfo {
  /** Ist die Aufgabe am Stichtag fällig (dueDate <= heute)? */
  due: boolean;
  /** Nächster Fälligkeits-Termin als ISO-Datum */
  dueDate: string;
  /** Tage bis zur Fälligkeit (negativ = überfällig) */
  daysUntil: number;
  /** Fällig innerhalb der nächsten 30 Tage (aber noch nicht fällig)? */
  soon: boolean;
}

const DAY_MS = 86400000;

/** ISO-Datum (YYYY-MM-DD) aus einem Date/String – null bei kaputten Werten. */
function toIsoDay(value: Date | string): string | null {
  if (value instanceof Date) {
    // Lokaler Tag, nicht UTC: «heute erledigt» um 00:30 wäre sonst
    // gestern erledigt – und die Pflege gälte einen Tag zu früh.
    return Number.isNaN(value.getTime()) ? null : localDay(value);
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * ISO-Datum um `months` Monate verschieben; Monats-Überläufe werden auf den
 * letzten Tag des Ziel-Monats geklemmt (31.01. + 1 Monat → 28./29.02.).
 */
export function addMonthsClamped(iso: string, months: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const targetMonthIndex = month + months;
  // Letzter Tag des Ziel-Monats (Tag 0 des Folgemonats, UTC gegen TZ-Sprünge)
  const lastDay = new Date(
    Date.UTC(year, targetMonthIndex + 1, 0)
  ).getUTCDate();
  const target = new Date(
    Date.UTC(year, targetMonthIndex, Math.min(day, lastDay))
  );
  return Number.isNaN(target.getTime())
    ? null
    : target.toISOString().slice(0, 10);
}

/**
 * Fälligkeit einer Aufgabe am Stichtag `today` (ISO-Datum): Basis ist
 * lastDoneAt, sonst das Anlage-Datum; dueDate = Basis + Intervall.
 * Kaputte Daten gelten defensiv als «nicht fällig» mit dueDate = today.
 */
export function gearTaskDue(task: GearTaskLike, today: string): GearDueInfo {
  const base = task.lastDoneAt ?? toIsoDay(task.createdAt);
  const months = Math.max(
    MIN_GEAR_INTERVAL_MONTHS,
    Math.min(MAX_GEAR_INTERVAL_MONTHS, Math.round(task.intervalMonths))
  );
  const dueDate = base ? addMonthsClamped(base, months) : null;
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  if (!dueDate || Number.isNaN(todayMs)) {
    return { due: false, dueDate: today, daysUntil: 0, soon: false };
  }
  const dueMs = Date.parse(`${dueDate}T00:00:00Z`);
  const daysUntil = Math.round((dueMs - todayMs) / DAY_MS);
  const due = daysUntil <= 0;
  return {
    due,
    dueDate,
    daysUntil,
    soon: !due && daysUntil <= GEAR_SOON_DAYS,
  };
}

/** Vorschlag aus dem Katalog: Titel (übersetzt) + empfohlenes Intervall. */
export interface GearTaskSuggestion {
  title: L4;
  intervalMonths: number;
}

/** Vorschlags-Katalog fürs Inventar («Hinzufügen aus Vorschlägen»). */
export const GEAR_TASK_SUGGESTIONS: GearTaskSuggestion[] = [
  {
    title: l4(
      "Zelt imprägnieren",
      "Imperméabiliser la tente",
      "Impermeabilizzare la tenda",
      "Re-waterproof the tent"
    ),
    intervalMonths: 24,
  },
  {
    title: l4(
      "Erste-Hilfe-Set auffrischen",
      "Renouveler la trousse de premiers secours",
      "Rinnovare il kit di primo soccorso",
      "Restock the first aid kit"
    ),
    intervalMonths: 12,
  },
  {
    title: l4(
      "Batterien & Lampen prüfen",
      "Contrôler piles et lampes",
      "Controllare batterie e lampade",
      "Check batteries & lamps"
    ),
    intervalMonths: 6,
  },
  {
    title: l4(
      "Gaskartuschen-Dichtung sichten",
      "Inspecter le joint des cartouches de gaz",
      "Ispezionare la guarnizione delle cartucce a gas",
      "Inspect gas cartridge seals"
    ),
    intervalMonths: 12,
  },
  {
    title: l4(
      "Schlafsack lüften & waschen",
      "Aérer et laver le sac de couchage",
      "Arieggiare e lavare il sacco a pelo",
      "Air & wash the sleeping bag"
    ),
    intervalMonths: 12,
  },
  {
    title: l4(
      "Wasserkanister reinigen",
      "Nettoyer le bidon d'eau",
      "Pulire la tanica dell'acqua",
      "Clean the water container"
    ),
    intervalMonths: 6,
  },
];

/**
 * Fahrzeug-Service-Merker (#637): Vorschläge rund um Zugfahrzeug,
 * Wohnwagen und Camper – gleiche Fälligkeits-Logik und Tabelle wie die
 * Ausrüstungs-Pflege (#124), nur ein zweiter Vorschlags-Katalog.
 */
export const VEHICLE_TASK_SUGGESTIONS: GearTaskSuggestion[] = [
  {
    title: l4(
      "Fahrzeug-Service / Ölwechsel",
      "Service du véhicule / vidange",
      "Tagliando / cambio olio",
      "Vehicle service / oil change"
    ),
    intervalMonths: 12,
  },
  {
    title: l4(
      "Reifen & Reifendruck prüfen (auch Wohnwagen)",
      "Contrôler pneus et pression (aussi caravane)",
      "Controllare gomme e pressione (anche roulotte)",
      "Check tyres & pressure (incl. caravan)"
    ),
    intervalMonths: 6,
  },
  {
    title: l4(
      "Gasprüfung Wohnwagen/Camper",
      "Contrôle du gaz caravane/camping-car",
      "Controllo gas roulotte/camper",
      "Gas system check caravan/camper"
    ),
    intervalMonths: 36,
  },
  {
    title: l4(
      "Aufbaubatterie & Ladetechnik prüfen",
      "Contrôler batterie auxiliaire et chargeur",
      "Controllare batteria servizi e caricatore",
      "Check leisure battery & charger"
    ),
    intervalMonths: 12,
  },
  {
    title: l4(
      "Dichtungen am Aufbau pflegen",
      "Entretenir les joints de la cellule",
      "Curare le guarnizioni della cellula",
      "Treat body seals"
    ),
    intervalMonths: 12,
  },
  {
    title: l4(
      "Wasseranlage entkalken & desinfizieren",
      "Détartrer et désinfecter le circuit d'eau",
      "Decalcificare e disinfettare l'impianto acqua",
      "Descale & sanitise the water system"
    ),
    intervalMonths: 12,
  },
];

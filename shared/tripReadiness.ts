/**
 * Reise-Cockpit: Bereitschafts-Auswertung eines geplanten Aufenthalts.
 * Reine Funktionen ohne DB/UI – der Client sammelt die Daten (Packliste,
 * Menüplan, Reise-Einkäufe, Stammdaten) und lässt hier bewerten, was noch
 * offen ist. Texte und Links liegen bewusst im Client, hier nur Zahlen.
 */
import { MEALS, type Meal } from "./menuPlan";

/** Diese Mahlzeiten zählen als «Haupt-Slots» – Znüni/Zvieri ist optional. */
export const MAIN_MEALS: Meal[] = MEALS.filter(meal => meal !== "snack");

/** Belegter Menüplan-Slot (weitere Felder des Eintrags spielen keine Rolle). */
export interface MenuSlotLike {
  day: string;
  meal: string;
}

/**
 * Haupt-Slots eines Aufenthalts zählen: pro Tag je ein Slot für Morgen-,
 * Mittag- und Abendessen. Einträge ausserhalb der Tage oder für Znüni/Zvieri
 * zählen NICHT, doppelte Einträge für denselben Slot nur einmal.
 */
export function countMainSlots(
  days: string[],
  entries: MenuSlotLike[]
): { mainSlots: number; emptySlots: number } {
  const mainSlots = days.length * MAIN_MEALS.length;
  const dayset = new Set(days);
  const filled = new Set<string>();
  entries.forEach(entry => {
    if (!dayset.has(entry.day)) return;
    if (!MAIN_MEALS.some(meal => meal === entry.meal)) return;
    filled.add(`${entry.day}|${entry.meal}`);
  });
  return { mainSlots, emptySlots: Math.max(0, mainSlots - filled.size) };
}

/** Geprüfte Bereiche des Cockpits, in Anzeige-Reihenfolge. */
export type ReadinessKey =
  "packList" | "menuPlan" | "shopping" | "spot" | "arrivalTime";

/** Zustand einer Zeile: erledigt oder noch offen. */
export type ReadinessStatus = "ok" | "open";

export interface ReadinessRow {
  key: ReadinessKey;
  status: ReadinessStatus;
  /**
   * Zahl zur Zeile – je nach Bereich Prozent (packList), Anzahl fehlender
   * Haupt-Slots (menuPlan) oder offener Einträge (shopping); sonst 0.
   */
  value: number;
}

export interface TripReadinessInput {
  /** Ist ein Zeltplatz-Favorit verknüpft? */
  hasSpot: boolean;
  /** Ist eine Ankunftszeit erfasst? */
  hasArrivalTime: boolean;
  /** Packlisten-Stand; null = keine Liste verknüpft. */
  packList: { checked: number; total: number } | null;
  /** Menüplan-Stand; null = keine Auswertung möglich (Zeile entfällt). */
  menu: { mainSlots: number; emptySlots: number } | null;
  /** Reise-Einkaufsliste; null = nicht geladen (Zeile entfällt). */
  shopping: { open: number; total: number } | null;
  /** Geteilte Reise? Dann ist die Reise-Einkaufsliste immer ein Thema. */
  sharedTrip: boolean;
}

export interface TripReadiness {
  /** Zeilen in fester Reihenfolge – ohne die nicht auswertbaren Bereiche. */
  rows: ReadinessRow[];
  /** Anzahl offener Punkte. */
  openCount: number;
  /** Alles erledigt (und mindestens eine Zeile vorhanden)? */
  ready: boolean;
}

/** Prozent-Anteil abgehakter Einträge (leere Liste = 0 %). */
function packedPercent(checked: number, total: number): number {
  return total > 0 ? Math.round((checked / total) * 100) : 0;
}

/**
 * Bereitschaft eines geplanten Aufenthalts auswerten. Bewusst tolerant:
 * fehlende Daten lassen die jeweilige Zeile weg, statt «offen» zu behaupten.
 */
export function tripReadiness(input: TripReadinessInput): TripReadiness {
  const rows: ReadinessRow[] = [];

  // Packliste: ohne Liste offen, mit Liste erst bei 100 % erledigt.
  if (input.packList === null) {
    rows.push({ key: "packList", status: "open", value: 0 });
  } else {
    const { checked, total } = input.packList;
    rows.push({
      key: "packList",
      status: total > 0 && checked >= total ? "ok" : "open",
      value: packedPercent(checked, total),
    });
  }

  // Menüplan: nur auswerten, wenn es überhaupt Haupt-Slots gibt.
  if (input.menu !== null && input.menu.mainSlots > 0) {
    rows.push({
      key: "menuPlan",
      status: input.menu.emptySlots === 0 ? "ok" : "open",
      value: input.menu.emptySlots,
    });
  }

  // Reise-Einkäufe: bei geteilten Reisen immer, sonst nur mit Einträgen.
  if (
    input.shopping !== null &&
    (input.sharedTrip || input.shopping.total > 0)
  ) {
    rows.push({
      key: "shopping",
      status: input.shopping.open === 0 ? "ok" : "open",
      value: input.shopping.open,
    });
  }

  rows.push({
    key: "spot",
    status: input.hasSpot ? "ok" : "open",
    value: 0,
  });
  rows.push({
    key: "arrivalTime",
    status: input.hasArrivalTime ? "ok" : "open",
    value: 0,
  });

  const openCount = rows.filter(row => row.status === "open").length;
  return { rows, openCount, ready: rows.length > 0 && openCount === 0 };
}

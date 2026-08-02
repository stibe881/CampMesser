/**
 * App-Icon-Zähler (Badging API): zeigt auf installierten PWAs eine kleine
 * Zahl am App-Icon – Kühlbox-Einträge, die heute oder morgen ablaufen, plus
 * fällige Ausrüstungs-Pflege-Aufgaben. Reine Zähl-Logik getrennt von der
 * Browser-API, damit sie ohne DOM testbar bleibt; ohne Badging-Unterstützung
 * sind alle Aufrufe No-ops.
 */
import { expiryInfo } from "@shared/food";
import { gearTaskDue, type GearTaskLike } from "@shared/gearTasks";

/** Kühlbox-Eintrag, soweit für den Zähler relevant. */
export interface BadgeFoodItem {
  /** Mindesthaltbarkeitsdatum (ISO YYYY-MM-DD); null/undefined = ohne MHD */
  expiryDate?: string | null;
}

/** Unterstützt der Browser die Badging API? */
export function isAppBadgeSupported(): boolean {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

/**
 * Zähler fürs App-Icon: Kühlbox-Einträge mit Ablauf heute oder morgen
 * (bereits Abgelaufene zählen nicht mehr – die sind ohnehin durch) plus
 * fällige Pflege-Aufgaben am Stichtag `today` (ISO-Datum).
 */
export function computeBadgeCount(input: {
  foodItems: BadgeFoodItem[];
  gearTasks: GearTaskLike[];
  today: string;
}): number {
  const { foodItems, gearTasks, today } = input;
  const expiringFood = foodItems.filter(item => {
    const info = expiryInfo(item.expiryDate, today);
    return info !== null && info.daysLeft >= 0 && info.daysLeft <= 1;
  }).length;
  const dueTasks = gearTasks.filter(
    task => gearTaskDue(task, today).due
  ).length;
  return expiringFood + dueTasks;
}

/** Zahl am App-Icon setzen; 0 räumt das Badge weg. Ohne Support ein No-op. */
export function updateAppBadge(count: number): void {
  if (!isAppBadgeSupported()) return;
  const promise =
    count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
  promise.catch(() => {
    // Badge ist reine Nettigkeit – Fehler (z. B. fehlende Berechtigung) still
  });
}

/** Badge entfernen (Logout / keine fälligen Einträge). */
export function clearAppBadge(): void {
  updateAppBadge(0);
}

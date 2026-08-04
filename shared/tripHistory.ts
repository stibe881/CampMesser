/**
 * Änderungsverlauf pro Reise (#296): wer hat wann was geändert.
 *
 * WOFÜR: Bei einer gemeinsamen Reise sind mehrere Leute an derselben
 * Planung. Wenn am Abend eine Ausgabe anders lautet als am Morgen, ist
 * die erste Frage nicht «was steht da», sondern «wer hat das geändert».
 * Ohne Verlauf endet das in einer Nachricht im Familienchat.
 *
 * EREIGNISSE, KEIN FELD-DIFF. Festgehalten wird, WER WANN WAS FÜR EINE
 * ART von Änderung gemacht hat – nicht der alte und der neue Wert jedes
 * Feldes. Ein vollständiger Diff über zehn Tabellen wäre ein Vielfaches
 * an Daten und liest sich für niemanden. «Anna hat die Reisekasse
 * ergänzt: Camping Sarnen, 48.00» beantwortet die Frage; «notes:
 * null→''» beantwortet sie nicht.
 *
 * GEBÜNDELT WIRD, WAS ZUSAMMENGEHÖRT. Wer zwölf Posten auf die
 * Einkaufsliste setzt, erzeugt zwölf Zeilen – und begräbt damit alles
 * andere. Gleiche Person, gleicher Bereich, gleiche Aktion und keine
 * grössere Pause dazwischen: eine Zeile mit Anzahl. Das ist keine
 * Kosmetik, sondern der Unterschied zwischen einem lesbaren Verlauf und
 * einem Protokoll.
 */
import { l4, type L4 } from "./i18n";

/** Bereiche einer Reise, in denen etwas passieren kann. */
export const CHANGE_AREAS = [
  "trip",
  "journal",
  "expense",
  "board",
  "menu",
  "shopping",
  "guestbook",
  "photo",
  "member",
] as const;
export type ChangeArea = (typeof CHANGE_AREAS)[number];

export const CHANGE_ACTIONS = ["add", "edit", "remove"] as const;
export type ChangeAction = (typeof CHANGE_ACTIONS)[number];

export const AREA_LABELS: Record<ChangeArea, L4> = {
  trip: l4("Reisedaten", "Données du voyage", "Dati del viaggio", "Trip data"),
  journal: l4("Journal", "Journal", "Diario", "Journal"),
  expense: l4("Reisekasse", "Caisse commune", "Cassa comune", "Kitty"),
  board: l4("Pinnwand", "Tableau", "Bacheca", "Pinboard"),
  menu: l4("Menüplan", "Menu", "Menu", "Meal plan"),
  shopping: l4(
    "Einkaufsliste",
    "Liste de courses",
    "Lista della spesa",
    "Shopping list"
  ),
  guestbook: l4("Gästebuch", "Livre d'or", "Libro degli ospiti", "Guest book"),
  photo: l4("Fotos", "Photos", "Foto", "Photos"),
  member: l4("Mitreisende", "Compagnons", "Compagni di viaggio", "Companions"),
};

export const ACTION_LABELS: Record<ChangeAction, L4> = {
  add: l4("hinzugefügt", "ajouté", "aggiunto", "added"),
  edit: l4("geändert", "modifié", "modificato", "changed"),
  remove: l4("entfernt", "supprimé", "rimosso", "removed"),
};

/**
 * So viele Einträge hebt eine Reise auf. Darüber fallen die ältesten
 * weg: Ein Verlauf, der ewig wächst, ist irgendwann nur noch Ballast –
 * und die Frage «wer war das» stellt sich zu dem, was gerade passiert
 * ist, nicht zu dem, was im Frühling war.
 */
export const HISTORY_LIMIT = 300;

/**
 * Wie nah zwei Änderungen liegen müssen, um als eine zu gelten. Zehn
 * Minuten sind grosszügig genug für «die Einkaufsliste durchgehen» und
 * kurz genug, dass zwei getrennte Sitzungen getrennt bleiben.
 */
export const BURST_MS = 10 * 60 * 1000;

export interface ChangeLike {
  id: number;
  userId: number;
  area: string;
  action: string;
  /** Was genau – null, wenn es nichts Benennbares gibt. */
  label: string | null;
  at: Date | string;
}

/** Eine Zeile im Verlauf: eine Änderung oder ein Bündel gleichartiger. */
export interface ChangeGroup {
  /** Id der jüngsten Änderung im Bündel – als React-Schlüssel brauchbar. */
  id: number;
  userId: number;
  area: string;
  action: string;
  /** Zeitpunkt der JÜNGSTEN Änderung im Bündel. */
  at: number;
  /** Die benannten Dinge, jüngstes zuerst; kann leer sein. */
  labels: string[];
  /** Wie viele Änderungen im Bündel stecken. */
  count: number;
}

function timeOf(value: Date | string | number): number {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

/** Beim Bündeln trägt `lastAt` die zuletzt aufgenommene Zeit. */
interface OpenGroup extends ChangeGroup {
  lastAt: number;
}

/**
 * Den Verlauf lesbar machen: jüngstes zuerst, Gleichartiges gebündelt.
 *
 * Gebündelt wird nur, was WIRKLICH zusammengehört – gleiche Person,
 * gleicher Bereich, gleiche Aktion, und höchstens `burstMs` Abstand zur
 * vorigen Änderung des Bündels. Eine Ausgabe von heute Morgen und eine
 * von heute Abend bleiben zwei Zeilen.
 */
export function bundleChanges(
  entries: readonly ChangeLike[],
  burstMs = BURST_MS
): ChangeGroup[] {
  const sorted = entries
    .slice()
    .sort((a, b) => timeOf(b.at) - timeOf(a.at) || b.id - a.id);
  const groups: OpenGroup[] = [];

  sorted.forEach(entry => {
    const at = timeOf(entry.at);
    const open = groups[groups.length - 1];
    const fits =
      open != null &&
      open.userId === entry.userId &&
      open.area === entry.area &&
      open.action === entry.action &&
      // Abstand zur zuletzt aufgenommenen Änderung, nicht zum Bündelbeginn:
      // Sonst reisst eine lange Serie kleiner Schritte künstlich ab.
      open.lastAt - at <= burstMs;
    if (fits) {
      open.count += 1;
      open.lastAt = at;
      if (entry.label) open.labels.push(entry.label);
      return;
    }
    groups.push({
      id: entry.id,
      userId: entry.userId,
      area: entry.area,
      action: entry.action,
      at,
      lastAt: at,
      labels: entry.label ? [entry.label] : [],
      count: 1,
    });
  });

  // `lastAt` ist Buchhaltung beim Bündeln und gehört nicht ins Ergebnis
  return groups.map(({ lastAt: _lastAt, ...group }) => group);
}

export interface ChangeDay {
  /** Tag als ISO-Datum (lokal gerechnet). */
  day: string;
  groups: ChangeGroup[];
}

const pad = (value: number) => String(value).padStart(2, "0");

/** ISO-Datum aus den LOKALEN Feldern – über UTC kippt es abends. */
export function localDay(at: number): string {
  const date = new Date(at);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Nach Tagen gruppieren, jüngster Tag zuoberst. */
export function groupByDay(groups: readonly ChangeGroup[]): ChangeDay[] {
  const days: ChangeDay[] = [];
  groups.forEach(group => {
    const day = localDay(group.at);
    const open = days[days.length - 1];
    if (open && open.day === day) {
      open.groups.push(group);
      return;
    }
    days.push({ day, groups: [group] });
  });
  return days;
}

/**
 * Beschriftung für eine Zeile: die genannten Dinge, gekürzt.
 *
 * Mehr als drei Namen in einer Zeile liest niemand – der Rest wird
 * gezählt. Die Anzahl bleibt vollständig, nur die Aufzählung ist kurz.
 */
export const MAX_SHOWN_LABELS = 3;

export function shownLabels(group: ChangeGroup): {
  shown: string[];
  more: number;
} {
  const unique: string[] = [];
  group.labels.forEach(label => {
    if (unique.indexOf(label) < 0) unique.push(label);
  });
  return {
    shown: unique.slice(0, MAX_SHOWN_LABELS),
    more: Math.max(0, unique.length - MAX_SHOWN_LABELS),
  };
}

export function isChangeArea(value: string): value is ChangeArea {
  return (CHANGE_AREAS as readonly string[]).indexOf(value) >= 0;
}

export function isChangeAction(value: string): value is ChangeAction {
  return (CHANGE_ACTIONS as readonly string[]).indexOf(value) >= 0;
}

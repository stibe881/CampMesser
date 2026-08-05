/**
 * Unterwegs-Modus der Startseite.
 *
 * DAS PROBLEM: Die Startseite zeigt 44 Werkzeuge in sieben Gruppen, und
 * zuoberst steht die Reiseplanung – sinnvoll, solange man zuhause plant.
 * Auf dem Platz ist es genau verkehrt herum: Dort braucht man Wasserwaage,
 * Zelt-Finder, Wetter, Ämtli und Kühlbox, und die Planung interessiert
 * niemanden mehr. Bisher scrollte man jedes Mal daran vorbei.
 *
 * DIE LÖSUNG: Läuft gerade ein Aufenthalt, ordnen sich die Gruppen von
 * selbst um – die Vor-Ort-Werkzeuge nach oben, die Planung nach unten.
 * Umgeschaltet wird nichts weggenommen: Alle Gruppen bleiben da, nur die
 * Reihenfolge ändert sich. Wer es anders will, stellt von Hand um; die
 * Wahl bleibt gespeichert, bis sie wieder auf «automatisch» steht.
 */

/** Was die Startseite anzeigen soll. */
export type TravelMode = "auto" | "onSite" | "planning";

/**
 * Reihenfolge der Gruppen während eines Aufenthalts.
 *
 * Begründung der Sortierung: «Vor Ort» sind die Handgriffe am Platz.
 * Danach die Küche (dreimal täglich), dann Sicherheit (Wetter, Warnungen),
 * dann Familie (die Kinder wollen beschäftigt sein), dann Ausrüstung.
 * Wissen und Reiseplanung wandern nach unten – nachschlagen tut man
 * gezielt über die Suche, geplant wird zuhause.
 */
export const ON_SITE_GROUP_ORDER = [
  "vorOrt",
  "kueche",
  "sicherheit",
  "familie",
  "ausruestung",
  "wissen",
  "reise",
] as const;

/**
 * Gruppen für die Anzeige sortieren – reine Funktion.
 *
 * Ohne Unterwegs-Modus bleibt die Reihenfolge unverändert. Gruppen, die in
 * ON_SITE_GROUP_ORDER fehlen (etwa eine neu hinzugekommene), landen hinten
 * und behalten ihre bisherige Reihenfolge zueinander – so führt eine
 * vergessene Ergänzung höchstens zu einer ungünstigen Position, nie zu
 * einer verschwundenen Gruppe.
 */
export function orderGroups<T extends string>(
  groups: readonly T[],
  onSite: boolean
): T[] {
  if (!onSite) return [...groups];
  const rank = (group: T) => {
    const index = (ON_SITE_GROUP_ORDER as readonly string[]).indexOf(group);
    return index === -1 ? ON_SITE_GROUP_ORDER.length : index;
  };
  return [...groups]
    .map((group, index) => ({ group, index }))
    .sort((a, b) => rank(a.group) - rank(b.group) || a.index - b.index)
    .map(entry => entry.group);
}

/**
 * Gilt der Unterwegs-Modus gerade? «auto» folgt dem laufenden Aufenthalt,
 * die beiden anderen Werte gewinnen über die Automatik.
 */
export function isOnSite(mode: TravelMode, tripRunning: boolean): boolean {
  if (mode === "onSite") return true;
  if (mode === "planning") return false;
  return tripRunning;
}

const STORAGE_KEY = "campmesser.travelMode";

/** Gespeicherte Wahl lesen (Standard: automatisch). */
export function loadTravelMode(): TravelMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "onSite" || raw === "planning" || raw === "auto") return raw;
  } catch {
    /* egal */
  }
  return "auto";
}

/** Wahl speichern; «auto» räumt den Eintrag wieder weg. */
export function saveTravelMode(mode: TravelMode): void {
  try {
    if (mode === "auto") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* egal */
  }
}

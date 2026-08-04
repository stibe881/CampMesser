/**
 * GPS-Schatzsuche (#267): Wegpunkte am Platz verstecken und suchen.
 *
 * Das Spiel steht und fällt mit einer Zahl: der GPS-Genauigkeit. Ein
 * Handy zeigt unter Bäumen gerne 20 Meter Abweichung an, und wer dann
 * «gefunden» meldet, schickt Kinder zehn Minuten im Kreis. Deshalb
 * arbeitet dieses Modul mit einem grosszügigen Fundradius und lässt
 * einen Punkt nur dann automatisch als gefunden gelten, wenn das Gerät
 * seine Position auch wirklich kennt.
 *
 * Angezeigt wird für Kinder nicht die Distanz allein, sondern «warm /
 * kalt» – die Stufe versteht ein Fünfjähriger, «87 Meter» nicht. Die
 * Meterzahl steht für die Erwachsenen trotzdem daneben.
 */
import { l4, type L4 } from "./i18n";

export const MAX_HUNT_NAME_LENGTH = 60;
export const MAX_POINT_NAME_LENGTH = 60;
export const MAX_POINT_HINT_LENGTH = 200;

/** Mehr Stationen hält keine Kindergruppe durch – und kein Akku. */
export const MAX_TREASURE_POINTS = 12;

/**
 * Ab dieser Nähe gilt ein Punkt als gefunden. 15 Meter klingen viel,
 * entsprechen aber der Genauigkeit, die ein Handy im Wald überhaupt
 * liefern kann. Kleiner gewählt wäre der Punkt für Kinder oft gar nicht
 * erreichbar – das Versteck wird ja sowieso mit den Augen gesucht.
 */
export const FOUND_RADIUS_M = 15;

/**
 * Schlechter als das ist die Ortung nicht mehr brauchbar: Bei 40 Metern
 * Unsicherheit würde die Anzeige raten. Dann sagt die App lieber, dass
 * das Signal schwach ist, statt eine Zahl vorzutäuschen.
 */
export const MAX_USABLE_ACCURACY_M = 40;

export type Warmth = "eiskalt" | "kalt" | "warm" | "heiss" | "gefunden";

/** Obergrenze in Metern je Stufe – die letzte Stufe ist der Fundradius. */
export const WARMTH_LIMITS: { warmth: Warmth; upToMeters: number }[] = [
  { warmth: "gefunden", upToMeters: FOUND_RADIUS_M },
  { warmth: "heiss", upToMeters: 40 },
  { warmth: "warm", upToMeters: 100 },
  { warmth: "kalt", upToMeters: 300 },
];

export const WARMTH_LABELS: Record<Warmth, L4> = {
  eiskalt: l4("Eiskalt", "Glacial", "Gelido", "Freezing"),
  kalt: l4("Kalt", "Froid", "Freddo", "Cold"),
  warm: l4("Warm", "Chaud", "Caldo", "Warm"),
  heiss: l4("Heiss!", "Brûlant !", "Bollente!", "Hot!"),
  gefunden: l4("Gefunden!", "Trouvé !", "Trovato!", "Found!"),
};

/** Was die Stufe für die Suchenden bedeutet – kindgerecht formuliert. */
export const WARMTH_HINTS: Record<Warmth, L4> = {
  eiskalt: l4(
    "Weit weg – lauf los und schau, ob es wärmer wird.",
    "Très loin – marche et regarde si ça se réchauffe.",
    "Molto lontano – cammina e guarda se si scalda.",
    "Far away – start walking and see if it gets warmer."
  ),
  kalt: l4(
    "Noch ein gutes Stück. Die Richtung stimmt, wenn die Zahl kleiner wird.",
    "Encore un bon bout. La direction est bonne si le nombre diminue.",
    "Ancora un bel pezzo. La direzione è giusta se il numero cala.",
    "Still a good way. You are going the right way if the number shrinks."
  ),
  warm: l4(
    "Es wird wärmer! Jetzt langsamer gehen und schauen.",
    "Ça chauffe ! Ralentis et ouvre l'œil.",
    "Si scalda! Ora rallenta e guardati intorno.",
    "Getting warmer! Slow down now and look around."
  ),
  heiss: l4(
    "Ganz nah! Schau unter Steine, hinter Bäume, in Astgabeln.",
    "Tout près ! Regarde sous les pierres, derrière les arbres, dans les fourches.",
    "Vicinissimo! Guarda sotto i sassi, dietro gli alberi, tra i rami.",
    "Very close! Look under stones, behind trees, in branch forks."
  ),
  gefunden: l4(
    "Du stehst praktisch drauf – jetzt zählen die Augen, nicht das Handy.",
    "Tu es pratiquement dessus – maintenant ce sont les yeux qui comptent, pas le téléphone.",
    "Ci sei praticamente sopra – ora contano gli occhi, non il telefono.",
    "You are practically on top of it – now it is your eyes that count, not the phone."
  ),
};

/** Stufe zur Distanz. Ohne Distanz gibt es keine Stufe, sondern null. */
export function warmthFor(distanceMeters: number): Warmth {
  for (const level of WARMTH_LIMITS) {
    if (distanceMeters <= level.upToMeters) return level.warmth;
  }
  return "eiskalt";
}

/**
 * Darf ein Punkt automatisch als gefunden gelten? Nur, wenn er im
 * Fundradius liegt UND die Ortung genau genug ist. Ohne die zweite
 * Bedingung meldet ein Handy mit 60 Metern Unsicherheit «gefunden»,
 * während das Versteck noch drei Wiesen weiter liegt.
 */
export function canDeclareFound(
  distanceMeters: number,
  accuracyMeters: number | null
): boolean {
  if (distanceMeters > FOUND_RADIUS_M) return false;
  if (accuracyMeters === null) return true;
  return accuracyMeters <= MAX_USABLE_ACCURACY_M;
}

/** Ist die Ortung brauchbar genug, um überhaupt etwas anzuzeigen? */
export function accuracyUsable(accuracyMeters: number | null): boolean {
  return accuracyMeters === null || accuracyMeters <= MAX_USABLE_ACCURACY_M;
}

/** Ein Wegpunkt, soweit für den Spielablauf nötig. */
export interface TreasurePointLike {
  id: number;
  sortIndex: number;
  foundAt: Date | string | null;
}

/** Wegpunkte in Spielreihenfolge – bei gleichem Index entscheidet die Id. */
export function sortPoints<T extends TreasurePointLike>(
  points: readonly T[]
): T[] {
  return points
    .slice()
    .sort((a, b) => a.sortIndex - b.sortIndex || a.id - b.id);
}

/**
 * Der nächste zu suchende Punkt: der erste noch nicht gefundene in der
 * Reihenfolge. Bewusst STRENG nacheinander – eine Schatzsuche, bei der
 * man die Stationen in beliebiger Reihenfolge abklappert, verliert ihre
 * Geschichte, und der letzte Hinweis führt zum Schatz.
 */
export function nextPoint<T extends TreasurePointLike>(
  points: readonly T[]
): T | null {
  return sortPoints(points).find(p => p.foundAt === null) ?? null;
}

export interface HuntProgress {
  found: number;
  total: number;
  /** Alle Punkte gefunden – und mindestens einer vorhanden. */
  done: boolean;
  /** Anteil in Prozent, gerundet; 0 bei leerer Schatzsuche. */
  percent: number;
}

export function huntProgress(
  points: readonly TreasurePointLike[]
): HuntProgress {
  const total = points.length;
  const found = points.filter(p => p.foundAt !== null).length;
  return {
    found,
    total,
    done: total > 0 && found === total,
    percent: total === 0 ? 0 : Math.round((found / total) * 100),
  };
}

/**
 * Nächster freier Sortier-Index. Wegpunkte werden angehängt, nicht
 * eingefügt – wer die Reihenfolge ändern will, legt die Suche neu an.
 */
export function nextSortIndex(points: readonly TreasurePointLike[]): number {
  return points.reduce((max, p) => Math.max(max, p.sortIndex), -1) + 1;
}

/** Name auf eine sinnvolle Länge bringen; leer bleibt leer. */
export function normalizeHuntName(value: string): string {
  return value.trim().slice(0, MAX_HUNT_NAME_LENGTH);
}

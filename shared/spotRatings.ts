/**
 * Eigene Platz-Bewertung nach Kriterien (#278).
 *
 * Ein einzelner Stern-Wert beantwortet die Frage nicht, die man beim
 * Planen stellt. «Vier Sterne» hilft nicht, wenn man mit kleinen Kindern
 * reist und wissen will, ob es dort einen Spielplatz und saubere Duschen
 * gibt – oder wenn man im August Schatten braucht.
 *
 * Deshalb vier Kriterien, die sich beim Camping tatsächlich
 * unterscheiden und die man nach einem Aufenthalt auch beurteilen kann.
 * Ein Kriterium darf LEER bleiben: Wer im Regen nie draussen sass, kann
 * den Schatten nicht bewerten, und eine erfundene Drei ist schlechter
 * als eine ehrliche Lücke.
 */
import { l4, type L4 } from "./i18n";

export type SpotCriterion = "sanitary" | "quiet" | "shade" | "kids";

/** Reihenfolge der Anzeige – so, wie man einen Platz erlebt. */
export const SPOT_CRITERIA: SpotCriterion[] = [
  "sanitary",
  "quiet",
  "shade",
  "kids",
];

export const SPOT_CRITERION_LABELS: Record<SpotCriterion, L4> = {
  sanitary: l4("Sanitär", "Sanitaires", "Servizi igienici", "Facilities"),
  quiet: l4("Ruhe", "Calme", "Tranquillità", "Quiet"),
  shade: l4("Schatten", "Ombre", "Ombra", "Shade"),
  kids: l4(
    "Kinderfreundlich",
    "Adapté aux enfants",
    "A misura di bambino",
    "Child-friendly"
  ),
};

/** Was das Kriterium meint – damit alle dasselbe bewerten. */
export const SPOT_CRITERION_HINTS: Record<SpotCriterion, L4> = {
  sanitary: l4(
    "Sauberkeit, Warmwasser, genug Duschen für die Belegung.",
    "Propreté, eau chaude, assez de douches pour la fréquentation.",
    "Pulizia, acqua calda, docce sufficienti per le presenze.",
    "Cleanliness, hot water, enough showers for how full it gets."
  ),
  quiet: l4(
    "Nachtruhe, Strassenlärm, Abstand zwischen den Plätzen.",
    "Repos nocturne, bruit de la route, distance entre les emplacements.",
    "Riposo notturno, rumore della strada, distanza tra le piazzole.",
    "Night-time quiet, road noise, spacing between pitches."
  ),
  shade: l4(
    "Bäume oder Hecken am Platz – zählt im Hochsommer doppelt.",
    "Arbres ou haies sur l'emplacement – compte double en plein été.",
    "Alberi o siepi sulla piazzola – in piena estate conta doppio.",
    "Trees or hedges on the pitch – counts double in high summer."
  ),
  kids: l4(
    "Spielplatz, Badestelle, Verkehr auf den Wegen.",
    "Place de jeux, baignade, circulation sur les chemins.",
    "Parco giochi, zona balneabile, traffico sui vialetti.",
    "Playground, bathing spot, traffic on the paths."
  ),
};

export const MIN_STARS = 1;
export const MAX_STARS = 5;

/** Bewertung eines Platzes; null bedeutet «nicht bewertet». */
export type SpotRatings = Record<SpotCriterion, number | null>;

/** Leere Bewertung – der Ausgangszustand jedes Platzes. */
export function emptyRatings(): SpotRatings {
  return { sanitary: null, quiet: null, shade: null, kids: null };
}

/** Sterne auf den erlaubten Bereich bringen; 0 und Unsinn werden null. */
export function clampStars(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  const rounded = Math.round(value);
  if (rounded < MIN_STARS) return null;
  return Math.min(MAX_STARS, rounded);
}

/** Wie viele Kriterien sind überhaupt bewertet? */
export function ratedCount(ratings: SpotRatings): number {
  return SPOT_CRITERIA.filter(c => ratings[c] !== null).length;
}

/**
 * Gesamtwert als Mittel der BEWERTETEN Kriterien. Fehlende zählen nicht
 * als null-Sterne – wer nur den Schatten bewertet hat, bekommt keinen
 * Platz mit 1,25 Sternen angezeigt. Ohne jede Bewertung: null.
 */
export function overallRating(ratings: SpotRatings): number | null {
  const values = SPOT_CRITERIA.map(c => ratings[c]).filter(
    (v): v is number => v !== null
  );
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export interface RatedSpot {
  id: number;
  name: string;
  ratings: SpotRatings;
}

/**
 * Plätze nach einem Kriterium ordnen – die besten zuerst. Plätze OHNE
 * Bewertung in diesem Kriterium wandern ans Ende, statt als Null zu
 * gelten: «nicht bewertet» ist nicht «schlecht».
 */
export function rankByCriterion<T extends RatedSpot>(
  spots: readonly T[],
  criterion: SpotCriterion
): T[] {
  return spots.slice().sort((a, b) => {
    const av = a.ratings[criterion];
    const bv = b.ratings[criterion];
    if (av === null && bv === null) return a.name.localeCompare(b.name);
    if (av === null) return 1;
    if (bv === null) return -1;
    if (av !== bv) return bv - av;
    return a.name.localeCompare(b.name);
  });
}

/** Dasselbe für den Gesamtwert. */
export function rankByOverall<T extends RatedSpot>(spots: readonly T[]): T[] {
  return spots.slice().sort((a, b) => {
    const av = overallRating(a.ratings);
    const bv = overallRating(b.ratings);
    if (av === null && bv === null) return a.name.localeCompare(b.name);
    if (av === null) return 1;
    if (bv === null) return -1;
    if (av !== bv) return bv - av;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Der beste Platz für ein Kriterium – aber nur, wenn es überhaupt eine
 * Bewertung gibt UND der beste Wert nicht mit anderen geteilt wird.
 * «Am ruhigsten» soll etwas heissen; bei drei gleichauf sagt man besser
 * nichts.
 */
export function bestForCriterion<T extends RatedSpot>(
  spots: readonly T[],
  criterion: SpotCriterion
): T | null {
  const rated = spots.filter(s => s.ratings[criterion] !== null);
  if (rated.length === 0) return null;
  const ranked = rankByCriterion(rated, criterion);
  const best = ranked[0].ratings[criterion];
  const tied = rated.filter(s => s.ratings[criterion] === best);
  return tied.length === 1 ? ranked[0] : null;
}

/**
 * Erzählwürfel (#268): Bilder würfeln und daraus eine Geschichte erfinden.
 *
 * Das Spielprinzip ist alt und funktioniert am Feuer so gut wie am
 * Küchentisch: Man würfelt ein paar Symbole und erzählt reihum eine
 * Geschichte, in der alle vorkommen.
 *
 * ENTSCHEIDUNG, die den Unterschied macht: Es wird nicht blind aus einem
 * Topf gezogen, sondern JE EIN Würfel pro Kategorie – Figur, Ort,
 * Gegenstand, Ereignis, Gefühl, Wendung. Sechs zufällige Symbole ergeben
 * oft drei Tiere und keinen Ort, und daraus wird keine Geschichte. Eine
 * Figur an einem Ort mit einem Gegenstand dagegen erzählt sich fast von
 * selbst.
 *
 * Die Zufallsquelle wird hereingereicht, damit das Würfeln testbar bleibt.
 */
import { l4, type L4 } from "./i18n";

export type StoryCategory =
  "figur" | "ort" | "gegenstand" | "ereignis" | "gefuehl" | "wendung";

/**
 * Reihenfolge der Kategorien – zugleich die Reihenfolge, in der bei
 * weniger Würfeln ausgewählt wird. Figur, Ort und Gegenstand zuerst:
 * Mit diesen dreien steht eine Geschichte, alles Weitere würzt.
 */
export const STORY_CATEGORY_ORDER: StoryCategory[] = [
  "figur",
  "ort",
  "gegenstand",
  "ereignis",
  "gefuehl",
  "wendung",
];

export const STORY_CATEGORY_LABELS: Record<StoryCategory, L4> = {
  figur: l4("Wer", "Qui", "Chi", "Who"),
  ort: l4("Wo", "Où", "Dove", "Where"),
  gegenstand: l4("Womit", "Avec quoi", "Con che cosa", "With what"),
  ereignis: l4(
    "Was passiert",
    "Que se passe-t-il",
    "Che succede",
    "What happens"
  ),
  gefuehl: l4(
    "Wie fühlt es sich an",
    "Quel sentiment",
    "Che sensazione",
    "How it feels"
  ),
  wendung: l4(
    "Und plötzlich",
    "Et soudain",
    "E all'improvviso",
    "And suddenly"
  ),
};

export interface StoryFace {
  id: string;
  category: StoryCategory;
  /** Name des Symbols – die Anzeige löst ihn in ein Icon auf. */
  icon: string;
  word: L4;
}

export const MIN_STORY_DICE = 3;
export const MAX_STORY_DICE = STORY_CATEGORY_ORDER.length;

/**
 * Ein Wurf: je ein Symbol aus den ersten `count` Kategorien. Die
 * Zufallsfunktion liefert Werte in [0,1) – wie `Math.random`.
 */
export function rollStoryDice(
  faces: readonly StoryFace[],
  count: number,
  random: () => number
): StoryFace[] {
  const wanted = Math.max(
    MIN_STORY_DICE,
    Math.min(MAX_STORY_DICE, Math.floor(count))
  );
  const result: StoryFace[] = [];
  for (const category of STORY_CATEGORY_ORDER.slice(0, wanted)) {
    const pool = faces.filter(f => f.category === category);
    if (pool.length === 0) continue;
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    result.push(pool[index]);
  }
  return result;
}

/**
 * Einen einzelnen Würfel neu werfen, ohne die anderen anzufassen – der
 * Klassiker, wenn ein Symbol partout nicht in die Geschichte passt. Kommt
 * dasselbe Symbol wieder, wird EINMAL nachgewürfelt: mehr Versuche wären
 * gegen den Zufall gerichtet, keiner wäre für Kinder enttäuschend.
 */
export function rerollFace(
  faces: readonly StoryFace[],
  current: StoryFace,
  random: () => number
): StoryFace {
  const pool = faces.filter(f => f.category === current.category);
  if (pool.length <= 1) return current;
  const pick = () =>
    pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  const first = pick();
  return first.id === current.id ? pick() : first;
}

/**
 * Anfangssätze – gedacht als Starthilfe für den ersten Erzähler und
 * bewusst offen gehalten, damit sie zu jedem Wurf passen.
 */
export const STORY_STARTERS: L4[] = [
  l4(
    "Es war einmal, kurz nach dem Znacht …",
    "Il était une fois, juste après le souper …",
    "C'era una volta, poco dopo cena …",
    "Once upon a time, just after supper …"
  ),
  l4(
    "Niemand glaubte es, aber an jenem Abend …",
    "Personne n'y croyait, mais ce soir-là …",
    "Nessuno ci credeva, ma quella sera …",
    "Nobody believed it, but that evening …"
  ),
  l4(
    "Weit hinter dem letzten Zelt …",
    "Loin derrière la dernière tente …",
    "Molto oltre l'ultima tenda …",
    "Far beyond the last tent …"
  ),
  l4(
    "Am Morgen war alles anders, denn …",
    "Au matin, tout avait changé, car …",
    "Al mattino tutto era diverso, perché …",
    "In the morning everything had changed, because …"
  ),
  l4(
    "Der Wind erzählte eine Geschichte, und sie ging so …",
    "Le vent racontait une histoire, et elle disait ceci …",
    "Il vento raccontava una storia, e faceva così …",
    "The wind told a story, and it went like this …"
  ),
];

/** Einen Anfangssatz auswürfeln. */
export function pickStarter(random: () => number): L4 {
  const index = Math.min(
    STORY_STARTERS.length - 1,
    Math.floor(random() * STORY_STARTERS.length)
  );
  return STORY_STARTERS[index];
}

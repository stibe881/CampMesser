/**
 * Znüni- & Lunchbox-Planer (#289): was für den Ausflug in den Rucksack.
 *
 * DIE FRAGE ist nicht «was esse ich gern», sondern «was hält den Tag
 * durch». Ein Ausflug scheitert selten am Geschmack und oft an drei
 * Dingen: zu wenig getrunken, zu wenig dabei für die Kinder, und die
 * Schokolade war nach zwei Stunden eine Pfütze.
 *
 * DESHALB entscheiden hier drei Angaben über den Vorschlag – wie lange
 * man weg ist, wie anstrengend es wird und wie warm es ist – plus die
 * Frage, ob ein Kühlakku mitkommt. Ohne Kühlung fällt alles weg, was
 * gekühlt gehört; das ist keine Geschmacksfrage, sondern eine der
 * Lebensmittelsicherheit.
 *
 * MENGEN sind Faustwerte pro Person und Mahlzeit, keine Ernährungslehre.
 * Ein Kind isst weniger als ein Erwachsener, aber öfter – deshalb rechnet
 * der Planer für Kinder mit kleineren Portionen und mehr Znüni.
 */
import { l4, type L4 } from "./i18n";

/** Wie lange ist man unterwegs? */
export const TRIP_LENGTHS = {
  /** Ein Vormittag oder Nachmittag: ein Znüni, kein Mittagessen. */
  halbtag: { meals: 1, hours: 4 },
  /** Der ganze Tag: Znüni, Mittagessen, Zvieri. */
  ganztag: { meals: 3, hours: 8 },
  /** Bis in den Abend – dann braucht es eine zweite Runde. */
  langertag: { meals: 4, hours: 11 },
} as const;

export type TripLength = keyof typeof TRIP_LENGTHS;

/**
 * Wie anstrengend wird es? Der Faktor wirkt auf Wasser UND Essen: Wer
 * fünfhundert Höhenmeter steigt, braucht beides mehr.
 */
export const EFFORTS = {
  gemuetlich: { factor: 1 },
  wandern: { factor: 1.3 },
  anstrengend: { factor: 1.6 },
} as const;

export type Effort = keyof typeof EFFORTS;

/** Grundbedarf Wasser pro Person und Stunde, in Millilitern. */
const WATER_ML_PER_HOUR_ADULT = 250;
const WATER_ML_PER_HOUR_CHILD = 150;

/** Ab dieser Temperatur wird spürbar mehr getrunken. */
export const HOT_DAY_C = 25;

/** Zuschlag auf das Wasser an heissen Tagen. */
const HOT_WATER_FACTOR = 1.4;

/** Trinkflaschen gibt es in halben Litern – aufgerundet wird darauf. */
export const BOTTLE_ML = 500;

/** Was ein Eintrag im Rucksack über sich weiss. */
export interface LunchItem {
  id: string;
  name: L4;
  /** Znüni, Mittagessen oder Extra. */
  slot: "znueni" | "mittag" | "extra";
  /** Muss gekühlt sein – ohne Kühlakku fällt der Eintrag weg. */
  needsCooling?: boolean;
  /** Wird in der Hitze weich oder flüssig. */
  meltsInHeat?: boolean;
  /** Salziges: an heissen Tagen wichtig, weil man Salz ausschwitzt. */
  salty?: boolean;
  /** Geht bei Anstrengung schnell ins Blut. */
  energyDense?: boolean;
  /** Bei Kindern beliebt und gut aus der Hand zu essen. */
  kidFriendly?: boolean;
  /** Übersteht auch einen vollen Rucksack ohne Dose. */
  robust?: boolean;
}

/**
 * Der Vorrat, aus dem der Planer wählt. Bewusst Alltagszeug aus jedem
 * Laden – ein Ausflugsznüni ist keine Menüfolge.
 */
export const LUNCH_ITEMS: LunchItem[] = [
  {
    id: "sandwich",
    name: l4("Sandwich", "Sandwich", "Panino", "Sandwich"),
    slot: "mittag",
    kidFriendly: true,
  },
  {
    id: "wrap",
    name: l4("Wrap", "Wrap", "Piadina", "Wrap"),
    slot: "mittag",
    kidFriendly: true,
  },
  {
    id: "hartkaese",
    name: l4(
      "Hartkäse",
      "Fromage à pâte dure",
      "Formaggio stagionato",
      "Hard cheese"
    ),
    slot: "mittag",
    robust: true,
    salty: true,
  },
  {
    id: "trockenfleisch",
    name: l4("Trockenfleisch", "Viande séchée", "Carne secca", "Dried meat"),
    slot: "mittag",
    robust: true,
    salty: true,
  },
  {
    id: "frischkaese",
    name: l4("Frischkäse", "Fromage frais", "Formaggio fresco", "Cream cheese"),
    slot: "mittag",
    needsCooling: true,
  },
  {
    id: "salat",
    name: l4(
      "Salat im Glas",
      "Salade en bocal",
      "Insalata in vasetto",
      "Salad in a jar"
    ),
    slot: "mittag",
    needsCooling: true,
  },
  {
    id: "hartgekochtes-ei",
    name: l4("Hartgekochtes Ei", "Œuf dur", "Uovo sodo", "Hard-boiled egg"),
    slot: "mittag",
    needsCooling: true,
  },
  {
    id: "brot",
    name: l4(
      "Brot oder Weggli",
      "Pain ou petit pain",
      "Pane o panino",
      "Bread or roll"
    ),
    slot: "mittag",
    robust: true,
    kidFriendly: true,
  },
  {
    id: "apfel",
    name: l4("Apfel", "Pomme", "Mela", "Apple"),
    slot: "znueni",
    robust: true,
    kidFriendly: true,
  },
  {
    id: "banane",
    name: l4("Banane", "Banane", "Banana", "Banana"),
    slot: "znueni",
    energyDense: true,
    kidFriendly: true,
  },
  {
    id: "ruebli",
    name: l4(
      "Rüebli-Stängeli",
      "Bâtonnets de carotte",
      "Bastoncini di carota",
      "Carrot sticks"
    ),
    slot: "znueni",
    robust: true,
    kidFriendly: true,
  },
  {
    id: "trauben",
    name: l4("Trauben", "Raisin", "Uva", "Grapes"),
    slot: "znueni",
    kidFriendly: true,
  },
  {
    id: "nuesse",
    name: l4("Nüsse", "Noix", "Noci", "Nuts"),
    slot: "znueni",
    robust: true,
    energyDense: true,
    salty: true,
  },
  {
    id: "trockenfruechte",
    name: l4("Trockenfrüchte", "Fruits secs", "Frutta secca", "Dried fruit"),
    slot: "znueni",
    robust: true,
    energyDense: true,
  },
  {
    id: "riegel",
    name: l4(
      "Müesliriegel",
      "Barre de céréales",
      "Barretta ai cereali",
      "Cereal bar"
    ),
    slot: "znueni",
    energyDense: true,
    kidFriendly: true,
    robust: true,
  },
  {
    id: "schokolade",
    name: l4("Schokolade", "Chocolat", "Cioccolato", "Chocolate"),
    slot: "znueni",
    meltsInHeat: true,
    energyDense: true,
    kidFriendly: true,
  },
  {
    id: "salzgebaeck",
    name: l4("Salzgebäck", "Biscuits salés", "Salatini", "Salty crackers"),
    slot: "znueni",
    robust: true,
    salty: true,
    kidFriendly: true,
  },
  {
    id: "joghurt",
    name: l4("Joghurt", "Yaourt", "Yogurt", "Yoghurt"),
    slot: "znueni",
    needsCooling: true,
    kidFriendly: true,
  },
];

export interface LunchboxInput {
  adults: number;
  children: number;
  length: TripLength;
  effort: Effort;
  /** Höchsttemperatur des Tages in Grad Celsius. */
  temperatureC: number;
  /** Kommt ein Kühlakku mit? Ohne ihn fällt Gekühltes weg. */
  coolPack: boolean;
}

export interface LunchboxItemPlan {
  item: LunchItem;
  /** Wie viele Portionen insgesamt (alle Personen zusammen). */
  portions: number;
}

export interface LunchboxPlan {
  /** Trinkmenge für alle zusammen, in Millilitern. */
  waterMl: number;
  /** Daraus: so viele Halbliter-Flaschen. */
  bottles: number;
  /** Vorschläge fürs Znüni und fürs Mittagessen. */
  znueni: LunchboxItemPlan[];
  mittag: LunchboxItemPlan[];
  /** Was sonst noch in den Rucksack gehört. */
  reminders: L4[];
  /** War es zu heiss für Schokolade und Co.? */
  hot: boolean;
}

/** Immer dabei, egal wie der Tag aussieht. */
const ALWAYS: L4[] = [
  l4("Abfallsack", "Sac à déchets", "Sacchetto per i rifiuti", "Rubbish bag"),
  l4("Taschenmesser", "Couteau de poche", "Coltellino", "Pocket knife"),
  l4("Feuchttücher", "Lingettes", "Salviette umide", "Wet wipes"),
];

/**
 * Personen zählen, wobei ein Kind rund zwei Drittel einer erwachsenen
 * Portion isst. Kein Naturgesetz, aber näher dran als «alle gleich viel».
 */
function portionUnits(adults: number, children: number): number {
  return adults + children * 0.66;
}

/** Aufrunden auf halbe Portionen – ein halber Apfel ist eine Menge. */
function roundPortions(value: number): number {
  return Math.max(1, Math.round(value * 2) / 2);
}

/**
 * Passt der Eintrag zum Tag? Hier fallen die Sachen heraus, die den
 * Ausflug verderben würden.
 */
function fits(item: LunchItem, input: LunchboxInput, hot: boolean): boolean {
  // Ohne Kühlung nichts, was gekühlt gehört – das ist keine Vorliebe
  if (item.needsCooling && !input.coolPack) return false;
  // Schokolade bei 30 Grad ist eine Pfütze, auch mit Kühlakku im Rucksack
  if (item.meltsInHeat && hot) return false;
  return true;
}

/**
 * Bewertung: Je besser ein Eintrag zum Tag passt, desto weiter vorne
 * steht er. Punkte statt Zufall, damit derselbe Tag denselben Vorschlag
 * ergibt – ein Planer, der bei jedem Öffnen etwas anderes sagt, ist
 * keiner.
 */
function score(item: LunchItem, input: LunchboxInput, hot: boolean): number {
  let points = 0;
  if (hot && item.salty) points += 3;
  if (input.effort !== "gemuetlich" && item.energyDense) points += 3;
  if (input.children > 0 && item.kidFriendly) points += 2;
  if (!input.coolPack && item.robust) points += 2;
  if (input.length === "langertag" && item.robust) points += 1;
  return points;
}

/** So viele Vorschläge je Mahlzeit – mehr wird zur Einkaufsliste. */
const SUGGESTIONS_PER_SLOT = 4;

export function lunchboxPlan(input: LunchboxInput): LunchboxPlan {
  const adults = Math.max(0, Math.round(input.adults));
  const children = Math.max(0, Math.round(input.children));
  const people = adults + children;
  const hot = input.temperatureC >= HOT_DAY_C;
  const { hours, meals } = TRIP_LENGTHS[input.length];
  const effort = EFFORTS[input.effort].factor;

  // ── Trinken ──
  const baseWater =
    adults * WATER_ML_PER_HOUR_ADULT * hours +
    children * WATER_ML_PER_HOUR_CHILD * hours;
  const waterMl = Math.round(baseWater * effort * (hot ? HOT_WATER_FACTOR : 1));
  const bottles = people === 0 ? 0 : Math.ceil(waterMl / BOTTLE_ML);

  // ── Essen ──
  const units = portionUnits(adults, children) * effort;
  const usable = LUNCH_ITEMS.filter(item => fits(item, input, hot));
  const pick = (slot: LunchItem["slot"], portionsEach: number) =>
    usable
      .filter(item => item.slot === slot)
      .map(item => ({ item, points: score(item, input, hot) }))
      // Bei Punktegleichstand entscheidet die Reihenfolge im Vorrat –
      // stabil sortiert, damit derselbe Tag denselben Vorschlag ergibt
      .sort((a, b) => b.points - a.points)
      .slice(0, SUGGESTIONS_PER_SLOT)
      .map(({ item }) => ({
        item,
        portions: roundPortions(units * portionsEach),
      }));

  // Znüni gibt es so oft, wie der Tag Pausen hat (Mittagessen abgezogen)
  const znueniRounds = Math.max(1, meals - (meals >= 3 ? 1 : 0));
  const znueni = people === 0 ? [] : pick("znueni", znueniRounds / 2);
  const mittag = people === 0 || meals < 3 ? [] : pick("mittag", 0.5);

  // ── Nicht vergessen ──
  const reminders: L4[] = [...ALWAYS];
  if (hot) {
    reminders.push(
      l4(
        "Sonnencreme und Kopfbedeckung",
        "Crème solaire et couvre-chef",
        "Crema solare e cappello",
        "Sunscreen and a hat"
      )
    );
  }
  if (!input.coolPack) {
    reminders.push(
      l4(
        "Ohne Kühlakku: nichts Gekühltes einpacken",
        "Sans pain de glace : ne rien emporter qui doive être réfrigéré",
        "Senza siberino: non portare nulla che vada refrigerato",
        "Without a cool pack: bring nothing that needs refrigerating"
      )
    );
  }
  if (input.effort === "anstrengend") {
    reminders.push(
      l4(
        "Etwas Salziges gegen den Schweissverlust",
        "Quelque chose de salé pour compenser la transpiration",
        "Qualcosa di salato per compensare il sudore",
        "Something salty to make up for sweating"
      )
    );
  }
  if (children > 0) {
    reminders.push(
      l4(
        "Für jedes Kind eine eigene Trinkflasche",
        "Une gourde par enfant",
        "Una borraccia per ogni bambino",
        "One water bottle per child"
      )
    );
  }

  return { waterMl, bottles, znueni, mittag, reminders, hot };
}

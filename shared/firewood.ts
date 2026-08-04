/**
 * Feuerholz-Bedarf schätzen (#287): wie viel Holz für wie viele Abende.
 *
 * WARUM: Holz kauft man vorher – am Platz kostet das Netz das Doppelte,
 * und am Sonntagabend ist der Kiosk zu. Die Frage ist nie «wie viel
 * verbrennt ein Feuer», sondern «wie viele Netze lege ich ins Auto».
 * Deshalb rechnet dieses Modul in NETZEN und nicht nur in Kilogramm.
 *
 * DIE ZAHLEN sind Faustwerte aus der Praxis, keine Physik. Wie viel Holz
 * wirklich draufgeht, hängt an Wind, Feuchte und daran, wer das Feuer
 * hütet – zwei gleich grosse Feuer können sich um die Hälfte
 * unterscheiden. Die Ansicht sagt das; eine Zahl mit zwei
 * Nachkommastellen wäre hier gelogen.
 *
 * AUFGERUNDET wird immer nach oben: Ein Netz zu viel steht nächstes Mal
 * noch da, ein Netz zu wenig beendet den Abend.
 */

/** Feuerarten mit ihrem Verbrauch in Kilogramm pro Stunde. */
export const FIRE_KINDS = {
  /** Kleines Kochfeuer: es geht um Glut unter dem Topf, nicht um Flammen. */
  kochfeuer: { kgPerHour: 2 },
  /** Feuerschale: begrenzt durch die Schale selbst. */
  feuerschale: { kgPerHour: 3 },
  /** Lagerfeuer, um das man am Abend sitzt. */
  lagerfeuer: { kgPerHour: 4.5 },
  /** Wärmefeuer im Herbst – gross, und es soll durchbrennen. */
  waermefeuer: { kgPerHour: 6.5 },
} as const;

export type FireKind = keyof typeof FIRE_KINDS;

/**
 * Holzarten. Weichholz brennt schneller ab – gleiche Wärme braucht mehr
 * Volumen und mehr Nachlegen; deshalb ein Faktor auf die Menge.
 */
export const WOOD_TYPES = {
  hart: { factor: 1 },
  weich: { factor: 1.3 },
  gemischt: { factor: 1.15 },
} as const;

export type WoodType = keyof typeof WOOD_TYPES;

/** Übliches Verkaufsgebinde: ein Netz Brennholz wiegt rund 10 kg. */
export const NET_WEIGHT_KG = 10;

/**
 * Anzündholz pro Feuer: eine Handvoll Späne und ein paar dünne Scheite.
 * Wer das vergisst, steht mit trockenem Buchenholz und ohne Glut da.
 */
export const KINDLING_KG_PER_FIRE = 0.5;

export interface FirewoodEstimate {
  /** Gesamtmenge Scheitholz in Kilogramm (aufgerundet auf 0,5 kg). */
  totalKg: number;
  /** Davon Anzündholz. */
  kindlingKg: number;
  /** Netze à 10 kg, aufgerundet – so kauft man es. */
  nets: number;
  /** Kilogramm pro Abend, für die Einordnung. */
  kgPerEvening: number;
}

/** Auf halbe Kilogramm aufrunden – feiner wäre Scheingenauigkeit. */
function roundUpHalf(value: number): number {
  return Math.ceil(value * 2) / 2;
}

/**
 * Holzbedarf für eine Reise.
 *
 * `evenings` sind die Abende MIT Feuer, nicht die Nächte der Reise – bei
 * Regen oder Feuerverbot brennt gar nichts, und das weiss nur die Person
 * selbst.
 */
export function firewoodEstimate(input: {
  evenings: number;
  hoursPerEvening: number;
  kind: FireKind;
  wood: WoodType;
}): FirewoodEstimate {
  const evenings = Math.max(0, Math.round(input.evenings));
  const hours = Math.max(0, input.hoursPerEvening);
  if (evenings === 0 || hours === 0) {
    return { totalKg: 0, kindlingKg: 0, nets: 0, kgPerEvening: 0 };
  }
  const perEvening =
    FIRE_KINDS[input.kind].kgPerHour * hours * WOOD_TYPES[input.wood].factor;
  const kindlingKg = roundUpHalf(evenings * KINDLING_KG_PER_FIRE);
  const totalKg = roundUpHalf(perEvening * evenings) + kindlingKg;
  return {
    totalKg,
    kindlingKg,
    nets: Math.ceil(totalKg / NET_WEIGHT_KG),
    kgPerEvening: roundUpHalf(perEvening),
  };
}

/**
 * Reicht ein bestimmter Vorrat? Liefert die Abende, die damit möglich
 * sind – die Frage stellt sich am dritten Tag, wenn noch zwei Netze
 * dastehen.
 */
export function eveningsFromStock(input: {
  stockKg: number;
  hoursPerEvening: number;
  kind: FireKind;
  wood: WoodType;
}): number {
  const hours = Math.max(0, input.hoursPerEvening);
  if (hours === 0 || !(input.stockKg > 0)) return 0;
  const perEvening =
    FIRE_KINDS[input.kind].kgPerHour * hours * WOOD_TYPES[input.wood].factor +
    KINDLING_KG_PER_FIRE;
  // Abgerundet: ein halber Abend Feuer ist kein Abend Feuer
  return Math.floor(input.stockKg / perEvening);
}

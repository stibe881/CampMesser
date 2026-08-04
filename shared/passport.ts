/**
 * Kinder-Reisepass (#292): für jeden besuchten Platz ein Stempel.
 *
 * KEINE NEUE DATENHALTUNG. Die Stempel entstehen aus den Reisen, die
 * ohnehin im Tagebuch stehen – wer einen Platz einträgt, hat den Stempel
 * damit verdient. Alles andere hiesse, dasselbe zweimal zu erfassen, und
 * genau das lässt man beim Camping bleiben.
 *
 * WARUM EIN STEMPEL UND KEINE ZEILE: Weil ein Pass mit Stempeln etwas
 * ist, das man herzeigt. Deshalb bekommt jeder Platz ein eigenes
 * Aussehen – Form, Farbe und eine leichte Schräglage, wie von Hand
 * aufgedrückt. Das Aussehen wird aus dem NAMEN gerechnet, nicht
 * gewürfelt: Derselbe Platz sieht auf jedem Gerät und nach jedem Neuladen
 * gleich aus. Ein Stempel, der bei jedem Öffnen anders aussieht, wäre
 * kein Stempel.
 */
import { l4, type L4 } from "./i18n";
import { tripNights, type TripLike } from "./trips";

/** So viele Stempelformen gibt es. */
export const STAMP_SHAPES = ["kreis", "zackenrad", "wappen", "raute"] as const;
export type StampShape = (typeof STAMP_SHAPES)[number];

/** Und so viele Farben – bewusst wenige, sonst wird der Pass unruhig. */
export const STAMP_COLORS = [
  "#2f6b4f",
  "#b45309",
  "#1d4ed8",
  "#9d174d",
  "#4d7c0f",
  "#7c3aed",
] as const;

/** Wie schräg ein Stempel höchstens sitzt, in Grad. */
export const MAX_TILT_DEG = 12;

export interface PassportStamp {
  /** Platzname – zugleich der Schlüssel. */
  place: string;
  /** Datum des ERSTEN Besuchs (ISO). */
  firstVisit: string;
  /** Datum des letzten Besuchs (ISO). */
  lastVisit: string;
  /** Wie oft war die Familie da? */
  visits: number;
  /** Wie viele Nächte insgesamt? */
  nights: number;
  /** Aussehen, aus dem Namen gerechnet. */
  shape: StampShape;
  color: string;
  /** Schräglage in Grad, negativ oder positiv. */
  tiltDeg: number;
}

/**
 * Einfacher, stabiler Hash über den Namen (FNV-1a). Muss nicht sicher
 * sein – nur überall dasselbe Ergebnis liefern.
 */
export function stampHash(name: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    // FNV-Primzahl, in 32 Bit gehalten
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Aussehen eines Stempels aus seinem Namen. */
export function stampLook(name: string): {
  shape: StampShape;
  color: string;
  tiltDeg: number;
} {
  const hash = stampHash(name);
  const tiltSteps = 2 * MAX_TILT_DEG + 1;
  return {
    shape: STAMP_SHAPES[hash % STAMP_SHAPES.length],
    color: STAMP_COLORS[Math.floor(hash / 4) % STAMP_COLORS.length],
    tiltDeg: (Math.floor(hash / 64) % tiltSteps) - MAX_TILT_DEG,
  };
}

/**
 * Aus den Reisen die Stempelseite bauen.
 *
 * ZUSAMMENGEFASST WIRD NACH PLATZNAME: Wer dreimal am selben See war, hat
 * einen Stempel mit einer Drei, keine drei gleichen Stempel. Reisen ohne
 * Platznamen zählen nicht – ein Stempel ohne Ort wäre keiner.
 *
 * Sortiert nach dem ERSTEN Besuch: Der Pass liest sich von vorne, wie
 * eine Reihe von Ereignissen.
 */
export function buildPassport(trips: readonly TripLike[]): PassportStamp[] {
  const byPlace = new Map<string, PassportStamp>();
  trips.forEach(trip => {
    const place = (trip.placeName ?? "").trim();
    if (!place) return;
    const nights = Math.max(0, tripNights(trip.startDate, trip.endDate));
    const existing = byPlace.get(place);
    if (existing) {
      existing.visits += 1;
      existing.nights += nights;
      if (trip.startDate < existing.firstVisit) {
        existing.firstVisit = trip.startDate;
      }
      if (trip.startDate > existing.lastVisit) {
        existing.lastVisit = trip.startDate;
      }
      return;
    }
    byPlace.set(place, {
      place,
      firstVisit: trip.startDate,
      lastVisit: trip.startDate,
      visits: 1,
      nights,
      ...stampLook(place),
    });
  });

  const stamps: PassportStamp[] = [];
  byPlace.forEach(stamp => stamps.push(stamp));
  return stamps.sort(
    (a, b) =>
      (a.firstVisit < b.firstVisit
        ? -1
        : a.firstVisit > b.firstVisit
          ? 1
          : 0) || (a.place < b.place ? -1 : 1)
  );
}

export interface PassportRank {
  /** Ab so vielen Plätzen. */
  places: number;
  title: L4;
}

/**
 * Titel im Pass. Die Stufen stehen bewusst eng beieinander: Der erste
 * Stempel soll etwas bedeuten, und die zweite Stufe muss erreichbar sein,
 * sonst hört ein Kind auf hinzuschauen.
 */
export const PASSPORT_RANKS: PassportRank[] = [
  {
    places: 1,
    title: l4(
      "Erstcamper",
      "Premier campeur",
      "Primo campeggiatore",
      "First-time camper"
    ),
  },
  {
    places: 3,
    title: l4(
      "Zeltgast",
      "Habitué des tentes",
      "Ospite in tenda",
      "Tent guest"
    ),
  },
  {
    places: 6,
    title: l4(
      "Platz-Entdecker",
      "Explorateur de campings",
      "Esploratore di campeggi",
      "Site explorer"
    ),
  },
  {
    places: 12,
    title: l4(
      "Weitgereist",
      "Grand voyageur",
      "Gran viaggiatore",
      "Well travelled"
    ),
  },
  {
    places: 25,
    title: l4(
      "Camping-Meister",
      "Maître du camping",
      "Maestro del campeggio",
      "Camping master"
    ),
  },
];

/** Aktueller Titel – null, solange kein Stempel im Pass steht. */
export function passportRank(places: number): PassportRank | null {
  let current: PassportRank | null = null;
  PASSPORT_RANKS.forEach(rank => {
    if (places >= rank.places) current = rank;
  });
  return current;
}

/** Die nächste Stufe und wie viele Plätze noch fehlen. */
export function nextRank(
  places: number
): { rank: PassportRank; missing: number } | null {
  const next = PASSPORT_RANKS.find(rank => places < rank.places);
  return next ? { rank: next, missing: next.places - places } : null;
}

export interface PassportSummary {
  stamps: PassportStamp[];
  places: number;
  nights: number;
  /** Erster und letzter Besuch über alle Stempel; null ohne Stempel. */
  firstVisit: string | null;
  lastVisit: string | null;
  rank: PassportRank | null;
  next: { rank: PassportRank; missing: number } | null;
}

export function passportSummary(trips: readonly TripLike[]): PassportSummary {
  const stamps = buildPassport(trips);
  const nights = stamps.reduce((sum, stamp) => sum + stamp.nights, 0);
  const lastVisit = stamps.reduce<string | null>(
    (latest, stamp) =>
      latest == null || stamp.lastVisit > latest ? stamp.lastVisit : latest,
    null
  );
  return {
    stamps,
    places: stamps.length,
    nights,
    firstVisit: stamps.length > 0 ? stamps[0].firstVisit : null,
    lastVisit,
    rank: passportRank(stamps.length),
    next: nextRank(stamps.length),
  };
}

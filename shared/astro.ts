/**
 * Astro-Kalender: die grossen jährlichen Sternschnuppen-Ströme mit Maximum,
 * Raten und Beobachtungstipps – statische Daten, offline berechenbar.
 * Die Mondstörung am Maximum kommt aus shared/moon.ts.
 */
import { getMoonInfo } from "./moon";

export interface MeteorShower {
  id: string;
  name: string;
  /** Maximum (Monat 1–12, Tag) – jährlich ungefähr gleich */
  peakMonth: number;
  peakDay: number;
  /** Aktivitätszeitraum */
  fromMonth: number;
  fromDay: number;
  toMonth: number;
  toDay: number;
  /** Zenitstundenrate: Sternschnuppen pro Stunde unter Idealbedingungen */
  zhr: number;
  /** Herkunftsrichtung am Himmel (Radiant) als Alltagstext */
  radiant: string;
  tip: string;
}

export const meteorShowers: MeteorShower[] = [
  { id: "quadrantiden", name: "Quadrantiden", peakMonth: 1, peakDay: 3, fromMonth: 12, fromDay: 28, toMonth: 1, toDay: 12, zhr: 110, radiant: "Nordosten (unterhalb des Grossen Wagens)", tip: "Kurzes, scharfes Maximum von wenigen Stunden – die zweite Nachthälfte lohnt sich am meisten." },
  { id: "lyriden", name: "Lyriden", peakMonth: 4, peakDay: 22, fromMonth: 4, fromDay: 14, toMonth: 4, toDay: 30, zhr: 18, radiant: "Osten (beim hellen Stern Wega)", tip: "Erster grösserer Strom im Frühling – gelegentlich helle Feuerkugeln." },
  { id: "eta-aquariiden", name: "Eta-Aquariiden", peakMonth: 5, peakDay: 6, fromMonth: 4, fromDay: 19, toMonth: 5, toDay: 28, zhr: 50, radiant: "Osten, tief am Horizont", tip: "Staub des Halleyschen Kometen – am besten in den letzten zwei Stunden vor der Morgendämmerung." },
  { id: "delta-aquariiden", name: "Delta-Aquariiden", peakMonth: 7, peakDay: 30, fromMonth: 7, fromDay: 12, toMonth: 8, toDay: 23, zhr: 25, radiant: "Süden", tip: "Breites Maximum ohne Spitze – über mehrere Nächte gleich gut zu sehen." },
  { id: "perseiden", name: "Perseiden", peakMonth: 8, peakDay: 12, fromMonth: 7, fromDay: 17, toMonth: 8, toDay: 24, zhr: 100, radiant: "Nordosten (Sternbild Perseus)", tip: "Der Klassiker der Camping-Saison: warme Nächte, hohe Raten – Liegestuhl raus ab 22 Uhr." },
  { id: "draconiden", name: "Draconiden", peakMonth: 10, peakDay: 8, fromMonth: 10, fromDay: 6, toMonth: 10, toDay: 10, zhr: 10, radiant: "Nordwesten (Sternbild Drache)", tip: "Ausnahme-Strom: am besten am frühen Abend statt nach Mitternacht." },
  { id: "orioniden", name: "Orioniden", peakMonth: 10, peakDay: 21, fromMonth: 10, fromDay: 2, toMonth: 11, toDay: 7, zhr: 20, radiant: "Osten (oberhalb des Orion)", tip: "Schnelle, oft helle Meteore – ebenfalls Staub des Halleyschen Kometen." },
  { id: "leoniden", name: "Leoniden", peakMonth: 11, peakDay: 17, fromMonth: 11, fromDay: 6, toMonth: 11, toDay: 30, zhr: 15, radiant: "Osten (Sternbild Löwe)", tip: "Sehr schnelle Meteore mit langen Leuchtspuren – zweite Nachthälfte." },
  { id: "geminiden", name: "Geminiden", peakMonth: 12, peakDay: 13, fromMonth: 12, fromDay: 4, toMonth: 12, toDay: 17, zhr: 150, radiant: "Osten (Sternbild Zwillinge)", tip: "Der stärkste Strom des Jahres – lohnt sich trotz Kälte schon ab dem frühen Abend." },
  { id: "ursiden", name: "Ursiden", peakMonth: 12, peakDay: 22, fromMonth: 12, fromDay: 17, toMonth: 12, toDay: 26, zhr: 10, radiant: "Norden (Kleiner Wagen)", tip: "Kleiner, oft übersehener Strom in den längsten Nächten des Jahres." },
];

export interface UpcomingShower {
  shower: MeteorShower;
  /** Nächstes Maximum (heute oder in der Zukunft) */
  peakDate: Date;
  daysUntilPeak: number;
  /** Ist der Strom am Stichtag bereits aktiv? */
  activeNow: boolean;
  /** Mondbeleuchtung am Maximum (0–1) */
  moonIllumination: number;
  /** Stört der Mond die Beobachtung deutlich (> 60 % beleuchtet)? */
  moonInterferes: boolean;
}

const DAY_MS = 86400000;

function nextPeakDate(shower: MeteorShower, from: Date): Date {
  const candidate = new Date(from.getFullYear(), shower.peakMonth - 1, shower.peakDay);
  if (candidate.getTime() < from.getTime() - DAY_MS / 2) {
    return new Date(from.getFullYear() + 1, shower.peakMonth - 1, shower.peakDay);
  }
  return candidate;
}

/** Liegt das Datum im Aktivitätszeitraum (auch über den Jahreswechsel)? */
export function isShowerActive(shower: MeteorShower, date: Date): boolean {
  const dayKey = (date.getMonth() + 1) * 100 + date.getDate();
  const fromKey = shower.fromMonth * 100 + shower.fromDay;
  const toKey = shower.toMonth * 100 + shower.toDay;
  if (fromKey <= toKey) return dayKey >= fromKey && dayKey <= toKey;
  // Zeitraum über den Jahreswechsel (z. B. Quadrantiden Ende Dez. – Mitte Jan.)
  return dayKey >= fromKey || dayKey <= toKey;
}

/** Die nächsten Strom-Maxima ab Stichtag, sortiert nach Nähe. */
export function upcomingShowers(from: Date, count = 4): UpcomingShower[] {
  const startOfDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return meteorShowers
    .map(shower => {
      const peakDate = nextPeakDate(shower, startOfDay);
      const moon = getMoonInfo(peakDate);
      return {
        shower,
        peakDate,
        daysUntilPeak: Math.round((peakDate.getTime() - startOfDay.getTime()) / DAY_MS),
        activeNow: isShowerActive(shower, startOfDay),
        moonIllumination: moon.illumination,
        moonInterferes: moon.illumination > 0.6,
      };
    })
    .sort((a, b) => a.daysUntilPeak - b.daysUntilPeak)
    .slice(0, count);
}

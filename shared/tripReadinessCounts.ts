/**
 * Die Bereitschafts-Zahlen aller Reisen auf einmal (#362).
 *
 * WARUM ES DAS BRAUCHT: Die Bereitschafts-Karte nannte die Zahl der
 * offenen Punkte nur, wenn man sie AUFKLAPPTE – ihre drei Abfragen hängen
 * an `enabled: open`. Zugeklappt stand dort «Bereitschaft» und sonst
 * nichts, also klappte man jede Reise einzeln auf, um zu sehen, wo noch
 * etwas fehlt. Genau derselbe Fehler wie beim Reisekassen-Betrag (#345),
 * und dieselbe Antwort: EINE Abfrage für ALLE Reisen.
 *
 * KORREKTUR ZU #346: Dort steht am Endpunkt `trips.counts` geschrieben,
 * die Bereitschaft bleibe bewusst draussen – ihr Stand hänge an Packliste,
 * Menüplan und Einkaufsliste, und das für zwanzig Reisen vorzurechnen sei
 * zu viel. Der erste Teil stimmt, der Schluss nicht: Vorgerechnet werden
 * muss gar nichts. Der Server zählt drei Zahlen je Reise, die Bewertung
 * macht weiterhin `tripReadiness()` im Browser – dieselbe Funktion wie
 * beim aufgeklappten Abschnitt, also kann beides nicht auseinanderlaufen.
 * Und es betrifft nur Reisen, die noch nicht vorbei sind; die
 * Bereitschafts-Karte gibt es bei den vergangenen ohnehin nicht.
 *
 * FEHLENDE REISEN SIND NULLEN, nicht Lücken – wie in `tripSectionCounts`.
 */
import { countMainSlots, type MenuSlotLike } from "./tripReadiness";
import { tripDays } from "./menuPlan";

/** Was der Aufrufer über eine Reise weiss, bevor gezählt wird. */
export interface ReadinessTripLike {
  id: number;
  startDate: string;
  endDate: string;
  packListId: number | null;
}

/** Rohform aus der Datenbank: pro Bereich eine Liste. */
export interface TripReadinessRaw {
  /** Packlisten-Stand je LISTE (nicht je Reise – Listen sind teilbar). */
  packLists: readonly { listId: number; checked: number; total: number }[];
  /** Belegte Menüplan-Slots als Rohzeilen (Tag + Mahlzeit). */
  menuSlots: readonly (MenuSlotLike & { tripId: number })[];
  /** Reise-Einkaufsliste je Reise. */
  shopping: readonly { tripId: number; open: number; total: number }[];
}

/** Eine Zeile je Reise – genau die Eingaben, die `tripReadiness()` braucht. */
export interface TripReadinessCounts {
  tripId: number;
  /** null = keine Packliste verknüpft (die Zeile gilt dann als offen). */
  packList: { checked: number; total: number } | null;
  menu: { mainSlots: number; emptySlots: number };
  shopping: { open: number; total: number };
}

export function buildTripReadinessCounts(
  trips: readonly ReadinessTripLike[],
  raw: TripReadinessRaw
): TripReadinessCounts[] {
  const packByList = new Map(raw.packLists.map(row => [row.listId, row]));
  const slotsByTrip = new Map<number, MenuSlotLike[]>();
  raw.menuSlots.forEach(slot => {
    const list = slotsByTrip.get(slot.tripId);
    if (list) list.push(slot);
    else slotsByTrip.set(slot.tripId, [slot]);
  });
  const shoppingByTrip = new Map(raw.shopping.map(row => [row.tripId, row]));

  return trips.map(trip => {
    const pack =
      trip.packListId === null ? null : packByList.get(trip.packListId);
    const shopping = shoppingByTrip.get(trip.id);
    return {
      tripId: trip.id,
      // Verknüpft, aber (noch) leer: {0,0} statt null – «keine Liste» und
      // «leere Liste» sind zwei verschiedene Meldungen im Cockpit.
      packList:
        trip.packListId === null
          ? null
          : { checked: pack?.checked ?? 0, total: pack?.total ?? 0 },
      menu: countMainSlots(
        tripDays(trip.startDate, trip.endDate),
        slotsByTrip.get(trip.id) ?? []
      ),
      shopping: {
        open: shopping?.open ?? 0,
        total: shopping?.total ?? 0,
      },
    };
  });
}

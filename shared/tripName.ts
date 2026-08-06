import { l4, pick, type Language } from "./i18n";

/**
 * Wie eine Reise heisst (#329).
 *
 * WARUM DAS EINE EIGENE DATEI IST: Es gab davon neun Fassungen. Nicht
 * neun Aufrufe – neun ausgeschriebene `||`-Ketten mit drei verschiedenen
 * Reihenfolgen und vier verschiedenen Notlösungstexten, verteilt über
 * `Trips.tsx`, `Today.tsx`, `MenuPlan.tsx`, `TripShopping.tsx`,
 * `Hike.tsx`, `ShareTarget.tsx`, `ShoppingBookingDialog.tsx`,
 * `TripPrint.tsx` und `shared/widgetData.ts`. Zusammen 74 Fundstellen.
 *
 * WAS DAS ANRICHTETE, sieht man am selben Aufenthalt an zwei Orten: Auf
 * der Heute-Ansicht hiess er «Ohne Namen», auf der Reisen-Seite nach
 * seinem Zeltplatz. Das wirkt wie zwei verschiedene Reisen. Und wer eine
 * Reihenfolge ändert – etwa `location` vor `spotName` –, ändert sie nur
 * an einer von neun Stellen und merkt es nicht.
 *
 * ZWEI FRAGEN, ZWEI FUNKTIONEN: «Wie heisst die Reise» ist nicht «Wo ist
 * sie». Der Titel ist ein freier Name («Sommerferien»), der Ort ein
 * geografischer. Wer eine Landeskennung raten oder «Läden in der Nähe von
 * X» schreiben will, braucht den Ort – der Titel wäre dort irreführend.
 *
 * DER AUFGELÖSTE FAVORIT hat Vorrang vor `spotName`: Wird ein
 * Zeltplatz-Favorit umbenannt, steht in der Reise noch der alte Name.
 * Wer die Favoriten-Liste geladen hat, reicht den frischen Namen als
 * dritten Parameter durch; wer sie nicht hat (geteilte Reise, Widget),
 * lässt ihn weg und bekommt, was der Server mitgeliefert hat.
 */

export interface TripNameLike {
  /** Frei gewählter Name der Reise. */
  title?: string | null;
  /** Name des verknüpften Zeltplatzes, wie ihn der Server mitliefert. */
  spotName?: string | null;
  /** Freitext-Ort, wenn kein Favorit verknüpft ist. */
  location?: string | null;
}

/** Wenn nichts bekannt ist – ein Aufenthalt bleibt ein Aufenthalt. */
const NAME_FALLBACK = l4("Aufenthalt", "Séjour", "Soggiorno", "Stay");

/** Für die Ortsfrage: Hier gibt es keinen neutralen Namen. */
const PLACE_FALLBACK = l4(
  "Unbekannter Ort",
  "Lieu inconnu",
  "Luogo sconosciuto",
  "Unknown place"
);

/** Erster nicht-leerer Eintrag, sauber beschnitten. */
function firstFilled(values: readonly (string | null | undefined)[]) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/**
 * WO die Reise stattfindet: Zeltplatz, sonst Freitext-Ort.
 *
 * Ohne den Titel – der ist ein Name, kein Ort. «Sommerferien» als
 * Ortsangabe an eine Umkreissuche zu geben, liefert Unsinn.
 */
export function tripPlaceName(
  trip: TripNameLike,
  lang: Language,
  resolvedSpotName?: string | null
): string {
  return (
    firstFilled([resolvedSpotName, trip.spotName, trip.location]) ??
    pick(PLACE_FALLBACK, lang)
  );
}

/**
 * WIE die Reise heisst: eigener Titel, sonst der Ort.
 *
 * Der Titel gewinnt, weil ihn jemand bewusst gesetzt hat. Fehlt er, ist
 * der Zeltplatz die nächstbeste Antwort auf «welche Reise ist das» –
 * besser als «Ohne Namen», das nichts unterscheidet.
 */
export function tripDisplayName(
  trip: TripNameLike,
  lang: Language,
  resolvedSpotName?: string | null
): string {
  return (
    firstFilled([trip.title, resolvedSpotName, trip.spotName, trip.location]) ??
    pick(NAME_FALLBACK, lang)
  );
}

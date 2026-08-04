/**
 * Reise-Vorlagen (#284): «Wochenende», «Sommerferien» und Verwandte als
 * Muster mit Dauer, Packliste und Menüplan.
 *
 * WARUM: Eine neue Reise anzulegen ist heute drei Arbeitsschritte –
 * Zeitraum eintragen, Packliste erstellen, Menüplan füllen. Wer zweimal im
 * Jahr wegfährt, macht das gern; wer jedes zweite Wochenende losfährt,
 * lässt es irgendwann und zieht ohne Liste los. Die Vorlage macht aus den
 * drei Schritten einen.
 *
 * DIE DAUER ist der Kern: «Wochenende» heisst zwei Nächte, und daraus
 * ergeben sich Abreisetag, Anzahl Abendessen und Anzahl Frühstücke. Alles
 * andere hängt daran.
 *
 * MITTAGESSEN werden bewusst NICHT vorbelegt. Unterwegs isst man mittags,
 * was der Tag hergibt – Reste, ein Brot am See, eine Wurst vom Grill.
 * Slots mit erfundenen Gerichten zu füllen, die dann jede und jeder wieder
 * löscht, wäre Arbeit statt Hilfe.
 *
 * Die Vorlagen sind Vorschläge, keine Vorschriften: Nach dem Anlegen ist
 * alles ganz normal änderbar – Zeitraum, Liste, jeder einzelne Menü-Slot.
 */
import { l4, type L4 } from "./i18n";
import { addDaysIso } from "./ics";

export interface TripTemplate {
  id: string;
  title: L4;
  description: L4;
  /** Nächte, nicht Tage: «Wochenende» sind zwei Nächte und drei Tage. */
  nights: number;
  /** Vorgeschlagenes Packlisten-Szenario (id aus shared/packTemplates.ts). */
  packScenario: string;
  /** Abendessen der Reihe nach; kürzere Listen wiederholen sich. */
  dinners: string[];
  /** Frühstücke der Reihe nach; kürzere Listen wiederholen sich. */
  breakfasts: string[];
  /** Lucide-Symbolname für die Auswahl. */
  icon: string;
}

/**
 * Vier Muster decken ab, was in der Praxis vorkommt. Mehr Vorlagen hiessen
 * mehr Auswahl und nicht mehr Hilfe – wer ein eigenes Muster braucht, legt
 * eine Reise an und dupliziert sie später (#141).
 */
export const tripTemplates: TripTemplate[] = [
  {
    id: "wochenende",
    title: l4("Wochenende", "Week-end", "Fine settimana", "Weekend"),
    description: l4(
      "Zwei Nächte, Freitag bis Sonntag – Packliste für die Familie und zwei Abendessen.",
      "Deux nuits, du vendredi au dimanche – liste de bagages famille et deux repas du soir.",
      "Due notti, dal venerdì alla domenica – lista bagagli famiglia e due cene.",
      "Two nights, Friday to Sunday – family packing list and two dinners."
    ),
    nights: 2,
    packScenario: "familie",
    dinners: ["one-pot-pasta", "folienkartoffeln"],
    breakfasts: ["porridge", "camping-pancakes"],
    icon: "CalendarDays",
  },
  {
    id: "kurztrip-solo",
    title: l4(
      "Kurztrip allein",
      "Escapade en solo",
      "Fuga in solitaria",
      "Short solo trip"
    ),
    description: l4(
      "Zwei Nächte mit leichtem Gepäck – alles, was du selber trägst.",
      "Deux nuits en bagage léger – tout ce que tu portes toi-même.",
      "Due notti con bagaglio leggero – tutto quello che porti da solo.",
      "Two nights travelling light – everything you carry yourself."
    ),
    nights: 2,
    packScenario: "solo",
    dinners: ["linsen-dal", "gemuese-couscous"],
    breakfasts: ["porridge", "birchermuesli-overnight"],
    icon: "Backpack",
  },
  {
    id: "woche",
    title: l4("Eine Woche", "Une semaine", "Una settimana", "One week"),
    description: l4(
      "Sieben Nächte am selben Platz – Menüplan mit abwechselnden Abendessen.",
      "Sept nuits au même endroit – menu avec des repas du soir variés.",
      "Sette notti nello stesso posto – menu con cene diverse.",
      "Seven nights in one place – menu plan with varied dinners."
    ),
    nights: 7,
    packScenario: "familie",
    dinners: [
      "one-pot-pasta",
      "aelplermagronen",
      "chili-sin-carne",
      "pfannen-pizza",
      "curry-kokos",
      "raclette-pfaennli",
      "camp-minestrone",
    ],
    breakfasts: [
      "porridge",
      "camping-pancakes",
      "birchermuesli-overnight",
      "roesti-spiegelei",
    ],
    icon: "CalendarRange",
  },
  {
    id: "sommerferien",
    title: l4(
      "Sommerferien",
      "Vacances d'été",
      "Vacanze estive",
      "Summer holidays"
    ),
    description: l4(
      "Vierzehn Nächte – lange Liste, grosser Menüplan, Wäsche und Vorrat eingerechnet.",
      "Quatorze nuits – longue liste, grand menu, lessive et provisions comprises.",
      "Quattordici notti – lista lunga, menu grande, bucato e scorte inclusi.",
      "Fourteen nights – long list, big menu plan, laundry and supplies included."
    ),
    nights: 14,
    packScenario: "familie",
    dinners: [
      "one-pot-pasta",
      "grill-ananas",
      "chili-sin-carne",
      "aelplermagronen",
      "poulet-reis-pfanne",
      "pfannen-pizza",
      "linsen-dal",
      "steckerlfisch",
      "curry-kokos",
      "ghackets-hoernli",
      "camp-minestrone",
      "raclette-pfaennli",
      "gerstensuppe",
      "feuerspiess",
    ],
    breakfasts: [
      "porridge",
      "camping-pancakes",
      "birchermuesli-overnight",
      "roesti-spiegelei",
      "fotzelschnitten",
      "eier-broetli",
    ],
    icon: "Sun",
  },
];

/** Vorlage nachschlagen; unbekannte Ids ergeben undefined. */
export function tripTemplateById(id: string): TripTemplate | undefined {
  return tripTemplates.find(t => t.id === id);
}

/** Abreisetag aus Anreise und Nächten. */
export function templateEndDate(startDate: string, nights: number): string {
  return addDaysIso(startDate, Math.max(0, Math.round(nights)));
}

export interface TemplateMenuEntry {
  day: string;
  meal: "breakfast" | "dinner";
  recipeId: string;
}

/**
 * Menüplan der Vorlage auf echte Tage legen.
 *
 * ABENDESSEN gibt es an jedem Abend, an dem man dort ÜBERNACHTET – also
 * vom Anreisetag bis zum Vorabend der Abreise. Am Abreisetag isst man
 * nicht mehr auf dem Platz zu Abend.
 *
 * FRÜHSTÜCK gibt es an jedem Morgen NACH einer Nacht – also ab dem zweiten
 * Tag bis und mit Abreisetag. Am Anreisetag ist man morgens noch daheim.
 *
 * Diese beiden Sätze sind der ganze Trick: Ein Menüplan, der am
 * Anreisemorgen ein Frühstück vorsieht, ist falsch, und einer ohne
 * Frühstück am Abreisetag lässt den Morgen leer, an dem die Kinder am
 * hungrigsten sind.
 */
export function templateMenuPlan(
  template: TripTemplate,
  startDate: string
): TemplateMenuEntry[] {
  const entries: TemplateMenuEntry[] = [];
  const nights = Math.max(0, Math.round(template.nights));
  for (let night = 0; night < nights; night++) {
    if (template.dinners.length > 0) {
      entries.push({
        day: addDaysIso(startDate, night),
        meal: "dinner",
        recipeId: template.dinners[night % template.dinners.length],
      });
    }
    if (template.breakfasts.length > 0) {
      entries.push({
        day: addDaysIso(startDate, night + 1),
        meal: "breakfast",
        recipeId: template.breakfasts[night % template.breakfasts.length],
      });
    }
  }
  return entries;
}

/**
 * Vorschlag für den Namen der Packliste: «Wochenende – 12.06.» hilft
 * später beim Wiederfinden mehr als fünfmal «Familie».
 */
export function templateListName(title: string, startDate: string): string {
  const day = startDate.slice(8, 10);
  const month = startDate.slice(5, 7);
  return `${title} ${day}.${month}.`.slice(0, 120);
}

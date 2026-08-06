import { l4, pick, type Language } from "./i18n";
import { daysUntilTrip, currentTripDay } from "./trips";
import { expiryInfo } from "./food";
import { gearTaskDue, type GearTaskLike } from "./gearTasks";
import type { WidgetTask } from "./widgetActions";
import { tripDisplayName } from "./tripName";

/**
 * Die Nutzlast für die iPhone-Widgets (#323).
 *
 * DAS WIDGET BEKOMMT TEXT, KEINE DATEN. Das ist die zentrale Entscheidung
 * hier, und sie hat einen handfesten Grund: Ein WidgetKit-Widget ist Swift
 * und lebt in einer eigenen Erweiterung – es hat keinen Zugriff auf die
 * Übersetzungen der Web-App, nicht auf `Intl`, nicht auf die Logik in
 * `shared/`. Würde es Zahlen und Datumsangaben bekommen, müsste die halbe
 * App in Swift nachgebaut werden: vier Sprachen, Pluralformen,
 * Datumsformate – und beim nächsten Textwechsel driften die beiden
 * Fassungen auseinander, ohne dass es jemand merkt.
 *
 * Deshalb rechnet und formuliert die Web-App fertig, und das Widget malt
 * nur noch. Es kennt keine Reise, keinen Zeitplan und keine Sprache – es
 * kennt eine Überschrift, eine Zeile darunter und eine Zahl für den Ring.
 *
 * WAS DAS KOSTET: Nach einem Sprachwechsel stehen die alten Texte im
 * Widget, bis die App das nächste Mal offen war. Das ist verkraftbar –
 * die Alternative wäre eine zweite, stillschweigend veraltende
 * Übersetzung im Swift-Teil.
 *
 * WAS DRIN STEHT, ist bewusst knapp: Ein Widget wird im Vorbeigehen
 * angeschaut. Zwei Fragen beantwortet es, mehr nicht – «wann geht es los
 * und bin ich bereit» und «muss ich etwas aufbrauchen oder pflegen».
 *
 * DAZU EINE LISTE ZUM ABHAKEN (#327): Seit iOS 17 kann ein Widget etwas
 * TUN. Was dort steht, hängt davon ab, wo man gerade steht – vor der
 * Reise die nächsten offenen Punkte der Packliste, während der Reise die
 * heutigen Ämtli. Beides sind Handgriffe, die man im Vorbeigehen macht,
 * und beide sind idempotent: «Eintrag 42 ist abgehakt» schadet doppelt
 * geschickt nicht.
 */

/** Ein Widget-Feld: grosse Zahl, Titel, Zeile darunter. */
export interface WidgetPanel {
  /** Blickfang – Zahl oder kurzes Zeichen («3», «heute», «–»). */
  value: string;
  /** Worum es geht («Seeblick», «Kühlbox»). */
  title: string;
  /** Ergänzung in klein («Packliste 60 %», «2 laufen morgen ab»). */
  subtitle: string;
  /** Ziel beim Antippen – ein Pfad der App. */
  url: string;
}

/** Fortschritts-Ring, 0–1; null = keiner. */
export interface WidgetProgress {
  ratio: number;
  label: string;
}

export interface WidgetPayload {
  /** Fassung der Nutzlast; das Swift-Teil prüft sie, bevor es zeichnet. */
  version: 2;
  /** Wann gebaut (ISO) – das Widget zeigt es nicht, aber es hilft beim Suchen. */
  builtAt: string;
  trip: WidgetPanel;
  /** Packstand der kommenden Reise; null = keine Liste verknüpft. */
  packing: WidgetProgress | null;
  supplies: WidgetPanel;
  /** Überschrift über der Liste zum Abhaken. */
  tasksTitle: string;
  /** Text, wenn nichts offen ist. */
  tasksEmpty: string;
  /** Ziel beim Antippen NEBEN den Häkchen – die zugehörige Liste. */
  tasksUrl: string;
  /** Die Einträge selbst – höchstens MAX_WIDGET_TASKS. */
  tasks: WidgetTask[];
}

/**
 * Wie viele Zeilen ins mittlere Widget passen, ohne dass es zur Liste
 * wird. Mehr als vier liest im Vorbeigehen ohnehin niemand.
 */
export const MAX_WIDGET_TASKS = 4;

export interface WidgetTripLike {
  id: number;
  title?: string | null;
  location?: string | null;
  spotName?: string | null;
  startDate: string;
  endDate: string;
  /** Verknüpfte Packliste – für den Fortschritts-Ring. */
  packListId?: number | null;
}

export interface WidgetFoodLike {
  expiryDate?: string | null;
}

/** Ein Packlisten-Eintrag, soweit fürs Widget nötig. */
export interface WidgetPackItemLike {
  id: number;
  name: string;
  checked: boolean;
}

/** Eine Ämtli-Zuteilung von heute. */
export interface WidgetChoreLike {
  id: number;
  title: string;
  doneAt: Date | string | null;
}

export interface WidgetInput {
  trips: readonly WidgetTripLike[];
  foodItems: readonly WidgetFoodLike[];
  gearTasks: readonly GearTaskLike[];
  /** Packstand der nächsten Reise, falls eine Liste verknüpft ist. */
  packing: { total: number; checked: number } | null;
  /** Einträge der verknüpften Packliste (vor der Reise). */
  packItems?: readonly WidgetPackItemLike[];
  /** Heutige Ämtli (während der Reise). */
  chores?: readonly WidgetChoreLike[];
  /** Heutiges Datum als ISO-Tag (YYYY-MM-DD). */
  today: string;
  lang: Language;
}

/**
 * Name eines Aufenthalts – aus derselben Quelle wie überall sonst (#329).
 *
 * Vorher stand die Regel hier ein zweites Mal. Das Widget hätte damit
 * einen anderen Namen zeigen können als die App daneben, ohne dass es
 * jemandem auffällt.
 */
const tripName = tripDisplayName;

/**
 * Der laufende oder nächste Aufenthalt.
 *
 * LAUFEND SCHLÄGT KOMMEND: Wer gerade auf dem Platz steht, will nicht
 * lesen, dass in drei Wochen die nächste Reise ansteht.
 */
export function selectWidgetTrip(
  trips: readonly WidgetTripLike[],
  today: string
): { trip: WidgetTripLike; running: boolean } | null {
  const running = trips
    .filter(trip => currentTripDay(trip, today) !== null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (running) return { trip: running, running: true };
  const upcoming = trips
    .filter(trip => trip.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  return upcoming ? { trip: upcoming, running: false } : null;
}

function tripPanel(input: WidgetInput): WidgetPanel {
  const { lang, today } = input;
  const found = selectWidgetTrip(input.trips, today);
  if (!found) {
    return {
      value: "–",
      title: pick(
        l4(
          "Keine Reise geplant",
          "Aucun voyage prévu",
          "Nessun viaggio",
          "No trip planned"
        ),
        lang
      ),
      subtitle: pick(
        l4(
          "Tippen zum Planen",
          "Toucher pour planifier",
          "Tocca per pianificare",
          "Tap to plan"
        ),
        lang
      ),
      url: "/tagebuch",
    };
  }
  const { trip, running } = found;
  const name = tripName(trip, lang);
  const url = `/tagebuch/${trip.id}`;

  if (running) {
    const day = currentTripDay(trip, today);
    return {
      value: String(day?.day ?? 1),
      title: name,
      subtitle: pick(
        l4(
          `Tag ${day?.day} von ${day?.total}`,
          `Jour ${day?.day} sur ${day?.total}`,
          `Giorno ${day?.day} di ${day?.total}`,
          `Day ${day?.day} of ${day?.total}`
        ),
        lang
      ),
      url,
    };
  }

  // Hier ist `days` immer ≥ 1: Eine Reise, die HEUTE beginnt, ist bereits
  // eine laufende (Anreisetag = Tag 1) und wurde oben behandelt. Ein
  // Zweig für «heute» wäre toter Code – samt vier Übersetzungen, die
  // niemand je zu Gesicht bekäme und die beim nächsten Umbau falsch
  // würden, ohne dass es auffällt.
  const days = daysUntilTrip(trip.startDate, today);
  const subtitle =
    days === 1
      ? pick(
          l4(
            "Anreise morgen",
            "Arrivée demain",
            "Arrivo domani",
            "Arrival tomorrow"
          ),
          lang
        )
      : pick(
          l4(
            `noch ${days} Tage`,
            `encore ${days} jours`,
            `ancora ${days} giorni`,
            `${days} days to go`
          ),
          lang
        );
  return { value: String(days), title: name, subtitle, url };
}

function packingProgress(input: WidgetInput): WidgetProgress | null {
  const packed = input.packing;
  if (!packed || packed.total <= 0) return null;
  const pct = Math.round((packed.checked / packed.total) * 100);
  return {
    ratio: Math.min(1, Math.max(0, packed.checked / packed.total)),
    label: pick(
      l4(
        `Packliste ${pct} %`,
        `Bagages ${pct} %`,
        `Bagagli ${pct} %`,
        `Packing ${pct} %`
      ),
      input.lang
    ),
  };
}

/**
 * Ablaufende Lebensmittel und fällige Pflege – dieselbe Zählung wie beim
 * App-Icon-Zähler (#132), damit die beiden Zahlen nie auseinanderlaufen.
 */
export function countSupplies(input: {
  foodItems: readonly WidgetFoodLike[];
  gearTasks: readonly GearTaskLike[];
  today: string;
}): { expiring: number; due: number } {
  const expiring = input.foodItems.filter(item => {
    const info = expiryInfo(item.expiryDate, input.today);
    return info !== null && info.daysLeft >= 0 && info.daysLeft <= 1;
  }).length;
  const due = input.gearTasks.filter(
    task => gearTaskDue(task, input.today).due
  ).length;
  return { expiring, due };
}

function suppliesPanel(input: WidgetInput): WidgetPanel {
  const { lang } = input;
  const { expiring, due } = countSupplies(input);
  const total = expiring + due;
  if (total === 0) {
    return {
      value: "✓",
      title: pick(
        l4("Alles im Griff", "Tout est en ordre", "Tutto a posto", "All clear"),
        lang
      ),
      subtitle: pick(
        l4(
          "Nichts läuft ab, nichts fällig",
          "Rien n’expire, rien à faire",
          "Nulla scade, nulla in scadenza",
          "Nothing expiring, nothing due"
        ),
        lang
      ),
      url: "/kuehlbox",
    };
  }
  // Der Titel nennt das Dringendere zuerst: Essen verdirbt, Pflege wartet.
  const title =
    expiring > 0
      ? pick(l4("Kühlbox", "Glacière", "Frigo", "Cool box"), lang)
      : pick(l4("Ausrüstung", "Équipement", "Attrezzatura", "Gear"), lang);
  const parts: string[] = [];
  if (expiring > 0) {
    parts.push(
      pick(
        expiring === 1
          ? l4(
              "1 läuft bald ab",
              "1 arrive à expiration",
              "1 sta per scadere",
              "1 expiring soon"
            )
          : l4(
              `${expiring} laufen bald ab`,
              `${expiring} arrivent à expiration`,
              `${expiring} stanno per scadere`,
              `${expiring} expiring soon`
            ),
        lang
      )
    );
  }
  if (due > 0) {
    parts.push(
      pick(
        due === 1
          ? l4(
              "1 Pflege fällig",
              "1 entretien dû",
              "1 manutenzione",
              "1 task due"
            )
          : l4(
              `${due} Pflege fällig`,
              `${due} entretiens dus`,
              `${due} manutenzioni`,
              `${due} tasks due`
            ),
        lang
      )
    );
  }
  return {
    value: String(total),
    title,
    subtitle: parts.join(" · "),
    url: expiring > 0 ? "/kuehlbox" : "/inventar",
  };
}

/**
 * Was im Widget zum Abhaken steht (#327).
 *
 * DIE REGEL FOLGT DEM ORT, AN DEM MAN STEHT: Vor der Reise sind es die
 * nächsten offenen Punkte der verknüpften Packliste – da steht man vor
 * dem Schrank. Während der Reise die heutigen Ämtli – da steht man auf
 * dem Platz. Nach der Reise nichts; dort gibt es keinen Handgriff, den
 * ein Widget abnehmen könnte.
 *
 * OFFENE ZUERST, ERLEDIGTE DAHINTER: Ein Widget mit vier abgehakten
 * Zeilen ist nutzlos. Erledigte bleiben trotzdem sichtbar, solange Platz
 * ist – sonst verschwindet die Zeile im selben Moment, in dem man sie
 * antippt, und man weiss nicht, ob der Tipp angekommen ist.
 */
export function selectWidgetTasks(input: WidgetInput): {
  title: string;
  empty: string;
  url: string;
  tasks: WidgetTask[];
} {
  const { lang } = input;
  const found = selectWidgetTrip(input.trips, input.today);

  if (found?.running) {
    const chores = (input.chores ?? []).map(row => ({
      id: row.id,
      kind: "chore" as const,
      title: row.title,
      checked: row.doneAt !== null,
    }));
    return {
      title: pick(
        l4(
          "Heute im Camp",
          "Aujourd’hui au camp",
          "Oggi al campo",
          "Today at camp"
        ),
        lang
      ),
      empty: pick(
        l4(
          "Keine Ämtli für heute",
          "Aucune tâche aujourd’hui",
          "Nessun turno per oggi",
          "No chores today"
        ),
        lang
      ),
      url: "/aemtli",
      tasks: orderTasks(chores),
    };
  }

  const items = (input.packItems ?? []).map(row => ({
    id: row.id,
    kind: "packing" as const,
    title: row.name,
    checked: row.checked,
  }));
  return {
    title: pick(
      l4(
        "Noch zu packen",
        "Encore à préparer",
        "Ancora da preparare",
        "Still to pack"
      ),
      lang
    ),
    empty: pick(
      l4("Alles gepackt", "Tout est prêt", "Tutto pronto", "All packed"),
      lang
    ),
    url: found?.trip.packListId
      ? `/packlisten/${found.trip.packListId}`
      : "/packlisten",
    tasks: orderTasks(items),
  };
}

/** Offene zuerst, dann erledigte; abgeschnitten auf MAX_WIDGET_TASKS. */
function orderTasks(tasks: readonly WidgetTask[]): WidgetTask[] {
  const open = tasks.filter(task => !task.checked);
  const done = tasks.filter(task => task.checked);
  return [...open, ...done].slice(0, MAX_WIDGET_TASKS);
}

/** Die vollständige Nutzlast bauen. */
export function buildWidgetPayload(input: WidgetInput): WidgetPayload {
  const tasks = selectWidgetTasks(input);
  return {
    version: 2,
    builtAt: `${input.today}T00:00:00Z`,
    trip: tripPanel(input),
    packing: packingProgress(input),
    supplies: suppliesPanel(input),
    tasksTitle: tasks.title,
    tasksEmpty: tasks.empty,
    tasksUrl: tasks.url,
    tasks: tasks.tasks,
  };
}

/**
 * Hat sich etwas geändert, das im Widget sichtbar wäre?
 *
 * Das Neuzeichnen eines Widgets ist beim System ein Budget-Posten – iOS
 * drosselt Apps, die ohne Grund oft nachladen. Verglichen wird deshalb
 * die fertige Nutzlast OHNE `builtAt`: Ein neuer Tag allein ist kein
 * Grund, solange alle Texte gleich bleiben.
 */
export function widgetPayloadChanged(
  previous: WidgetPayload | null,
  next: WidgetPayload
): boolean {
  if (!previous) return true;
  const strip = (p: WidgetPayload) => JSON.stringify({ ...p, builtAt: "" });
  return strip(previous) !== strip(next);
}

/**
 * Die Stellplatz-Skizze (#382).
 *
 * WAS FEHLTE: Das Dossier weiss seit #252, welche Parzellennummer man
 * hatte und wie das WLAN heisst. Was es nie wusste, ist die einzige
 * Frage, die beim zweiten Besuch wirklich zählt: WIE HAT ES GEPASST?
 * Stand der Wohnwagen richtig herum? War das Vordach zum Weg hin zu
 * knapp? Wie weit war die Strom-Säule wirklich weg – reichte das Kabel?
 * Das behält man ein Jahr lang nicht im Kopf, und ein Foto zeigt es auch
 * nicht: Auf einem Foto ist alles gleich weit weg.
 *
 * EINE SKIZZE, KEIN CAD. Rechtecke auf einem Raster in METERN, mehr
 * nicht. Kein Massstab zum Einstellen, keine Drehung um 37 Grad, keine
 * Schraffuren. Was man wissen will, sind Abstände auf einen halben Meter
 * genau – ob das Kabel reicht, entscheidet sich nicht an Zentimetern.
 * Deshalb rastet alles auf `SKETCH_STEP_M`.
 *
 * WARUM AM PLATZ UND NICHT AN DER REISE: Die Parzellennummer wechselt
 * bei jedem Besuch, das WLAN-Passwort ändert die Rezeption – die stehen
 * darum an der Reise (#252). Die Skizze ist das Gegenteil: Sie nützt
 * genau dann, wenn man WIEDERKOMMT, und wer sie an der Reise vom
 * vorletzten Sommer suchen müsste, findet sie nie. Sie gehört ins
 * Dossier, zum Platz.
 *
 * WARUM JSON UND KEINE TABELLE: dieselbe Begründung wie bei
 * `tariffsJson` und `attributesJson` daneben – die Rechtecke gehören
 * ausschliesslich zu ihrem Platz, werden nur als Ganzes gelesen und nie
 * einzeln gesucht oder verknüpft.
 *
 * ALLES HIER IST DEFENSIV: Der Text kommt aus einer JSON-Spalte, und
 * eine kaputte Zeile darf nie die Seite kippen. Unlesbares fällt still
 * weg, wie bei `spotTariffs`.
 */
import { l4, pick, type L4, type Language } from "./i18n";

/** Raster in Metern – feiner braucht es niemand, gröber wird es falsch. */
export const SKETCH_STEP_M = 0.5;
/** Kleinster und grösster sinnvoller Stellplatz. */
export const PITCH_MIN_M = 4;
export const PITCH_MAX_M = 40;
/** So viele Rechtecke sind eine Skizze; mehr ist ein Bauplan. */
export const MAX_SKETCH_ITEMS = 24;
/** Obergrenze der gespeicherten JSON-Länge – schützt die Spalte. */
export const PITCH_SKETCH_JSON_MAX_LENGTH = 4000;
/** Standardgrösse: ein durchschnittlicher Schweizer Stellplatz (~100 m²). */
export const DEFAULT_PITCH_WIDTH_M = 10;
export const DEFAULT_PITCH_DEPTH_M = 10;

/**
 * Was auf einen Stellplatz kommt.
 *
 * Bewusst kurz gehalten: Jede Art, die man nie braucht, macht die
 * Auswahl langsamer. Was fehlt, deckt `tent` mit anderer Grösse ab.
 */
export const SKETCH_KINDS = [
  "tent",
  "awning",
  "caravan",
  "car",
  "table",
  "power",
  "water",
  "tree",
  "path",
] as const;
export type SketchKind = (typeof SKETCH_KINDS)[number];

export function isSketchKind(value: unknown): value is SketchKind {
  return (SKETCH_KINDS as readonly unknown[]).includes(value);
}

/** Beschreibung einer Art: Name, Standardmass und ob sie überlappen darf. */
export interface SketchKindInfo {
  label: L4;
  /** Standardbreite/-tiefe in Metern – Erfahrungswerte, jederzeit änderbar. */
  widthM: number;
  depthM: number;
  /**
   * Darf über anderem liegen, ohne dass gewarnt wird.
   *
   * Das Vordach steht per Definition AM Zelt oder Wohnwagen, der Baum
   * hängt mit der Krone über den Tisch, und der Weg läuft am Rand
   * entlang. Eine Warnung dafür wäre Lärm, den man nach dem zweiten Mal
   * ignoriert – und dann ignoriert man auch die echte.
   */
  mayOverlap: boolean;
}

export const SKETCH_KIND_INFO: Record<SketchKind, SketchKindInfo> = {
  tent: {
    label: l4("Zelt", "Tente", "Tenda", "Tent"),
    widthM: 3,
    depthM: 4,
    mayOverlap: false,
  },
  awning: {
    label: l4("Vordach", "Auvent", "Veranda", "Awning"),
    widthM: 3,
    depthM: 2.5,
    mayOverlap: true,
  },
  caravan: {
    label: l4("Wohnwagen", "Caravane", "Roulotte", "Caravan"),
    widthM: 2.5,
    depthM: 6,
    mayOverlap: false,
  },
  car: {
    label: l4("Auto", "Voiture", "Auto", "Car"),
    widthM: 2,
    depthM: 4.5,
    mayOverlap: false,
  },
  table: {
    label: l4("Tisch", "Table", "Tavolo", "Table"),
    widthM: 1.5,
    depthM: 1,
    mayOverlap: false,
  },
  power: {
    label: l4("Strom-Säule", "Borne élec.", "Colonnina", "Power point"),
    widthM: 0.5,
    depthM: 0.5,
    mayOverlap: false,
  },
  water: {
    label: l4("Wasserhahn", "Robinet", "Rubinetto", "Water tap"),
    widthM: 0.5,
    depthM: 0.5,
    mayOverlap: false,
  },
  tree: {
    label: l4("Baum", "Arbre", "Albero", "Tree"),
    widthM: 2,
    depthM: 2,
    mayOverlap: true,
  },
  path: {
    label: l4("Weg", "Chemin", "Sentiero", "Path"),
    widthM: 10,
    depthM: 1.5,
    mayOverlap: true,
  },
};

export function sketchKindLabel(kind: SketchKind, lang: Language): string {
  return pick(SKETCH_KIND_INFO[kind].label, lang);
}

/** Ein Rechteck auf dem Raster; x/y ist die linke obere Ecke in Metern. */
export interface SketchItem {
  id: string;
  kind: SketchKind;
  x: number;
  y: number;
  widthM: number;
  depthM: number;
}

/** Die ganze Skizze: Platzmass und was darauf steht. */
export interface PitchSketch {
  widthM: number;
  depthM: number;
  items: SketchItem[];
}

/** Auf das Raster runden – die eine Stelle, an der aus Zahlen Meter werden. */
export function snapM(value: number): number {
  return Math.round(value / SKETCH_STEP_M) * SKETCH_STEP_M;
}

function clampNumber(value: unknown, min: number, max: number): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(max, Math.max(min, snapM(num)));
}

/** Ein leerer Stellplatz in Standardgrösse. */
export function emptySketch(): PitchSketch {
  return {
    widthM: DEFAULT_PITCH_WIDTH_M,
    depthM: DEFAULT_PITCH_DEPTH_M,
    items: [],
  };
}

/**
 * Ein Rechteck so verschieben, dass es ganz auf dem Platz liegt.
 *
 * ZUERST DAS MASS, DANN DIE LAGE: Ein Zelt, das breiter ist als der
 * Platz, wird auf die Platzbreite gestutzt – sonst gäbe es keine Lage,
 * die passt, und der Rest der Rechnung liefe ins Leere.
 */
export function clampItem(
  item: SketchItem,
  widthM: number,
  depthM: number
): SketchItem {
  const w = Math.min(Math.max(SKETCH_STEP_M, item.widthM), widthM);
  const d = Math.min(Math.max(SKETCH_STEP_M, item.depthM), depthM);
  return {
    ...item,
    widthM: w,
    depthM: d,
    x: Math.min(Math.max(0, snapM(item.x)), snapM(widthM - w)),
    y: Math.min(Math.max(0, snapM(item.y)), snapM(depthM - d)),
  };
}

/**
 * Gespeichertes JSON in eine Skizze verwandeln.
 *
 * Gibt null zurück, wenn nichts Brauchbares übrig bleibt – «keine
 * Skizze» bleibt so von «leere Skizze» unterscheidbar, und die Karte im
 * Dossier weiss, ob sie überhaupt etwas zu zeigen hat.
 */
export function parsePitchSketch(
  raw: string | null | undefined
): PitchSketch | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const record = data as {
    widthM?: unknown;
    depthM?: unknown;
    items?: unknown;
  };
  const widthM = clampNumber(record.widthM, PITCH_MIN_M, PITCH_MAX_M);
  const depthM = clampNumber(record.depthM, PITCH_MIN_M, PITCH_MAX_M);
  if (widthM === null || depthM === null) return null;
  const items: SketchItem[] = [];
  const seen = new Set<string>();
  if (Array.isArray(record.items)) {
    for (const entry of record.items.slice(0, MAX_SKETCH_ITEMS)) {
      if (typeof entry !== "object" || entry === null) continue;
      const row = entry as {
        id?: unknown;
        kind?: unknown;
        x?: unknown;
        y?: unknown;
        widthM?: unknown;
        depthM?: unknown;
      };
      if (!isSketchKind(row.kind)) continue;
      const id = typeof row.id === "string" ? row.id.slice(0, 40) : "";
      // Doppelte Ids wären ein stiller Fehler beim Verschieben: zwei
      // Rechtecke, die sich immer gemeinsam bewegen.
      if (!id || seen.has(id)) continue;
      const x = clampNumber(row.x, 0, PITCH_MAX_M);
      const y = clampNumber(row.y, 0, PITCH_MAX_M);
      const w = clampNumber(row.widthM, SKETCH_STEP_M, PITCH_MAX_M);
      const d = clampNumber(row.depthM, SKETCH_STEP_M, PITCH_MAX_M);
      if (x === null || y === null || w === null || d === null) continue;
      seen.add(id);
      items.push(
        clampItem(
          { id, kind: row.kind, x, y, widthM: w, depthM: d },
          widthM,
          depthM
        )
      );
    }
  }
  return { widthM, depthM, items };
}

/**
 * Skizze zum Speichern normalisieren. Gibt null zurück, wenn nichts
 * darauf steht – ein leeres Raster ist keine Erinnerung wert.
 */
export function serializePitchSketch(
  sketch: PitchSketch | null
): string | null {
  if (!sketch) return null;
  const clean = parsePitchSketch(JSON.stringify(sketch));
  if (!clean || clean.items.length === 0) return null;
  const json = JSON.stringify(clean);
  // Nach den Obergrenzen oben nicht zu erwarten; wenn doch, lieber
  // nichts speichern als eine abgeschnittene, unlesbare Zeile.
  return json.length > PITCH_SKETCH_JSON_MAX_LENGTH ? null : json;
}

/** Freie Id für eine neue Art: «tent-1», «tent-2» … – ohne Zufall, damit prüfbar. */
export function nextItemId(
  items: readonly SketchItem[],
  kind: SketchKind
): string {
  const used = new Set(items.map(item => item.id));
  for (let n = 1; n <= MAX_SKETCH_ITEMS + 1; n += 1) {
    const id = `${kind}-${n}`;
    if (!used.has(id)) return id;
  }
  return `${kind}-${items.length + 1}`;
}

/** Abstand zweier Rechtecke in Metern; 0, wenn sie sich berühren oder überlappen. */
export function rectGapM(a: SketchItem, b: SketchItem): number {
  const dx = Math.max(
    0,
    Math.max(a.x - (b.x + b.widthM), b.x - (a.x + a.widthM))
  );
  const dy = Math.max(
    0,
    Math.max(a.y - (b.y + b.depthM), b.y - (a.y + a.depthM))
  );
  return Math.round(Math.hypot(dx, dy) * 100) / 100;
}

/** Überlappen sich zwei Rechtecke echt (Berührung zählt nicht)? */
export function overlaps(a: SketchItem, b: SketchItem): boolean {
  return (
    a.x < b.x + b.widthM &&
    b.x < a.x + a.widthM &&
    a.y < b.y + b.depthM &&
    b.y < a.y + a.depthM
  );
}

/**
 * Ein neues Rechteck platzieren – auf dem ersten freien Rasterplatz.
 *
 * Von oben links nach unten rechts, weil man dort zu lesen anfängt. Wenn
 * nichts frei ist, kommt es trotzdem auf 0/0: sichtbar und im Weg ist
 * besser als «der Knopf tut nichts».
 */
export function addSketchItem(
  sketch: PitchSketch,
  kind: SketchKind
): PitchSketch {
  if (sketch.items.length >= MAX_SKETCH_ITEMS) return sketch;
  const info = SKETCH_KIND_INFO[kind];
  const base: SketchItem = {
    id: nextItemId(sketch.items, kind),
    kind,
    x: 0,
    y: 0,
    widthM: info.widthM,
    depthM: info.depthM,
  };
  const fitted = clampItem(base, sketch.widthM, sketch.depthM);
  let placed = fitted;
  outer: for (
    let y = 0;
    y + fitted.depthM <= sketch.depthM;
    y += SKETCH_STEP_M
  ) {
    for (let x = 0; x + fitted.widthM <= sketch.widthM; x += SKETCH_STEP_M) {
      const candidate = { ...fitted, x: snapM(x), y: snapM(y) };
      if (!sketch.items.some(other => overlaps(candidate, other))) {
        placed = candidate;
        break outer;
      }
    }
  }
  return { ...sketch, items: [...sketch.items, placed] };
}

/** Ein Rechteck mit seiner MITTE auf einen Punkt setzen (Tippen auf das Raster). */
export function moveSketchItem(
  sketch: PitchSketch,
  id: string,
  centerX: number,
  centerY: number
): PitchSketch {
  return {
    ...sketch,
    items: sketch.items.map(item =>
      item.id === id
        ? clampItem(
            {
              ...item,
              x: snapM(centerX - item.widthM / 2),
              y: snapM(centerY - item.depthM / 2),
            },
            sketch.widthM,
            sketch.depthM
          )
        : item
    ),
  };
}

/**
 * Um 90 Grad drehen: Breite und Tiefe tauschen, um die MITTE.
 *
 * Um die Mitte und nicht um die Ecke, weil man den Wohnwagen dort dreht,
 * wo er steht – eine Drehung, die ihn zusätzlich verschiebt, muss man
 * hinterher wieder von Hand geraderücken.
 */
export function rotateSketchItem(sketch: PitchSketch, id: string): PitchSketch {
  return {
    ...sketch,
    items: sketch.items.map(item => {
      if (item.id !== id) return item;
      const cx = item.x + item.widthM / 2;
      const cy = item.y + item.depthM / 2;
      return clampItem(
        {
          ...item,
          widthM: item.depthM,
          depthM: item.widthM,
          x: snapM(cx - item.depthM / 2),
          y: snapM(cy - item.widthM / 2),
        },
        sketch.widthM,
        sketch.depthM
      );
    }),
  };
}

/** Mass eines Rechtecks ändern; die linke obere Ecke bleibt, wo sie ist. */
export function resizeSketchItem(
  sketch: PitchSketch,
  id: string,
  widthM: number,
  depthM: number
): PitchSketch {
  return {
    ...sketch,
    items: sketch.items.map(item =>
      item.id === id
        ? clampItem({ ...item, widthM, depthM }, sketch.widthM, sketch.depthM)
        : item
    ),
  };
}

export function removeSketchItem(sketch: PitchSketch, id: string): PitchSketch {
  return { ...sketch, items: sketch.items.filter(item => item.id !== id) };
}

/**
 * Platzmass ändern – und alles wieder hineinholen, was dadurch draussen
 * läge. Sonst stünde das Auto bei einem schmaleren Platz halb im Nichts.
 */
export function resizePitch(
  sketch: PitchSketch,
  widthM: number,
  depthM: number
): PitchSketch {
  const w = Math.min(PITCH_MAX_M, Math.max(PITCH_MIN_M, snapM(widthM)));
  const d = Math.min(PITCH_MAX_M, Math.max(PITCH_MIN_M, snapM(depthM)));
  return {
    widthM: w,
    depthM: d,
    items: sketch.items.map(item => clampItem(item, w, d)),
  };
}

/** Abstände eines Rechtecks zu den vier Rändern des Platzes, in Metern. */
export interface EdgeDistances {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function edgeDistances(
  item: SketchItem,
  sketch: PitchSketch
): EdgeDistances {
  return {
    left: snapM(item.x),
    right: snapM(sketch.widthM - (item.x + item.widthM)),
    top: snapM(item.y),
    bottom: snapM(sketch.depthM - (item.y + item.depthM)),
  };
}

/** Das nächste andere Rechteck samt Abstand – oder null, wenn es allein steht. */
export function nearestNeighbour(
  item: SketchItem,
  sketch: PitchSketch
): { item: SketchItem; distanceM: number } | null {
  let best: { item: SketchItem; distanceM: number } | null = null;
  for (const other of sketch.items) {
    if (other.id === item.id) continue;
    const distanceM = rectGapM(item, other);
    if (!best || distanceM < best.distanceM) best = { item: other, distanceM };
  }
  return best;
}

/**
 * Was sich überlappt, obwohl es das nicht darf.
 *
 * Paare, nicht Einzelmeldungen: «Zelt und Auto überlappen» ist ein
 * Satz, den man versteht; zwei Meldungen über dasselbe Problem sind eine
 * zu viel. Jedes Paar erscheint genau einmal.
 */
export function overlapWarnings(
  sketch: PitchSketch
): { a: SketchItem; b: SketchItem }[] {
  const found: { a: SketchItem; b: SketchItem }[] = [];
  for (let i = 0; i < sketch.items.length; i += 1) {
    for (let j = i + 1; j < sketch.items.length; j += 1) {
      const a = sketch.items[i];
      const b = sketch.items[j];
      if (SKETCH_KIND_INFO[a.kind].mayOverlap) continue;
      if (SKETCH_KIND_INFO[b.kind].mayOverlap) continue;
      if (overlaps(a, b)) found.push({ a, b });
    }
  }
  return found;
}

/** Fläche des Platzes in m². */
export function pitchAreaM2(sketch: PitchSketch): number {
  return Math.round(sketch.widthM * sketch.depthM * 10) / 10;
}

/**
 * Belegte Fläche in m² – ohne die Arten, die überlappen dürfen.
 *
 * Das Vordach liegt über dem Zelt und der Baum über dem Tisch;
 * mitzuzählen ergäbe eine Zahl über 100 % und damit keine.
 */
export function usedAreaM2(sketch: PitchSketch): number {
  const sum = sketch.items
    .filter(item => !SKETCH_KIND_INFO[item.kind].mayOverlap)
    .reduce((total, item) => total + item.widthM * item.depthM, 0);
  return Math.round(sum * 10) / 10;
}

/** Meter als Text: «3 m», «2.5 m» – nie «2.50 m», das liest niemand als Skizze. */
export function formatMeters(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} m`;
}

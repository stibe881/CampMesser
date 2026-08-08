/**
 * Die Stellplatz-Skizze zeichnen (#382) – nur zeichnen, nichts ändern.
 *
 * EIGENES BAUTEIL, weil es an zwei Stellen gebraucht wird: im eigenen
 * Dossier und in der geteilten Ansicht, wo niemand etwas ändern darf.
 * Ein Bauteil, das beides kann, hätte an der zweiten Stelle einen
 * Bearbeiten-Knopf, den man abschalten muss – und irgendwann vergisst.
 *
 * SVG UND KEIN CANVAS: Die Skizze soll mitwachsen, wenn das Telefon
 * quer gehalten wird, und im Dunkelmodus die Farben des Themes tragen.
 * Beides macht SVG mit Tailwind-Klassen von selbst.
 *
 * NUMMERN STATT BESCHRIFTUNG IM RECHTECK: «Strom-Säule» passt nicht in
 * ein Quadrat von einem halben Meter. Die Nummer passt immer, und die
 * Legende darunter hat Platz für den Namen, das Mass und die Abstände.
 *
 * DIE ABSTÄNDE ERSCHEINEN NUR BEIM AUSGEWÄHLTEN Rechteck. Vier
 * gestrichelte Linien an jedem Gegenstand gleichzeitig wären ein Netz,
 * in dem man nichts mehr erkennt.
 */
import { useI18n } from "@/i18n";
import {
  SKETCH_KIND_INFO,
  edgeDistances,
  formatMeters,
  sketchKindLabel,
  type PitchSketch,
  type SketchItem,
} from "@shared/pitchSketch";
import { cn } from "@/lib/utils";

/**
 * Farbe je Art. Bewusst über Theme-Farben und nicht über feste
 * Hex-Werte: Die Skizze wird auch nachts im Rotlicht-Modus (#84)
 * angeschaut, und dort ist ein hartes Blau ein Fremdkörper.
 */
const KIND_CLASS: Record<string, string> = {
  tent: "fill-primary/25 stroke-primary",
  awning: "fill-primary/10 stroke-primary/60",
  caravan: "fill-primary/25 stroke-primary",
  car: "fill-muted-foreground/25 stroke-muted-foreground",
  table: "fill-muted-foreground/20 stroke-muted-foreground/70",
  power: "fill-destructive/25 stroke-destructive",
  water: "fill-destructive/15 stroke-destructive/70",
  tree: "fill-muted-foreground/15 stroke-muted-foreground/50",
  path: "fill-muted stroke-border",
};

/** Schriftgrösse in METERN, damit die Nummer nie über ihr Rechteck läuft. */
function labelSize(item: SketchItem): number {
  return Math.min(0.9, item.widthM * 0.5, item.depthM * 0.7);
}

export default function PitchSketchView({
  sketch,
  selectedId,
  onSelect,
  onPlace,
  className,
}: {
  sketch: PitchSketch;
  selectedId?: string | null;
  /** Rechteck angetippt. Fehlt sie, ist die Skizze reine Anzeige. */
  onSelect?: (id: string) => void;
  /** Leere Fläche angetippt: Punkt in METERN. Nur im Bearbeiten-Modus. */
  onPlace?: (xM: number, yM: number) => void;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const ps = t.pitchSketch;
  const selected = sketch.items.find(item => item.id === selectedId) ?? null;
  const edges = selected ? edgeDistances(selected, sketch) : null;
  const interactive = Boolean(onSelect);

  /**
   * Tippen auf die Fläche in Meter umrechnen.
   *
   * Der Kasten hat DAS SEITENVERHÄLTNIS DER SKIZZE (aspectRatio unten) –
   * damit ist die Umrechnung eine Multiplikation und nicht eine Rechnung
   * über Randstreifen, die SVG sonst um den Inhalt legt.
   */
  const handleBackground = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onPlace) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    onPlace(
      ((event.clientX - box.left) / box.width) * sketch.widthM,
      ((event.clientY - box.top) / box.height) * sketch.depthM
    );
  };

  // Rasterlinien im Meterabstand – die Skala, ohne die Meter Zahlen bleiben
  const gridX: number[] = [];
  for (let x = 1; x < sketch.widthM; x += 1) gridX.push(x);
  const gridY: number[] = [];
  for (let y = 1; y < sketch.depthM; y += 1) gridY.push(y);

  return (
    <svg
      viewBox={`0 0 ${sketch.widthM} ${sketch.depthM}`}
      style={{ aspectRatio: `${sketch.widthM} / ${sketch.depthM}` }}
      className={cn("w-full rounded-lg bg-card", className)}
      /**
       * Als reine Anzeige ist die Skizze EIN Bild mit einer Beschreibung.
       * Sobald man Rechtecke anwählen kann, wird sie zur Gruppe: Ein
       * `img` erklärt seine Kinder für unwichtig, und darin verschwänden
       * genau die Knöpfe, über die man sie bedient.
       */
      role={interactive ? "group" : "img"}
      aria-label={ps.sketchAria(
        formatMeters(sketch.widthM),
        formatMeters(sketch.depthM),
        sketch.items.length
      )}
      onClick={handleBackground}
    >
      {gridX.map(x => (
        <line
          key={`x${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={sketch.depthM}
          className="stroke-border"
          strokeWidth={0.02}
        />
      ))}
      {gridY.map(y => (
        <line
          key={`y${y}`}
          x1={0}
          y1={y}
          x2={sketch.widthM}
          y2={y}
          className="stroke-border"
          strokeWidth={0.02}
        />
      ))}
      <rect
        x={0}
        y={0}
        width={sketch.widthM}
        height={sketch.depthM}
        className="fill-none stroke-foreground/40"
        strokeWidth={0.06}
      />

      {/* Abstände des ausgewählten Rechtecks zu den vier Rändern */}
      {selected && edges && (
        <g
          className="stroke-primary"
          strokeWidth={0.04}
          strokeDasharray="0.3 0.2"
        >
          {edges.left > 0 && (
            <line
              x1={0}
              y1={selected.y + selected.depthM / 2}
              x2={selected.x}
              y2={selected.y + selected.depthM / 2}
            />
          )}
          {edges.right > 0 && (
            <line
              x1={selected.x + selected.widthM}
              y1={selected.y + selected.depthM / 2}
              x2={sketch.widthM}
              y2={selected.y + selected.depthM / 2}
            />
          )}
          {edges.top > 0 && (
            <line
              x1={selected.x + selected.widthM / 2}
              y1={0}
              x2={selected.x + selected.widthM / 2}
              y2={selected.y}
            />
          )}
          {edges.bottom > 0 && (
            <line
              x1={selected.x + selected.widthM / 2}
              y1={selected.y + selected.depthM}
              x2={selected.x + selected.widthM / 2}
              y2={sketch.depthM}
            />
          )}
        </g>
      )}

      {sketch.items.map((item, index) => {
        const isSelected = item.id === selectedId;
        return (
          <g
            key={item.id}
            className={interactive ? "cursor-pointer" : undefined}
            {...(interactive
              ? {
                  role: "button",
                  tabIndex: 0,
                  "aria-label": ps.itemAria(
                    sketchKindLabel(item.kind, lang),
                    formatMeters(item.widthM),
                    formatMeters(item.depthM)
                  ),
                  "aria-pressed": isSelected,
                  onClick: (event: React.MouseEvent) => {
                    // Sonst zählte derselbe Tipp auch als «leere Fläche»
                    // und das Rechteck spränge unter den Finger.
                    event.stopPropagation();
                    onSelect?.(item.id);
                  },
                  onKeyDown: (event: React.KeyboardEvent) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect?.(item.id);
                    }
                  },
                }
              : {})}
          >
            <rect
              x={item.x}
              y={item.y}
              width={item.widthM}
              height={item.depthM}
              rx={0.15}
              className={cn(
                KIND_CLASS[item.kind] ?? "fill-muted stroke-border",
                isSelected && "stroke-primary"
              )}
              strokeWidth={isSelected ? 0.14 : 0.06}
            />
            <text
              x={item.x + item.widthM / 2}
              y={item.y + item.depthM / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={labelSize(item)}
              className="fill-foreground font-semibold"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export { KIND_CLASS, SKETCH_KIND_INFO };

/**
 * Die Legende unter der Skizze: Nummer, Name, Mass.
 *
 * SIE IST NICHT NUR BESCHRIFTUNG, sondern auch der Weg ohne Maus: Wer
 * mit der Tastatur unterwegs ist, wählt hier aus, statt ein Rechteck im
 * Bild zu treffen. Ohne `onSelect` bleibt sie eine reine Aufzählung –
 * dann sind es Zeilen und keine Knöpfe.
 */
export function PitchSketchLegend({
  sketch,
  selectedId,
  onSelect,
}: {
  sketch: PitchSketch;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const { lang } = useI18n();
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {sketch.items.map((item, index) => {
        const text = `${index + 1} · ${sketchKindLabel(item.kind, lang)} · ${formatMeters(item.widthM)} × ${formatMeters(item.depthM)}`;
        return (
          <li key={item.id}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={item.id === selectedId}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  item.id === selectedId
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:bg-accent"
                )}
              >
                {text}
              </button>
            ) : (
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {text}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

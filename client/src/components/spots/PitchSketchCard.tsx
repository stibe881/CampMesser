/**
 * Die Stellplatz-Skizze im Dossier (#382): anschauen und bearbeiten.
 *
 * WOFÜR: Das Dossier weiss seit #252 die Parzellennummer und das
 * WLAN-Passwort. Was es nie wusste, ist die Frage, die beim zweiten
 * Besuch zählt: Wie hat es gepasst? Reichte das Stromkabel? War das
 * Vordach zum Weg hin zu knapp? Das behält man ein Jahr lang nicht im
 * Kopf, und ein Foto zeigt es auch nicht – auf einem Foto ist alles
 * gleich weit weg.
 *
 * BEARBEITET WIRD IM DIALOG, nicht auf der Seite: Das Dossier ist lang,
 * und ein Raster, das man mit dem Finger antippt, während die Seite
 * darunter scrollt, ist eine Quelle von Fehlgriffen. Im Dialog steht
 * die Skizze still.
 *
 * ANTIPPEN STATT ZIEHEN. Ein Rechteck wählen, dann auf die Zielstelle
 * tippen – fertig. Ziehen sähe eleganter aus, ist aber auf einem
 * Telefon mit Handschuhen im Regen der schlechtere Weg: Jeder
 * Fehlgriff verschiebt etwas, und rückgängig macht das niemand. Zwei
 * Tipps sind langsamer und dafür verlässlich; die Pfeiltasten machen
 * dasselbe für die Tastatur.
 *
 * GESPEICHERT WIRD ERST AUF KNOPFDRUCK. Wer den Dialog schliesst, hat
 * nichts verändert – auch das gehört zu «verlässlich».
 */
import { useState } from "react";
import { Grid2x2, Pencil, RotateCw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import PitchSketchView, { PitchSketchLegend } from "./PitchSketchView";
import {
  MAX_SKETCH_ITEMS,
  PITCH_MAX_M,
  PITCH_MIN_M,
  SKETCH_KINDS,
  SKETCH_STEP_M,
  addSketchItem,
  edgeDistances,
  emptySketch,
  formatMeters,
  moveSketchItem,
  nearestNeighbour,
  overlapWarnings,
  parsePitchSketch,
  pitchAreaM2,
  removeSketchItem,
  resizePitch,
  resizeSketchItem,
  rotateSketchItem,
  serializePitchSketch,
  sketchKindLabel,
  usedAreaM2,
  type PitchSketch,
} from "@shared/pitchSketch";

/** Ein Zahlenfeld in halben Metern – für Platzmass und Rechteck-Mass. */
function MeterField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={SKETCH_STEP_M}
        min={min}
        max={max}
        value={value}
        onChange={event => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
      />
    </div>
  );
}

export default function PitchSketchCard({
  spotId,
  pitchSketchJson,
}: {
  spotId: number;
  pitchSketchJson: string | null;
}) {
  const { lang, t } = useI18n();
  const ps = t.pitchSketch;
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PitchSketch>(emptySketch);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const saved = parsePitchSketch(pitchSketchJson);

  const updateMutation = trpc.spots.update.useMutation({
    onSuccess: () => {
      void utils.spots.list.invalidate();
      setOpen(false);
      toast.success(ps.saved);
    },
    onError: () => toast.error(t.common.saveFailed),
  });

  const openEditor = () => {
    setDraft(saved ?? emptySketch());
    setSelectedId(null);
    setOpen(true);
  };

  const selected = draft.items.find(item => item.id === selectedId) ?? null;
  const overlaps = overlapWarnings(draft);

  /**
   * Verschieben mit den Pfeiltasten – ein Rasterschritt je Druck.
   * Die Entsprechung zum Antippen, für alle, die nicht tippen können
   * oder wollen.
   */
  const nudge = (dx: number, dy: number) => {
    if (!selected) return;
    setDraft(current =>
      moveSketchItem(
        current,
        selected.id,
        selected.x + selected.widthM / 2 + dx * SKETCH_STEP_M,
        selected.y + selected.depthM / 2 + dy * SKETCH_STEP_M
      )
    );
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        <Button type="button" size="sm" variant="outline" onClick={openEditor}>
          <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {saved ? ps.edit : ps.create}
        </Button>
      </div>

      {saved ? (
        <>
          <PitchSketchView sketch={saved} />
          <PitchSketchLegend sketch={saved} />
          <p className="mt-2 text-xs text-muted-foreground">
            {ps.areaLine(
              formatMeters(saved.widthM),
              formatMeters(saved.depthM),
              usedAreaM2(saved),
              pitchAreaM2(saved)
            )}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{ps.empty}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ps.title}</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">{ps.hint}</p>

          <PitchSketchView
            sketch={draft}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPlace={(x, y) => {
              if (!selectedId) return;
              setDraft(current => moveSketchItem(current, selectedId, x, y));
            }}
          />

          {draft.items.length > 0 && (
            <PitchSketchLegend
              sketch={draft}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}

          {/* Was noch dazukommen darf */}
          <div>
            <p className="text-xs text-muted-foreground">{ps.addTitle}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SKETCH_KINDS.map(kind => (
                <Button
                  key={kind}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={draft.items.length >= MAX_SKETCH_ITEMS}
                  onClick={() =>
                    setDraft(current => {
                      const next = addSketchItem(current, kind);
                      const added = next.items[next.items.length - 1];
                      if (added) setSelectedId(added.id);
                      return next;
                    })
                  }
                >
                  {sketchKindLabel(kind, lang)}
                </Button>
              ))}
            </div>
            {draft.items.length >= MAX_SKETCH_ITEMS && (
              <p className="mt-1 text-xs text-muted-foreground">
                {ps.full(MAX_SKETCH_ITEMS)}
              </p>
            )}
          </div>

          {/* Der ausgewählte Gegenstand: Mass, Drehen, Entfernen, Abstände */}
          {selected && (
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">
                {sketchKindLabel(selected.kind, lang)}
              </p>
              <div className="mt-2 flex gap-2">
                <MeterField
                  id="sketch-item-width"
                  label={ps.itemWidth}
                  value={selected.widthM}
                  min={SKETCH_STEP_M}
                  max={draft.widthM}
                  onChange={value =>
                    setDraft(current =>
                      resizeSketchItem(
                        current,
                        selected.id,
                        value,
                        selected.depthM
                      )
                    )
                  }
                />
                <MeterField
                  id="sketch-item-depth"
                  label={ps.itemDepth}
                  value={selected.depthM}
                  min={SKETCH_STEP_M}
                  max={draft.depthM}
                  onChange={value =>
                    setDraft(current =>
                      resizeSketchItem(
                        current,
                        selected.id,
                        selected.widthM,
                        value
                      )
                    )
                  }
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDraft(current => rotateSketchItem(current, selected.id))
                  }
                >
                  <RotateCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {ps.rotate}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDraft(current => removeSketchItem(current, selected.id));
                    setSelectedId(null);
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {ps.remove}
                </Button>
              </div>

              {/* Pfeiltasten-Ersatz als Knöpfe: derselbe halbe Meter */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(
                  [
                    [ps.moveLeft, -1, 0],
                    [ps.moveRight, 1, 0],
                    [ps.moveUp, 0, -1],
                    [ps.moveDown, 0, 1],
                  ] as [string, number, number][]
                ).map(([label, dx, dy]) => (
                  <Button
                    key={label}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => nudge(dx, dy)}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                {(() => {
                  const edges = edgeDistances(selected, draft);
                  const near = nearestNeighbour(selected, draft);
                  return (
                    <>
                      <dt className="text-muted-foreground">{ps.edgeLeft}</dt>
                      <dd>{formatMeters(edges.left)}</dd>
                      <dt className="text-muted-foreground">{ps.edgeRight}</dt>
                      <dd>{formatMeters(edges.right)}</dd>
                      <dt className="text-muted-foreground">{ps.edgeTop}</dt>
                      <dd>{formatMeters(edges.top)}</dd>
                      <dt className="text-muted-foreground">{ps.edgeBottom}</dt>
                      <dd>{formatMeters(edges.bottom)}</dd>
                      <dt className="text-muted-foreground">{ps.nearest}</dt>
                      <dd>
                        {near
                          ? `${sketchKindLabel(near.item.kind, lang)} · ${formatMeters(near.distanceM)}`
                          : ps.alone}
                      </dd>
                    </>
                  );
                })()}
              </dl>
            </div>
          )}

          {/* Das Platzmass selbst */}
          <div className="flex gap-2">
            <MeterField
              id="sketch-pitch-width"
              label={ps.pitchWidth}
              value={draft.widthM}
              min={PITCH_MIN_M}
              max={PITCH_MAX_M}
              onChange={value =>
                setDraft(current => resizePitch(current, value, current.depthM))
              }
            />
            <MeterField
              id="sketch-pitch-depth"
              label={ps.pitchDepth}
              value={draft.depthM}
              min={PITCH_MIN_M}
              max={PITCH_MAX_M}
              onChange={value =>
                setDraft(current => resizePitch(current, current.widthM, value))
              }
            />
          </div>

          {overlaps.length > 0 && (
            <p className="flex items-start gap-2 text-xs text-destructive">
              <TriangleAlert
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                {overlaps
                  .map(pair =>
                    ps.overlap(
                      sketchKindLabel(pair.a.kind, lang),
                      sketchKindLabel(pair.b.kind, lang)
                    )
                  )
                  .join(" ")}
              </span>
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  id: spotId,
                  // Eine leere Skizze wird zu null – «nicht erfasst» und
                  // «leeres Raster» bleiben so unterscheidbar.
                  pitchSketchJson: serializePitchSketch(draft),
                })
              }
            >
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

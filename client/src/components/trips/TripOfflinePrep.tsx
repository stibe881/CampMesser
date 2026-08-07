/**
 * Eine Reise offline stellen – mit einem Knopf (#387).
 *
 * WAS FEHLTE: Offline gibt es stückweise. Kartenkacheln lädt man pro
 * Platz vor (#217), die eigenen Daten bleiben erhalten (#302), Häkchen
 * werden gepuffert (#303). Nur muss man vor der Abfahrt an mehrere
 * Dinge einzeln denken – und im Funkloch merkt man, was man vergessen
 * hat. Da nützt die beste Offline-Fähigkeit nichts mehr.
 *
 * EIN KNOPF, DER ALLES FÜR DIESE REISE HOLT: Platz-Dossier, Packliste,
 * Menüplan samt Rezepten, Mitreisende, Kartenkacheln um den Platz.
 *
 * ER SAGT EHRLICH, WAS ER GEHOLT HAT. Jeder Schritt hat seinen eigenen
 * Zustand, und ein gescheiterter Schritt bleibt sichtbar rot stehen,
 * statt in einer Sammelmeldung unterzugehen. «Fertig» über einem halb
 * geladenen Paket wäre die gefährlichste Anzeige der ganzen App: Man
 * verlässt sich darauf und steht dann ohne Karte da.
 *
 * WAS ER NICHT VERSPRECHEN KANN: Der Browser entscheidet selbst, was er
 * aus seinem Zwischenspeicher wirft, wenn der Platz knapp wird. Das
 * steht als Satz darunter und nicht nur in diesem Kommentar.
 *
 * KEIN AUTOMATISMUS. Das Paket sind einige Megabyte; wer im Ausland mit
 * Roaming unterwegs ist, entscheidet das selbst.
 */
import { useState } from "react";
import { CheckCircle2, CloudDownload, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";
import { trpc } from "@/lib/trpc";
import {
  currentTileLayer,
  downloadTiles,
  rememberOfflineMap,
  tileCacheSupported,
  tilesForArea,
  zoomLevelsUpTo,
} from "@/lib/mapTiles";
import { cn } from "@/lib/utils";

/** Radius und Zoom des Reise-Pakets: der Platz und sein Dorf. */
const TRIP_RADIUS_KM = 5;
const TRIP_MAX_ZOOM = 15;

type StepState = "idle" | "running" | "done" | "failed" | "skipped";

interface Step {
  key: string;
  label: string;
  state: StepState;
  /** Zusatz wie «412 Kacheln» – nur, wenn es etwas zu sagen gibt. */
  detail?: string;
}

export default function TripOfflinePrep({
  tripId,
  spotId,
  packListId,
}: {
  tripId: number;
  spotId: number | null;
  packListId: number | null;
}) {
  const t = useT();
  const to = t.tripOffline;
  const utils = trpc.useUtils();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = (key: string, changes: Partial<Step>) =>
    setSteps(list =>
      (list ?? []).map(step =>
        step.key === key ? { ...step, ...changes } : step
      )
    );

  /**
   * Einen Schritt ausführen und seinen Ausgang festhalten.
   *
   * Ein Fehler bricht NICHT ab: Ohne Menüplan ist die Karte trotzdem
   * etwas wert. Was scheiterte, bleibt sichtbar.
   */
  const run = async (key: string, task: () => Promise<unknown>) => {
    patch(key, { state: "running" });
    try {
      await task();
      patch(key, { state: "done" });
    } catch {
      patch(key, { state: "failed" });
    }
  };

  const start = async () => {
    setBusy(true);
    setSteps([
      { key: "trip", label: to.stepTrip, state: "idle" },
      { key: "pack", label: to.stepPacking, state: "idle" },
      { key: "menu", label: to.stepMenu, state: "idle" },
      { key: "map", label: to.stepMap, state: "idle" },
    ]);

    // Reise, Plätze, Mitreisende, Fotos des Platzes
    await run("trip", async () => {
      await utils.trips.list.prefetch();
      await utils.spots.list.prefetch();
      await utils.trips.members.list.prefetch({ tripId });
      if (spotId !== null) {
        await utils.spots.photos.list.prefetch({ spotId });
      }
    });

    // Packliste: ohne Verknüpfung gibt es nichts zu holen
    if (packListId === null) {
      patch("pack", { state: "skipped", detail: to.noList });
    } else {
      await run("pack", async () => {
        await utils.packing.items.prefetch({ listId: packListId });
        await utils.packing.progress.prefetch({ listId: packListId });
      });
    }

    // Menüplan samt Rezeptbuch – die Rezepte sind der eigentliche Grund
    await run("menu", async () => {
      await utils.menu.listByTrip.prefetch({ tripId });
      await utils.recipes.list.prefetch();
    });

    // Kartenkacheln um den Platz
    if (spotId === null) {
      patch("map", { state: "skipped", detail: to.noSpot });
    } else if (!tileCacheSupported()) {
      patch("map", { state: "skipped", detail: to.noTileCache });
    } else {
      await run("map", async () => {
        const spot = utils.spots.list
          .getData()
          ?.find(entry => entry.id === spotId);
        if (!spot) throw new Error("Platz nicht geladen");
        const tiles = tilesForArea(
          spot.latitude,
          spot.longitude,
          TRIP_RADIUS_KM,
          zoomLevelsUpTo(TRIP_MAX_ZOOM)
        );
        const layer = currentTileLayer();
        const result = await downloadTiles(tiles, layer, {
          onProgress: (done, total) =>
            patch("map", { detail: to.tileProgress(done, total) }),
        });
        // Ins Verzeichnis der Pakete (#217), damit man es auch wieder
        // löschen kann – sonst läge es unsichtbar im Speicher.
        rememberOfflineMap(spotId, {
          radiusKm: TRIP_RADIUS_KM,
          maxZoom: TRIP_MAX_ZOOM,
          layer,
          tiles: result.stored,
          bytes: result.bytes,
          savedAt: new Date().toISOString(),
        });
        patch("map", { detail: to.tilesStored(result.stored) });
        if (result.stored === 0) throw new Error("Keine Kachel geladen");
      });
    }

    setBusy(false);
  };

  const icon = (state: StepState) => {
    if (state === "running")
      return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
    if (state === "done")
      return (
        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
      );
    if (state === "failed")
      return (
        <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
      );
    return <span className="block h-4 w-4" aria-hidden="true" />;
  };

  return (
    <div className="mt-2 rounded-lg border border-border bg-card p-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <CloudDownload className="h-4 w-4 text-primary" aria-hidden="true" />
        {to.title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{to.intro}</p>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2"
        disabled={busy}
        onClick={start}
      >
        {busy ? to.running : steps ? to.again : to.start}
      </Button>

      {steps && (
        <ul className="mt-3 space-y-1.5" aria-live="polite">
          {steps.map(step => (
            <li key={step.key} className="flex items-start gap-2 text-sm">
              {icon(step.state)}
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    step.state === "failed" && "text-destructive",
                    step.state === "skipped" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <span className="block text-xs text-muted-foreground">
                    {step.detail}
                  </span>
                )}
                {step.state === "failed" && (
                  <span className="block text-xs text-destructive">
                    {to.stepFailed}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
        {to.note}
      </p>
    </div>
  );
}

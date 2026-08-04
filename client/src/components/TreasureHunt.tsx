/**
 * GPS-Schatzsuche (#267): Verstecke am Platz anlegen und suchen.
 *
 * Sitzt seit der Zusammenlegung IM FAMILIEN-MODUS statt in einem eigenen
 * Modul – dort suchen Eltern ohnehin nach Beschäftigung für die Kinder,
 * und die Schatzsuche stand als eigene Kachel zwischen Erste Hilfe und
 * Knoten am falschen Ort.
 *
 * Zwei Rollen in einer Ansicht: Erwachsene legen die Verstecke an – immer
 * am Ort, an dem sie gerade stehen, denn Koordinaten von Hand einzutippen
 * macht niemand. Kinder suchen dann mit «warm/kalt» und einem Pfeil.
 *
 * Bewusst KEINE Karte im Suchmodus. Eine Karte verrät sofort, wo der Punkt
 * liegt, und aus der Schatzsuche wird ein Spaziergang zum Pin. Distanz,
 * Richtung und die Wärme-Stufe reichen – und der Blick geht dorthin, wo er
 * hingehört: nach draussen.
 *
 * GPS UND KOMPASS LAUFEN ERST AUF KNOPFDRUCK. Als eigene Seite war das
 * egal – wer sie öffnete, wollte die Schatzsuche. Im Familien-Modus wäre
 * es das nicht: Wer nur ein Quiz sucht, soll weder einen Standort-Dialog
 * sehen noch das GPS mitlaufen lassen.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Compass,
  Eye,
  Flag,
  Gem,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { bearingDegrees, distanceMeters, formatDistance } from "@shared/geo";
import { pick } from "@shared/i18n";
import {
  accuracyUsable,
  canDeclareFound,
  huntProgress,
  MAX_POINT_HINT_LENGTH,
  MAX_POINT_NAME_LENGTH,
  MAX_TREASURE_POINTS,
  nextPoint,
  sortPoints,
  WARMTH_HINTS,
  WARMTH_LABELS,
  warmthFor,
  type Warmth,
} from "@shared/treasureHunt";

type Fix = { lat: number; lon: number; accuracy: number | null };

const warmthStyles: Record<Warmth, string> = {
  eiskalt: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  kalt: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  warm: "border-amber-600/40 bg-amber-500/15 text-amber-800 dark:text-amber-300",
  heiss:
    "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-300",
  gefunden: "border-primary/40 bg-primary/10 text-primary",
};

export default function TreasureHunt({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const tt = t.treasure;
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  /** Zu, bis jemand die Schatzsuche wirklich will (GPS, Kompass, Abfrage). */
  const [open, setOpen] = useState(false);

  const huntsQuery = trpc.treasure.list.useQuery(undefined, {
    enabled: isAuthenticated && open,
  });
  const hunts = useMemo(() => huntsQuery.data ?? [], [huntsQuery.data]);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [mode, setMode] = useState<"verstecken" | "suchen">("verstecken");
  const [fix, setFix] = useState<Fix | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [pointDialogOpen, setPointDialogOpen] = useState(false);
  const [pointForm, setPointForm] = useState({ name: "", hint: "" });
  const { heading, start } = useDeviceHeading();

  useEffect(() => {
    if (!open) return;
    void start();
  }, [open, start]);

  // Standort laufend verfolgen – ohne ihn geht weder Verstecken noch Suchen
  useEffect(() => {
    if (!open) return;
    if (!navigator.geolocation) {
      setGeoError(true);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      pos =>
        setFix({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy)
            ? pos.coords.accuracy
            : null,
        }),
      () => setGeoError(true),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [open]);

  const refresh = () => utils.treasure.list.invalidate();
  const createHunt = trpc.treasure.create.useMutation({
    onSuccess: ({ id }) => {
      setActiveId(id);
      void refresh();
    },
    onError: e => toast.error(e.message),
  });
  const removeHunt = trpc.treasure.remove.useMutation({
    onSuccess: () => {
      setActiveId(null);
      void refresh();
    },
    onError: e => toast.error(e.message),
  });
  const addPoint = trpc.treasure.addPoint.useMutation({
    onSuccess: () => {
      setPointDialogOpen(false);
      setPointForm({ name: "", hint: "" });
      void refresh();
    },
    onError: e => toast.error(e.message),
  });
  const removePoint = trpc.treasure.removePoint.useMutation({
    onSuccess: () => void refresh(),
    onError: e => toast.error(e.message),
  });
  const setFound = trpc.treasure.setFound.useMutation({
    onSuccess: () => void refresh(),
    onError: e => toast.error(e.message),
  });
  const resetHunt = trpc.treasure.reset.useMutation({
    onSuccess: () => void refresh(),
    onError: e => toast.error(e.message),
  });

  const active = hunts.find(h => h.id === activeId) ?? hunts[0] ?? null;
  const points = useMemo(
    () => (active ? sortPoints(active.points) : []),
    [active]
  );
  const progress = huntProgress(points);
  const target = nextPoint(points);

  // Entfernung und Peilung zum nächsten Versteck
  const toTarget = useMemo(() => {
    if (!fix || !target) return null;
    const meters = distanceMeters(
      fix.lat,
      fix.lon,
      target.latitude,
      target.longitude
    );
    return {
      meters,
      bearing: bearingDegrees(
        fix.lat,
        fix.lon,
        target.latitude,
        target.longitude
      ),
      warmth: warmthFor(meters),
      canFind: canDeclareFound(meters, fix.accuracy),
    };
  }, [fix, target]);

  if (loading) return null;

  /** Überschrift des Abschnitts – im Familien-Modus wie die Nachbarn. */
  const sectionHeading = (
    <>
      <h2 className="mb-1 flex items-center gap-2 font-serif text-xl font-semibold">
        <Gem className="h-5 w-5 text-primary" aria-hidden="true" />
        {tt.title}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">{tt.subtitle}</p>
    </>
  );

  if (!isAuthenticated) {
    return (
      <section className={cn("mb-8", className)} aria-label={tt.title}>
        {sectionHeading}
        <LoginPrompt feature={tt.loginFeature} />
      </section>
    );
  }

  if (!open) {
    return (
      <section className={cn("mb-8", className)} aria-label={tt.title}>
        {sectionHeading}
        <Button variant="outline" onClick={() => setOpen(true)}>
          <ChevronDown className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {tt.openSection}
        </Button>
        {/* Ehrlich sagen, warum der Knopf da ist und nicht gleich alles läuft */}
        <p className="mt-2 text-xs text-muted-foreground">
          {tt.openSectionHint}
        </p>
      </section>
    );
  }

  return (
    <section className={cn("mb-8", className)} aria-label={tt.title}>
      {sectionHeading}

      {geoError && (
        <p className="mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm">
          {tt.geoError}
        </p>
      )}

      {/* Schatzsuchen: Auswahl und Anlegen */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {hunts.map(hunt => (
          <button
            key={hunt.id}
            type="button"
            onClick={() => setActiveId(hunt.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active?.id === hunt.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={active?.id === hunt.id}
          >
            {hunt.name}
          </button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => createHunt.mutate({ name: tt.defaultName })}
          disabled={createHunt.isPending}
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          {tt.newHunt}
        </Button>
      </div>

      {!active && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {tt.empty}
          </CardContent>
        </Card>
      )}

      {active && (
        <>
          {/* Modus: verstecken oder suchen */}
          <div
            className="mb-5 flex gap-2"
            role="group"
            aria-label={tt.modeAria}
          >
            {(["verstecken", "suchen"] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  mode === m
                    ? "border-primary bg-accent"
                    : "border-border bg-card text-muted-foreground"
                )}
                aria-pressed={mode === m}
              >
                {m === "verstecken" ? (
                  <MapPin
                    className="mr-1.5 inline h-4 w-4"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
                )}
                {m === "verstecken" ? tt.modeHide : tt.modeSeek}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold">{active.name}</span>
              <span className="text-muted-foreground">
                {tt.progressLine(progress.found, progress.total)}
              </span>
            </div>
            <Progress value={progress.percent} aria-label={tt.progressAria} />
          </div>

          {mode === "suchen" && (
            <section className="mb-6" aria-label={tt.seekAria}>
              {progress.done ? (
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-5 text-center">
                  <Trophy
                    className="mx-auto h-10 w-10 text-primary"
                    aria-hidden="true"
                  />
                  <p className="mt-2 font-serif text-xl font-bold">
                    {tt.allFound}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => resetHunt.mutate({ huntId: active.id })}
                    disabled={resetHunt.isPending}
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {tt.reset}
                  </Button>
                </div>
              ) : !target ? (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  {tt.noPoints}
                </p>
              ) : !fix ? (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  {tt.waitingForFix}
                </p>
              ) : (
                <div
                  className={cn(
                    "rounded-xl border p-5 text-center",
                    toTarget ? warmthStyles[toTarget.warmth] : "border-border"
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">
                    {tt.stationLine(target.sortIndex + 1, points.length)}
                  </p>
                  <p className="mt-1 font-serif text-2xl font-bold">
                    {toTarget ? pick(WARMTH_LABELS[toTarget.warmth], lang) : ""}
                  </p>
                  {toTarget && (
                    <>
                      <p className="mt-1 text-sm">
                        {formatDistance(toTarget.meters, lang)}
                      </p>
                      {/* Pfeil zeigt zum Versteck, sobald der Kompass läuft */}
                      {heading !== null && (
                        <Compass
                          className="mx-auto mt-3 h-14 w-14 transition-transform"
                          style={{
                            transform: `rotate(${toTarget.bearing - heading}deg)`,
                          }}
                          aria-label={tt.arrowAria}
                        />
                      )}
                      <p className="mt-3 text-sm">
                        {pick(WARMTH_HINTS[toTarget.warmth], lang)}
                      </p>
                      {target.hint && (
                        <p className="mt-3 rounded-lg bg-background/60 p-3 text-sm italic">
                          «{target.hint}»
                        </p>
                      )}
                      {!accuracyUsable(fix.accuracy) && (
                        <p className="mt-3 text-xs">{tt.weakSignal}</p>
                      )}
                      <Button
                        className="mt-4 w-full"
                        disabled={!toTarget.canFind || setFound.isPending}
                        onClick={() =>
                          setFound.mutate({
                            huntId: active.id,
                            pointId: target.id,
                            found: true,
                          })
                        }
                      >
                        <Flag className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        {toTarget.canFind ? tt.markFound : tt.tooFarAway}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {mode === "verstecken" && (
            <section className="mb-6" aria-label={tt.hideAria}>
              <Button
                className="mb-4 w-full"
                onClick={() => setPointDialogOpen(true)}
                disabled={!fix || points.length >= MAX_TREASURE_POINTS}
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {tt.addPointHere}
              </Button>
              {!fix && !geoError && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {tt.waitingForFix}
                </p>
              )}
              {points.length >= MAX_TREASURE_POINTS && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {tt.maxPoints(MAX_TREASURE_POINTS)}
                </p>
              )}
              <p className="mb-4 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                {tt.hideTip}
              </p>
            </section>
          )}

          {/* Stationen-Liste: im Versteck-Modus mit Koordinaten, sonst knapp */}
          <ul className="space-y-2">
            {points.map((point, index) => (
              <li
                key={point.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    point.foundAt
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {mode === "verstecken" || point.foundAt
                      ? point.name
                      : tt.hiddenName}
                  </span>
                  {mode === "verstecken" && point.hint && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {point.hint}
                    </span>
                  )}
                </span>
                {point.foundAt && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setFound.mutate({
                        huntId: active.id,
                        pointId: point.id,
                        found: false,
                      })
                    }
                    aria-label={tt.hideAgainAria(point.name)}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                {mode === "verstecken" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      removePoint.mutate({
                        huntId: active.id,
                        pointId: point.id,
                      })
                    }
                    aria-label={tt.removePointAria(point.name)}
                  >
                    <Trash2
                      className="h-4 w-4 text-destructive"
                      aria-hidden="true"
                    />
                  </Button>
                )}
              </li>
            ))}
          </ul>

          {mode === "verstecken" && (
            <Button
              variant="ghost"
              className="mt-6 text-destructive"
              onClick={() => removeHunt.mutate({ id: active.id })}
              disabled={removeHunt.isPending}
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {tt.removeHunt}
            </Button>
          )}
        </>
      )}

      <Dialog open={pointDialogOpen} onOpenChange={setPointDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tt.addPointTitle}</DialogTitle>
            <DialogDescription>{tt.addPointDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="treasure-name">{tt.pointName}</Label>
              <Input
                id="treasure-name"
                value={pointForm.name}
                maxLength={MAX_POINT_NAME_LENGTH}
                onChange={e =>
                  setPointForm(f => ({ ...f, name: e.target.value }))
                }
                placeholder={tt.pointNamePlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="treasure-hint">{tt.pointHint}</Label>
              <Input
                id="treasure-hint"
                value={pointForm.hint}
                maxLength={MAX_POINT_HINT_LENGTH}
                onChange={e =>
                  setPointForm(f => ({ ...f, hint: e.target.value }))
                }
                placeholder={tt.pointHintPlaceholder}
              />
            </div>
            {fix && (
              <p className="text-xs text-muted-foreground">
                {tt.accuracyLine(Math.round(fix.accuracy ?? 0))}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!active || !fix || !pointForm.name.trim()) return;
                addPoint.mutate({
                  huntId: active.id,
                  name: pointForm.name.trim(),
                  hint: pointForm.hint.trim() || null,
                  latitude: fix.lat,
                  longitude: fix.lon,
                });
              }}
              disabled={!pointForm.name.trim() || addPoint.isPending}
            >
              {tt.savePoint}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/**
 * Windrichtungs-Assistent (#251): Wie stelle ich Zelt oder Tarp hin, damit
 * der Wind nicht dagegen drückt?
 *
 * Der Abschnitt holt die aktuelle Windrichtung und die Böen von Open-Meteo
 * (dieselbe Quelle wie das Wetter-Modul, ohne Schlüssel) und zeigt zwei
 * Pfeile auf einer Kompassrose: woher der Wind kommt und wohin die
 * Zeltspitze zeigen soll. Mit Kompass dreht sich die Rose mit dem Gerät,
 * dann steht daneben, wie viel Grad nach links oder rechts noch fehlen.
 *
 * Ohne Kompass (Desktop, verweigerte Erlaubnis) bleibt die Empfehlung als
 * Himmelsrichtung stehen – das Muster kennt der Zelt-Finder schon.
 *
 * Die Rechnerei liegt vollständig in `shared/tentWind.ts` und ist getestet;
 * hier steht nur Bedienung und Darstellung.
 */
import { useEffect, useRef, useState } from "react";
import { Compass, RotateCw, Wind } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDeviceHeading } from "@/hooks/useDeviceHeading";
import { usePersistFn } from "@/hooks/usePersistFn";
import { useI18n } from "@/i18n";
import { distanceMeters } from "@shared/geo";
import { compassDirection } from "@shared/solar";
import { TENT_SHAPES, tentWindAdvice, type TentShape } from "@shared/tentWind";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "ready" | "failed";

/**
 * Ab dieser Entfernung zum letzten Abruf lohnt sich ein neuer (#358).
 *
 * WARUM ES ÜBERHAUPT EINE SCHWELLE BRAUCHT: Der Zelt-Finder verfolgt die
 * Position fortlaufend mit `watchPosition` und hoher Genauigkeit – jeder
 * Fix wackelt um ein paar Meter, und es kommt sekündlich einer. Hing
 * dieser Abschnitt an den rohen Koordinaten, lud er bei JEDEM Fix neu.
 * Das kostete nicht nur eine Anfrage pro Sekunde beim Wetterdienst; die
 * fertige Kompassrose wurde dabei jedes Mal wieder zum Ladeskelett. Weil
 * der Abschnitt zuunterst auf der Seite steht, schrumpfte die Seite so um
 * mehrere hundert Pixel – und wer ganz unten stand, wurde vom Browser ein
 * Stück nach oben geschoben. Genau das hat der Nutzer gemeldet.
 *
 * WARUM ENTFERNUNG UND NICHT GERUNDETE KOORDINATEN: Runden hat Kanten.
 * Wer zufällig genau auf einer Rasterlinie steht, springt beim Wackeln
 * zwischen zwei Werten hin und her – und lädt wieder im Sekundentakt.
 * «Weiter als zwei Kilometer vom letzten Abruf» kennt diese Kanten nicht.
 *
 * Zwei Kilometer sind dabei keine Sparsamkeit, sondern die Auflösung der
 * Sache: Open-Meteo rechnet auf einem Gitter von rund elf Kilometern.
 */
const RELOAD_DISTANCE_M = 2000;

interface WindNow {
  fromDeg: number;
  speedKmh: number;
  gustKmh: number;
}

/** Aktuellen Wind holen – eine Stunde reicht, mehr braucht es hier nicht. */
async function fetchWindNow(
  lat: number,
  lon: number,
  signal: AbortSignal
): Promise<WindNow> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    current: "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal }
  );
  if (!res.ok) throw new Error("Wetterdienst nicht erreichbar");
  const json = await res.json();
  const current = json?.current ?? {};
  const fromDeg = Number(current.wind_direction_10m);
  if (!Number.isFinite(fromDeg)) throw new Error("keine Windrichtung");
  return {
    fromDeg,
    speedKmh: Number(current.wind_speed_10m) || 0,
    gustKmh: Number(current.wind_gusts_10m) || 0,
  };
}

export default function TentWindHelper({
  latitude,
  longitude,
  className,
}: {
  latitude: number | null;
  longitude: number | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tw = t.tentWind;
  const [shape, setShape] = useState<TentShape>("tunnel");
  const [status, setStatus] = useState<Status>("idle");
  const [busy, setBusy] = useState(false);
  const [wind, setWind] = useState<WindNow | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { heading, active, permission, start } = useDeviceHeading();

  /** Wo zuletzt abgerufen wurde – Grundlage für `RELOAD_DISTANCE_M`. */
  const loadedAtRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // `usePersistFn` statt `useCallback`: Die Funktion braucht die aktuellen
  // Koordinaten, darf aber ihre Identität nicht bei jedem Fix ändern –
  // sonst löst der Effekt unten wieder im Sekundentakt aus.
  const load = usePersistFn(async () => {
    if (latitude === null || longitude === null) return;
    // Vor dem Abruf merken, nicht danach: Ein Fehlschlag soll nicht bei
    // jedem folgenden Fix erneut den Wetterdienst behelligen. Zum
    // Wiederholen gibt es den Knopf.
    loadedAtRef.current = { lat: latitude, lon: longitude };
    // Beim Nachladen bleibt eine fertige Rose STEHEN. Sie durch das
    // Ladeskelett zu ersetzen, würde die Seite unter dem Finger
    // zusammenziehen; das Skelett gehört nur an den Anfang.
    setStatus(prev => (prev === "ready" ? prev : "loading"));
    setBusy(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setWind(await fetchWindNow(latitude, longitude, controller.signal));
      setStatus("ready");
    } catch {
      if (controller.signal.aborted) return;
      // Ein misslungener Nachschlag wirft nicht weg, was schon dasteht.
      setStatus(prev => (prev === "ready" ? prev : "failed"));
    } finally {
      // Nur der zuletzt gestartete Abruf schaltet den Knopf wieder frei
      if (abortRef.current === controller) setBusy(false);
    }
  });

  // Einmal beim ersten Standort – danach erst wieder, wenn man wirklich
  // weitergezogen ist. Kein Dauerpolling.
  useEffect(() => {
    if (latitude === null || longitude === null) return;
    const at = loadedAtRef.current;
    if (
      at &&
      distanceMeters(at.lat, at.lon, latitude, longitude) < RELOAD_DISTANCE_M
    ) {
      return;
    }
    void load();
  }, [latitude, longitude, load]);

  if (latitude === null || longitude === null) return null;

  const advice = wind
    ? tentWindAdvice(wind.fromDeg, wind.gustKmh, shape, active ? heading : null)
    : null;

  /** Kompassrose dreht mit dem Gerät, sofern der Kompass läuft. */
  const roseRotation = active && heading !== null ? -heading : 0;

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tw.sectionAria}
    >
      <div className="flex items-center gap-2">
        <Wind className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="font-serif text-lg font-semibold">{tw.title}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8"
          onClick={() => void load()}
          disabled={busy}
          aria-label={tw.refreshAria}
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{tw.subtitle}</p>

      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label={tw.shapeGroupAria}
      >
        {TENT_SHAPES.map(value => (
          <button
            key={value}
            type="button"
            onClick={() => setShape(value)}
            aria-pressed={shape === value}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              shape === value
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            {tw.shape[value]}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {tw.shapeHint[shape]}
      </p>

      {status === "loading" && (
        <Skeleton
          className="mt-3 h-40 w-full rounded-lg"
          aria-label={tw.loading}
        />
      )}
      {status === "failed" && (
        <p className="mt-3 text-sm text-muted-foreground">{tw.loadFailed}</p>
      )}

      {status === "ready" && advice && wind && (
        <>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
            <div
              className="relative h-40 w-40 shrink-0"
              role="img"
              aria-label={tw.roseAria(
                compassDirection(advice.windFromDeg, lang),
                compassDirection(advice.recommendedDeg, lang)
              )}
            >
              <div
                className="absolute inset-0 rounded-full border-2 border-border transition-transform duration-300"
                style={{ transform: `rotate(${roseRotation}deg)` }}
              >
                {/* Himmelsrichtungen */}
                {[0, 90, 180, 270].map(deg => (
                  <span
                    key={deg}
                    className="absolute left-1/2 top-1 -translate-x-1/2 text-[0.65rem] font-semibold text-muted-foreground"
                    style={{
                      transform: `rotate(${deg}deg) translateY(0) rotate(${-deg}deg)`,
                      transformOrigin: "50% 79px",
                    }}
                  >
                    {compassDirection(deg, lang)}
                  </span>
                ))}
                {/* Wind: Pfeil zeigt in die Blasrichtung */}
                <div
                  className="absolute left-1/2 top-1/2 h-16 w-1 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-muted-foreground/70"
                  style={{ transform: `rotate(${advice.windTowardDeg}deg)` }}
                  aria-hidden="true"
                />
                {/* Empfehlung: Zeltspitze */}
                <div
                  className="absolute left-1/2 top-1/2 h-20 w-1.5 origin-bottom -translate-x-1/2 -translate-y-full rounded-full bg-primary"
                  style={{ transform: `rotate(${advice.recommendedDeg}deg)` }}
                  aria-hidden="true"
                />
                <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
              </div>
            </div>

            <dl className="min-w-0 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">{tw.windFromLabel}</dt>
                <dd className="font-medium">
                  {compassDirection(advice.windFromDeg, lang)} (
                  {Math.round(advice.windFromDeg)}°)
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">{tw.speedLabel}</dt>
                <dd className="font-medium">
                  {tw.speedValue(
                    Math.round(wind.speedKmh),
                    Math.round(wind.gustKmh)
                  )}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">{tw.pointLabel}</dt>
                <dd className="font-medium text-primary">
                  {compassDirection(advice.recommendedDeg, lang)} (
                  {Math.round(advice.recommendedDeg)}°)
                </dd>
              </div>
              <p
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs",
                  advice.level === "storm"
                    ? "bg-destructive/10 text-destructive"
                    : advice.level === "windy"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {tw.levelHint[advice.level]}
              </p>
            </dl>
          </div>

          {/* Kompass-Rückmeldung: wie weit noch drehen? */}
          {active && advice.turnDeg !== null && advice.quality !== null ? (
            <p
              className={cn(
                "mt-3 rounded-lg px-3 py-2 text-sm",
                advice.quality === "good"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
              aria-live="polite"
            >
              {advice.quality === "good"
                ? tw.alignedNow
                : advice.turnDeg > 0
                  ? tw.turnRight(Math.round(Math.abs(advice.turnDeg)))
                  : tw.turnLeft(Math.round(Math.abs(advice.turnDeg)))}
            </p>
          ) : permission !== "unsupported" && permission !== "denied" ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void start()}
            >
              <Compass className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {tw.startCompass}
            </Button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              {permission === "denied" ? tw.compassDenied : tw.noCompass}
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">{tw.source}</p>
        </>
      )}
    </section>
  );
}

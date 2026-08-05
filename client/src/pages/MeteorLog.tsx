/**
 * Sternschnuppen-Protokoll (#294): eine Beobachtungsnacht mitzählen.
 *
 * DER ZÄHL-KNOPF IST DIE RICHTUNGSWAHL. Acht Felder im Kreis, in der
 * Mitte «unklar»: Man tippt dorthin, wo sie hergekommen ist – Zeit und
 * Richtung in einem Griff. Wer im Liegestuhl liegt, schreibt nichts auf.
 *
 * GESPEICHERT WIRD AUF DEM GERÄT. Ein Protokoll unter freiem Himmel darf
 * kein Konto und keine Verbindung brauchen; die Nächte liegen im
 * localStorage. Der Preis ist ehrlich zu nennen: Sie wandern nicht aufs
 * zweite Gerät.
 *
 * ROTLICHT UND WACHES DISPLAY sind hier keine Spielerei: Ein heller
 * Bildschirm zerstört in zwei Sekunden die Dunkeladaption, für die die
 * Augen zwanzig Minuten gebraucht haben – und ein Display, das mitten im
 * Zählen ausgeht, kostet die Nacht.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { fmtPlain } from "@/lib/dateFormat";
import { useConfirm } from "@/components/ConfirmDialog";
import { Moon, Pause, Play, Star, Trash2, Undo2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import RedLightMode from "@/components/RedLightMode";
import { Button } from "@/components/ui/button";
import { useWakeLock } from "@/lib/useWakeLock";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { meteorShowers, showersNearPeak } from "@shared/astro";
import { compassDirection } from "@shared/solar";
import {
  SECTOR_DEGREES,
  addSighting,
  newSession,
  nightSummaries,
  pauseSession,
  resumeSession,
  sectorCounts,
  sessionStats,
  undoSighting,
  type MeteorSession,
} from "@shared/meteorLog";
import { cn } from "@/lib/utils";

const STORE_KEY = "campmesser.meteorLog";

/** Neue, praktisch kollisionsfreie Sitzungs-Id. */
function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function load(): MeteorSession[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is MeteorSession =>
        entry != null &&
        typeof entry === "object" &&
        typeof (entry as MeteorSession).id === "string" &&
        Array.isArray((entry as MeteorSession).spans) &&
        Array.isArray((entry as MeteorSession).sightings)
    );
  } catch {
    return [];
  }
}

/**
 * Die Anordnung der Richtungsfelder im 3×3-Raster: oben Norden, rechts
 * Osten – wie auf einer Karte. In der Mitte sitzt «unklar».
 */
const GRID: (number | null | "center")[] = [7, 0, 1, 6, "center", 2, 5, 4, 3];

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}

export default function MeteorLogPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const ml = t.meteorLog;
  const [sessions, setSessions] = useState<MeteorSession[]>(load);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [redLight, setRedLight] = useState(false);
  // Die Uhr tickt für die Anzeige der Dauer weiter, solange gezählt wird.
  const [now, setNow] = useState(() => Date.now());

  const active = useMemo(
    () => sessions.find(session => session.id === activeId) ?? null,
    [sessions, activeId]
  );

  useWakeLock(active != null);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
    } catch {
      /* Voller Speicher darf das Zählen nicht abbrechen */
    }
  }, [sessions]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, [active]);

  const update = useCallback(
    (change: (session: MeteorSession) => MeteorSession) => {
      setNow(Date.now());
      setSessions(prev =>
        prev.map(session =>
          session.id === activeId ? change(session) : session
        )
      );
    },
    [activeId]
  );

  const start = () => {
    const at = Date.now();
    const session = newSession(newId(), at);
    setSessions(prev => prev.concat(session));
    setActiveId(session.id);
    setNow(at);
  };

  const count = (sector: number | null) => {
    update(session => addSighting(session, sector, Date.now()));
    if ("vibrate" in navigator) navigator.vibrate(15);
  };

  const stats = active ? sessionStats(active, now) : null;
  const nights = useMemo(() => nightSummaries(sessions, now), [sessions, now]);
  const totalNights = nights.length;

  /** Ströme, die in dieser Nacht Maximum haben – zur Auswahl gestellt. */
  const tonight = useMemo(
    () => showersNearPeak(new Date(active ? active.spans[0].from : now)),
    [active, now]
  );

  const showerName = (id: string | null) => {
    const shower = meteorShowers.find(entry => entry.id === id);
    return shower ? pick(shower.name, lang) : ml.showerUnknown;
  };

  const sectorLabel = (sector: number | null) =>
    sector == null
      ? ml.directionUnknown
      : compassDirection(sector * SECTOR_DEGREES, lang);

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={ml.title} subtitle={ml.intro} />

      {!active ? (
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Star
            className="mx-auto mb-2 h-8 w-8 text-primary"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">{ml.startHint}</p>
          <Button className="mt-3 w-full" onClick={start}>
            {ml.start}
          </Button>
          {tonight.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {ml.tonight(tonight.map(s => pick(s.name, lang)).join(", "))}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Kopfzeile: Zahl, Zeit, Rate */}
          <div className="rounded-xl border-2 border-primary/40 bg-accent/30 p-4 text-center">
            <p className="font-serif text-5xl font-bold text-primary">
              {stats?.count ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {ml.observed(formatDuration(stats?.observedMs ?? 0))}
            </p>
            <p className="mt-1 text-sm font-medium">
              {stats?.perHour == null
                ? ml.rateTooEarly
                : ml.rate(Math.round(stats.perHour * 10) / 10)}
            </p>
            {stats?.dominant != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {ml.mostlyFrom(sectorLabel(stats.dominant))}
              </p>
            )}
          </div>

          {/* Der Zähl-Knopf IST die Richtungswahl */}
          <p className="mt-4 text-sm font-medium">{ml.tapHint}</p>
          <div className="mt-2 grid aspect-square grid-cols-3 gap-2">
            {GRID.map((cell, index) =>
              cell === "center" ? (
                <button
                  key="center"
                  type="button"
                  onClick={() => count(null)}
                  className="rounded-full border-2 border-dashed border-border bg-background text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {ml.directionUnknown}
                </button>
              ) : (
                <button
                  key={index}
                  type="button"
                  onClick={() => count(cell as number)}
                  className="rounded-lg border-2 border-border bg-background text-lg font-semibold transition-colors hover:border-primary hover:bg-accent/40"
                >
                  {compassDirection((cell as number) * SECTOR_DEGREES, lang)}
                </button>
              )
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                update(session =>
                  stats?.observing
                    ? pauseSession(session, Date.now())
                    : resumeSession(session, Date.now())
                )
              }
            >
              {stats?.observing ? (
                <Pause className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {stats?.observing ? ml.pause : ml.resume}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={(stats?.count ?? 0) === 0}
              onClick={() => update(undoSighting)}
            >
              <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {ml.undo}
            </Button>
          </div>

          {/* Welcher Strom? Nur die, die heute Nacht überhaupt in Frage kommen */}
          <div className="mt-4 rounded-xl border border-border bg-card p-3">
            <p className="text-sm font-medium">{ml.showerLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[null as string | null]
                .concat(tonight.map(shower => shower.id))
                .map(id => (
                  <button
                    key={id ?? "none"}
                    type="button"
                    onClick={() =>
                      update(session => ({ ...session, showerId: id }))
                    }
                    aria-pressed={active.showerId === id}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active.showerId === id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {showerName(id)}
                  </button>
                ))}
            </div>
          </div>

          {/* Verteilung über die Richtungen */}
          {(stats?.count ?? 0) > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-medium">{ml.distribution}</p>
              <ul className="mt-2 space-y-1">
                {sectorCounts(active)
                  .filter(entry => entry.count > 0)
                  .map(entry => (
                    <li
                      key={entry.sector ?? "unknown"}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-10 shrink-0 font-medium">
                        {sectorLabel(entry.sector)}
                      </span>
                      <span
                        className="h-2 rounded-full bg-primary/60"
                        style={{
                          width: `${(entry.count / (stats?.count || 1)) * 100}%`,
                          minWidth: "0.5rem",
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">
                        {entry.count}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRedLight(true)}
            >
              <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
              {ml.redLight}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                update(session => pauseSession(session, Date.now()));
                setActiveId(null);
              }}
            >
              {ml.finish}
            </Button>
          </div>
        </>
      )}

      {/* Die Nächte bisher */}
      {totalNights > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold">{ml.pastNights}</h2>
          <ul className="mt-2 space-y-2">
            {nights.map(night => (
              <li
                key={night.night}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {ml.nightOf(
                      fmtPlain(new Date(`${night.night}T12:00:00`), lang)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {showerName(night.showerId)} ·{" "}
                    {formatDuration(night.observedMs)}
                    {night.perHour == null
                      ? ""
                      : ` · ${ml.rate(Math.round(night.perHour * 10) / 10)}`}
                  </p>
                </div>
                <span className="font-serif text-2xl font-bold text-primary">
                  {night.count}
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-muted-foreground"
            onClick={async () => {
              if (
                !(await ask({
                  title: ml.clearConfirm,
                  confirmLabel: t.common.confirmEmpty,
                }))
              )
                return;
              setSessions([]);
              setActiveId(null);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            {ml.clear}
          </Button>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">{ml.note}</p>

      {redLight && <RedLightMode onExit={() => setRedLight(false)} />}
    </div>
  );
}

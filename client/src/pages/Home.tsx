import { Link } from "wouter";
import heroImage from "@/assets/hero-camping.webp";
import {
  Compass,
  ListChecks,
  Package,
  Siren,
  Cross,
  Cable,
  TreePine,
  CookingPot,
  BatteryCharging,
  Droplets,
  Scale,
  Users,
  Refrigerator,
  ArrowRight,
  CloudSunRain,
  Tent,
  Shirt,
  Moon,
  History as HistoryIcon,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sprout,
} from "lucide-react";
import { getSunTimes } from "@/lib/sun";
import { useEffect, useRef, useState } from "react";
import { getRecentModules } from "@/components/AppShell";

const ORDER_KEY = "campmesser.moduleOrder";

/** Gespeicherte Kachel-Reihenfolge laden (Pfad-Liste). */
function loadModuleOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

/** Kachel-Reihenfolge auf dem Gerät speichern. */
function saveModuleOrder(order: string[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // Speicher nicht verfügbar – Sortierung gilt nur für die Sitzung
  }
}

interface Module {
  path: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Planung" | "Sicherheit" | "Erste Hilfe" | "Energie & Wasser";
  offline?: boolean;
}

const modules: Module[] = [
  { path: "/sonne", title: "Sonnenstand-Kompass", description: "Sonnenposition, Auf- und Untergang am Standort", icon: Compass, group: "Planung" },
  { path: "/packlisten", title: "Packlisten", description: "Szenario-basierte Checklisten zum Abhaken", icon: ListChecks, group: "Planung" },
  { path: "/inventar", title: "Inventar", description: "Ausrüstung mit Gewicht und Volumen erfassen", icon: Package, group: "Planung" },
  { path: "/packen", title: "Pack-Optimierung", description: "Gewicht und Packmass im Griff behalten", icon: Scale, group: "Planung" },
  { path: "/familie", title: "Familien-Modus", description: "Kinder-Checklisten, Schnitzeljagden und Quiz", icon: Users, group: "Planung" },
  { path: "/zeltplaetze", title: "Zeltplatz-Favoriten", description: "Orte speichern, Wetter und Sonne im Voraus prüfen", icon: Tent, group: "Planung" },
  { path: "/rasen", title: "Rasenschoner", description: "Wie lange darf das Zelt auf dem Rasen stehen?", icon: Sprout, group: "Planung", offline: true },
  { path: "/sos", title: "SOS & Notfall", description: "GPS-Koordinaten und Notfallnummern", icon: Siren, group: "Sicherheit" },
  { path: "/wetter", title: "Camp-Wetter", description: "Hyperlokale Vorhersage und Unwetterwarnungen", icon: CloudSunRain, group: "Sicherheit" },
  { path: "/trockenzeiten", title: "Trockenzeiten", description: "Wird die Wäsche bis Sonnenuntergang trocken?", icon: Shirt, group: "Planung" },
  { path: "/nachtruhe", title: "Camp-Quiet-Timer", description: "Lautstärke im Blick während der Nachtruhe", icon: Moon, group: "Sicherheit" },
  { path: "/erste-hilfe", title: "Erste Hilfe", description: "Offline-Ratgeber für Outdoor-Verletzungen", icon: Cross, group: "Sicherheit", offline: true },
  { path: "/knoten", title: "Knoten-Bibliothek", description: "Die wichtigsten Outdoor-Knoten, Schritt für Schritt", icon: Cable, group: "Erste Hilfe", offline: true },
  { path: "/natur", title: "Natur-Entdecker", description: "Tierspuren, Sternbilder und Bäume erkennen", icon: TreePine, group: "Erste Hilfe", offline: true },
  { path: "/rezepte", title: "Campfire-Rezepte", description: "Kochen auf Gaskocher und offenem Feuer", icon: CookingPot, group: "Erste Hilfe", offline: true },
  { path: "/kuehlbox", title: "Kühlbox-Inventar", description: "Vorräte erfassen, passende Rezepte finden", icon: Refrigerator, group: "Erste Hilfe" },
  { path: "/energie", title: "Energie-Budget", description: "Autarkie-Dauer mit Solar und Powerstation", icon: BatteryCharging, group: "Energie & Wasser" },
  { path: "/wasser", title: "Trinkwasser-Rechner", description: "Wasserbedarf für Personen, Tage und Hitze", icon: Droplets, group: "Energie & Wasser" },
];

const groups = ["Planung", "Sicherheit", "Erste Hilfe", "Energie & Wasser"] as const;

/** Schnellzugriff: die zuletzt genutzten Module (max. 4) aus dem lokalen Verlauf. */
function RecentModules() {
  const [recent] = useState<string[]>(() => getRecentModules());
  const items = recent
    .map(path => modules.find(m => m.path === path))
    .filter((m): m is (typeof modules)[number] => Boolean(m))
    .slice(0, 4);
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-xl font-semibold md:text-2xl">
        <HistoryIcon className="h-5 w-5 text-primary" aria-hidden="true" />
        Zuletzt genutzt
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map(m => {
          const Icon = m.icon;
          return (
            <Link
              key={m.path}
              href={m.path}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
            >
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {m.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [sunInfo, setSunInfo] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState(false);
  const [order, setOrder] = useState<string[]>(() => loadModuleOrder());
  const [dragPath, setDragPath] = useState<string | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const dragInfo = useRef<{ from: string; group: (typeof groups)[number] } | null>(null);
  const dragOverRef = useRef<string | null>(null);

  /** Kachel unter dem Zeiger ermitteln (funktioniert für Maus und Touch). */
  const tileUnderPointer = (x: number, y: number, group: string): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const tile = el?.closest<HTMLElement>("[data-drag-path]");
    if (!tile || tile.dataset.dragGroup !== group) return null;
    return tile.dataset.dragPath ?? null;
  };

  /** Zieh-Zustand zurücksetzen. */
  const endDrag = () => {
    dragInfo.current = null;
    dragOverRef.current = null;
    setDragPath(null);
    setDragOverPath(null);
  };

  /** Module einer Gruppe in gespeicherter Reihenfolge liefern. */
  const orderedModules = (group: (typeof groups)[number]) => {
    const inGroup = modules.filter(m => m.group === group);
    return [...inGroup].sort((a, b) => {
      const ia = order.indexOf(a.path);
      const ib = order.indexOf(b.path);
      return (ia === -1 ? inGroup.indexOf(a) : ia) - (ib === -1 ? inGroup.indexOf(b) : ib);
    });
  };

  /** Kachel innerhalb ihrer Gruppe an neue Position schieben und speichern. */
  const moveModule = (group: (typeof groups)[number], fromPath: string, toPath: string) => {
    if (fromPath === toPath) return;
    const inGroup = orderedModules(group).map(m => m.path);
    const fromIdx = inGroup.indexOf(fromPath);
    const toIdx = inGroup.indexOf(toPath);
    if (fromIdx === -1 || toIdx === -1) return;
    inGroup.splice(toIdx, 0, ...inGroup.splice(fromIdx, 1));
    // Gesamtreihenfolge: alle Gruppen zusammenführen
    const next = groups.flatMap(g => (g === group ? inGroup : orderedModules(g).map(m => m.path)));
    setOrder(next);
    saveModuleOrder(next);
  };

  const moveByOffset = (group: (typeof groups)[number], path: string, offset: -1 | 1) => {
    const inGroup = orderedModules(group).map(m => m.path);
    const idx = inGroup.indexOf(path);
    const target = inGroup[idx + offset];
    if (target) moveModule(group, path, target);
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const times = getSunTimes(new Date(), pos.coords.latitude, pos.coords.longitude);
        if (times.sunrise && times.sunset) {
          const fmt = (d: Date) =>
            d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
          setSunInfo(`Heute: Sonnenaufgang ${fmt(times.sunrise)} · Sonnenuntergang ${fmt(times.sunset)}`);
        }
      },
      () => setSunInfo(null),
      { timeout: 8000 },
    );
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white">
        <img
          src={heroImage}
          alt="Zelt mit Solarpanels und Lagerfeuer vor Schweizer Alpen bei Sonnenuntergang"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"
          aria-hidden="true"
        />
        <div className="container relative py-16 md:py-24">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-white/90 drop-shadow">
            Dein Schweizer Taschenmesser fürs Zelt-Camping
          </p>
          <h1 className="max-w-xl text-3xl font-bold leading-tight drop-shadow-md md:text-5xl">
            Alles fürs Camp.<br />In einer App.
          </h1>
          <p className="mt-3 max-w-lg text-white/90 drop-shadow md:text-lg">
            Planung, Sicherheit, Energie und Naturerlebnis – 16 smarte Werkzeuge für dein nächstes Abenteuer.
          </p>
          {sunInfo && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 text-sm text-white backdrop-blur-md">
              <Compass className="h-4 w-4" aria-hidden="true" />
              {sunInfo}
            </p>
          )}
        </div>
      </section>

      {/* Modul-Grid */}
      <section className="container py-8 md:py-12">
        <RecentModules />
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSortMode(s => !s)}
            className={
              sortMode
                ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-sm"
                : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
            aria-pressed={sortMode}
            aria-label={sortMode ? "Sortieren beenden" : "Kacheln sortieren"}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
            {sortMode ? "Fertig" : "Sortieren"}
          </button>
        </div>
        {sortMode && (
          <p className="mb-4 rounded-lg bg-accent px-4 py-2.5 text-sm text-accent-foreground">
            Ziehe die Kacheln an ihre neue Position (innerhalb der Gruppe) oder nutze die Pfeil-Buttons.
            Die Reihenfolge wird auf diesem Gerät gespeichert.
          </p>
        )}
        {groups.map(group => (
          <div key={group} className="mb-8 last:mb-0">
            <h2 className="mb-4 font-serif text-xl font-semibold md:text-2xl">{group}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orderedModules(group).map((m, idx, arr) => {
                  const Icon = m.icon;
                  if (sortMode) {
                    return (
                      <div
                        key={m.path}
                        data-drag-path={m.path}
                        data-drag-group={group}
                        onPointerDown={e => {
                          // Klicks auf die Pfeil-Buttons nicht als Ziehen werten
                          if ((e.target as HTMLElement).closest("button")) return;
                          dragInfo.current = { from: m.path, group };
                          dragOverRef.current = null;
                          setDragPath(m.path);
                          e.currentTarget.setPointerCapture(e.pointerId);
                        }}
                        onPointerMove={e => {
                          if (!dragInfo.current) return;
                          const over = tileUnderPointer(e.clientX, e.clientY, group);
                          if (over !== dragOverRef.current) {
                            dragOverRef.current = over;
                            setDragOverPath(over);
                          }
                        }}
                        onPointerUp={() => {
                          const info = dragInfo.current;
                          const over = dragOverRef.current;
                          if (info && over && over !== info.from) {
                            moveModule(info.group, info.from, over);
                          }
                          endDrag();
                        }}
                        onPointerCancel={endDrag}
                        className={
                          "flex touch-none select-none items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all " +
                          (dragPath === m.path
                            ? "border-primary opacity-60"
                            : dragOverPath === m.path
                              ? "border-solid border-primary bg-accent/40"
                              : "cursor-grab border-dashed border-primary/40 active:cursor-grabbing")
                        }
                        aria-label={`${m.title} verschieben`}
                      >
                        <GripVertical className="mt-2 h-5 w-5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                        </span>
                        <span className="flex-1">
                          <span className="font-semibold text-card-foreground">{m.title}</span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">{m.description}</span>
                        </span>
                        <span className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveByOffset(group, m.path, -1)}
                            disabled={idx === 0}
                            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30"
                            aria-label={`${m.title} nach vorne verschieben`}
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveByOffset(group, m.path, 1)}
                            disabled={idx === arr.length - 1}
                            className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-30"
                            aria-label={`${m.title} nach hinten verschieben`}
                          >
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </span>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={m.path}
                      href={m.path}
                      className="group flex items-start gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
                      aria-label={`${m.title} öffnen`}
                    >
                      <span
                        className={
                          m.path === "/sos"
                            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                        }
                      >
                        <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 font-semibold text-card-foreground">
                          {m.title}
                          {m.offline && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                              Offline
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{m.description}</span>
                      </span>
                      <ArrowRight
                        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

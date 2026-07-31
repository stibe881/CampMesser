import { Link } from "wouter";
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
} from "lucide-react";
import { getSunTimes } from "@/lib/sun";
import { useEffect, useState } from "react";
import { getRecentModules } from "@/components/AppShell";

interface Module {
  path: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Planung" | "Sicherheit" | "1. Hilfe" | "Energie & Wasser";
  offline?: boolean;
}

const modules: Module[] = [
  { path: "/sonne", title: "Sonnenstand-Kompass", description: "Sonnenposition, Auf- und Untergang am Standort", icon: Compass, group: "Planung" },
  { path: "/packlisten", title: "Packlisten", description: "Szenario-basierte Checklisten zum Abhaken", icon: ListChecks, group: "Planung" },
  { path: "/inventar", title: "Inventar", description: "Ausrüstung mit Gewicht und Volumen erfassen", icon: Package, group: "Planung" },
  { path: "/packen", title: "Pack-Optimierung", description: "Gewicht und Packmass im Griff behalten", icon: Scale, group: "Planung" },
  { path: "/familie", title: "Familien-Modus", description: "Kinder-Checklisten, Schnitzeljagden und Quiz", icon: Users, group: "Planung" },
  { path: "/zeltplaetze", title: "Zeltplatz-Favoriten", description: "Orte speichern, Wetter und Sonne im Voraus prüfen", icon: Tent, group: "Planung" },
  { path: "/sos", title: "SOS & Notfall", description: "GPS-Koordinaten und Notfallnummern", icon: Siren, group: "Sicherheit" },
  { path: "/wetter", title: "Camp-Wetter", description: "Hyperlokale Vorhersage und Unwetterwarnungen", icon: CloudSunRain, group: "Sicherheit" },
  { path: "/trockenzeiten", title: "Trockenzeiten", description: "Wird die Wäsche bis Sonnenuntergang trocken?", icon: Shirt, group: "Planung" },
  { path: "/nachtruhe", title: "Camp-Quiet-Timer", description: "Lautstärke im Blick während der Nachtruhe", icon: Moon, group: "Sicherheit" },
  { path: "/erste-hilfe", title: "Erste Hilfe", description: "Offline-Ratgeber für Outdoor-Verletzungen", icon: Cross, group: "Sicherheit", offline: true },
  { path: "/knoten", title: "Knoten-Bibliothek", description: "Die wichtigsten Outdoor-Knoten, Schritt für Schritt", icon: Cable, group: "1. Hilfe", offline: true },
  { path: "/natur", title: "Natur-Entdecker", description: "Tierspuren, Sternbilder und Bäume erkennen", icon: TreePine, group: "1. Hilfe", offline: true },
  { path: "/rezepte", title: "Campfire-Rezepte", description: "Kochen auf Gaskocher und offenem Feuer", icon: CookingPot, group: "1. Hilfe", offline: true },
  { path: "/kuehlbox", title: "Kühlbox-Inventar", description: "Vorräte erfassen, passende Rezepte finden", icon: Refrigerator, group: "1. Hilfe" },
  { path: "/energie", title: "Energie-Budget", description: "Autarkie-Dauer mit Solar und Powerstation", icon: BatteryCharging, group: "Energie & Wasser" },
  { path: "/wasser", title: "Trinkwasser-Rechner", description: "Wasserbedarf für Personen, Tage und Hitze", icon: Droplets, group: "Energie & Wasser" },
];

const groups = ["Planung", "Sicherheit", "1. Hilfe", "Energie & Wasser"] as const;

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
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <img
          src="/manus-storage/hero-camping_c11b2337.png"
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
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground/90 drop-shadow">
            Dein Schweizer Taschenmesser fürs Zelt-Camping
          </p>
          <h1 className="max-w-xl text-3xl font-bold leading-tight drop-shadow-md md:text-5xl">
            Alles fürs Camp.<br />In einer App.
          </h1>
          <p className="mt-3 max-w-lg text-primary-foreground/90 drop-shadow md:text-lg">
            Planung, Sicherheit, Energie und Naturerlebnis – 15 smarte Werkzeuge für dein nächstes Abenteuer.
          </p>
          {sunInfo && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 text-sm backdrop-blur-md">
              <Compass className="h-4 w-4" aria-hidden="true" />
              {sunInfo}
            </p>
          )}
        </div>
      </section>

      {/* Modul-Grid */}
      <section className="container py-8 md:py-12">
        <RecentModules />
        {groups.map(group => (
          <div key={group} className="mb-8 last:mb-0">
            <h2 className="mb-4 font-serif text-xl font-semibold md:text-2xl">{group}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules
                .filter(m => m.group === group)
                .map(m => {
                  const Icon = m.icon;
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

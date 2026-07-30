import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import {
  Home,
  ListChecks,
  Compass,
  BookOpen,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Gemeinsames App-Layout: Top-Bar mit Logo, Inhalt, Bottom-Navigation (mobil).
 * Die Bottom-Nav zeigt die fünf wichtigsten Bereiche; alle Module sind über die Startseite erreichbar.
 */
const navItems = [
  { path: "/", label: "Start", icon: Home },
  { path: "/packlisten", label: "Packen", icon: ListChecks },
  { path: "/sonne", label: "Sonne", icon: Compass },
  { path: "/erste-hilfe", label: "Wissen", icon: BookOpen, activePaths: ["/erste-hilfe", "/knoten", "/natur", "/rezepte"] },
  { path: "/sos", label: "SOS", icon: Siren },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Beim Seitenwechsel nach oben scrollen
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top-Bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Zur Startseite">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 20 L12 4 L21 20 Z" />
                <path d="M12 12 L12 20" />
              </svg>
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight">CampMesser</span>
          </Link>
          <Link
            href="/sos"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-transform active:scale-[0.97]",
              "bg-destructive text-destructive-foreground shadow-sm",
            )}
            aria-label="SOS – Notfall-Dashboard öffnen"
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            SOS
          </Link>
        </div>
      </header>

      {/* Inhalt */}
      <main className="flex-1 pb-24 md:pb-10">{children}</main>

      {/* Bottom-Navigation (mobil) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
        aria-label="Hauptnavigation"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map(item => {
            const isActive = item.activePaths
              ? item.activePaths.some(p => location.startsWith(p))
              : item.path === "/"
                ? location === "/"
                : location.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5", item.label === "SOS" && "text-destructive")} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


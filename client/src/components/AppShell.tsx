import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Home,
  ListChecks,
  Compass,
  BookOpen,
  Siren,
  CloudSunRain,
  Globe,
  LogIn,
  LogOut,
  UserRound,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/i18n";
import { LANGUAGES, LANGUAGE_LABELS } from "@shared/i18n";
import BrandLogo from "@/components/BrandLogo";
import InstallPrompt from "@/components/InstallPrompt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Gemeinsames App-Layout: Top-Bar mit Logo, Inhalt, Bottom-Navigation (mobil).
 * Die Bottom-Nav zeigt die fünf wichtigsten Bereiche; alle Module sind über die Startseite erreichbar.
 */
interface NavItem {
  path: string;
  key: "start" | "pack" | "sun" | "weather" | "firstAid" | "sos";
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  activePaths?: string[];
}

const navItems: NavItem[] = [
  { path: "/", key: "start", icon: Home },
  { path: "/packlisten", key: "pack", icon: ListChecks },
  { path: "/sonne", key: "sun", icon: Compass },
  { path: "/wetter", key: "weather", icon: CloudSunRain },
  {
    path: "/erste-hilfe",
    key: "firstAid",
    icon: BookOpen,
    activePaths: ["/erste-hilfe", "/knoten", "/natur", "/rezepte"],
  },
  { path: "/sos", key: "sos", icon: Siren },
];

/** Merkt sich die zuletzt genutzten Module für den Startseiten-Schnellzugriff. */
const RECENT_KEY = "campmesser.recentModules";

function trackModuleVisit(path: string) {
  // Nur echte Modul-Seiten tracken (nicht Start, 404, geteilte Listen, Druckansichten)
  if (
    path === "/" ||
    path.startsWith("/liste/") ||
    path.startsWith("/familie/drucken") ||
    path === "/404"
  )
    return;
  // Nur den Modul-Stamm speichern (z. B. /packlisten/5 → /packlisten)
  const root = "/" + path.split("/")[1];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [root, ...list.filter(p => p !== root)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* egal */
  }
}

export function getRecentModules(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list.filter(p => typeof p === "string");
    }
  } catch {
    /* egal */
  }
  return [];
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [headerHidden, setHeaderHidden] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, t, setLang } = useI18n();

  // Beim Seitenwechsel nach oben scrollen
  useEffect(() => {
    window.scrollTo(0, 0);
    trackModuleVisit(location);
  }, [location]);

  // Header beim Runterscrollen ausblenden, beim Hochscrollen wieder zeigen
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY + 4 && y > 80) setHeaderHidden(true);
      else if (y < lastY - 4 || y <= 80) setHeaderHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top-Bar */}
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md",
          "transition-transform duration-300 ease-out",
          headerHidden && "-translate-y-full"
        )}
      >
        <div className="container flex h-14 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label={t.shell.toHome}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BrandLogo className="h-6 w-6" />
            </span>
            <span className="font-serif text-lg font-semibold tracking-tight">
              CampMesser
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Sprachwahl */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-border bg-card px-2.5 text-xs font-semibold uppercase text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t.shell.languageMenu}
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {lang}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGES.map(code => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLang(code)}
                    className={cn(
                      code === lang && "font-semibold text-primary"
                    )}
                  >
                    {LANGUAGE_LABELS[code]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={() => toggleTheme?.()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label={
                theme === "dark" ? t.shell.themeLight : t.shell.themeDark
              }
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t.shell.accountMenu}
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="max-w-[200px] truncate">
                    {user?.name || user?.email || t.shell.loggedIn}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      window.location.href = "/profil";
                    }}
                  >
                    <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />{" "}
                    {t.shell.profile}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void logout()}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />{" "}
                    {t.shell.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/anmelden"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t.shell.login}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.shell.login}</span>
              </Link>
            )}
            <Link
              href="/sos"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-transform active:scale-[0.97]",
                "bg-destructive text-destructive-foreground shadow-sm"
              )}
              aria-label={t.shell.sosAria}
            >
              <Siren className="h-4 w-4" aria-hidden="true" />
              SOS
            </Link>
          </div>
        </div>
      </header>

      {/* Schwebender SOS-Button, wenn der Header ausgeblendet ist */}
      <Link
        href="/sos"
        className={cn(
          "fixed right-4 top-3 z-50 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold",
          "bg-destructive text-destructive-foreground shadow-lg transition-all duration-300 ease-out active:scale-[0.97]",
          headerHidden
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-16 opacity-0"
        )}
        aria-label={t.shell.sosAria}
        aria-hidden={!headerHidden}
        tabIndex={headerHidden ? 0 : -1}
      >
        <Siren className="h-4 w-4" aria-hidden="true" />
        SOS
      </Link>

      {/* Inhalt */}
      <main className="flex-1 pb-24 md:pb-10">{children}</main>

      {/* PWA-Install-Hinweis (dezent, abweisbar, über der Bottom-Nav) */}
      <InstallPrompt />

      {/* Bottom-Navigation (mobil) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
        aria-label={t.shell.mainNav}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map(item => {
            const label = t.shell.nav[item.key];
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
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    item.key === "sos" && "text-destructive"
                  )}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

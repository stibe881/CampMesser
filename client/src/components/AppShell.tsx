import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Home,
  Siren,
  Globe,
  LogIn,
  LogOut,
  UserRound,
  MonitorSmartphone,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { modules } from "@/data/modules";
import { pick } from "@shared/i18n";
import {
  QUICK_BAR_SOS,
  QUICK_BAR_START,
  sanitizeQuickBar,
} from "@shared/quickBar";
import {
  loadQuickBar,
  quickBarChoices,
  saveQuickBar,
} from "@/lib/quickBarStore";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  clearAppBadge,
  computeBadgeCount,
  isAppBadgeSupported,
  updateAppBadge,
} from "@/lib/appBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/i18n";
import { LANGUAGES, LANGUAGE_LABELS } from "@shared/i18n";
import BrandLogo from "@/components/BrandLogo";
import InstallPrompt from "@/components/InstallPrompt";
import OfflineBanner from "@/components/OfflineBanner";
import OfflineSync from "@/components/OfflineSync";
import DirectionsPrompt from "@/components/DirectionsPrompt";
import UpdatePrompt from "@/components/UpdatePrompt";
import QuickActions from "@/components/QuickActions";
import CookTimerBar from "@/components/CookTimerBar";
import WhatsNewStartup from "@/components/WhatsNewDialog";
import { todayIso } from "@shared/localDate";
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
 *
 * Die Leiste unten ist seit #297 frei belegbar: Start und SOS sitzen fest
 * an den Rändern, dazwischen liegen vier Plätze, die im Profil gewählt
 * werden. Warum die beiden festbleiben, steht in shared/quickBar.ts.
 */
interface FixedItem {
  path: string;
  key: "start" | "sos";
  icon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
}

const START_ITEM: FixedItem = {
  path: QUICK_BAR_START,
  key: "start",
  icon: Home,
};
const SOS_ITEM: FixedItem = { path: QUICK_BAR_SOS, key: "sos", icon: Siren };

/**
 * Untermodule, die zur selben Kachel gehören – damit der Punkt in der
 * Leiste auch auf einer Unterseite noch als aktiv gilt.
 */
const RELATED_PATHS: Record<string, string[]> = {
  "/erste-hilfe": ["/erste-hilfe", "/knoten", "/natur", "/rezepte"],
};

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

/**
 * Hält den App-Icon-Zähler (Badging API) aktuell: heute/morgen ablaufende
 * Kühlbox-Einträge plus fällige Pflege-Aufgaben. Ohne Badging-Unterstützung
 * werden die Queries gar nicht erst geladen; beim Logout wird das Badge
 * geräumt. Keine sichtbare UI.
 */
function AppBadgeUpdater() {
  const { isAuthenticated } = useAuth();
  const supported = isAppBadgeSupported();
  // Support VOR dem Laden prüfen: ohne Badging keine unnötigen Abrufe
  const enabled = supported && isAuthenticated;
  const foodQuery = trpc.food.list.useQuery(undefined, {
    enabled,
    staleTime: 10 * 60_000,
  });
  const gearQuery = trpc.gear.list.useQuery(undefined, {
    enabled,
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!supported) return;
    if (!isAuthenticated) {
      clearAppBadge();
      return;
    }
    if (!foodQuery.data && !gearQuery.data) return; // noch nichts geladen
    updateAppBadge(
      computeBadgeCount({
        foodItems: foodQuery.data ?? [],
        gearTasks: gearQuery.data ?? [],
        today: todayIso(),
      })
    );
  }, [supported, isAuthenticated, foodQuery.data, gearQuery.data]);

  return null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [headerHidden, setHeaderHidden] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { preference, toggleTheme } = useTheme();
  const { lang, t, setLang } = useI18n();

  // Schnellzugriff-Leiste (#297): lokal gespeichert, per Konto abgeglichen
  const [quickBar, setQuickBar] = useState<string[]>(() => loadQuickBar());
  useSyncedSetting<unknown>("quickBar", value => {
    const clean = sanitizeQuickBar(value, quickBarChoices());
    setQuickBar(clean);
    saveQuickBar(clean);
  });

  /**
   * Die Leiste zum Zeichnen: feste Ränder, dazwischen die gewählten
   * Module mit ihrem Namen und Symbol aus dem Modul-Katalog.
   */
  const barItems = [
    { ...START_ITEM, label: t.shell.nav.start, related: undefined },
    ...quickBar.map(path => {
      const module = modules.find(m => m.path === path);
      return {
        path,
        icon: module?.icon ?? Home,
        label: module ? pick(module.title, lang) : path,
        related: RELATED_PATHS[path],
      };
    }),
    { ...SOS_ITEM, label: t.shell.nav.sos, related: undefined },
  ];

  // Die Leiste wird im Profil geändert – dieses Ereignis holt sie hierher,
  // ohne dass ein globaler Zustand nötig wäre.
  useEffect(() => {
    const reload = () => setQuickBar(loadQuickBar());
    window.addEventListener("campmesser:quickbar", reload);
    return () => window.removeEventListener("campmesser:quickbar", reload);
  }, []);

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
      {/* Sprungmarke: Mit der Tastatur (und im Screenreader) beginnt sonst
          jede Seite wieder bei Logo, Sprachwahl, Design und SOS. Sichtbar
          wird der Link erst, wenn er den Fokus bekommt. */}
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        {t.shell.skipToContent}
      </a>
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
                preference === "light"
                  ? t.shell.themeDark
                  : preference === "dark"
                    ? t.shell.themeAuto
                    : t.shell.themeLight
              }
            >
              {/* Icon zeigt jeweils das Design, das der nächste Klick aktiviert */}
              {preference === "light" ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : preference === "dark" ? (
                <MonitorSmartphone className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
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
        {/* Hinweis, solange keine Verbindung besteht – sitzt bewusst IM
            Header, damit er beim Scrollen mitwandert und nicht übersehen
            wird, sobald man weiter unten in einer Liste arbeitet. */}
        <OfflineBanner />
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
      <main id="inhalt" className="flex-1 pb-24 md:pb-10">
        {children}
      </main>

      {/* Offline gesetzte Häkchen nachschicken (ohne eigene Darstellung) */}
      <OfflineSync />

      {/* «Womit navigieren?» – fragt beim ersten Routen-Klick nach der
          Karten-App und merkt sich die Antwort auf Wunsch. */}
      <DirectionsPrompt />

      {/* PWA-Install-Hinweis (dezent, abweisbar, über der Bottom-Nav) */}
      <InstallPrompt />

      {/* PWA-Update-Hinweis «Neue Version verfügbar» (gleiches Muster) */}
      <UpdatePrompt />

      {/* «Was ist neu» beim Start – zeigt ungesehene Changelog-Blöcke.
          Nach «Aktualisieren» im UpdatePrompt lädt die Seite neu, dieser
          Dialog übernimmt dann automatisch die neuen Einträge. */}
      <WhatsNewStartup />

      {/* Schnellaktionen: FAB (mobil) + Befehls-Palette (Cmd/Ctrl+K) */}
      <QuickActions />

      {/* Küchen-Timer (#218): dezenter Chip, solange ein Timer läuft */}
      <CookTimerBar />

      {/* App-Icon-Zähler (Badging API) – unsichtbar */}
      <AppBadgeUpdater />

      {/* Bottom-Navigation (mobil) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
        aria-label={t.shell.mainNav}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {barItems.map(item => {
            const isActive = item.related
              ? item.related.some(p => location.startsWith(p))
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
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    item.path === QUICK_BAR_SOS && "text-destructive"
                  )}
                  aria-hidden="true"
                />
                <span className="w-full truncate text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

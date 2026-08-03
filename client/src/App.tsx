import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflinePrecache from "./components/OfflinePrecache";
import AppShell from "./components/AppShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider, useT } from "./i18n";
import Home from "./pages/Home";
import { getThemePreference } from "./lib/themePreference";

/**
 * Code-Splitting: jede Route lädt ihren eigenen Chunk. Die Loader stehen in
 * einer Map, damit derselbe Import sowohl für React.lazy als auch für das
 * Vorladen im Leerlauf verwendet wird (identische Chunk-URLs).
 */
const pageLoaders = {
  Sos: () => import("./pages/Sos"),
  SunCompass: () => import("./pages/SunCompass"),
  PackLists: () => import("./pages/PackLists"),
  PackListDetail: () => import("./pages/PackListDetail"),
  PackListPrint: () => import("./pages/PackListPrint"),
  Inventory: () => import("./pages/Inventory"),
  FirstAid: () => import("./pages/FirstAid"),
  Knots: () => import("./pages/Knots"),
  Nature: () => import("./pages/Nature"),
  Phrasebook: () => import("./pages/Phrasebook"),
  Recipes: () => import("./pages/Recipes"),
  Energy: () => import("./pages/Energy"),
  Water: () => import("./pages/Water"),
  PackOptimizer: () => import("./pages/PackOptimizer"),
  Family: () => import("./pages/Family"),
  Food: () => import("./pages/Food"),
  Shopping: () => import("./pages/Shopping"),
  ShoppingPrint: () => import("./pages/ShoppingPrint"),
  Weather: () => import("./pages/Weather"),
  Drying: () => import("./pages/Drying"),
  Quiet: () => import("./pages/Quiet"),
  Spots: () => import("./pages/Spots"),
  MapView: () => import("./pages/MapView"),
  SpotDetail: () => import("./pages/SpotDetail"),
  TentFinder: () => import("./pages/TentFinder"),
  Hike: () => import("./pages/Hike"),
  Trips: () => import("./pages/Trips"),
  Stats: () => import("./pages/Stats"),
  TripPrint: () => import("./pages/TripPrint"),
  MenuPlan: () => import("./pages/MenuPlan"),
  MenuPlanPrint: () => import("./pages/MenuPlanPrint"),
  TripShopping: () => import("./pages/TripShopping"),
  Level: () => import("./pages/Level"),
  Login: () => import("./pages/Login"),
  Lawn: () => import("./pages/Lawn"),
  Profile: () => import("./pages/Profile"),
  SharedPackList: () => import("./pages/SharedPackList"),
  SharedShopping: () => import("./pages/SharedShopping"),
  SharedSpot: () => import("./pages/SharedSpot"),
  SharedLocation: () => import("./pages/SharedLocation"),
  SharedTemplate: () => import("./pages/SharedTemplate"),
  SharedQuiz: () => import("./pages/SharedQuiz"),
  SharedRecipe: () => import("./pages/SharedRecipe"),
  SharedTrip: () => import("./pages/SharedTrip"),
  TripInvite: () => import("./pages/TripInvite"),
  HuntPrint: () => import("./pages/HuntPrint"),
  BadgeCertificate: () => import("./pages/BadgeCertificate"),
  ShareTarget: () => import("./pages/ShareTarget"),
} as const;

const CHUNK_RELOAD_KEY = "campmesser.chunkReloadAt";

/**
 * Wie React.lazy, aber robust gegen Deployments während einer laufenden Sitzung:
 * Liefert ein alter Chunk 404, wird die Seite einmal neu geladen, um die frische
 * index.html mit gültigen Chunk-URLs zu holen. Ein Zeitstempel verhindert eine
 * Reload-Schleife, falls der Chunk dauerhaft fehlt (dann greift der ErrorBoundary).
 */
function lazyWithRetry<T extends ComponentType<unknown>>(
  load: () => Promise<{ default: T }>
) {
  return lazy(() =>
    load().catch((error: unknown) => {
      let lastReload = 0;
      try {
        lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
      } catch {
        // sessionStorage blockiert: lieber kein Auto-Reload als eine Endlosschleife
        throw error;
      }
      if (Date.now() - lastReload > 60_000) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw error;
    })
  );
}

const SosPage = lazyWithRetry(pageLoaders.Sos);
const SunCompassPage = lazyWithRetry(pageLoaders.SunCompass);
const PackListsPage = lazyWithRetry(pageLoaders.PackLists);
const PackListDetailPage = lazyWithRetry(pageLoaders.PackListDetail);
const PackListPrintPage = lazyWithRetry(pageLoaders.PackListPrint);
const InventoryPage = lazyWithRetry(pageLoaders.Inventory);
const FirstAidPage = lazyWithRetry(pageLoaders.FirstAid);
const KnotsPage = lazyWithRetry(pageLoaders.Knots);
const NaturePage = lazyWithRetry(pageLoaders.Nature);
const PhrasebookPage = lazyWithRetry(pageLoaders.Phrasebook);
const RecipesPage = lazyWithRetry(pageLoaders.Recipes);
const EnergyPage = lazyWithRetry(pageLoaders.Energy);
const WaterPage = lazyWithRetry(pageLoaders.Water);
const PackOptimizerPage = lazyWithRetry(pageLoaders.PackOptimizer);
const FamilyPage = lazyWithRetry(pageLoaders.Family);
const FoodPage = lazyWithRetry(pageLoaders.Food);
const ShoppingPage = lazyWithRetry(pageLoaders.Shopping);
const ShoppingPrintPage = lazyWithRetry(pageLoaders.ShoppingPrint);
const WeatherPage = lazyWithRetry(pageLoaders.Weather);
const DryingPage = lazyWithRetry(pageLoaders.Drying);
const QuietPage = lazyWithRetry(pageLoaders.Quiet);
const SpotsPage = lazyWithRetry(pageLoaders.Spots);
const MapViewPage = lazyWithRetry(pageLoaders.MapView);
const SpotDetailPage = lazyWithRetry(pageLoaders.SpotDetail);
const TentFinderPage = lazyWithRetry(pageLoaders.TentFinder);
const HikePage = lazyWithRetry(pageLoaders.Hike);
const TripsPage = lazyWithRetry(pageLoaders.Trips);
const StatsPage = lazyWithRetry(pageLoaders.Stats);
const TripPrintPage = lazyWithRetry(pageLoaders.TripPrint);
const MenuPlanPage = lazyWithRetry(pageLoaders.MenuPlan);
const MenuPlanPrintPage = lazyWithRetry(pageLoaders.MenuPlanPrint);
const TripShoppingPage = lazyWithRetry(pageLoaders.TripShopping);
const LevelPage = lazyWithRetry(pageLoaders.Level);
const LoginPage = lazyWithRetry(pageLoaders.Login);
const LawnPage = lazyWithRetry(pageLoaders.Lawn);
const ProfilePage = lazyWithRetry(pageLoaders.Profile);
const SharedPackListPage = lazyWithRetry(pageLoaders.SharedPackList);
const SharedShoppingPage = lazyWithRetry(pageLoaders.SharedShopping);
const SharedSpotPage = lazyWithRetry(pageLoaders.SharedSpot);
const SharedLocationPage = lazyWithRetry(pageLoaders.SharedLocation);
const SharedTemplatePage = lazyWithRetry(pageLoaders.SharedTemplate);
const SharedQuizPage = lazyWithRetry(pageLoaders.SharedQuiz);
const SharedRecipePage = lazyWithRetry(pageLoaders.SharedRecipe);
const SharedTripPage = lazyWithRetry(pageLoaders.SharedTrip);
const TripInvitePage = lazyWithRetry(pageLoaders.TripInvite);
const HuntPrintPage = lazyWithRetry(pageLoaders.HuntPrint);
const BadgeCertificatePage = lazyWithRetry(pageLoaders.BadgeCertificate);
const ShareTargetPage = lazyWithRetry(pageLoaders.ShareTarget);

function RouteFallback() {
  const t = useT();
  return (
    <div className="container flex justify-center py-16">
      <Loader2
        className="h-6 w-6 animate-spin text-muted-foreground"
        aria-label={t.common.loading}
      />
    </div>
  );
}

function Router() {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/sos"} component={SosPage} />
          <Route path={"/sonne"} component={SunCompassPage} />
          <Route path={"/packlisten"} component={PackListsPage} />
          {/* Druckroute VOR der Detail-Route, sonst fängt :id auch «drucken» ab */}
          <Route
            path={"/packlisten/:id/drucken"}
            component={PackListPrintPage}
          />
          <Route path={"/packlisten/:id"} component={PackListDetailPage} />
          <Route path={"/inventar"} component={InventoryPage} />
          <Route path={"/erste-hilfe"} component={FirstAidPage} />
          <Route path={"/knoten"} component={KnotsPage} />
          <Route path={"/natur"} component={NaturePage} />
          <Route path={"/sprachhilfe"} component={PhrasebookPage} />
          <Route path={"/rezepte"} component={RecipesPage} />
          <Route path={"/energie"} component={EnergyPage} />
          <Route path={"/wasser"} component={WaterPage} />
          <Route path={"/packen"} component={PackOptimizerPage} />
          <Route path={"/familie"} component={FamilyPage} />
          <Route path={"/kuehlbox"} component={FoodPage} />
          <Route path={"/einkauf/drucken"} component={ShoppingPrintPage} />
          <Route path={"/einkauf"} component={ShoppingPage} />
          <Route path={"/wetter"} component={WeatherPage} />
          <Route path={"/trockenzeiten"} component={DryingPage} />
          <Route path={"/nachtruhe"} component={QuietPage} />
          <Route path={"/zeltplaetze"} component={SpotsPage} />
          <Route path={"/karte"} component={MapViewPage} />
          <Route path={"/zeltplaetze/:id"} component={SpotDetailPage} />
          <Route path={"/zeltfinder"} component={TentFinderPage} />
          <Route path={"/wanderung"} component={HikePage} />
          <Route path={"/tagebuch"} component={TripsPage} />
          <Route path={"/statistik"} component={StatsPage} />
          {/* Druckroute VOR möglichen parametrisierten Tagebuch-Routen registrieren */}
          <Route path={"/tagebuch/:id/drucken"} component={TripPrintPage} />
          {/* Druckroute VOR der Basis-Route, sonst fängt :tripId auch «drucken» ab */}
          <Route
            path={"/menueplan/:tripId/drucken"}
            component={MenuPlanPrintPage}
          />
          {/* Reise-Einkaufsliste ebenfalls VOR der Basis-Route registrieren */}
          <Route
            path={"/menueplan/:tripId/einkauf"}
            component={TripShoppingPage}
          />
          <Route path={"/menueplan/:tripId"} component={MenuPlanPage} />
          <Route path={"/wasserwaage"} component={LevelPage} />
          <Route path={"/anmelden"} component={LoginPage} />
          <Route path={"/rasen"} component={LawnPage} />
          <Route path={"/profil"} component={ProfilePage} />
          <Route path={"/liste/:token"} component={SharedPackListPage} />
          <Route
            path={"/einkaufsliste/:token"}
            component={SharedShoppingPage}
          />
          <Route path={"/platz/:token"} component={SharedSpotPage} />
          <Route path={"/standort/:token"} component={SharedLocationPage} />
          <Route path={"/vorlage/:token"} component={SharedTemplatePage} />
          <Route path={"/quiz/:token"} component={SharedQuizPage} />
          <Route path={"/rezept/:token"} component={SharedRecipePage} />
          <Route path={"/reise/:token"} component={SharedTripPage} />
          <Route path={"/reise-einladung/:token"} component={TripInvitePage} />
          <Route path={"/familie/drucken/:id"} component={HuntPrintPage} />
          {/* Abzeichen-Urkunde eines Kindes zum Ausdrucken */}
          <Route
            path={"/familie/urkunde/:childId"}
            component={BadgeCertificatePage}
          />
          {/* Share Target der PWA: nimmt per System-Teilen geteilte Fotos entgegen */}
          <Route path={"/teilen"} component={ShareTargetPage} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppShell>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  // Gespeicherte Design-Präferenz aus dem Profil anwenden
  const savedTheme = getThemePreference();

  // Route-Chunks im Leerlauf vorladen: Seitenwechsel werden sofort, und der
  // Service Worker cached alle Chunks – so bleiben die Offline-Module
  // (Erste Hilfe, Knoten, Natur, Rezepte) auch ohne Netz nutzbar.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      Object.values(pageLoaders).forEach(load => {
        load().catch(() => {
          // Offline oder Netzfehler: beim nächsten Besuch erneut versuchen
        });
      });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme={savedTheme ?? "light"} switchable>
        <TooltipProvider>
          <Toaster />
          <OfflinePrecache />
          <LanguageProvider>
            <Router />
          </LanguageProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

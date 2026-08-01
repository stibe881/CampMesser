import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflinePrecache from "./components/OfflinePrecache";
import AppShell from "./components/AppShell";
import { ThemeProvider } from "./contexts/ThemeContext";
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
  Inventory: () => import("./pages/Inventory"),
  FirstAid: () => import("./pages/FirstAid"),
  Knots: () => import("./pages/Knots"),
  Nature: () => import("./pages/Nature"),
  Recipes: () => import("./pages/Recipes"),
  Energy: () => import("./pages/Energy"),
  Water: () => import("./pages/Water"),
  PackOptimizer: () => import("./pages/PackOptimizer"),
  Family: () => import("./pages/Family"),
  Food: () => import("./pages/Food"),
  Weather: () => import("./pages/Weather"),
  Drying: () => import("./pages/Drying"),
  Quiet: () => import("./pages/Quiet"),
  Spots: () => import("./pages/Spots"),
  Trips: () => import("./pages/Trips"),
  Login: () => import("./pages/Login"),
  Lawn: () => import("./pages/Lawn"),
  Profile: () => import("./pages/Profile"),
  SharedPackList: () => import("./pages/SharedPackList"),
  HuntPrint: () => import("./pages/HuntPrint"),
} as const;

const SosPage = lazy(pageLoaders.Sos);
const SunCompassPage = lazy(pageLoaders.SunCompass);
const PackListsPage = lazy(pageLoaders.PackLists);
const PackListDetailPage = lazy(pageLoaders.PackListDetail);
const InventoryPage = lazy(pageLoaders.Inventory);
const FirstAidPage = lazy(pageLoaders.FirstAid);
const KnotsPage = lazy(pageLoaders.Knots);
const NaturePage = lazy(pageLoaders.Nature);
const RecipesPage = lazy(pageLoaders.Recipes);
const EnergyPage = lazy(pageLoaders.Energy);
const WaterPage = lazy(pageLoaders.Water);
const PackOptimizerPage = lazy(pageLoaders.PackOptimizer);
const FamilyPage = lazy(pageLoaders.Family);
const FoodPage = lazy(pageLoaders.Food);
const WeatherPage = lazy(pageLoaders.Weather);
const DryingPage = lazy(pageLoaders.Drying);
const QuietPage = lazy(pageLoaders.Quiet);
const SpotsPage = lazy(pageLoaders.Spots);
const TripsPage = lazy(pageLoaders.Trips);
const LoginPage = lazy(pageLoaders.Login);
const LawnPage = lazy(pageLoaders.Lawn);
const ProfilePage = lazy(pageLoaders.Profile);
const SharedPackListPage = lazy(pageLoaders.SharedPackList);
const HuntPrintPage = lazy(pageLoaders.HuntPrint);

function RouteFallback() {
  return (
    <div className="container flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
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
          <Route path={"/packlisten/:id"} component={PackListDetailPage} />
          <Route path={"/inventar"} component={InventoryPage} />
          <Route path={"/erste-hilfe"} component={FirstAidPage} />
          <Route path={"/knoten"} component={KnotsPage} />
          <Route path={"/natur"} component={NaturePage} />
          <Route path={"/rezepte"} component={RecipesPage} />
          <Route path={"/energie"} component={EnergyPage} />
          <Route path={"/wasser"} component={WaterPage} />
          <Route path={"/packen"} component={PackOptimizerPage} />
          <Route path={"/familie"} component={FamilyPage} />
          <Route path={"/kuehlbox"} component={FoodPage} />
          <Route path={"/wetter"} component={WeatherPage} />
          <Route path={"/trockenzeiten"} component={DryingPage} />
          <Route path={"/nachtruhe"} component={QuietPage} />
          <Route path={"/zeltplaetze"} component={SpotsPage} />
          <Route path={"/tagebuch"} component={TripsPage} />
          <Route path={"/anmelden"} component={LoginPage} />
          <Route path={"/rasen"} component={LawnPage} />
          <Route path={"/profil"} component={ProfilePage} />
          <Route path={"/liste/:token"} component={SharedPackListPage} />
          <Route path={"/familie/drucken/:id"} component={HuntPrintPage} />
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
      <ThemeProvider
        defaultTheme={savedTheme ?? "light"}
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <OfflinePrecache />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

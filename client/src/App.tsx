import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AppShell from "./components/AppShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SosPage from "./pages/Sos";
import SunCompassPage from "./pages/SunCompass";
import PackListsPage from "./pages/PackLists";
import PackListDetailPage from "./pages/PackListDetail";
import InventoryPage from "./pages/Inventory";
import FirstAidPage from "./pages/FirstAid";
import KnotsPage from "./pages/Knots";
import NaturePage from "./pages/Nature";
import RecipesPage from "./pages/Recipes";
import EnergyPage from "./pages/Energy";
import WaterPage from "./pages/Water";
import PackOptimizerPage from "./pages/PackOptimizer";
import FamilyPage from "./pages/Family";
import FoodPage from "./pages/Food";
import WeatherPage from "./pages/Weather";
import SpotsPage from "./pages/Spots";

function Router() {
  return (
    <AppShell>
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
        <Route path={"/zeltplaetze"} component={SpotsPage} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

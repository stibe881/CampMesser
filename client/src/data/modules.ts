/**
 * Modul-Katalog der Startseite: Kacheln mit Gruppe, Icon und Beschreibung.
 * Eigenes Datenmodul, damit auch die globale Suche die Werkzeuge findet.
 */
import {
  BatteryCharging,
  BookOpen,
  Cable,
  CloudSunRain,
  Compass,
  CookingPot,
  Cross,
  Droplets,
  Gauge,
  ListChecks,
  Moon,
  Package,
  Refrigerator,
  Scale,
  Shirt,
  Siren,
  Sprout,
  Tent,
  TreePine,
  Users,
} from "lucide-react";

export interface Module {
  path: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Planung" | "Sicherheit" | "Erste Hilfe" | "Energie & Wasser";
  offline?: boolean;
}

export const modules: Module[] = [
  {
    path: "/sonne",
    title: "Sonnenstand-Kompass",
    description: "Sonnenposition, Auf- und Untergang am Standort",
    icon: Compass,
    group: "Planung",
  },
  {
    path: "/packlisten",
    title: "Packlisten",
    description: "Szenario-basierte Checklisten zum Abhaken",
    icon: ListChecks,
    group: "Planung",
  },
  {
    path: "/inventar",
    title: "Inventar",
    description: "Ausrüstung mit Gewicht und Volumen erfassen",
    icon: Package,
    group: "Planung",
  },
  {
    path: "/packen",
    title: "Pack-Optimierung",
    description: "Gewicht und Packmass im Griff behalten",
    icon: Scale,
    group: "Planung",
  },
  {
    path: "/familie",
    title: "Familien-Modus",
    description: "Kinder-Checklisten, Schnitzeljagden und Quiz",
    icon: Users,
    group: "Planung",
  },
  {
    path: "/zeltplaetze",
    title: "Zeltplatz-Favoriten",
    description: "Orte speichern, Wetter und Sonne im Voraus prüfen",
    icon: Tent,
    group: "Planung",
  },
  {
    path: "/tagebuch",
    title: "Reise-Tagebuch",
    description: "Aufenthalte festhalten, Nächte und Lieblingsplätze zählen",
    icon: BookOpen,
    group: "Planung",
  },
  {
    path: "/rasen",
    title: "Rasenschoner",
    description: "Wie lange darf das Zelt auf dem Rasen stehen?",
    icon: Sprout,
    group: "Planung",
    offline: true,
  },
  {
    path: "/wasserwaage",
    title: "Wasserwaage",
    description: "Wohnwagen und Tisch mit dem Lagesensor ausrichten",
    icon: Gauge,
    group: "Planung",
    offline: true,
  },
  {
    path: "/sos",
    title: "SOS & Notfall",
    description: "GPS-Koordinaten und Notfallnummern",
    icon: Siren,
    group: "Sicherheit",
  },
  {
    path: "/wetter",
    title: "Camp-Wetter",
    description: "Hyperlokale Vorhersage und Unwetterwarnungen",
    icon: CloudSunRain,
    group: "Sicherheit",
  },
  {
    path: "/trockenzeiten",
    title: "Trockenzeiten",
    description: "Wird die Wäsche bis Sonnenuntergang trocken?",
    icon: Shirt,
    group: "Planung",
  },
  {
    path: "/nachtruhe",
    title: "Camp-Quiet-Timer",
    description: "Lautstärke im Blick während der Nachtruhe",
    icon: Moon,
    group: "Sicherheit",
  },
  {
    path: "/erste-hilfe",
    title: "Erste Hilfe",
    description: "Offline-Ratgeber für Outdoor-Verletzungen",
    icon: Cross,
    group: "Sicherheit",
    offline: true,
  },
  {
    path: "/knoten",
    title: "Knoten-Bibliothek",
    description: "Die wichtigsten Outdoor-Knoten, Schritt für Schritt",
    icon: Cable,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/natur",
    title: "Natur-Entdecker",
    description: "Tierspuren, Sternbilder und Bäume erkennen",
    icon: TreePine,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/rezepte",
    title: "Campfire-Rezepte",
    description: "Kochen auf Gaskocher und offenem Feuer",
    icon: CookingPot,
    group: "Erste Hilfe",
    offline: true,
  },
  {
    path: "/kuehlbox",
    title: "Kühlbox-Inventar",
    description: "Vorräte erfassen, passende Rezepte finden",
    icon: Refrigerator,
    group: "Erste Hilfe",
  },
  {
    path: "/energie",
    title: "Energie-Budget",
    description: "Autarkie-Dauer mit Solar und Powerstation",
    icon: BatteryCharging,
    group: "Energie & Wasser",
  },
  {
    path: "/wasser",
    title: "Trinkwasser-Rechner",
    description: "Wasserbedarf für Personen, Tage und Hitze",
    icon: Droplets,
    group: "Energie & Wasser",
  },
];

export const groups = [
  "Planung",
  "Sicherheit",
  "Erste Hilfe",
  "Energie & Wasser",
] as const;

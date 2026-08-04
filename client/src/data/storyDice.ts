/**
 * Symbole der Erzählwürfel (#268), je sechs pro Kategorie.
 *
 * Ausgewählt sind Dinge, die ein Kind am Zeltplatz kennt oder sich sofort
 * vorstellen kann – kein Einhorn-Raumschiff, sondern Fuchs, Taschenlampe,
 * Gewitter. Wer die Bilder wiedererkennt, erzählt drauflos; wer erst
 * überlegen muss, was das Symbol darstellt, erzählt gar nicht.
 *
 * Die Icon-Namen stehen als Zeichenkette hier und werden in der Ansicht
 * aufgelöst, damit dieses Modul frei von React bleibt und in Tests ohne
 * Bundler läuft.
 */
import { l4 } from "@shared/i18n";
import { type StoryFace } from "@shared/storyDice";

export const storyDiceFaces: StoryFace[] = [
  // ── Wer ──
  {
    id: "fuchs",
    category: "figur",
    icon: "PawPrint",
    word: l4("Fuchs", "Renard", "Volpe", "Fox"),
  },
  {
    id: "kind",
    category: "figur",
    icon: "Baby",
    word: l4("Kind", "Enfant", "Bambino", "Child"),
  },
  {
    id: "riese",
    category: "figur",
    icon: "Mountain",
    word: l4("Riese", "Géant", "Gigante", "Giant"),
  },
  {
    id: "eule",
    category: "figur",
    icon: "Bird",
    word: l4("Eule", "Chouette", "Gufo", "Owl"),
  },
  {
    id: "platzwart",
    category: "figur",
    icon: "UserRound",
    word: l4("Platzwart", "Gardien", "Custode", "Warden"),
  },
  {
    id: "hund",
    category: "figur",
    icon: "Dog",
    word: l4("Hund", "Chien", "Cane", "Dog"),
  },
  // ── Wo ──
  {
    id: "wald",
    category: "ort",
    icon: "TreePine",
    word: l4("Wald", "Forêt", "Bosco", "Forest"),
  },
  {
    id: "see",
    category: "ort",
    icon: "Waves",
    word: l4("See", "Lac", "Lago", "Lake"),
  },
  {
    id: "hoehle",
    category: "ort",
    icon: "Moon",
    word: l4("Höhle", "Grotte", "Grotta", "Cave"),
  },
  {
    id: "zeltplatz",
    category: "ort",
    icon: "Tent",
    word: l4("Zeltplatz", "Camping", "Campeggio", "Campsite"),
  },
  {
    id: "berg",
    category: "ort",
    icon: "Mountain",
    word: l4("Berggipfel", "Sommet", "Vetta", "Mountain top"),
  },
  {
    id: "bach",
    category: "ort",
    icon: "Droplets",
    word: l4("Bach", "Ruisseau", "Ruscello", "Stream"),
  },
  // ── Womit ──
  {
    id: "taschenlampe",
    category: "gegenstand",
    icon: "Flashlight",
    word: l4("Taschenlampe", "Lampe de poche", "Torcia", "Torch"),
  },
  {
    id: "karte",
    category: "gegenstand",
    icon: "Map",
    word: l4("Alte Karte", "Vieille carte", "Vecchia mappa", "Old map"),
  },
  {
    id: "schluessel",
    category: "gegenstand",
    icon: "Key",
    word: l4("Schlüssel", "Clé", "Chiave", "Key"),
  },
  {
    id: "seil",
    category: "gegenstand",
    icon: "Cable",
    word: l4("Seil", "Corde", "Corda", "Rope"),
  },
  {
    id: "topf",
    category: "gegenstand",
    icon: "CookingPot",
    word: l4("Kochtopf", "Casserole", "Pentola", "Cooking pot"),
  },
  {
    id: "kompass",
    category: "gegenstand",
    icon: "Compass",
    word: l4("Kompass", "Boussole", "Bussola", "Compass"),
  },
  // ── Was passiert ──
  {
    id: "gewitter",
    category: "ereignis",
    icon: "CloudLightning",
    word: l4("Gewitter", "Orage", "Temporale", "Thunderstorm"),
  },
  {
    id: "verirrt",
    category: "ereignis",
    icon: "Footprints",
    word: l4("Verirrt", "Perdu", "Smarrito", "Lost"),
  },
  {
    id: "fund",
    category: "ereignis",
    icon: "Gem",
    word: l4("Ein Fund", "Une trouvaille", "Un ritrovamento", "A find"),
  },
  {
    id: "wettrennen",
    category: "ereignis",
    icon: "Flag",
    word: l4("Wettrennen", "Course", "Gara", "Race"),
  },
  {
    id: "geraeusch",
    category: "ereignis",
    icon: "Volume2",
    word: l4("Ein Geräusch", "Un bruit", "Un rumore", "A noise"),
  },
  {
    id: "besuch",
    category: "ereignis",
    icon: "DoorOpen",
    word: l4("Besuch", "Une visite", "Una visita", "A visitor"),
  },
  // ── Wie fühlt es sich an ──
  {
    id: "mutig",
    category: "gefuehl",
    icon: "Shield",
    word: l4("Mutig", "Courageux", "Coraggioso", "Brave"),
  },
  {
    id: "angst",
    category: "gefuehl",
    icon: "Ghost",
    word: l4("Gruselig", "Effrayant", "Spaventoso", "Spooky"),
  },
  {
    id: "lustig",
    category: "gefuehl",
    icon: "Smile",
    word: l4("Lustig", "Drôle", "Divertente", "Funny"),
  },
  {
    id: "muede",
    category: "gefuehl",
    icon: "Moon",
    word: l4("Hundemüde", "Épuisé", "Stanchissimo", "Dog-tired"),
  },
  {
    id: "neugierig",
    category: "gefuehl",
    icon: "Search",
    word: l4("Neugierig", "Curieux", "Curioso", "Curious"),
  },
  {
    id: "stolz",
    category: "gefuehl",
    icon: "Trophy",
    word: l4("Stolz", "Fier", "Fiero", "Proud"),
  },
  // ── Und plötzlich ──
  {
    id: "tuer",
    category: "wendung",
    icon: "DoorClosed",
    word: l4(
      "Eine Tür im Baum",
      "Une porte dans l'arbre",
      "Una porta nell'albero",
      "A door in the tree"
    ),
  },
  {
    id: "sprechen",
    category: "wendung",
    icon: "MessageCircle",
    word: l4(
      "Etwas spricht",
      "Quelque chose parle",
      "Qualcosa parla",
      "Something speaks"
    ),
  },
  {
    id: "verschwunden",
    category: "wendung",
    icon: "EyeOff",
    word: l4("Alles weg", "Tout a disparu", "Tutto sparito", "All gone"),
  },
  {
    id: "rueckwaerts",
    category: "wendung",
    icon: "RotateCcw",
    word: l4(
      "Alles rückwärts",
      "Tout à l'envers",
      "Tutto al contrario",
      "Everything backwards"
    ),
  },
  {
    id: "doppelgaenger",
    category: "wendung",
    icon: "Users",
    word: l4("Ein Doppel", "Un double", "Un sosia", "A double"),
  },
  {
    id: "sternschnuppe",
    category: "wendung",
    icon: "Sparkles",
    word: l4(
      "Eine Sternschnuppe",
      "Une étoile filante",
      "Una stella cadente",
      "A shooting star"
    ),
  },
];

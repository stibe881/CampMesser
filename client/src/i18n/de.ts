/**
 * Deutsches UI-Wörterbuch – die kanonische Quelle: `Translation` leitet sich
 * aus diesem Objekt ab, fr/it/en müssen exakt dieselben Schlüssel liefern.
 */
export const de = {
  common: {
    loading: "Lädt",
    save: "Speichern",
    saving: "Wird gespeichert …",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    copy: "Kopieren",
    linkCopied: "Link kopiert",
    copyFailed: "Kopieren nicht möglich – bitte manuell markieren",
    back: "Zurück",
    today: "Heute",
    tomorrow: "morgen",
    optional: "optional",
    night: "Nacht",
    nights: "Nächte",
    deleteFailed: "Löschen fehlgeschlagen",
    saveFailed: "Speichern fehlgeschlagen",
    actionFailed: "Aktion fehlgeschlagen",
    offlineBadge: "Offline",
  },
  shell: {
    toHome: "Zur Startseite",
    themeLight: "Helles Design aktivieren",
    themeDark: "Dunkles Design aktivieren",
    languageMenu: "Sprache wählen",
    accountMenu: "Konto-Menü öffnen",
    loggedIn: "Angemeldet",
    profile: "Profil",
    logout: "Abmelden",
    login: "Anmelden",
    sosAria: "SOS – Notfall-Dashboard öffnen",
    mainNav: "Hauptnavigation",
    nav: {
      start: "Start",
      pack: "Packen",
      sun: "Sonne",
      weather: "Wetter",
      firstAid: "Erste Hilfe",
      sos: "SOS",
    },
  },
  home: {
    heroImageAlt:
      "Zelt mit Solarpanels und Lagerfeuer vor Schweizer Alpen bei Sonnenuntergang",
    heroKicker: "Dein Schweizer Taschenmesser fürs Zelt-Camping",
    heroTitle1: "Alles fürs Camp.",
    heroTitle2: "In einer App.",
    heroSubtitle:
      "Planung, Sicherheit, Energie und Naturerlebnis – 16 smarte Werkzeuge für dein nächstes Abenteuer.",
    sunInfo: (sunrise: string, sunset: string) =>
      `Heute: Sonnenaufgang ${sunrise} · Sonnenuntergang ${sunset}`,
    nextTripFallback: "Nächster Trip",
    nextTripAria: (place: string) => `Nächster geplanter Aufenthalt: ${place}`,
    tripStartsToday: "Heute geht's los!",
    tripStartsTomorrow: "Morgen geht's los!",
    tripDaysLeft: (n: number) => `Noch ${n} Tage`,
    tripPacked: (name: string, checked: number, total: number, pct: number) =>
      `${name}: ${checked} von ${total} gepackt (${pct} %)`,
    tripPlannedNote: "Geplanter Aufenthalt im Reise-Tagebuch",
    weatherAria: (temp: number, label: string) =>
      `Aktuelles Wetter: ${temp} Grad, ${label} – zum Wetter-Modul`,
    weatherNoAlerts: "Keine Unwetterwarnungen an deinem Standort",
    searchPlaceholder: "Wissen durchsuchen: Zeckenbiss, Mastwurf, Rezepte …",
    searchAria: "Wissensmodule durchsuchen",
    searchNoResults:
      "Nichts gefunden – probiere einen anderen Begriff (z. B. «Verbrennung» oder «Knoten»).",
    searchCategories: {
      module: "Modul",
      firstAid: "Erste Hilfe",
      knots: "Knoten",
      recipes: "Rezepte",
      nature: "Natur",
    },
    recentTitle: "Zuletzt genutzt",
    sortStart: "Sortieren",
    sortDone: "Fertig",
    sortStartAria: "Kacheln sortieren",
    sortDoneAria: "Sortieren beenden",
    sortHint:
      "Ziehe die Kacheln an ihre neue Position (innerhalb der Gruppe) oder nutze die Pfeil-Buttons. Mit dem Augen-Button blendest du Kacheln aus oder wieder ein. Angemeldet wird die Auswahl auf allen deinen Geräten übernommen.",
    hiddenBadge: "Ausgeblendet",
    moveAria: (title: string) => `${title} verschieben`,
    moveUpAria: (title: string) => `${title} nach vorne verschieben`,
    moveDownAria: (title: string) => `${title} nach hinten verschieben`,
    showAria: (title: string) => `${title} wieder einblenden`,
    hideAria: (title: string) => `${title} ausblenden`,
    openAria: (title: string) => `${title} öffnen`,
  },
};

export type Translation = typeof de;

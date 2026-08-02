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
};

export type Translation = typeof de;

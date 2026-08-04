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
    screenAwake: "Display bleibt an",
  },
  password: {
    strengthLabel: "Passwort-Stärke",
    weak: "schwach",
    medium: "mittel",
    good: "gut",
    strong: "stark",
    strengthAria: (label: string) => `Passwort-Stärke: ${label}`,
    hints: {
      tooShort: "Mindestens 8 Zeichen verwenden",
      addLength: "Länger machen – ab 12 Zeichen wird es deutlich sicherer",
      addCase: "Gross- und Kleinbuchstaben mischen",
      addNumber: "Mindestens eine Ziffer einbauen",
      addSpecial: "Ein Sonderzeichen ergänzen, z. B. ! ? #",
      avoidCommon: "Häufige Wörter und Zahlenfolgen vermeiden",
      avoidRepeat: "Wiederholungen wie «aaa» vermeiden",
    },
  },
  shell: {
    toHome: "Zur Startseite",
    themeLight: "Helles Design aktivieren",
    themeDark: "Dunkles Design aktivieren",
    themeAuto: "Automatisches Design (System) aktivieren",
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
    greeting: {
      morning: (name: string) => `Guten Morgen, ${name}`,
      day: (name: string) => `Guten Tag, ${name}`,
      evening: (name: string) => `Guten Abend, ${name}`,
    },
    tripArrivalAt: (time: string) => `Anreise ${time}`,
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
    tripPlannedNote: "Geplanter Aufenthalt in «Meine Reisen»",
    currentTripAria: (place: string) => `Laufender Aufenthalt in ${place}`,
    currentTripTitle: (place: string) => `Du bist in ${place}`,
    currentTripDay: (day: number, total: number) => `Tag ${day} von ${total}`,
    currentTripMenuLink: "Menüplan",
    currentTripMenuAria: (place: string) =>
      `Menüplan des Aufenthalts in ${place} öffnen`,
    currentTripSpotLink: "Platz-Dossier",
    currentTripSpotAria: (place: string) => `Platz-Dossier zu ${place} öffnen`,
    currentTripShoppingLink: "Einkaufsliste",
    currentTripMealsSr: "Heutige Mahlzeiten:",
    anniversaryTitleOne: "Vor einem Jahr",
    anniversaryTitleMany: (years: number) => `Vor ${years} Jahren`,
    anniversaryNights: (n: number) => (n === 1 ? "1 Nacht" : `${n} Nächte`),
    anniversaryRatingAria: (stars: number) =>
      stars === 1 ? "1 von 5 Sternen" : `${stars} von 5 Sternen`,
    anniversaryLink: "Im Tagebuch ansehen",
    anniversaryLinkAria: (place: string) =>
      `Eintrag zu ${place} im Tagebuch ansehen`,
    anniversaryPhotoAlt: (place: string) => `Titelbild von ${place}`,
    anniversaryDismissAria: "Erinnerung für heute ausblenden",
    weatherAria: (temp: number, label: string) =>
      `Aktuelles Wetter: ${temp} Grad, ${label} – zum Wetter-Modul`,
    weatherNoAlerts: "Keine Unwetterwarnungen an deinem Standort",
    weatherAlertAria: (
      temp: number,
      label: string,
      count: number,
      severity: string
    ) =>
      `Aktuelles Wetter: ${temp} Grad, ${label}. ${
        count === 1 ? "1 Unwetterwarnung" : `${count} Unwetterwarnungen`
      }, höchste Stufe: ${severity} – zu den Warnungen im Wetter-Modul`,
    tipOfDayTitle: "Tipp des Tages",
    tipOfDayAria: (text: string) => `Tipp des Tages: ${text}`,
    gearDueText: (n: number) =>
      n === 1
        ? "1 Pflege-Aufgabe deiner Ausrüstung ist fällig"
        : `${n} Pflege-Aufgaben deiner Ausrüstung sind fällig`,
    gearDueAria: (n: number) =>
      n === 1
        ? "1 fällige Pflege-Aufgabe – Inventar öffnen"
        : `${n} fällige Pflege-Aufgaben – Inventar öffnen`,
    tickDueText: (n: number) =>
      n === 1
        ? "1 Zeckenstich ist noch zu beobachten"
        : `${n} Zeckenstiche sind noch zu beobachten`,
    tickDueAria: (n: number) =>
      n === 1
        ? "1 Zeckenstich in Beobachtung – Erste Hilfe öffnen"
        : `${n} Zeckenstiche in Beobachtung – Erste Hilfe öffnen`,
    searchPlaceholder: "Wissen durchsuchen: Zeckenbiss, Mastwurf, Rezepte …",
    recentSearches: "Kürzlich gesucht:",
    recentSearchesClear: "löschen",
    searchAria: "Wissensmodule durchsuchen",
    searchNoResults:
      "Nichts gefunden – probiere einen anderen Begriff (z. B. «Verbrennung» oder «Knoten»).",
    searchCategories: {
      module: "Modul",
      firstAid: "Erste Hilfe",
      knots: "Knoten",
      recipes: "Rezepte",
      nature: "Natur",
      care: "Pflege",
      clouds: "Wolken",
      own: "Meine Inhalte",
    },
    recentTitle: "Zuletzt genutzt",
    sortStart: "Sortieren",
    sortDone: "Fertig",
    sortStartAria: "Kacheln sortieren",
    sortDoneAria: "Sortieren beenden",
    sortHint:
      "Ziehe die Kacheln an ihre neue Position (innerhalb der Gruppe) oder nutze die Pfeil-Buttons. Mit dem Augen-Button blendest du Kacheln aus oder wieder ein. Angemeldet wird die Auswahl auf allen deinen Geräten übernommen.",
    hiddenBadge: "Ausgeblendet",
    widgetsTitle: "Widgets",
    widgetsHint:
      "Wähle, welche Bereiche über den Kacheln erscheinen. Begrüssung, Suche und die Kacheln selbst bleiben immer sichtbar. Angemeldet gilt die Auswahl auf allen deinen Geräten.",
    widgetNames: {
      onboarding: "Erste Schritte",
      briefing: "Morgen-Briefing",
      trip: "Laufende/nächste Reise",
      anniversary: "Vor einem Jahr",
      weather: "Wetter",
      tip: "Tipp des Tages",
      recent: "Zuletzt genutzt",
    },
    moveAria: (title: string) => `${title} verschieben`,
    moveUpAria: (title: string) => `${title} nach vorne verschieben`,
    moveDownAria: (title: string) => `${title} nach hinten verschieben`,
    showAria: (title: string) => `${title} wieder einblenden`,
    hideAria: (title: string) => `${title} ausblenden`,
    openAria: (title: string) => `${title} öffnen`,
    onboardingTitle: "Erste Schritte",
    onboardingSubtitle: "So richtest du CampMesser fürs nächste Abenteuer ein.",
    onboardingDismissAria: "Erste-Schritte-Karte ausblenden",
    onboardingSteps: {
      account: "Konto erstellen oder anmelden",
      spot: "Ersten Zeltplatz speichern",
      packList: "Erste Packliste anlegen",
      trip: "Erste Reise planen",
      push: "Push-Mitteilungen aktivieren",
    },
    onboardingOptional: "optional",
    onboardingDoneAria: (label: string) => `${label} – erledigt`,
    onboardingOpenAria: (label: string) => `${label} – jetzt öffnen`,
    onboardingLockedAria: (label: string) =>
      `${label} – erst nach der Anmeldung möglich`,
  },
  login: {
    title: "Anmelden",
    subtitle:
      "Mit deinem CampMesser-Konto speicherst du Packlisten, Inventar und Zeltplätze und nutzt sie auf allen Geräten.",
    resetTitle: "Passwort zurücksetzen",
    resetSubtitle:
      "Gib die E-Mail-Adresse deines Kontos an – wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.",
    newPasswordTitle: "Neues Passwort setzen",
    newPasswordSubtitle: "Wähle ein neues Passwort für dein Konto.",
    welcome: "Willkommen!",
    welcomeName: (name: string) => `Willkommen, ${name}!`,
    linkSent:
      "Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir soeben einen Link geschickt (60 Minuten gültig). Prüfe auch den Spam-Ordner.",
    resetDone: "Passwort zurückgesetzt – du bist jetzt angemeldet.",
    resetUnavailable:
      "Der Passwort-Reset per E-Mail ist derzeit nicht verfügbar. Bitte wende dich an den Betreiber.",
    tooManyResets:
      "Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.",
    resetLinkInvalid:
      "Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.",
    passwordsMismatch: "Die Passwörter stimmen nicht überein.",
    accountEmailLabel: "E-Mail deines Kontos",
    emailPlaceholder: "du@beispiel.ch",
    sendingLink: "Link wird verschickt …",
    sendLink: "Link anfordern",
    newPasswordLabel: "Neues Passwort",
    passwordHint: "(mind. 8 Zeichen)",
    confirmNewPasswordLabel: "Neues Passwort bestätigen",
    setPassword: "Passwort setzen",
    backToLogin: "Zurück zur Anmeldung",
    tabLogin: "Anmelden",
    tabRegister: "Registrieren",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    loggingIn: "Wird angemeldet …",
    loginButton: "Anmelden",
    forgotPassword: "Passwort vergessen?",
    nameLabel: "Name",
    namePlaceholder: "z. B. Alex",
    confirmPasswordLabel: "Passwort bestätigen",
    creatingAccount: "Konto wird erstellt …",
    createAccount: "Konto erstellen",
    knowledgeNote:
      "Die Wissens-Module (Erste Hilfe, Knoten, Natur, Rezepte) funktionieren auch ohne Konto – ein Konto brauchst du nur zum Speichern eigener Daten.",
    passkeyOr: "oder",
    passkeyButton: "Mit Passkey anmelden",
    passkeyWaiting: "Warte auf den Passkey …",
    passkeyFailed:
      "Die Passkey-Anmeldung hat nicht geklappt. Versuch es erneut oder melde dich mit dem Passwort an.",
    emailVerified: "E-Mail-Adresse bestätigt – danke!",
    verifyLinkInvalid:
      "Der Bestätigungs-Link ist ungültig oder abgelaufen. Fordere im Profil einen neuen an.",
  },
  profile: {
    prefHeat: "Sonne & Hitze",
    prefHeatDesc:
      "Morgens eine Erinnerung ans Eincremen und ans Trinken, wenn der Tag hohen UV-Index oder über 28 °C bringt.",
    title: "Profil",
    manageSubtitle: "Verwalte dein Konto und deine Einstellungen.",
    loginFeature: "dein Profil",
    loggedInAs: (id: string) => `Angemeldet als ${id}`,
    nameUpdated: "Name aktualisiert",
    emailUpdated: "E-Mail-Adresse aktualisiert – melde dich künftig damit an",
    passwordUpdated: "Passwort aktualisiert",
    accountDeleted: "Konto gelöscht. Gute Reise!",
    themeSavedDark: "Dunkles Design als Standard gespeichert",
    themeSavedLight: "Helles Design als Standard gespeichert",
    themeSavedAuto:
      "Automatisches Design gespeichert – folgt der System-Einstellung",
    themeTitle: "Design",
    themeIntro: "Wähle, mit welchem Design die App standardmässig startet.",
    themeGroupAria: "Standard-Design wählen",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeAuto: "Automatisch (System)",
    nameTitle: "Name ändern",
    nameAria: "Name",
    namePlaceholder: "Dein Name",
    verifyHint:
      "Deine E-Mail-Adresse ist noch nicht bestätigt. Prüfe dein Postfach (auch den Spam-Ordner) oder lass dir den Link erneut schicken.",
    verifyResend: "Bestätigungs-Mail erneut senden",
    verifySending: "Wird verschickt …",
    verifySent:
      "Bestätigungs-Mail verschickt – prüfe dein Postfach (48 Stunden gültig).",
    verifyTooMany:
      "Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.",
    verifyUnavailable: "Der E-Mail-Versand ist derzeit nicht verfügbar.",
    emailTitle: "E-Mail-Adresse ändern",
    emailCurrentPrefix: "Aktuell:",
    emailCurrentSuffix: ". Mit der neuen Adresse meldest du dich künftig an.",
    newEmailLabel: "Neue E-Mail-Adresse",
    confirmWithPasswordLabel: "Passwort zur Bestätigung",
    changeEmail: "E-Mail ändern",
    passwordTitle: "Passwort aktualisieren",
    newPasswordsMismatch: "Die neuen Passwörter stimmen nicht überein.",
    currentPasswordLabel: "Aktuelles Passwort",
    newPasswordLabel: "Neues Passwort (min. 8 Zeichen)",
    repeatPasswordLabel: "Neues Passwort wiederholen",
    changePassword: "Passwort ändern",
    deleteTitle: "Konto löschen",
    deleteIntro:
      "Löscht dein Konto und alle gespeicherten Daten (Packlisten, Inventar, Zeltplätze, Verbraucher, Kühlbox) unwiderruflich.",
    deleteButton: "Konto löschen …",
    deleteConfirmTitle: "Konto wirklich löschen?",
    deleteConfirmDescription:
      "Alle deine Daten werden unwiderruflich gelöscht. Bestätige mit deinem Passwort.",
    passwordLabel: "Passwort",
    deleteFinal: "Endgültig löschen",
    versionLine: (version: string) => `CampMesser Version ${version}`,
    buildDate: (date: string) => ` · Build vom ${date}`,
    notificationsTitle: "Mitteilungen",
    pushDeviceTitle: "Push auf diesem Gerät",
    pushDeviceDesc:
      "Benachrichtigungen zu Unwetter, Kühlbox-MHD, Trip-Countdown, Sternschnuppen-Nächten und Ausrüstungs-Pflege.",
    pushDeviceAria: "Push-Mitteilungen auf diesem Gerät aktivieren",
    pushUnsupported: "Dein Browser unterstützt keine Push-Mitteilungen.",
    pushNotConfigured: "Push ist serverseitig nicht eingerichtet.",
    pushOn: "Push-Mitteilungen aktiviert",
    pushOff: "Push-Mitteilungen deaktiviert",
    prefsIntro: "Wähle, welche Mitteilungen dieses Gerät erhält:",
    prefWeather: "Unwetter-Warnungen",
    prefWeatherDesc:
      "Sturm, Gewitter oder Starkregen an deinen gespeicherten Plätzen.",
    prefFood: "MHD-Erinnerungen",
    prefFoodDesc:
      "Wenn Lebensmittel in der Kühlbox heute oder morgen ablaufen.",
    prefTrips: "Trip-Countdown",
    prefTripsDesc: "3 Tage vor der Anreise, inklusive Packlisten-Stand.",
    prefAstro: "Sternschnuppen-Nächte",
    prefAstroDesc:
      "Wenn an deinem Heim-Standort eine klare Nacht auf ein Sternschnuppen-Maximum trifft.",
    prefGear: "Pflege-Erinnerungen",
    prefGearDesc:
      "Höchstens einmal pro Monat, wenn Ausrüstungs-Pflege fällig ist.",
    prefToggleAria: (label: string) => `${label} an- oder abschalten`,
    thresholdsTitle: "Eigene Warn-Schwellen",
    thresholdsIntro:
      "Ab welchen Werten soll dich der Unwetter-Push wecken? Leer lassen heisst Standard.",
    thresholdWind: "Windböen ab (km/h)",
    thresholdWindHint: (standard: number, min: number, max: number) =>
      `Standard ${standard} · möglich ${min}–${max}`,
    thresholdRain: "Regen ab (mm pro Stunde)",
    thresholdRainHint: (standard: number, min: number, max: number) =>
      `Standard ${standard} · möglich ${min}–${max}`,
    thresholdReset: "Standard",
    historyTitle: "Verlauf",
    historyToggleAria: "Benachrichtigungs-Verlauf ein- oder ausklappen",
    historyHint: "Die letzten Mitteilungen an dein Konto – neueste zuerst.",
    historyEmpty:
      "Noch keine Mitteilungen verschickt. Sobald etwas ansteht, findest du es hier.",
    historyOpenAria: (title: string) => `«${title}» öffnen`,
    historyKind: {
      heat: "Sonne & Hitze",
      weather: "Unwetter",
      food: "Kühlbox",
      trip: "Reise",
      drying: "Zelt trocknen",
      astro: "Sternschnuppen",
      gear: "Ausrüstung",
      evepack: "Vorabend-Check",
    },
    homeTitle: "Heim-Standort",
    homeIntro:
      "Hinterlege deinen Wohnort, um Unwetter-Warnungen und Sternschnuppen-Tipps auch für zu Hause zu erhalten – ganz ohne gespeicherten Zeltplatz.",
    homeNotSet: "Noch kein Heim-Standort gesetzt.",
    homeNameLabel: "Name",
    homeDefaultName: "Zuhause",
    homeUseLocation: "Aktuelle Position verwenden",
    homeLocating: "Position wird ermittelt …",
    homeSearchLabel: "Ort suchen",
    homeSearchPlaceholder: "z. B. Bern",
    homeSearchButton: "Suchen",
    homeSearchFailed:
      "Die Ortssuche hat nicht geklappt. Versuch es später erneut.",
    homeSearchEmpty: "Keine Orte gefunden.",
    homeSelectAria: (name: string) => `${name} als Heim-Standort setzen`,
    homeSaved: "Heim-Standort gespeichert",
    homeRemoved: "Heim-Standort entfernt",
    homeRemoveAria: "Heim-Standort entfernen",
    passkeysTitle: "Sicherheit: Passkeys",
    passkeysIntro:
      "Mit einem Passkey meldest du dich ohne Passwort an – per Fingerabdruck, Gesicht oder Geräte-Code. Dein Passwort bleibt zusätzlich gültig.",
    passkeysEmpty: "Noch kein Passkey hinterlegt.",
    passkeyAddedOn: (date: string) => `hinzugefügt am ${date}`,
    passkeyNameLabel: "Name des Passkeys",
    passkeyNamePlaceholder: "z. B. Handy Alex",
    passkeyDefaultName: "Passkey",
    passkeyAddButton: "Passkey hinzufügen",
    passkeyAdding: "Warte auf Bestätigung …",
    passkeyAdded: "Passkey gespeichert",
    passkeyAddFailed:
      "Der Passkey konnte nicht angelegt werden. Versuch es erneut.",
    passkeyExists: "Auf diesem Gerät ist bereits ein Passkey hinterlegt.",
    passkeyRemoveAria: (name: string) => `Passkey «${name}» entfernen`,
    passkeyRemoveConfirm: (name: string) =>
      `Passkey «${name}» wirklich entfernen? Die Anmeldung damit ist danach nicht mehr möglich.`,
    passkeyRemoved: "Passkey entfernt",
    passkeysUnsupported: "Dein Browser unterstützt keine Passkeys.",
  },
  packLists: {
    title: "Packlisten",
    subtitle:
      "Szenario-basierte Checklisten, die du abhaken und erweitern kannst.",
    loginFeature: "deine Packlisten",
    newList: "Neue Packliste",
    newListAria: "Neue Packliste erstellen",
    dialogDescription:
      "Wähle ein Szenario – die passende Basis-Ausrüstung wird automatisch eingetragen.",
    scenarioAria: (label: string) => `Szenario ${label} wählen`,
    preparedItems: (n: number) => `Enthält ${n} vorbereitete Einträge.`,
    nameLabel: "Name der Liste",
    namePlaceholder: (label: string) => `z. B. ${label} Sommer`,
    namePlaceholderFallback: "Name",
    personsLabel: "Personen (optional)",
    personsPlaceholder: "Name eingeben, Enter fügt hinzu",
    personsAddAria: "Person zur neuen Liste hinzufügen",
    personsRemoveAria: (name: string) => `Person ${name} wieder entfernen`,
    personsHint:
      "Jede Person bekommt einen eigenen Bereich auf der Liste – «Allgemein» gibt es immer.",
    createList: "Liste erstellen",
    defaultName: "Meine Packliste",
    created: "Packliste erstellt",
    createFailed: "Liste konnte nicht erstellt werden",
    duplicated: "Liste kopiert – alle Einträge sind unabgehakt",
    duplicateFailed: "Kopieren fehlgeschlagen",
    openAria: (name: string) => `Packliste ${name} öffnen`,
    duplicateAria: (name: string) => `Packliste ${name} duplizieren`,
    deleteAria: (name: string) => `Packliste ${name} löschen`,
    deleteConfirm: (name: string) => `Liste «${name}» wirklich löschen?`,
    emptyTitle: "Noch keine Packlisten",
    emptyText: "Erstelle deine erste Liste – wähle einfach ein Szenario aus.",
    familyTitle: "Checklisten für Familien",
    familySubtitle:
      "Fertige Pakete fürs Camping mit Kindern – übernimm die Einträge in eine deiner Listen.",
    moreItems: (n: number) => `… und ${n} weitere Einträge`,
    addToPackList: "Zu einer Packliste hinzufügen",
    addToPackListAria: (label: string) =>
      `Paket ${label} zu einer Packliste hinzufügen`,
    chooseListTitle: "Packliste wählen",
    chooseListDescription: (label: string) =>
      `In welche Liste sollen die Einträge aus «${label}» übernommen werden?`,
    addOnAdded: (label: string, list: string) =>
      `«${label}» zu «${list}» hinzugefügt`,
    addOnAddFailed: "Einträge konnten nicht hinzugefügt werden",
    noListsForAddOn:
      "Erstelle zuerst eine Packliste – danach kannst du das Paket übernehmen.",
    myTemplatesTitle: "Meine Vorlagen",
    templateAria: (name: string) => `Vorlage ${name} wählen`,
    templateItemCount: (n: number) => (n === 1 ? "1 Eintrag" : `${n} Einträge`),
    templateDeleteAria: (name: string) => `Vorlage ${name} löschen`,
    templateDeleteConfirm: (name: string) =>
      `Vorlage «${name}» wirklich löschen?`,
    templateDeleted: "Vorlage gelöscht",
    templateDeleteFailed: "Vorlage konnte nicht gelöscht werden",
    budgetBadge: (weight: string) => `Budget ${weight}`,
    templateShareAria: (name: string) => `Vorlage ${name} per Link teilen`,
    templateShareTitle: "Vorlage teilen",
    templateShareDescription:
      "Wer den Link hat, kann die Vorlage ansehen und mit einem Konto als eigene Vorlage übernehmen.",
    templateShareCopied: "Teil-Link kopiert – schick ihn weiter!",
    templateShareFailed: "Teilen fehlgeschlagen",
    templateUnshare: "Teilen beenden",
    templateUnshared: "Teilen beendet – der Link ist nicht mehr gültig",
    templateUnshareFailed: "Teilen konnte nicht beendet werden",
    templateQrAlt: (name: string) =>
      `QR-Code zum Teil-Link der Vorlage ${name}`,
    templateQrTitle: "Direkt weitergeben",
    templateQrText:
      "Lass andere den Code mit der Handy-Kamera scannen – die Vorlage öffnet sich sofort.",
    templateSharedBadge: "geteilt",
    archiveAria: (name: string) => `Packliste ${name} archivieren`,
    unarchiveAria: (name: string) => `Packliste ${name} wiederherstellen`,
    archived: "Liste archiviert",
    unarchived: "Liste wiederhergestellt",
    archiveFailed: "Archivieren fehlgeschlagen",
    archiveSectionTitle: (n: number) => `Archiv (${n})`,
    archiveSectionAria: "Archivierte Packlisten auf- oder zuklappen",
    archiveHint:
      "Archivierte Listen bleiben mit allen Einträgen erhalten – sie tauchen nur nicht mehr in den Auswahl-Listen auf.",
    archivedBadge: "archiviert",
  },
  packListDetail: {
    backLabel: "Packlisten",
    fallbackTitle: "Packliste",
    loginFeature: "deine Packlisten",
    notFound: "Packliste nicht gefunden",
    packedCount: (checked: number, total: number) =>
      `${checked} von ${total} Einträgen gepackt`,
    progressAria: (pct: number) => `Fortschritt: ${pct} Prozent gepackt`,
    weightTotal: "gesamt",
    weightPacked: "gepackt",
    volumeLine: (litres: string) => `${litres} l Volumen`,
    matchedInfo: (matched: number, total: number) =>
      `(${matched} von ${total} Einträgen im Inventar gefunden)`,
    shareCreating: "Link wird erstellt …",
    shareButton: "Liste per Link teilen",
    shareCopied: "Teil-Link kopiert – schick ihn deinen Mitreisenden!",
    shareCreated: "Teil-Link erstellt – kopiere ihn unten.",
    shareFailed: "Teilen fehlgeschlagen",
    qrAlt: (name: string) => `QR-Code zum Teil-Link der Liste ${name}`,
    qrTitle: "Direkt am Platz übergeben",
    qrText:
      "Lass deine Mitreisenden den Code mit der Handy-Kamera scannen – die Liste öffnet sich sofort, ganz ohne Tippen oder Anmeldung.",
    shareHint:
      "Wer den Link hat, kann die Liste sehen und mit dir gemeinsam abhaken – ganz ohne Anmeldung.",
    toggleFailed: "Änderung fehlgeschlagen",
    addFailed: "Eintrag konnte nicht hinzugefügt werden",
    addOnAdded: (label: string) => `«${label}» hinzugefügt`,
    addPlaceholder: "Eintrag hinzufügen …",
    addNameAria: "Name des neuen Eintrags",
    categoryAria: "Kategorie des neuen Eintrags",
    newCategoryOption: "Neue Kategorie …",
    newCategoryPlaceholder: "Neue Kategorie",
    newCategoryAria: "Name der neuen Kategorie",
    editCategoryAria: (name: string) => `Kategorie von ${name} ändern`,
    editItemAria: (name: string) => `${name} bearbeiten`,
    editNameAria: (name: string) => `Neuer Name für ${name}`,
    editQtyAria: (name: string) => `Menge von ${name}`,
    editCategorySelectAria: (name: string) => `Neue Kategorie für ${name}`,
    categorySave: "Kategorie speichern",
    categoryUpdateFailed: "Kategorie konnte nicht geändert werden",
    addAria: "Eintrag hinzufügen",
    defaultCategory: "Eigene",
    generalCategory: "Allgemein",
    inventoryTitle: "Aus deinem Inventar übernehmen",
    inventoryAddAria: (name: string) =>
      `${name} aus dem Inventar zur Liste hinzufügen`,
    inventoryHint:
      "Einträge mit Inventar-Treffer zählen automatisch zur Gewichts-Bilanz oben.",
    addOnAria: (label: string) => `Paket ${label} zur Liste hinzufügen`,
    markPacked: (name: string) => `${name} als gepackt markieren`,
    markUnpacked: (name: string) => `${name} als ungepackt markieren`,
    deleteItemAria: (name: string) => `${name} löschen`,
    reorderAria: (name: string) => `${name} verschieben – ziehen zum Sortieren`,
    reorderFailed: "Neue Reihenfolge konnte nicht gespeichert werden",
    emptyList:
      "Diese Liste ist noch leer – füge unten in einem Bereich deinen ersten Eintrag hinzu.",
    assignFailed: "Zuordnung fehlgeschlagen",
    assignButtonAria: (name: string) => `${name} einer Person zuweisen`,
    assignInputAria: (name: string) => `Person, die ${name} packt`,
    assignPlaceholder: "Name (z. B. Mama)",
    assignSave: "Zuweisen",
    assignRemove: "Zuordnung entfernen",
    assignSuggestionAria: (person: string, item: string) =>
      `${item} an ${person} zuweisen`,
    sectionGeneral: "Allgemein",
    sectionProgress: (checked: number, total: number) =>
      `${checked} von ${total} gepackt`,
    sectionEmpty: "Noch keine Einträge in diesem Bereich.",
    sectionAddNameAria: (section: string) =>
      `Neuer Eintrag im Bereich ${section}`,
    sectionAddAria: (section: string) =>
      `Eintrag im Bereich ${section} hinzufügen`,
    printPersonAria: (name: string) => `Nur die Einträge von ${name} drucken`,
    managePersonsButton: "Personen verwalten",
    personTabsAria: "Bereiche der Packliste",
    managePersonsTitle: "Personen verwalten",
    managePersonsDescription:
      "Jede Person bekommt einen eigenen Bereich auf der Liste. Einträge ohne Person stehen unter «Allgemein».",
    personsEmpty: "Noch keine Personen – füge unten die erste hinzu.",
    personNameAria: "Name der neuen Person",
    addPersonButton: "Hinzufügen",
    removePersonAria: (name: string) => `Person ${name} entfernen`,
    removePersonConfirm: (name: string) =>
      `Person «${name}» wirklich entfernen? Ihre Einträge wandern zurück zu «Allgemein».`,
    personsSaveFailed: "Personen konnten nicht gespeichert werden",
    personsMaxHint: "Höchstens 10 Personen pro Liste.",
    tripMembersTitle: "Mitreisende hinzufügen",
    tripMembersHint:
      "Diese Liste hängt an einer geteilten Reise – tippe auf einen Namen, um dafür einen Bereich anzulegen.",
    addTripMemberAria: (name: string) =>
      `${name} als Person zur Liste hinzufügen`,
    ownPersonBadge: "Du",
    printButton: "Drucken",
    saveTemplateButton: "Als Vorlage speichern",
    saveTemplateAria: (name: string) => `Liste ${name} als Vorlage speichern`,
    saveTemplateTitle: "Als Vorlage speichern",
    saveTemplateDescription:
      "Speichert die aktuellen Einträge (Namen, Kategorien, Mengen) als wiederverwendbare Vorlage. Häkchen und Personen-Zuordnungen werden nicht übernommen.",
    templateNameLabel: "Name der Vorlage",
    saveTemplateConfirm: "Vorlage speichern",
    templateSaved: "Vorlage gespeichert – beim Anlegen neuer Listen wählbar",
    templateSaveFailed: "Vorlage konnte nicht gespeichert werden",
    budgetSetButton: "Gewichts-Budget festlegen",
    budgetEdit: "Anpassen",
    budgetEditAria: "Gewichts-Budget anpassen",
    budgetLine: (total: string, budget: string) =>
      `${total} von ${budget} Budget`,
    budgetPercent: (pct: number) => `${pct} % des Budgets ausgeschöpft`,
    budgetOver: (excess: string) => `${excess} über dem Budget`,
    budgetProgressAria: (pct: number) => `Gewicht: ${pct} Prozent des Budgets`,
    budgetDialogTitle: "Gewichts-Budget festlegen",
    budgetDialogDescription:
      "Lege fest, wie schwer dein Gepäck höchstens sein darf. Die Bilanz vergleicht das Ist-Gewicht aus dem Inventar-Abgleich mit deinem Budget.",
    budgetLabel: "Budget in kg",
    budgetPlaceholder: "z. B. 15,5",
    budgetSave: "Budget speichern",
    budgetRemove: "Budget entfernen",
    budgetSaved: "Gewichts-Budget gespeichert",
    budgetRemoved: "Gewichts-Budget entfernt",
    budgetSaveFailed: "Budget konnte nicht gespeichert werden",
    budgetInvalid: "Gib ein Gewicht zwischen 0,1 und 500 kg ein",
    uncheckAllButton: "Alle Haken lösen",
    uncheckAllConfirm: (n: number) =>
      n === 1
        ? "Den gesetzten Haken wirklich lösen? Der Eintrag bleibt erhalten."
        : `Wirklich alle ${n} Haken lösen? Die Einträge bleiben erhalten.`,
    uncheckAllDone: "Alle Haken gelöst – bereit fürs nächste Packen",
    uncheckAllFailed: "Haken konnten nicht gelöst werden",
    editedByTitle: (name: string, date: string) =>
      `Zuletzt geändert von ${name} am ${date}`,
    editedByBadgeAria: (name: string) => `Zuletzt geändert von ${name}`,
  },
  packListPrint: {
    docTitle: (name: string) => `${name} – Packliste zum Ausdrucken`,
    docTitleFallback: "Packliste",
    appTitle: "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
    notFound: "Diese Packliste wurde nicht gefunden.",
    printButton: "Drucken / Als PDF sichern",
    printBrowserHint:
      "In der installierten App öffnet der Knopf die Ansicht im Browser – dort über das Menü drucken oder als PDF sichern.",
    headerKicker: "CampMesser · Packliste",
    meta: (items: number, categories: number) =>
      `${items} ${items === 1 ? "Eintrag" : "Einträge"} · ${categories} ${categories === 1 ? "Kategorie" : "Kategorien"}`,
    printedOn: (date: string) => `Stand: ${date}`,
    personFilterInfo: (name: string) => `Nur Einträge von ${name}`,
    emptyList: "Diese Liste hat keine Einträge.",
    footer:
      "Nichts vergessen – gute Reise! · CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
  },
  sharedPackList: {
    loadingShared: "Geteilte Liste wird geladen …",
    notFoundTitle: "Link abgelaufen oder ungültig",
    backHome: "Startseite",
    invalidLink:
      "Dieser Teil-Link ist abgelaufen, ungültig oder wurde von der Besitzerin bzw. dem Besitzer zurückgezogen.",
    toggleFailed: "Abhaken fehlgeschlagen",
    subtitle: (checked: number, total: number) =>
      `Geteilte Packliste · ${checked} von ${total} Einträgen gepackt`,
    progressAria: (pct: number) => `Fortschritt: ${pct} Prozent gepackt`,
    sharedInfo:
      "Gemeinsames Abhaken: Alle mit diesem Link sehen den gleichen Stand – die Anzeige aktualisiert sich automatisch.",
    emptyList: "Diese Liste ist noch leer.",
    checkAria: (name: string) => `${name} abhaken`,
  },
  sharedTemplate: {
    loading: "Geteilte Vorlage wird geladen …",
    notFoundTitle: "Link abgelaufen oder ungültig",
    backHome: "Startseite",
    invalidLink:
      "Dieser Teil-Link ist abgelaufen, ungültig oder wurde von der Besitzerin bzw. dem Besitzer zurückgezogen.",
    subtitle: (n: number) =>
      n === 1
        ? "Geteilte Packvorlage · 1 Eintrag"
        : `Geteilte Packvorlage · ${n} Einträge`,
    sharedInfo:
      "Geteilte Packvorlage: Schau sie dir an – mit einem Konto kannst du sie übernehmen oder direkt eine Packliste daraus erstellen.",
    importButton: "Als eigene Vorlage übernehmen",
    imported: "Vorlage übernommen – beim Anlegen neuer Listen wählbar",
    importFailed: "Vorlage konnte nicht übernommen werden",
    createListButton: "Neue Liste daraus erstellen",
    listCreated: "Packliste erstellt",
    createListFailed: "Liste konnte nicht erstellt werden",
    loginHint:
      "Melde dich an, um die Vorlage zu übernehmen oder eine Packliste daraus zu erstellen.",
    emptyTemplate: "Diese Vorlage hat keine Einträge.",
  },
  sharedQuiz: {
    loading: "Geteiltes Quiz wird geladen …",
    notFoundTitle: "Link abgelaufen oder ungültig",
    backHome: "Startseite",
    invalidLink:
      "Dieser Teil-Link ist abgelaufen, ungültig oder wurde von der Besitzerin bzw. dem Besitzer zurückgezogen.",
    subtitle: "Geteiltes Quiz",
    sharedInfo:
      "Geteiltes Quiz: Schau es dir an – mit einem Konto kannst du es als eigenes Quiz in deinen Familien-Modus übernehmen.",
    importButton: "Als eigenes Quiz übernehmen",
    imported: "Quiz übernommen – du findest es im Familien-Modus",
    importFailed: "Quiz konnte nicht übernommen werden",
    loginHint: "Melde dich an, um das Quiz als eigenes Quiz zu übernehmen.",
    questionCount: (n: number) => (n === 1 ? "1 Frage" : `${n} Fragen`),
    sampleQuestionTitle: "Beispielfrage",
    moreQuestions: (n: number) =>
      n === 1
        ? "… und 1 weitere Frage warten nach dem Übernehmen."
        : `… und ${n} weitere Fragen warten nach dem Übernehmen.`,
    emptyQuiz: "Dieses Quiz hat keine Fragen.",
  },
  sharedRecipe: {
    loading: "Geteiltes Rezept wird geladen …",
    notFoundTitle: "Link abgelaufen oder ungültig",
    backHome: "Startseite",
    invalidLink:
      "Dieser Teil-Link ist abgelaufen, ungültig oder wurde von der Besitzerin bzw. dem Besitzer zurückgezogen.",
    subtitle: "Geteiltes Rezept",
    sharedInfo:
      "Geteiltes Rezept: Koch es nach – mit einem Konto kannst du es als eigenes Rezept in dein Rezeptbuch übernehmen.",
    importButton: "Als eigenes Rezept übernehmen",
    imported: "Rezept übernommen – du findest es im Rezeptbuch",
    importFailed: "Rezept konnte nicht übernommen werden",
    loginHint: "Melde dich an, um das Rezept in dein Rezeptbuch zu übernehmen.",
    minutes: (n: number) => `${n} Min.`,
    servings: (n: number) => `${n} Portionen`,
    onePotBadge: "One-Pot",
    kidsBadge: "Kinder",
    ingredientsTitle: "Zutaten",
    stepsTitle: "Zubereitung",
    tipTitle: "Tipp",
    photoNote:
      "Das Foto des Rezepts bleibt privat und wird über den Teil-Link nicht mitgeteilt.",
  },
  packOptimizer: {
    title: "Pack-Optimierung",
    subtitleLoggedOut:
      "Gewicht und Packmass deiner Ausrüstung im Blick – abgestimmt auf dein Fahrzeug.",
    loginFeature: "deine Pack-Analyse",
    subtitle:
      "Basiert auf deinem Inventar: Gewicht und Volumen im Vergleich zur Kapazität deines Transports.",
    transportTitle: "Transportmittel",
    transportGroupAria: "Transportmittel wählen",
    weight: "Gewicht",
    weightPercentAria: (pct: number) => `Gewichtsauslastung ${pct} Prozent`,
    volume: "Volumen",
    volumePercentAria: (pct: number) => `Volumenauslastung ${pct} Prozent`,
    hintsTitle: "Optimierungshinweise",
    heaviestTitle: "Schwerste Positionen",
    bulkiestTitle: "Grösste Positionen",
    emptyPrefix: "Dein Inventar ist noch leer.",
    emptyLink: "Erfasse zuerst deine Ausrüstung",
    emptySuffix: "mit Gewicht und Volumen.",
  },
  inventory: {
    boxButton: "Versorgen",
    boxAria: (name: string) => `${name} in eine Kiste versorgen`,
    boxDialogTitle: "In eine Kiste versorgen",
    boxDialogDescription:
      "Wähle die Kiste, in der dieser Gegenstand liegt. Er erscheint dann im Inhalt der Kiste – auch nach dem Scannen des Etiketts.",
    boxAssigned: "Zuordnung gespeichert",
    boxRemove: "Aus der Kiste nehmen",
    boxNoBoxes:
      "Noch keine Kiste angelegt. Leg zuerst eine an, dann kannst du hier versorgen.",
    boxManageLink: "Kisten verwalten",
    title: "Inventar",
    subtitleLoggedOut: "Erfasse dein Campingmaterial mit Gewicht und Volumen.",
    loginFeature: "dein Inventar",
    subtitle:
      "Erfasse dein Campingmaterial – Gewicht und Volumen fliessen direkt in die Pack-Optimierung ein.",
    itemsCount: "Gegenstände",
    totalWeight: "Gesamtgewicht",
    totalVolume: "Gesamtvolumen",
    addButton: "Ausrüstung erfassen",
    addAria: "Neue Ausrüstung erfassen",
    dialogTitleEdit: "Ausrüstung bearbeiten",
    dialogTitleNew: "Neue Ausrüstung",
    dialogDescription:
      "Gewicht und Volumen helfen später bei der Pack-Optimierung.",
    nameLabel: "Name",
    namePlaceholder: "z. B. Schlafsack Komfort -5 °C",
    categoryLabel: "Kategorie",
    categoryAria: "Kategorie wählen",
    weightLabel: "Gewicht (g)",
    volumeLabel: "Volumen (l)",
    quantityLabel: "Anzahl",
    submitNew: "Erfassen",
    created: "Ausrüstung erfasst",
    updated: "Änderungen gespeichert",
    nameRequired: "Bitte einen Namen eingeben",
    tableName: "Name",
    tableCategory: "Kategorie",
    tableWeight: "Gewicht",
    tableVolume: "Volumen",
    actionsAria: "Aktionen",
    editAria: (name: string) => `${name} bearbeiten`,
    deleteAria: (name: string) => `${name} löschen`,
    deleteConfirm: (name: string) => `«${name}» wirklich löschen?`,
    photoLabel: "Foto (optional)",
    photoChoose: "Foto auswählen",
    photoChange: "Foto ändern",
    photoRemove: "Foto entfernen",
    photoPreviewAlt: "Vorschau des Ausrüstungs-Fotos",
    photoHint:
      "JPEG, PNG oder WebP – wird vor dem Hochladen automatisch verkleinert.",
    photoUploading: "Foto wird hochgeladen …",
    photoUploadFailed:
      "Gespeichert, aber das Foto konnte nicht hochgeladen werden.",
    photoTooLarge: "Das Foto ist zu gross (max. 5 MB).",
    photoHeic:
      "HEIC/HEIF kann der Browser nicht lesen – bitte als JPEG exportieren.",
    photoReadFailed: "Das Bild konnte nicht gelesen werden.",
    photoRemoveFailed: "Das Foto konnte nicht entfernt werden.",
    photoThumbAria: (name: string) => `Foto von ${name} in Vollbild anzeigen`,
    photoDialogAlt: (name: string) => `Foto von ${name}`,
    photoDialogDescription: "Foto des Gegenstands in gross.",
    emptyTitle: "Noch keine Ausrüstung erfasst",
    emptyText: "Beginne mit den grossen Teilen: Zelt, Schlafsack, Isomatte.",
    searchPlaceholder: "Inventar durchsuchen …",
    searchAria: "Inventar nach Name oder Notiz durchsuchen",
    categoryFilterAria: "Nach Kategorie filtern",
    filterAll: "Alle",
    filterCount: (shown: number, total: number) =>
      `${shown} von ${total} Gegenständen`,
    filterEmptyTitle: "Keine Treffer",
    filterEmptyText: "Passe die Suche an oder wähle eine andere Kategorie.",
    filterReset: "Filter zurücksetzen",
    priceLabel: "Preis (CHF)",
    priceAria: "Kaufpreis in Franken",
    purchaseDateLabel: "Kaufdatum",
    warrantyLabel: "Garantie (Monate)",
    warrantyAria: "Garantiedauer in Monaten ab Kaufdatum",
    warrantyHelp: "Ab Kaufdatum – leer lassen, wenn du es nicht weisst.",
    warrantyBadge: (date: string) => `Garantie bis ${date}`,
    warrantyExpiredBadge: (date: string) => `Garantie abgelaufen am ${date}`,
    warrantyDaysLeft: (n: number) =>
      n === 0
        ? "Läuft heute ab"
        : n === 1
          ? "Läuft morgen ab"
          : `Läuft in ${n} Tagen ab`,
    warrantySoonTitle: (n: number) =>
      n === 1 ? "1 Garantie läuft bald ab" : `${n} Garantien laufen bald ab`,
    warrantySoonText: "In den nächsten 60 Tagen – jetzt prüfen lohnt sich.",
    warrantySoonShow: "Anzeigen",
    warrantySoonShowAll: "Alle anzeigen",
    lentButton: "Verliehen",
    lentAria: (name: string) => `${name} als verliehen vermerken`,
    lentDialogTitle: "Als verliehen vermerken",
    lentDialogDescription:
      "Halte fest, wer den Gegenstand hat und seit wann – so vergisst du nichts.",
    lentToLabel: "Verliehen an",
    lentToPlaceholder: "z. B. Nachbarin Sarah",
    lentAtLabel: "Seit",
    lentSubmit: "Als verliehen vermerken",
    lentToRequired: "Bitte einen Namen eingeben",
    lentSaved: "Als verliehen vermerkt",
    lentBadge: (name: string, date: string) =>
      `verliehen an ${name} seit ${date}`,
    lentReturnButton: "Zurück erhalten",
    lentReturnAria: (name: string) => `${name} als zurück erhalten vermerken`,
    lentReturned: "Zurück im Inventar",
    lentFilterChip: (n: number) => `Verliehen (${n})`,
    priceBadge: (chf: string) => `CHF ${chf}`,
    totalValue: (chf: string) => `Gesamtwert: CHF ${chf}`,
    totalValueHint: "Summe aller erfassten Preise × Anzahl",
    receiptLabel: "Beleg (optional)",
    receiptChoose: "Beleg auswählen",
    receiptChange: "Beleg ändern",
    receiptRemove: "Beleg entfernen",
    receiptPreviewAlt: "Vorschau des Belegs",
    receiptHint:
      "Foto der Quittung – JPEG, PNG oder WebP, wird vor dem Hochladen automatisch verkleinert.",
    receiptUploading: "Beleg wird hochgeladen …",
    receiptUploadFailed:
      "Gespeichert, aber der Beleg konnte nicht hochgeladen werden.",
    receiptRemoveFailed: "Der Beleg konnte nicht entfernt werden.",
    receiptIconAria: (name: string) => `Beleg von ${name} anzeigen`,
    receiptDialogDescription: "Beleg des Gegenstands in gross.",
    receiptDialogAlt: (name: string) => `Beleg von ${name}`,
    receiptDialogTitle: (name: string) => `Beleg: ${name}`,
    gearTitle: "Pflege & Wartung",
    gearIntro:
      "Wiederkehrende Aufgaben wie Imprägnieren oder Batterien prüfen – fällige Aufgaben werden markiert und per Push erinnert.",
    gearAddButton: "Aufgabe hinzufügen",
    gearAddAria: "Neue Pflege-Aufgabe hinzufügen",
    gearDialogTitle: "Pflege-Aufgabe hinzufügen",
    gearDialogDescription:
      "Übernimm einen Vorschlag oder erfasse eine eigene Aufgabe mit Intervall.",
    gearSuggestionsLabel: "Vorschläge",
    gearSuggestionAria: (title: string) => `Vorschlag «${title}» übernehmen`,
    gearTitleLabel: "Aufgabe",
    gearTitlePlaceholder: "z. B. Zelt imprägnieren",
    gearIntervalLabel: "Intervall (Monate)",
    gearIntervalText: (n: number) =>
      n === 1 ? "jeden Monat" : `alle ${n} Monate`,
    gearSubmit: "Hinzufügen",
    gearCreated: "Pflege-Aufgabe hinzugefügt",
    gearTitleRequired: "Bitte einen Aufgaben-Titel eingeben",
    gearEmpty:
      "Noch keine Pflege-Aufgaben – übernimm einen Vorschlag oder lege eine eigene an.",
    gearDueBadge: "Fällig",
    gearSoonBadge: "Bald fällig",
    gearDueOn: (date: string) => `Fällig am ${date}`,
    gearLastDone: (date: string) => `zuletzt erledigt am ${date}`,
    gearNeverDone: "noch nie erledigt",
    gearDoneButton: "Erledigt",
    gearDoneAria: (title: string) => `«${title}» als erledigt markieren`,
    gearMarkedDone: "Als erledigt markiert",
    gearRemoveAria: (title: string) => `Pflege-Aufgabe «${title}» löschen`,
    gearRemoveConfirm: (title: string) =>
      `Pflege-Aufgabe «${title}» wirklich löschen?`,
    gearRemoved: "Pflege-Aufgabe gelöscht",
  },
  fireBans: {
    title: "Feuerverbote nach Kanton",
    sectionAria: "Waldbrand-Gefahrenstufen aller Kantone",
    intro:
      "Amtliche Gefahrenstufe am Hauptort jedes Kantons, höchste zuerst. Ein Kanton kann mehrere Warnregionen umfassen – im Gebirge gilt oft eine andere Stufe als im Tal.",
    loading: "Stufen werden geladen …",
    loadFailed:
      "Die Gefahrenstufen sind gerade nicht abrufbar. Ohne Netz oder wenn der Dienst des Bundes klemmt, bleibt die Liste leer.",
    retry: "Nochmals versuchen",
    unknown: "keine Angabe",
    banLikely: "Verbot wahrscheinlich",
    disclaimer:
      "Die Stufe ist eine Einschätzung des Bundes. Das Feuerverbot verfügt der Kanton oder die Gemeinde – vor dem Anzünden dort nachsehen.",
    portalLink: "Offizielle Übersicht der Kantone",
  },
  weather: {
    mosquitoTitle: "Stechmücken heute Abend",
    mosquitoAria: "Stechmücken-Index für den Abend",
    mosquitoBarAria: (score: number) => `Stechmücken-Index ${score} von 100`,
    mosquitoLimiting: {
      kalt: "Zu kühl für rege Mückenflüge.",
      trocken: "Trockene Luft hält sie unten.",
      wind: "Der Wind hält sie weg – der beste Mückenschutz überhaupt.",
    },
    mosquitoHint:
      "Geschätzt aus Wärme, Feuchte, Wind und dem Regen der letzten Tage. Ein Weiher neben dem Zelt schlägt jede Formel.",
    cloudLexiconHint:
      "Der Himmel weiss oft mehr als die Prognose: Wolkenart nachschlagen und sehen, was folgt.",
    heatSunscreen: (minutes: number, burn: number) =>
      `Eincremen, alle ${minutes} Min. nachlegen (ungeschützt rot nach ~${burn} Min.)`,
    heatDrink: (liters: string) => `Rund ${liters} l Wasser pro Erwachsener`,
    title: "Camp-Wetter",
    subtitle:
      "Hyperlokale Vorhersage und Unwetterwarnungen für deinen Zeltplatz.",
    locationGroupAria: "Ort für die Wettervorhersage wählen",
    myLocation: "Mein Standort",
    loadingAria: "Wetterdaten werden geladen",
    retry: "Erneut versuchen",
    offlineHint:
      "Hinweis: Das Wetter-Modul braucht eine Internetverbindung und deinen Standort. Die Offline-Module (Erste Hilfe, Knoten, Natur) funktionieren weiterhin ohne Netz.",
    serviceError: (status: number) =>
      `Wetterdienst antwortet nicht (${status})`,
    loadFailed: "Wetterdaten konnten nicht geladen werden.",
    geoUnsupported: "Dein Gerät unterstützt keine Standortbestimmung.",
    geoDenied:
      "Standort nicht verfügbar. Bitte Standortfreigabe im Browser erlauben.",
    elevation: (m: number) => `${m} m ü. M.`,
    feelsLike: (deg: number) => `Gefühlt ${deg}°`,
    refreshAria: "Wetter aktualisieren",
    alertsAria: "Unwetterwarnungen",
    noAlerts:
      "Keine Unwetterwarnungen für die nächsten 48 Stunden – gute Bedingungen fürs Camp.",
    severity: {
      gefahr: "Gefahr",
      warnung: "Warnung",
      info: "Info",
    },
    fireAria: "Waldbrandgefahr",
    fireTitle: (title: string) => `Waldbrandgefahr: ${title}`,
    fireLevelBadge: (level: number) => `Stufe ${level}/5`,
    fireValidFrom: (date: string) => `gültig seit ${date}`,
    fireSourcePrefix:
      "Quelle: BAFU-Warnkarte. Rechtlich verbindlich sind die kantonalen Verfügungen – Details auf ",
    uvAria: "UV-Index",
    uvTitle: "UV-Index",
    uvTodayMax: (uv: number) => `Heutiges Maximum: UV ${uv}`,
    pollenTitle: "Pollenflug",
    pollenAria: "Pollenflug",
    pollenListAria: "Pollenbelastung nach Art",
    pollenLoadingAria: "Pollendaten werden geladen",
    pollenUnavailable:
      "Pollendaten sind zurzeit nicht verfügbar – die Wettervorhersage ist davon nicht betroffen.",
    pollenNoData: "Für diesen Ort liegen keine Pollendaten vor.",
    pollenSource:
      "Quelle: Open-Meteo Air Quality (CAMS Europa) – aktuelle Belastung der laufenden Stunde.",
    pollenProfileTitle: "Deine Pollenarten",
    pollenProfileIntro:
      "Wähle, welche Arten dich betreffen – sie werden hervorgehoben und zuerst gezeigt.",
    pollenOnlyMine: "Nur meine Arten zeigen",
    pollenMineSr: "(deine Art)",
    next24: "Nächste 24 Stunden",
    rain48: "Regen: nächste 48 Stunden",
    chartRain: "Regen",
    chartProb: "Wahrscheinlichkeit",
    chartTooltipHour: (label: string) => `${label} Uhr`,
    chartLegend:
      "Balken = Regenmenge (mm/h, linke Achse) · Linie = Regenwahrscheinlichkeit (%, rechte Achse).",
    forecast7: "7-Tage-Vorhersage",
    week2Title: "Woche 2",
    week2Hint: "Ausblick – geringere Zuverlässigkeit",
    week2Aria: "Ausblick auf Woche 2",
    dayToggleAria: (day: string) =>
      `Stundenverlauf für ${day} ein- oder ausblenden`,
    chartTemp: "Temperatur",
    hourlyLegend:
      "Linie = Temperatur (°C, linke Achse) · Balken = Regenmenge (mm/h, rechte Achse).",
    windRowAria: "Wind im Tagesverlauf",
    windRowLegend:
      "Pfeil = Windrichtung (zeigt, wohin der Wind weht) · Zahl = Böenspitze in km/h.",
    windSrHour: (time: string, dir: string, gusts: number) =>
      `${time}: Wind aus ${dir}, Böen bis ${gusts} km/h`,
    windSrHourNoDir: (time: string, gusts: number) =>
      `${time}: Böen bis ${gusts} km/h`,
    dayWindPeak: (n: number) => `Wind-Spitze: Böen bis ${n} km/h`,
    dayFeelsLike: (deg: number) => `gefühlt bis ${deg}°`,
    dayHoursEmpty: "Keine Stundendaten für diesen Tag verfügbar.",
    dataSource:
      "Datenquelle: Open-Meteo (beste verfügbare Auflösung für deinen Standort, in der Schweiz MeteoSchweiz ICON-CH). Warnungen werden aus der Vorhersage berechnet und ersetzen keine offiziellen Warnungen von MeteoSchweiz.",
    compareButton: "Mit anderem Ort vergleichen",
    compareTitle: "Orte vergleichen",
    compareAria: "Wetter-Vergleich zweier Orte",
    compareCloseAria: "Vergleich schliessen",
    compareSearchLabel: "Zweiten Ort suchen",
    compareSearchPlaceholder: "z. B. Bellinzona oder Fiesch",
    compareSearchButton: "Suchen",
    compareSearchingAria: "Ortssuche läuft",
    compareSearchFailed:
      "Ortssuche fehlgeschlagen – bitte später erneut versuchen.",
    compareNoResults: "Kein Ort gefunden – prüfe die Schreibweise.",
    compareResultsAria: "Gefundene Orte",
    compareSpotsLabel: "Oder einen gespeicherten Zeltplatz wählen:",
    compareChange: "Ort ändern",
    compareLoadingAria: "Vergleichs-Prognose wird geladen",
    compareLoadFailed:
      "Prognose für den Vergleichsort konnte nicht geladen werden.",
    compareCaption: (a: string, b: string) => `7-Tage-Vergleich: ${a} und ${b}`,
    compareDayHeader: "Tag",
    compareSrRain: "Regen",
    compareSrWind: "Windböen",
    radarTitle: "Regenradar",
    radarAria: "Regenradar",
    radarIntro:
      "Niederschlag der letzten Stunde und Kurzfrist-Prognose (Nowcast) rund um den gewählten Ort – als Animation.",
    radarLoadingAria: "Regenradar wird geladen",
    radarFailed: "Regenradar konnte nicht geladen werden.",
    radarMapAria: "Regenradar-Karte",
    radarPlayAria: "Radar-Animation abspielen",
    radarPauseAria: "Radar-Animation anhalten",
    radarTimestamp: (time: string) => `Radarbild von ${time}`,
    radarForecastBadge: "Prognose",
    radarSource:
      "Radardaten: RainViewer · Karte: OpenStreetMap. Nowcast-Frames sind eine kurzfristige Hochrechnung.",
    rainSoonAria: "Regen-Kurzfrist-Hinweis",
    pressureAria: "Luftdruck-Trend",
    pressureFalling: (hPa: string) =>
      `Der Luftdruck fällt (−${hPa} hPa in 3 Stunden) – ein Wetterumschwung ist wahrscheinlich.`,
    pressureFallingStrong: (hPa: string) =>
      `Der Luftdruck fällt stark (−${hPa} hPa in 3 Stunden) – rechne mit einem deutlichen Wetterumschwung und sichere dein Camp.`,
    rainStartsAt: (time: string) => `Regen beginnt ca. ${time}`,
    rainEndsAt: (time: string) => `Regen hört ca. ${time} auf`,
    placeAddButton: "Ort hinzufügen",
    placeSearchLabel: "Ort suchen und als Wetter-Favorit speichern",
    placeSearchPlaceholder: "z. B. Locarno oder Scuol",
    placeSearchCloseAria: "Ortssuche schliessen",
    placeResultsHint: "Ein Klick speichert den Ort und zeigt sein Wetter.",
    placeRemoveAria: (name: string) => `${name} aus den Wetter-Orten entfernen`,
    placeLimitHint: (max: number) =>
      `Maximal ${max} gespeicherte Orte – entferne zuerst einen.`,
    placesTitle: "Deine Plätze",
    placesAria: "Warnungs-Übersicht deiner Plätze",
    placesIntro:
      "Prüft die Unwetterwarnungen der nächsten 48 Stunden für deine gespeicherten Zeltplätze und deinen Heim-Standort.",
    placesLoadingAria: "Warnungen deiner Plätze werden geprüft",
    placesNoAlert: "Keine Warnung",
    placesCheckFailed: "Prüfung fehlgeschlagen",
    placesEmpty:
      "Noch keine Plätze gespeichert – lege Zeltplatz-Favoriten an oder setze deinen Heim-Standort im Profil.",
    placesSelectAria: (name: string) =>
      `Wetter für ${name} in der Hauptansicht anzeigen`,
  },
  water: {
    title: "Trinkwasser-Rechner",
    subtitle:
      "Wie viel Wasser musst du mitnehmen, wenn es am Zeltplatz keinen Frischwasseranschluss gibt?",
    liters: (n: number) => `${n} Liter`,
    recommendedNote: "empfohlene Gesamtmenge inkl. 20 % Sicherheitsreserve",
    canisterNote: (n: number) => `Das entspricht etwa ${n} × 10-Liter-Kanister`,
    adults: "Erwachsene",
    children: "Kinder",
    dogs: "Hunde",
    daysWithoutWater: "Tage ohne Wasseranschluss",
    decreaseAria: (label: string) => `${label} verringern`,
    increaseAria: (label: string) => `${label} erhöhen`,
    tempLabel: "Erwartete Tageshöchsttemperatur",
    tempSliderAria: "Erwartete Tageshöchsttemperatur in Grad Celsius",
    tempAuto: (days: number, temp: number) =>
      `Automatisch übernommen: Höchstwert der nächsten ${days} Tage an deinem Standort (${temp} °C).`,
    tempReapply: (temp: number) => `Prognose wieder übernehmen (${temp} °C)`,
    tempHint:
      "Ab 20 °C rechnen wir pro 5 °C einen Zuschlag von 0.5 l pro Person und Tag.",
    activityTitle: "Aktivitätslevel",
    activityGroupAria: "Aktivitätslevel wählen",
    activityCalm: "Ruhig",
    activityCalmHint: "Camp & Baden",
    activityNormal: "Normal",
    activityNormalHint: "Spaziergänge",
    activityActive: "Aktiv",
    activityActiveHint: "Wandern & Sport",
    cookingTitle: "Kochen & Abwasch einrechnen",
    cookingHint: "+1.5 l pro Person und Tag",
    cookingAria: "Wasser für Kochen und Abwasch einrechnen",
    comfortTitle: "Komfortable Körperpflege",
    comfortHint: "Katzenwäsche oder Solar-Dusche: +4 l pro Person und Tag",
    comfortAria: "Wasser für komfortable Körperpflege einrechnen",
    breakdownTitle: "Aufschlüsselung",
    rowAdults: (perDay: string, n: number, days: number) =>
      `Trinken Erwachsene (${perDay} l/Tag × ${n} × ${days} Tage)`,
    rowChildren: (perDay: string, n: number, days: number) =>
      `Trinken Kinder (${perDay} l/Tag × ${n} × ${days} Tage)`,
    rowDogs: (perDay: string, n: number, days: number) =>
      `Hunde (${perDay} l/Tag × ${n} × ${days} Tage)`,
    rowCooking: "Kochen & Abwasch",
    rowComfort: "Körperpflege komfortabel",
    rowReserve: "Sicherheitsreserve (20 %)",
    rowTotal: "Total empfohlen",
    footnote:
      "Hinweis: Werte sind Richtwerte für gemässigtes Klima. Bei Hitzewellen, Höhenlagen oder körperlicher Arbeit grosszügiger planen. Hunde-Richtwert gilt für mittelgrosse Hunde (ca. 20 kg). Wasser aus Bächen nur gefiltert oder abgekocht verwenden.",
  },
  sunCompass: {
    title: "Sonnenstand-Kompass",
    subtitle:
      "Wo steht die Sonne wann? Perfekt für die Wahl des Stellplatzes und die Ausrichtung der Solarpanels.",
    kinds: {
      baum: "Baum / Wald",
      berg: "Berg / Hügel",
      gebaeude: "Gebäude",
    },
    diagramAria: (dir: string, alt: number) =>
      `Sonnenstand-Diagramm: Sonne aktuell im ${dir} bei ${alt} Grad Höhe`,
    horizonLabel: "Horizont (0°)",
    ring30: "30° hoch",
    ring60: "60° hoch",
    cardinalN: "N",
    cardinalE: "O",
    cardinalS: "S",
    cardinalW: "W",
    risePoint: "Aufgang",
    setPoint: "Untergang",
    hourMark: (h: number) => `${h} Uhr`,
    youAreHere: "Du bist hier",
    inShadow: "im Schatten",
    sunBelowHorizon: "Sonne unter dem Horizont",
    spotBanner: "Sonnenstand für gespeicherten Zeltplatz",
    useOwnLocation: "Eigenen Standort nutzen",
    locating: "Standort wird ermittelt …",
    retry: "Erneut versuchen",
    geoUnsupported: "Dieses Gerät unterstützt keine Standortermittlung.",
    geoDenied:
      "Standortzugriff verweigert. Bitte in den Browser-Einstellungen erlauben.",
    geoFailed: "Standort konnte nicht ermittelt werden.",
    atTime: (time: string) => `Um ${time} Uhr`,
    sunIsIn: "steht die Sonne im",
    aboveHorizon: "über dem Horizont",
    summaryBlocked:
      " – aber ein eingetragenes Hindernis verdeckt sie: dein Platz liegt im Schatten.",
    summaryHigh: " – fast senkrecht, kaum Schatten.",
    summaryMid: " – Bäume und Zelte werfen mittellange Schatten.",
    summaryLow:
      " – tiefer Stand, lange Schatten: Hindernisse verschatten jetzt viel.",
    belowHorizonNext: "ist die Sonne unter dem Horizont. Nächster Aufgang:",
    clock: (time: string) => `${time} Uhr`,
    inTheEast: "im Osten.",
    viewFromAbove:
      "Blick von oben auf deinen Platz: Aussenring = Horizont, Mitte = senkrecht über dir.",
    placeModeHint: (kind: string) =>
      `Tippe jetzt auf die Stelle im Diagramm, wo das Hindernis (${kind}) steht – Richtung und Höhe werden automatisch übernommen.`,
    liveCompassOn: "Live-Kompass ein",
    liveCompassOff: "Live-Kompass aus",
    compassDenied:
      "Zugriff auf den Bewegungssensor wurde abgelehnt – erlaube ihn in den Browser-Einstellungen, um den Live-Kompass zu nutzen.",
    compassUnsupported:
      "Dieses Gerät hat keinen Richtungssensor – der Live-Kompass funktioniert nur auf Smartphones und Tablets.",
    compassWaiting:
      "Warte auf Sensordaten … bewege das Gerät leicht in einer Acht, um den Kompass zu kalibrieren.",
    legendSunNow: "Sonne jetzt",
    legendPathFuture: "Bahn (kommt noch)",
    legendPathPast: "Bahn (vorbei)",
    legendYourLocation: "Dein Standort",
    legendObstacle: "Hindernis",
    dateLabel: "Datum",
    dateAria: "Datum für die Sonnenstand-Anzeige wählen",
    planningView: "Planungs-Ansicht",
    sliderLabel: "Zieh den Regler, um in die Zukunft zu schauen",
    nowButton: "Jetzt",
    nowAria: "Datum und Regler auf jetzt stellen",
    timeAria: "Uhrzeit für die Sonnenstand-Anzeige wählen",
    sunriseTitle: "Sonnenaufgang",
    sunsetTitle: "Sonnenuntergang",
    belowHorizonShort: "unter Horizont",
    sunHeightAt: (time: string) => `Sonnenhöhe um ${time}`,
    directionAt: (time: string) => `Richtung um ${time}`,
    obstaclesTitle: "Hindernisse am Horizont",
    obstaclesIntro:
      "Trage Bäume, Berge oder Gebäude rund um deinen Platz ein. Der Kompass zeigt sie im Diagramm und berechnet, wann sie die Sonne verdecken – wichtig für Zelt und Solarpanels.",
    profileGroupAria: "Hindernis-Profil wählen",
    profileGeneral: "Allgemein",
    obstacleLine: (
      label: string,
      dir: string,
      az: number,
      h: number,
      w: number
    ) => `${label} im ${dir} (${az}°) · ${h}° hoch · ${w}° breit`,
    removeObstacleAria: (label: string) => `${label} entfernen`,
    kindLabel: "Art",
    azimuthLabel: "Richtung (°)",
    azimuthPlaceholder: "180 = Süden",
    heightLabel: "Höhe (°)",
    widthLabel: "Breite (°)",
    placeByTapActive: "Tipp-Modus aktiv …",
    placeByTap: "Per Tipp im Diagramm setzen",
    addNumeric: "Mit Zahlen eintragen",
    fistTip:
      "Tipp zur Höhe: Strecke den Arm aus – eine Faust entspricht etwa 10°. Ein Baum, der zweieinhalb Fäuste über dem Horizont endet, hat also rund 25°.",
    shadowTitle: "Schattenzeiten heute",
    shadowNone:
      "Deine Hindernisse verdecken die Sonne heute nie – freie Sicht den ganzen Tag.",
    shadowRange: (from: string, to: string) => `${from}–${to} Uhr`,
    shadowSuffix: "– Sonne hinter Hindernis, Platz im Schatten",
    locationLine: "Standort:",
    refreshLocationAria: "Standort aktualisieren",
    tipsTitle: "Tipps für den Stellplatz",
    morningShadeTitle: "Morgens Schatten:",
    morningShadeText: (sunrise: string) =>
      `Stelle das Zelt so, dass im Osten (Sonnenaufgang um ${sunrise}) Bäume oder ein Hang stehen – so bleibt es im Zelt länger kühl.`,
    solarTitle: "Solarpanels:",
    solarText1: (alt: number) =>
      `Richte die Panels nach Süden aus. Um die Mittagszeit steht die Sonne mit ${alt}° am höchsten – der`,
    solarLink: "Energie-Budget-Rechner",
    solarText2: "hilft bei der Ertragsplanung.",
    photoLightTitle: "Fotolicht",
    photoLightIntro:
      "Goldene Stunde (weiches, warmes Licht) und blaue Stunde (tiefblauer Himmel) am gewählten Datum an diesem Ort.",
    photoLightMorning: "Morgens",
    photoLightEvening: "Abends",
    goldenHour: "Goldene Stunde",
    blueHour: "Blaue Stunde",
    photoLightRange: (from: string, to: string) => `${from}–${to} Uhr`,
  },
  level: {
    title: "Wasserwaage",
    subtitle:
      "Wohnwagen, Kocher oder Tisch ausrichten – Handy flach auflegen, Display nach oben.",
    unsupported:
      "Dieses Gerät hat keinen Lagesensor. Öffne die Wasserwaage auf deinem Smartphone – sie funktioniert komplett offline.",
    needsSensor:
      "Für die Wasserwaage braucht die App Zugriff auf den Lagesensor.",
    activateSensor: "Sensor aktivieren",
    bubbleAria: (pitch: string, roll: string) =>
      `Neigung: vor/zurück ${pitch}, links/rechts ${roll}`,
    waitingSensor: "Warte auf Sensordaten",
    pitchLabel: "Vor / zurück",
    rollLabel: "Links / rechts",
    levelNow: "In Waage – perfekter Stand!",
    zeroHere: "Hier nullen",
    resetCalibration: "Kalibrierung zurücksetzen",
    profileLabel: "Fahrzeug-Profil",
    profileNames: {
      tent: "Zelt",
      bus: "Bus",
      caravan: "Wohnwagen",
    },
    profileTolerance: (deg: string) => `Toleranz ±${deg}°`,
    manageVehicles: "Fahrzeuge & Zuladung",
    soundLabel: "Signalton",
    soundHint:
      "Kurzer Ton und Vibration, sobald es im Lot ist – erst wieder, wenn du die Waage zwischendurch verlässt.",
    calibrationHint:
      "«Hier nullen» gleicht eine schiefe Handy-Hülle oder Tischplatte aus: Lege das Handy auf eine Fläche, von der du weisst, dass sie eben ist, und nulle dort. Für den Wohnwagen: Handy auf den Boden oder eine Arbeitsfläche im Innern legen und die tiefe Seite mit Keilen unterlegen, bis die Blase in der Mitte ist.",
  },
  payload: {
    title: "Zuladungs-Rechner",
    subtitle:
      "Ist dein Gespann überladen? Grenzwerte, Ladung und Ampel auf einen Blick.",
    disclaimer:
      "Orientierungshilfe ohne Gewähr: Verbindlich sind der Fahrzeugausweis und die Waage. Wieg dein beladenes Gespann vor der Abfahrt auf einer öffentlichen Brückenwaage – diese Rechnung ersetzt das nicht.",
    rigTitle: "Gespann",
    towLabel: "Zugfahrzeug",
    trailerLabel: "Anhänger",
    noneOption: "Kein Fahrzeug gewählt",
    noTrailerOption: "Ohne Anhänger",
    showVehicles: "Fahrzeuge bearbeiten",
    hideVehicles: "Fahrzeuge zuklappen",
    vehiclesHint: "Dieselben Profile nutzt die Wasserwaage.",
    limitsHint:
      "Alle Werte stehen im Fahrzeugausweis. Lass leer, was du nicht kennst – dann bleibt die Ampel grau statt grün.",
    nameLabel: "Name",
    kindLabel: "Art",
    roleLabel: "Rolle",
    roleNames: {
      tow: "Zugfahrzeug",
      trailer: "Anhänger",
      none: "Unterkunft",
    },
    emptyKgLabel: "Leergewicht (kg)",
    grossKgLabel: "Zul. Gesamtgewicht (kg)",
    towKgLabel: "Zul. Anhängelast (kg)",
    noseKgLabel: "Zul. Stützlast (kg)",
    axleKgLabel: "Zul. Achslast (kg)",
    addVehicle: "Fahrzeug hinzufügen",
    newVehicleName: "Neues Fahrzeug",
    deleteVehicleAria: (name: string) => `${name} löschen`,
    deleteVehicleConfirm: (name: string) =>
      `«${name}» wirklich löschen? Die Wasserwaage verliert das Profil ebenfalls.`,
    loadTitle: "Ladung",
    personsLabel: "Personen",
    personKgLabel: "kg pro Person",
    personsHint: (kg: string) => `${kg} im Zugfahrzeug`,
    personsDecreaseAria: "Eine Person weniger",
    personsIncreaseAria: "Eine Person mehr",
    packListLabel: "Packliste als Ladung",
    packListNone: "Keine Packliste",
    packListWeight: (kg: string) => `${kg} aus dem Inventar-Abgleich`,
    packListMissing: (n: number) =>
      `${n} Einträge ohne Gewicht im Inventar – die fehlen in der Summe`,
    packListLoggedOut:
      "Melde dich an, um eine Packliste samt Gewicht als Ladung zu übernehmen.",
    positionLabel: "Position",
    positionNames: {
      tow: "Zugfahrzeug",
      trailer: "Anhänger",
    },
    itemsTitle: "Freie Posten",
    itemsHint:
      "Für alles, was nicht auf der Packliste steht: Wasser im Tank, Gasflasche, Velos, Vorzelt.",
    itemLabelPlaceholder: "Was?",
    itemKgPlaceholder: "kg",
    addItem: "Hinzufügen",
    removeItemAria: (label: string) => `${label} entfernen`,
    noseMeasuredLabel: "Gemessene Stützlast (kg)",
    noseMeasuredHint: "Leer lassen: Wir rechnen mit 5 % des Anhängergewichts.",
    resultTitle: "Ergebnis",
    noVehicleHint:
      "Wähl ein Zugfahrzeug oder einen Anhänger – dann rechnen wir.",
    checkNames: {
      towGross: "Gesamtgewicht Zugfahrzeug",
      trailerGross: "Gesamtgewicht Anhänger",
      towCapacity: "Anhängelast",
      noseWeight: "Stützlast",
      towAxle: "Achslast Zugfahrzeug",
      trailerAxle: "Achslast Anhänger",
    },
    statusNames: {
      ok: "im grünen Bereich",
      tight: "knapp",
      over: "überladen",
      unknown: "unklar",
    },
    verdict: {
      ok: "Alles im grünen Bereich – gute Fahrt!",
      tight:
        "Knapp: Mindestens ein Grenzwert ist fast erreicht. Wieg das Gespann vor der Fahrt.",
      over: "Überladen: Mindestens ein Grenzwert ist überschritten. So darfst du nicht losfahren.",
      unknown:
        "Noch kein Urteil: Es fehlen Angaben. Trag die Werte aus dem Fahrzeugausweis nach.",
    },
    checkLine: (actual: string, limit: string, rest: string) =>
      `${actual} von ${limit} · ${rest}`,
    freeLeft: (kg: string) => `${kg} frei`,
    overBy: (kg: string) => `${kg} zu viel`,
    missingLimit: "Grenzwert nicht erfasst – trag ihn beim Fahrzeug nach.",
    missingValue: "Leergewicht fehlt – ohne das lässt sich nichts rechnen.",
    notComputable:
      "Ohne Waage nicht berechenbar: Wie sich das Gewicht auf die Achsen verteilt, hängt an Radstand und Ladeort.",
    estimatedNote: "mit geschätzter Stützlast",
    totalsLine: (tow: string, trailer: string, train: string) =>
      `Zugfahrzeug ${tow} · Anhänger ${trailer} · Gespann ${train}`,
    noseRule: (min: string, max: string, rec: string) =>
      `Faustregel Stützlast: 4–7 % des tatsächlichen Anhängergewichts, hier also ${min} bis ${max}. Nutz die zulässige Stützlast möglichst aus (bis ${rec}) – zu wenig Druck auf der Deichsel bringt das Gespann ins Schlingern.`,
    levelHint: "Steht das Fahrzeug schon eben? Dieselben Profile führen die",
    levelLink: "Wasserwaage",
  },
  roadRules: {
    title: "Maut, Vignette & Regeln",
    subtitle:
      "Kurzinfo fürs Zielland: Maut, Tempo mit Anhänger, Pflichtausrüstung, Notruf.",
    disclaimer:
      "Regeln, Preise und Grenzwerte ändern sich – diese Übersicht ist eine Orientierung, keine Rechtsauskunft. Prüf vor der Fahrt die Angaben deines Automobilclubs oder der Behörden im Zielland.",
    countryLabel: "Land wählen",
    tollTitle: "Vignette & Maut",
    trailerTitle: "Anhänger",
    speedTitle: "Tempo mit Anhänger",
    roadNames: {
      motorway: "Autobahn",
      rural: "Landstrasse",
      urban: "Innerorts",
    },
    bacTitle: "Promillegrenze",
    permille: (value: string) => `${value} ‰`,
    equipmentTitle: "Pflicht an Bord",
    zonesTitle: "Umweltzonen",
    emergencyTitle: "Notruf",
    callAria: (number: string) => `Notruf ${number} anrufen`,
    campingTitle: "Übernachten & Campen",
    updatedLine: (country: string, date: string) =>
      `${country}: Stand ${date}. Angaben in km/h; ohne Gewähr.`,
  },
  sos: {
    title: "SOS & Notfall-Dashboard",
    subtitle:
      "Dein Standort und alle wichtigen Notfallnummern – für den Fall der Fälle.",
    geoUnsupported: "Dieses Gerät unterstützt keine Standortermittlung.",
    geoDenied:
      "Standortzugriff verweigert. Bitte in den Browser-Einstellungen erlauben.",
    geoFailed:
      "Standort konnte nicht ermittelt werden. Bitte erneut versuchen.",
    coordsCopied: "Koordinaten kopiert",
    copyFailed: "Kopieren nicht möglich",
    locationTitle: "Dein Standort",
    refresh: "Aktualisieren",
    refreshAria: "Standort aktualisieren",
    locating: "Standort wird ermittelt …",
    decimalLabel: "Dezimalgrad (WGS84) – für Rettungsdienste",
    copyDecimalAria: "Koordinaten in Dezimalgrad kopieren",
    dmsLabel: "Grad / Minuten / Sekunden",
    lv95Label: "Schweizer Koordinaten (LV95)",
    outsideSwitzerland: "Ausserhalb der Schweiz",
    accuracy: (m: number) => `Genauigkeit: ±${m} m`,
    altitude: (m: number) => ` · Höhe: ${m} m ü. M.`,
    asOf: (time: string) => ` · Stand: ${time}`,
    numbersTitle: "Notfallnummern",
    callAria: (label: string) => `${label} anrufen`,
    regaTitle: "Rega-Alarmierung mit Standortübermittlung",
    regaText:
      "Die offizielle Rega-App übermittelt beim Alarmieren automatisch deine Position an die Einsatzzentrale – das beschleunigt die Rettung in den Bergen erheblich. Wir empfehlen, sie zusätzlich zu installieren. Alternativ kannst du beim Anruf auf 1414 die oben angezeigten Koordinaten durchgeben.",
    regaLinkAria: "Offizielle Rega-App-Seite öffnen (externer Link)",
    regaLink: "Zur offiziellen Rega-App",
    guideTitle: "So setzt du den Notruf richtig ab",
  },
  energy: {
    title: "Energie-Budget-Rechner",
    subtitleLoggedOut:
      "Wie lange reicht deine Powerstation? Verbraucher erfassen und Autarkie berechnen.",
    loginFeature: "deine Energie-Verbraucher",
    subtitle:
      "Verbraucher, Solarertrag und Akkukapazität kombiniert: So lange kannst du autark stehen.",
    saveFailed: "Verbraucher konnte nicht gespeichert werden",
    sourceSpot: (name: string) => `Zeltplatz «${name}»`,
    sourceLocation: "deinem Standort",
    rangeSelfSufficient: "Unbegrenzt – Solar deckt den Verbrauch",
    rangeOverMax: (d: number) => `> ${d} Tage`,
    rangeDays: (d: number) => `${d} Tage`,
    rangeHours: (h: number) => `${h} h`,
    rangeUnknown: "–",
    rangeLabel: "Reichweite",
    consumptionPerDay: "Verbrauch / Tag",
    solarPerDay: "Solarertrag / Tag",
    balancePerDay: "Bilanz / Tag",
    availableLabel: "Nutzbar jetzt",
    storageTitle: "Dein Speicher",
    storageIntro:
      "Powerstation oder Bordbatterie: Kapazität, Bauart und Ladestand bestimmen, wie lange dein Strom reicht.",
    chemistryLabel: "Bauart",
    chemistryNames: {
      lifepo4: "LiFePO₄",
      liion: "Li-Ion / Powerstation",
      agm: "AGM",
      gel: "Gel",
      lead: "Blei (Nass)",
    },
    modeLabel: "Kapazität erfassen",
    modeWh: "in Wh",
    modeAh: "in Ah + Volt",
    capacityWhLabel: "Kapazität (Wh)",
    capacityWhHint: "Steht meist auf der Powerstation, z. B. 1024 Wh.",
    capacityAhLabel: "Kapazität (Ah)",
    voltageLabel: "Nennspannung (V)",
    voltageHint:
      "Bordbatterien sind meist 12 V, grössere Anlagen 24 V oder 48 V.",
    voltageMissing:
      "Ohne Spannung sind Ah keine Energie – trag die Nennspannung ein, dann rechnen wir Wh daraus.",
    usableLabel: "Nutzbarer Anteil",
    usableDefaultHint: (p: number) =>
      `Vorgabe für diese Bauart: ${p} %. Blei gibt man nur zur Hälfte her, LiFePO₄ fast ganz – tiefer entladen kostet Lebensdauer.`,
    usableReset: "Vorgabe der Bauart",
    usableAria: "Nutzbarer Anteil des Speichers in Prozent",
    chargeLabel: "Ladestand jetzt",
    chargeAria: "Aktueller Ladestand in Prozent",
    capacitySummary: (nominal: string, usable: string, reserve: string) =>
      `${nominal} nominal · ${usable} nutzbar · ${reserve} bleiben als Tiefentlade-Reserve stehen.`,
    capacityUnknown:
      "Noch keine Kapazität erfasst – ohne sie gibt es keine Reichweite.",
    deepDischargeTitle: "Tiefentladung droht",
    deepDischargeText:
      "Der nutzbare Vorrat ist noch heute aufgebraucht. Schalte Verbraucher ab, lade nach – oder nimm die tiefere Entladung bewusst in Kauf und weisst, dass sie Lebensdauer kostet.",
    missingStorageHint:
      "Trag oben deinen Speicher ein, dann rechnen wir dir die Reichweite aus.",
    missingConsumersHint:
      "Trag unten deine Verbraucher ein, dann rechnen wir dir die Reichweite aus.",
    consumerShare: (p: number) => `${p} % des Tagesverbrauchs`,
    templatesHint:
      "Die Vorlagen sind Anhaltspunkte aus der Praxis – bei Kompressorgeräten ist die Laufzeit gemeint, nicht die Standzeit. Was auf dem Typenschild steht, gilt vor der Vorlage.",
    solarLabel: "Solarpanels (W gesamt)",
    solarHint: "z. B. 2 × 200-W-Panels = 400",
    mountLabel: "Aufstellung",
    mountRoof: "Fest auf dem Dach",
    mountPortable: "Mobil aufgestellt",
    mountRoofHint:
      "Flach montiert: Wir rechnen mit der Einstrahlung auf die waagrechte Fläche.",
    mountPortableHint:
      "Frei aufgestellt und in die Sonne gedreht: Wir holen die Einstrahlung gleich für die Neigung und Ausrichtung, die weiter unten empfohlen werden.",
    forecastTitle: "Ertragsprognose",
    forecastSubtitle: (d: number) =>
      `Erwarteter Ertrag deiner Anlage für die nächsten ${d} Tage.`,
    forecastTilted:
      "Grundlage ist die Einstrahlung auf dein aufgestelltes Panel.",
    forecastHorizontal:
      "Grundlage ist die Einstrahlung auf die waagrechte Fläche.",
    noPanelHint:
      "Trag oben die Nennleistung deiner Panels ein, dann rechnen wir den Ertrag aus.",
    dayYield: (wh: string, kwh: number) => `${wh} · ${kwh} kWh/m²`,
    dayBattery: (p: number) => `${p} % Speicher`,
    balanceTotals: (y: string, c: string, d: number) =>
      `Über ${d} Tage: ${y} Ertrag gegen ${c} Verbrauch.`,
    wastedHint: (wh: string) =>
      `${wh} davon passen nicht mehr in den vollen Speicher.`,
    balanceCovered: (d: number) =>
      `Die Sonne trägt dich durch alle ${d} Tage – der Speicher bleibt über der Entladegrenze.`,
    balanceEmpty: (date: string, d: number) =>
      `Am ${date} ist der nutzbare Vorrat aufgebraucht – die Sonne reicht für ${d} Tage.`,
    balanceNoStorage:
      "Ohne erfasste Kapazität zeigen wir nur Ertrag und Verbrauch, nicht den Speicherstand.",
    efficiencyIntro: (p: number) =>
      `Gerechnet mit ${p} % Systemwirkungsgrad – so setzt er sich zusammen:`,
    lossNames: {
      controller: "Laderegler",
      cable: "Kabel & Stecker",
      temperature: "Temperatur",
      soiling: "Verschmutzung & Alterung",
    },
    yieldSourceForecast: "Solarertrag aus der Einstrahlungs-Prognose.",
    yieldSourceSunHours: "Solarertrag aus deinen effektiven Sonnenstunden.",
    sunHoursLabel: "Effektive Sonnenstunden pro Tag",
    sunAutoLabel: "Automatisch aus Wetter-Prognose übernehmen",
    sunAutoAria: "Sonnenstunden automatisch aus der Wetter-Prognose übernehmen",
    sunSliderAria: "Effektive Sonnenstunden pro Tag",
    manualModeHint:
      "Manueller Modus: Dein Wert bleibt bestehen und wird nicht von der Prognose überschrieben.",
    forecastLoading: "Prognose wird geladen …",
    forecastRefresh: "Prognose aktualisieren",
    forecastApply: "Sonnenstunden aus Wetterprognose übernehmen",
    forecastOk: (avg: number, days: number, source: string) =>
      `Übernommen: Ø ${avg} h Sonnenschein pro Tag (Prognose für die nächsten ${days} Tage – Quelle: ${source}).`,
    forecastError:
      "Automatische Prognose nicht verfügbar – erlaube den Standortzugriff, speichere einen Zeltplatz-Favoriten oder setze den Wert manuell.",
    guidelinePrefix:
      "Richtwerte Schweiz: Sommer sonnig 5–6 h, wechselhaft 3–4 h, bedeckt 1–2 h. Verschattung durch Bäume oder Berge reduziert den Wert deutlich – prüfe den Sonnenverlauf im ",
    sunCompassLink: "Sonnenstand-Kompass",
    guidelineSuffix:
      ". Im Auto-Modus rechnet der Ertrag mit der Einstrahlungs-Prognose, dein Sonnenstunden-Wert bleibt als Anhaltspunkt.",
    alignmentTitle: "Optimale Panel-Ausrichtung heute",
    alignmentDirection: "Ausrichtung",
    alignmentTilt: "Neigung",
    alignmentVsFlat: "vs. flach gelegt",
    directSun: (from: string, to: string, h: number) =>
      `Direkte Sonne heute von ${from} bis ${to} (${h} h).`,
    directSunNoTimes: (h: number) => `Direkte Sonne heute (${h} h).`,
    shadedPrefix: (h: number) =>
      `${h} h sind durch dein Hindernis-Profil aus dem `,
    shadedLink: "Sonnen-Kompass",
    shadedSuffix: " verschattet – die Empfehlung rechnet das bereits ein.",
    obstacleTipPrefix: "Tipp: Erfasse Bäume oder Berge im ",
    obstacleTipSuffix:
      ", dann berücksichtigt die Empfehlung auch die Verschattung.",
    consumersTitle: "Deine Verbraucher",
    formError: "Bitte Name, Watt und Stunden angeben",
    consumerPlaceholder: "Verbraucher",
    consumerNameAria: "Name des Verbrauchers",
    wattsPlaceholder: "Watt",
    wattsAria: "Leistung in Watt",
    hoursPlaceholder: "h/Tag",
    hoursAria: "Betriebsstunden pro Tag",
    addAria: "Verbraucher hinzufügen",
    presetAddAria: (name: string) => `Vorschlag ${name} hinzufügen`,
    consumerLine: (w: number, h: number, wh: number) =>
      `${w} W · ${h} h/Tag = ${wh} Wh`,
    enableAria: (name: string) => `${name} aktivieren`,
    disableAria: (name: string) => `${name} deaktivieren`,
    deleteAria: (name: string) => `${name} löschen`,
    empty:
      "Noch keine Verbraucher erfasst – nutze die Vorschläge oben oder trage eigene Geräte ein.",
    presets: {
      fridge: "Kühlschrank",
      coolbox: "Kompressor-Kühlbox",
      laptop: "Laptop",
      drone: "Drohnen-Akku laden",
      phone: "Smartphone laden",
      led: "LED-Beleuchtung",
      camera: "Kamera-Akkus",
      pump: "Wasserpumpe",
      heater: "Heizungsgebläse",
      fan: "Ventilator",
      tv: "Fernseher",
      router: "WLAN-Router",
    },
  },
  drying: {
    title: "Trockenzeiten",
    subtitle:
      "Wird die Wäsche an der Leine bis Sonnenuntergang trocken? Berechnet aus Temperatur, Luftfeuchtigkeit und Wind.",
    myLocation: "Mein Standort",
    conditionsTitle: "Aktuelle Bedingungen",
    tempLabel: "Temp. (°C)",
    humidityLabel: "Feuchte (%)",
    windLabel: "Wind (km/h)",
    loadingWeather: "Wetter wird geladen …",
    loadWeather: "Aktuelles Wetter vom Standort übernehmen",
    weatherOk: (time: string) =>
      `Wetter übernommen – Sonnenuntergang heute um ${time} Uhr.`,
    forecastNote:
      "Die Schätzung rechnet mit dem stündlichen Prognose-Verlauf (genauer als eine Momentaufnahme).",
    weatherError:
      "Wetter konnte nicht geladen werden – trage die Werte von Hand ein (Sonnenuntergangs-Empfehlung braucht die Standortfreigabe).",
    lineTitle: "Was hängt an der Leine?",
    reminderTitle: "Wäsche-Erinnerung",
    reminderText:
      "Erhalte eine Warnung, bevor Regen einsetzt oder die Sonne untergeht – damit du die Wäsche rechtzeitig reinholen kannst. Die Erinnerung funktioniert, solange die App geöffnet ist (auch im Hintergrund-Tab).",
    leadLabel: "Vorlaufzeit:",
    leadGroupAria: "Vorlaufzeit wählen",
    minutesShort: (n: number) => `${n} Min.`,
    reminderStop: "Erinnerung stoppen",
    reminderStart: "Erinnerung aktivieren",
    reminderActive: (info: string) => `Aktiv: ${info}`,
    rainWarnTitle: "Regen im Anzug!",
    rainWarnBody: (min: number) =>
      `In ca. ${min} Minuten beginnt es zu regnen – hol die Wäsche rein.`,
    sunsetWarnTitle: "Sonne geht bald unter",
    sunsetWarnBody: (min: number) =>
      `Noch ca. ${min} Minuten bis Sonnenuntergang – Wäsche vor dem Abendtau reinholen.`,
    scheduledRain: (time: string) => `Regen-Warnung um ${time} Uhr`,
    scheduledSunset: (time: string) =>
      `Sonnenuntergangs-Erinnerung um ${time} Uhr`,
    noReminderTitle: "Keine Erinnerung nötig",
    noReminderBody:
      "Weder Regen noch Sonnenuntergang stehen in nächster Zeit bevor.",
    over24: "> 24 Std.",
    removeAria: (label: string) => `${label} entfernen`,
    dryAtPrefix: "Voraussichtlich trocken um ",
    dryAtSuffix: " Uhr",
    tomorrowSuffix: " (morgen)",
    rainFromPrefix: "Achtung: Ab ",
    rainFromSuffix: " Uhr",
    rainAnnounced: " ist Regen angesagt",
    rainProbability: (p: number) => ` (${p} %)`,
    rainAction: " – vorher abnehmen oder unters Vordach hängen!",
    ownMaterialTitle: "Eigenes Material hinzufügen",
    labelLabel: "Bezeichnung",
    labelPlaceholder: "z. B. Wollpullover",
    baseHoursLabel: "Basis (Std.)",
    addButton: "Hinzufügen",
    ownMaterialNote: "Eigenes Material",
    ownMaterialHint:
      "Basis-Trockenzeit = wie lange das Teil bei mildem Sommerwetter (20 °C, 60 % Feuchte, leichter Wind) zum Trocknen braucht. Deine Materialien bleiben auf diesem Gerät gespeichert.",
    footnote:
      "Schätzwerte für gut ausgewrungene, frei hängende Sachen. Direkte Sonne beschleunigt das Trocknen zusätzlich, Schatten und Windstille verlangsamen es. Bei Regen gilt: alles unters Vordach.",
  },
  quiet: {
    title: "Camp-Quiet-Timer",
    subtitle:
      "Behalte die Lautstärke im Blick, wenn auf dem Campingplatz Nachtruhe gilt – dezent und komplett offline.",
    micError:
      "Mikrofon-Zugriff nicht möglich. Erlaube den Zugriff in den Browser-Einstellungen – die Messung bleibt komplett auf deinem Gerät.",
    quietActive: (from: string, to: string) =>
      `Nachtruhe aktiv (${from}–${to} Uhr) – der Timer erinnert dich, wenn es zu laut wird.`,
    quietInactive: (from: string) =>
      `Aktuell keine Nachtruhe. Sie beginnt um ${from} Uhr.`,
    shhTitle: "Psst – Nachtruhe!",
    shhBody:
      "Die Gespräche sind gerade lauter als dein eingestellter Richtwert. Die Zelt-Nachbarn danken für etwas leisere Töne.",
    vibrateNote:
      "Auf Android-Geräten vibriert das Handy zusätzlich (iPhones unterstützen Web-Vibration leider nicht).",
    levelTitle: "Lautstärke-Pegel",
    currentLabel: "Aktuell:",
    thresholdLabel: "Schwelle:",
    peakLabel: "Spitze:",
    stopMeasuring: "Messung stoppen",
    startMeasuring: "Messung starten",
    privacyNote:
      "Der Ton wird nur live analysiert – nichts wird aufgenommen, gespeichert oder gesendet. Der Bildschirm muss dafür an bleiben.",
    protocolTitle: "Nacht-Protokoll",
    clearAria: "Protokoll löschen",
    clear: "Löschen",
    tooltipValue: (v: number) => `Pegel ${v}`,
    tooltipName: "Maximum",
    tooltipLabel: (label: string) => `${label} Uhr`,
    protocolNote: (n: number) =>
      `Höchster Pegel pro Minute (${n} Min. aufgezeichnet, max. 8 h). Die gestrichelte Linie ist deine Erinnerungs-Schwelle. Das Protokoll bleibt bis zum Verlassen der Seite erhalten – ideal für den Rückblick am Morgen.`,
    settingsTitle: "Nachtruhe-Einstellungen",
    fromLabel: "Nachtruhe ab",
    toLabel: "Nachtruhe bis",
    thresholdSetting: "Erinnerungs-Schwelle",
    thresholdAria: "Erinnerungs-Schwelle für die Lautstärke",
    tip: "Tipp: Starte die Messung bei normaler Gesprächslautstärke und stelle die Schwelle knapp darüber ein. Übliche Nachtruhe auf Schweizer Campingplätzen: 22:00–07:00 Uhr.",
  },
  lawn: {
    title: "Rasenschoner",
    subtitle:
      "Wie lange darf das Zelt auf dem Rasen stehen, bevor das Gras Schaden nimmt?",
    setupTitle: "Dein Setup",
    loadingWeather: "Wetter wird geladen …",
    loadWeather: "Temperatur & Feuchte vom Wetter übernehmen",
    weatherNoteSoil: (temp: number, soil: string, moisture: string) =>
      `Tagesmaximum ${temp} °C, Bodenfeuchte ${soil} % → Boden ${moisture}`,
    weatherNoteRain: (temp: number, rain: string, moisture: string) =>
      `Tagesmaximum ${temp} °C, Niederschlag letzte 2 Tage ${rain} mm → Boden ${moisture} (abgeleitet)`,
    moistureWet: "nass",
    moistureNormal: "normal",
    moistureDry: "trocken",
    fromForecast: (note: string) =>
      `Aus Prognose übernommen: ${note}. Manuell anpassbar.`,
    weatherError:
      "Wetter nicht verfügbar – stelle Temperatur und Feuchte von Hand ein.",
    floorLabel: "Zeltboden",
    floorMesh: "Mesh / ohne Boden",
    floorMeshHint: "Licht und Luft kommen durch",
    floorStandard: "Standard-Zeltboden",
    floorStandardHint: "übliche Bodenwanne",
    floorFootprint: "Boden + Footprint",
    floorFootprintHint: "dichtet vollständig ab",
    grassLabel: "Rasen-Zustand",
    grassRobust: "Robust",
    grassRobustHint: "Sport-/Campingwiese",
    grassNormal: "Normal",
    grassNormalHint: "gewöhnliche Wiese",
    grassDelicate: "Empfindlich",
    grassDelicateHint: "Zierrasen, frisch gesät",
    sunLabel: "Sonneneinstrahlung am Stellplatz",
    sunShade: "Schattig",
    sunPartial: "Halbschatten",
    sunFull: "Pralle Sonne",
    moistureLabel: "Bodenfeuchte",
    moistureOptDry: "Trocken",
    moistureOptNormal: "Normal",
    moistureOptWet: "Nass",
    tempLabel: "Tagestemperatur",
    tempAria: "Tagestemperatur in Grad Celsius",
    plannedLabel: "Geplante Standzeit",
    plannedAria: "Geplante Standzeit in Tagen",
    days: (n: number) => `${n} Tag${n > 1 ? "e" : ""}`,
    verdictSafe:
      "Unbedenklich – der Rasen erholt sich innert weniger Tage von selbst.",
    verdictCaution:
      "Vorsicht – das Gras wird vergilben. Es erholt sich meist in 1–2 Wochen, plane das Umstellen ein.",
    verdictDamage:
      "Bleibende Schäden wahrscheinlich – bei dieser Standzeit stirbt das Gras darunter ab. Stelle das Zelt zwingend um.",
    statYellowing: "bis erste Vergilbung",
    statDamage: "bis bleibende Schäden",
    statMove: "spätestens dann umstellen",
    tipsTitle: "Tipps zum Rasenschonen",
    tip1Title: "Zelt regelmässig umstellen:",
    tip1Text:
      "Schon ein Versetzen um eine Zeltbreite gibt dem Gras Licht und Luft zurück.",
    tip2Title: "Zelt tagsüber lüften:",
    tip2Text:
      "Boden anheben oder Apsiden öffnen, damit Hitze und Feuchtigkeit entweichen.",
    tip3Title: "Vergilbtes Gras:",
    tip3Text:
      "erholt sich meist in 1–2 Wochen von selbst – braunes, matschiges Gras braucht oft eine Nachsaat.",
    tip4Title: "Heisse Tage:",
    tip4Text:
      "Bei über 30 °C in praller Sonne leidet der Rasen unter dem Zeltboden schon nach einem Tag.",
  },
  spots: {
    title: "Zeltplatz-Favoriten",
    subtitle:
      "Speichere geplante Zeltplätze und rufe Wetter und Sonnenstand im Voraus ab.",
    loginFeature: "deine Zeltplatz-Favoriten",
    addSpot: "Zeltplatz hinzufügen",
    empty:
      "Noch keine Favoriten. Speichere deinen ersten geplanten Zeltplatz – per Koordinaten oder direkt mit deinem aktuellen Standort.",
    saved: "Zeltplatz gespeichert",
    deleteAria: (name: string) => `${name} löschen`,
    elevation: (value: string) => `${value} m ü. M.`,
    dossierLink: "Dossier →",
    sunLink: "Sonnenstand →",
    loadForecast: "Wetter-Vorschau laden",
    weatherFailed: "Wetter konnte nicht geladen werden.",
    retry: "Nochmals versuchen",
    gusts: (n: number) => `Böen ${n} km/h`,
    pushEnabled:
      "Unwetter-Warnungen aktiviert – du wirst bei Sturm oder Gewitter an deinen Plätzen benachrichtigt",
    pushDisabled: "Unwetter-Warnungen deaktiviert",
    pushTitle: "Unwetter-Warnungen für deine Plätze",
    pushDesc:
      "Push-Benachrichtigung bei Sturm, Gewitter oder Starkregen an einem deiner gespeicherten Zeltplätze. Zusätzlich erinnert dich CampMesser, wenn Lebensmittel in der Kühlbox bald ablaufen – und 3 Tage vor einem geplanten Aufenthalt inklusive Packlisten-Stand.",
    pushSaveFirst: "Speichere zuerst einen Zeltplatz.",
    pushProfileHint: "Feineinstellungen im Profil →",
    pushAria: "Unwetter-Warnungen für gespeicherte Zeltplätze aktivieren",
    geoUnsupported: "Dein Gerät unterstützt keine Standortbestimmung.",
    geoUnavailable: "Standort nicht verfügbar.",
    nameRequired: "Bitte einen Namen eingeben.",
    coordsInvalid:
      "Bitte gültige Koordinaten eingeben (z. B. 46.8182 und 8.2275).",
    dialogTitle: "Zeltplatz speichern",
    dialogDesc:
      "Tippe auf die Karte, übernimm deinen aktuellen Standort oder gib die Koordinaten von Hand ein.",
    nameLabel: "Name",
    namePlaceholder: "z. B. Camping Grindelwald",
    mapLabel: "Ort auf der Karte wählen",
    mapHide: "Karte ausblenden",
    mapShow: "Karte anzeigen",
    latLabel: "Breitengrad",
    lonLabel: "Längengrad",
    locating: "Standort wird ermittelt …",
    useLocation: "Aktuellen Standort übernehmen",
    noteLabel: "Notiz (optional)",
    notePlaceholder: "z. B. Platz am Bach, schattig am Morgen",
    attrFilterAria: "Nach Eigenschaften filtern",
    attrFilterShade: "Viel Schatten",
    attrFilterQuiet: "Ruhig",
    attrFilterWifi: "WLAN",
    attrFilterPower: "Strom am Platz",
    attrFilterDogs: "Hunde erlaubt",
    attrFilterKids: "Kinderfreundlich",
    attrFilterEmpty:
      "Kein gespeicherter Platz erfüllt alle gewählten Eigenschaften.",
    routeLink: "Route →",
    routeAria: (name: string) =>
      `Route zum Platz ${name} in der Karten-App öffnen`,
  },
  mapView: {
    title: "Karte",
    subtitle:
      "Alle gespeicherten Zeltplätze auf einen Blick – mit den Übernachtungen aus «Meine Reisen». Die Karte braucht eine Internetverbindung.",
    loginFeature: "deine Zeltplatz-Karte",
    mapAria: "Karte mit deinen gespeicherten Zeltplätzen",
    empty:
      "Noch keine Plätze auf der Karte. Speichere zuerst einen Zeltplatz-Favoriten, dann erscheint er hier als Pin.",
    emptyCta: "Zu den Zeltplatz-Favoriten",
    nightsHere: (n: number) =>
      n === 1
        ? "1 Übernachtung laut «Meine Reisen»"
        : `${n} Übernachtungen laut «Meine Reisen»`,
    toDossier: "Zum Dossier →",
    legend: (n: number) =>
      n === 1
        ? "1 gespeicherter Zeltplatz auf der Karte"
        : `${n} gespeicherte Zeltplätze auf der Karte`,
    targetKind: "Zelt-Finder-Ziel",
    aimTarget: "Anpeilen →",
    targetLegend: (n: number) =>
      n === 1
        ? "1 Zelt-Finder-Ziel auf der Karte"
        : `${n} Zelt-Finder-Ziele auf der Karte`,
    routeLink: "Route →",
    discoverToggle: "Campingplätze entdecken",
    locateButton: "Mein Standort",
    locateFailed: "Standort konnte nicht ermittelt werden.",
    measureButton: "Messen",
    measureHint: "Zwei Punkte auf der Karte antippen",
    discoverSearchHere: "In diesem Ausschnitt suchen",
    discoverLoading: "Campingplätze werden geladen …",
    discoverZoomHint: "Bitte näher zoomen, um Campingplätze zu suchen.",
    discoverError:
      "Campingplätze konnten nicht geladen werden – bitte später erneut versuchen.",
    discoverCount: (n: number) =>
      n === 0
        ? "Keine Campingplätze in diesem Ausschnitt gefunden."
        : n === 1
          ? "1 Campingplatz gefunden"
          : `${n} Campingplätze gefunden`,
    discoverLegend: (n: number) =>
      n === 1
        ? "1 entdeckter Campingplatz (OpenStreetMap)"
        : `${n} entdeckte Campingplätze (OpenStreetMap)`,
    osmFallbackName: "Campingplatz",
    osmWebsite: "Website →",
    osmSource: "© OpenStreetMap",
    adoptFavorite: "Als Favorit übernehmen",
    adopted: (name: string) => `«${name}» als Favorit gespeichert`,
    createTitle: "Favorit hier anlegen?",
    createDesc: (lat: string, lon: string) =>
      `Position ${lat}, ${lon} – gib dem neuen Platz einen Namen.`,
    createNameLabel: "Name",
    createNamePlaceholder: "z. B. Camping Seeblick",
    createNameRequired: "Bitte gib zuerst einen Namen ein.",
    createConfirm: "Favorit anlegen",
    createdToast: (name: string) => `«${name}» als Favorit angelegt`,
    createdToastAction: "Zum Dossier",
    sightingKind: "Natur-Beobachtung",
    sightingLegend: (n: number) =>
      n === 1
        ? "1 Natur-Beobachtung auf der Karte"
        : `${n} Natur-Beobachtungen auf der Karte`,
    layerGroupAria: "Kartendarstellung wählen",
    layerMap: "Karte",
    layerSatellite: "Satellit",
    clusterAria: (n: number) =>
      `Gruppe aus ${n} Pins – antippen zum Hineinzoomen`,
    layerFilterAria: "Pin-Ebenen ein- oder ausblenden",
    layerFavorites: "Favoriten",
    layerTargets: "Ziele",
    layerSightings: "Beobachtungen",
    layerCampsites: "Campingplätze (OSM)",
    layerExcursions: "Ausflüge",
    excursionLegend: (n: number) =>
      n === 1 ? "1 Ausflugsziel" : `${n} Ausflugsziele`,
    layerFirepits: "Feuerstellen",
    firepitLoading: "Feuerstellen werden gesucht …",
    firepitZoomHint: "Bitte näher zoomen, um Feuerstellen zu suchen.",
    firepitError:
      "Feuerstellen konnten nicht geladen werden – bitte später erneut versuchen.",
    firepitCount: (n: number) =>
      n === 0
        ? "Keine Feuerstellen in diesem Ausschnitt gefunden."
        : n === 1
          ? "1 Feuerstelle gefunden"
          : `${n} Feuerstellen gefunden`,
    firepitLegend: (n: number) =>
      n === 1
        ? "1 Feuer-/Grillstelle (OpenStreetMap)"
        : `${n} Feuer-/Grillstellen (OpenStreetMap)`,
    firepitSearchHint: "Tippe auf «In diesem Ausschnitt suchen».",
    layerFamily: "Familie",
    familyLoading: "Spiel- und Badeplätze werden gesucht …",
    familyZoomHint: "Bitte näher zoomen, um Spiel- und Badeplätze zu suchen.",
    familyError:
      "Spiel- und Badeplätze konnten nicht geladen werden – bitte später erneut versuchen.",
    familyCount: (n: number) =>
      n === 0
        ? "Keine Spiel- oder Badeplätze in diesem Ausschnitt gefunden."
        : n === 1
          ? "1 Spiel-/Badeplatz gefunden"
          : `${n} Spiel- und Badeplätze gefunden`,
    familyLegend: (n: number) =>
      n === 1
        ? "1 Spiel-/Badeplatz (OpenStreetMap)"
        : `${n} Spiel- und Badeplätze (OpenStreetMap)`,
    familySearchHint: "Tippe auf «In diesem Ausschnitt suchen».",
  },
  spotDetail: {
    fallbackTitle: "Zeltplatz",
    backLabel: "Zeltplätze",
    notFoundTitle: "Zeltplatz nicht gefunden",
    elevation: (value: string) => `${value} m ü. M.`,
    sunTitle: "Sonne heute an diesem Platz",
    sunrise: "Aufgang",
    noon: "Höchststand",
    sunset: "Untergang",
    sunCompassLink: "Sonnenbahn und Schatten im Kompass ansehen",
    weatherTitle: "Wetter-Vorschau",
    weatherFailed: "Wetter konnte nicht geladen werden (offline?).",
    moreAlerts: (n: number) => ` (+${n} weitere)`,
    noAlerts: "Keine Unwetterwarnungen in den nächsten 48 Stunden.",
    obstacleTitle: "Hindernis-Profil",
    obstaclesRecorded: (n: number) =>
      `${n} ${n === 1 ? "Hindernis" : "Hindernisse"} erfasst – Schattenzeiten und Panel-Ausrichtung berücksichtigen dieses Profil automatisch.`,
    obstacleEmpty:
      "Für diesen Platz ist noch kein Hindernis-Profil erfasst. Trage Bäume, Berge oder Gebäude im Sonnen-Kompass ein, um Schattenzeiten zu sehen.",
    obstacleEdit: "Profil im Sonnen-Kompass bearbeiten",
    obstacleCreate: "Profil im Sonnen-Kompass anlegen",
    staysTitle: "Deine Aufenthalte hier",
    nightsTotalLabel: (n: number) => `${n === 1 ? "Nacht" : "Nächte"} gesamt`,
    staysCountLabel: (n: number): string =>
      n === 1 ? "Aufenthalt" : "Aufenthalte",
    staysEmpty: "Noch kein Aufenthalt an diesem Platz in «Meine Reisen».",
    toDiary: "Zu «Meine Reisen»",
    shareTitle: "Platz teilen",
    shareDesc:
      "Wer den Link hat, sieht Name, Koordinaten, Wetter und Sonnenzeiten dieses Platzes – ohne Anmeldung und nur lesend. Deine Notizen, Hindernisse und Reise-Einträge bleiben privat.",
    stopShare: "Teilen beenden",
    stopShared: "Teilen beendet – der Link ist ungültig",
    shareLinkCopied: "Teil-Link kopiert",
    shareLinkCreated: "Teil-Link erstellt – kopiere ihn oben",
    shareFailed: "Teilen fehlgeschlagen",
    shareButton: "Platz per Link teilen",
    qrAlt: (name: string) => `QR-Code zum Teil-Link des Platzes ${name}`,
    qrTitle: "Direkt am Platz weitergeben",
    qrText:
      "Lass andere den Code mit der Handy-Kamera scannen – das Platz-Dossier öffnet sich sofort, ganz ohne Tippen oder Anmeldung.",
    climateTitle: "Beste Reisezeit",
    climateIntro:
      "Monatswerte aus fünf Jahren Wetterarchiv: durchschnittliche Höchst- und Tiefstwerte sowie Regentage pro Monat an diesem Platz.",
    climateLoadingAria: "Klimadaten werden geladen",
    climateFailed: "Klimadaten konnten nicht geladen werden.",
    climateRetry: "Erneut versuchen",
    climateBestTitle: "Beste Monate:",
    climateChartMax: "Ø Tagesmaximum",
    climateChartMin: "Ø Tagesminimum",
    climateChartRain: "Regentage",
    climateDaysUnit: "Tage",
    climateLegend:
      "Linien = durchschnittliches Tagesmaximum/-minimum (°C, linke Achse) · Balken = Regentage pro Monat (mehr als 1 mm, rechte Achse).",
    climateSource: (from: number, to: number) =>
      `Quelle: Open-Meteo Wetterarchiv, Jahre ${from}–${to}. Beste Monate = wärmste mit den wenigsten Regentagen.`,
    photosTitle: "Fotos",
    photosHint:
      "Merk dir den Platz mit Bildern – Stellplatz, Aussicht, Infotafel. Nur für dich sichtbar; die geteilte Dossier-Ansicht zeigt keine Fotos.",
    addPhotos: "Fotos hinzufügen",
    addPhotosAria: (name: string) => `Fotos zum Platz ${name} hinzufügen`,
    photoCountHint: (n: number, max: number) => `${n} von ${max} Fotos`,
    photoUploading: (n: number) =>
      n === 1 ? "1 Foto wird hochgeladen …" : `${n} Fotos werden hochgeladen …`,
    photoUploaded: (n: number) =>
      n === 1 ? "Foto gespeichert" : `${n} Fotos gespeichert`,
    photoLimitReached: (max: number) =>
      `Maximal ${max} Fotos pro Platz – überzählige wurden übersprungen`,
    photoTooLarge: (name: string) =>
      `${name}: Das Bild ist zu gross (max. 5 MB)`,
    photoUnsupportedType: (name: string) =>
      `${name}: Format nicht unterstützt – erlaubt sind JPEG, PNG und WebP`,
    photoHeic: (name: string) =>
      `${name}: HEIC/HEIF wird nicht unterstützt – bitte das Foto als JPEG exportieren`,
    photoReadFailed: (name: string) =>
      `${name}: Das Bild konnte nicht gelesen werden`,
    photoUploadFailed: (name: string) => `${name}: Upload fehlgeschlagen`,
    photosLoadFailed: "Fotos konnten nicht geladen werden",
    photoDeleteConfirm: "Dieses Foto endgültig löschen?",
    photoDeleted: "Foto gelöscht",
    photoDeleteAria: (n: number) => `Foto ${n} löschen`,
    photoAlt: (n: number, place: string) => `Foto ${n} vom Platz ${place}`,
    photoOpenAria: (n: number, place: string) =>
      `Foto ${n} von ${place} in Grossansicht öffnen`,
    galleryTitle: (place: string) => `Fotos – ${place}`,
    galleryCounter: (n: number, total: number) => `Foto ${n} von ${total}`,
    galleryPrev: "Vorheriges Foto",
    galleryNext: "Nächstes Foto",
    attributesTitle: "Eigenschaften",
    attributesEmpty:
      "Noch keine Eigenschaften erfasst – halte fest, was den Platz ausmacht: Schatten, Sanitär, Lärm und mehr.",
    attributesEditButton: "Eigenschaften bearbeiten",
    attributesDialogTitle: "Eigenschaften bearbeiten",
    attributesDialogDesc:
      "Wähle pro Eigenschaft den passenden Wert – lass offen, was du (noch) nicht weisst.",
    attributeUnset: "Keine Angabe",
    attributeGroupAria: (name: string) => `Wert für ${name} wählen`,
    attributesSaved: "Eigenschaften gespeichert",
    routeButton: "Route",
    routeAria: "Route zu diesem Platz in der Karten-App öffnen",
    contactTitle: "Kontakt & Check-in",
    contactEmpty:
      "Noch keine Kontaktdaten erfasst – halte die Telefonnummer der Rezeption, die Check-in-Zeiten und deine Parzellen-Nummer fest.",
    contactEditButton: "Kontaktdaten bearbeiten",
    contactDialogTitle: "Kontakt & Check-in bearbeiten",
    contactDialogDesc:
      "Alle Felder sind optional – leere Felder werden nicht angezeigt.",
    contactPhoneLabel: "Telefon Rezeption",
    contactPhonePlaceholder: "z. B. +41 33 123 45 67",
    contactPhoneAria: (name: string) => `Rezeption von ${name} anrufen`,
    contactCheckinLabel: "Check-in-Zeiten",
    contactCheckinPlaceholder: "z. B. Check-in 14–18 Uhr, Check-out bis 11 Uhr",
    contactParcelLabel: "Parzellen-Nummer",
    contactParcelPlaceholder: "z. B. B12",
    contactSaved: "Kontaktdaten gespeichert",
    costTitle: "Kosten pro Nacht",
    costEmpty:
      "Noch kein Preis erfasst – halte fest, was eine Nacht hier kostet, dann kannst du die Plätze in der Statistik vergleichen.",
    costEditButton: "Kosten bearbeiten",
    costPriceLabel: "Platz pro Nacht",
    costExtraLabel: "Kurtaxe & Nebenkosten",
    costNightlyLabel: "Total pro Nacht",
    costEstimate: (nights: number, amount: string) =>
      `Deine ${nights === 1 ? "1 Nacht" : `${nights} Nächte`} hier ergeben rund ${amount} – grobe Schätzung.`,
    costHint:
      "Nur eine Schätzung: Rabatte, Kinder, Hund und Saison-Zuschläge kennt CampMesser nicht. Was du wirklich bezahlt hast, steht in der Reisekasse der jeweiligen Reise.",
    costDialogTitle: "Kosten pro Nacht bearbeiten",
    costDialogDesc:
      "Beide Felder sind optional – leer lassen heisst «nicht erfasst».",
    costPriceInputLabel: "Platz pro Nacht (CHF)",
    costPricePlaceholder: "z. B. 42.00",
    costExtraInputLabel: "Kurtaxe & Nebenkosten pro Nacht (CHF)",
    costExtraPlaceholder: "z. B. 3.50",
    costExtraHelp:
      "Alles, was pro Nacht dazukommt: Kurtaxe, Strom, Duschmarken, Hund.",
    costSaved: "Kosten gespeichert",
    offlineMapTitle: "Offline-Karte",
    offlineMapDesc:
      "Lade die Karten-Kacheln rund um diesen Platz vorab herunter – dann finden sich Karte und Zelt-Finder auch ohne Empfang zurecht.",
    offlineMapRadiusLabel: "Umkreis",
    offlineMapRadiusGroupAria: "Umkreis für die Offline-Karte wählen",
    offlineMapRadiusOption: (km: number) => `${km} km`,
    offlineMapDetailLabel: "Detailgrad",
    offlineMapDetailGroupAria: "Detailgrad für die Offline-Karte wählen",
    offlineMapDetailOption: (zoom: number) => `bis Zoom ${zoom}`,
    offlineMapTileCount: (n: number) => (n === 1 ? "1 Kachel" : `${n} Kacheln`),
    offlineMapLayerNote: (layer: string) => `Ansicht: ${layer}`,
    offlineMapCapped: (max: number) =>
      `Obergrenze von ${max} Kacheln erreicht – geladen wird von der Mitte nach aussen.`,
    offlineMapDownload: "Herunterladen",
    offlineMapDownloadAria: (name: string) =>
      `Offline-Karte für ${name} herunterladen`,
    offlineMapCancel: "Abbrechen",
    offlineMapProgress: (done: number, total: number) =>
      `${done} von ${total} Kacheln`,
    offlineMapSaved: (tiles: number, size: string) =>
      `Gespeichert: ${tiles} Kacheln, ca. ${size} MB`,
    offlineMapSavedAt: (date: string) => `Geladen am ${date}`,
    offlineMapDelete: "Löschen",
    offlineMapDeleteAria: (name: string) => `Offline-Karte für ${name} löschen`,
    offlineMapDeleted: "Offline-Karte gelöscht",
    offlineMapDone: (n: number) =>
      `${n} Kacheln gespeichert – hier funktioniert die Karte jetzt auch offline.`,
    offlineMapNothing: "Es konnte keine Kachel geladen werden (offline?).",
    offlineMapCancelled:
      "Download abgebrochen – bereits geladene Kacheln bleiben gespeichert.",
    offlineMapUnsupported:
      "Dieser Browser kann keine Karten offline speichern.",
    offlineMapFairUse:
      "Die Kacheln kommen von OpenStreetMap und Esri und werden gratis bereitgestellt. Lade darum nur, was du wirklich brauchst – deshalb die Obergrenze pro Platz.",
  },
  tentFinder: {
    title: "Zelt-Finder",
    subtitle:
      "Kompass-Peilung und Distanz zurück zu deinem Zelt – auch nachts oder auf grossen Plätzen.",
    targetTitle: "Ziel",
    ownTargetsTitle: "Eigene Ziele",
    empty:
      "Noch keine Ziele gespeichert. Stell dich dorthin, wo du später zurückfinden willst – zum Beispiel direkt beim Zelt – gib dem Ort einen Namen und speichere deinen Standort.",
    addTitle: "Aktuellen Standort speichern unter …",
    nameAria: "Name des Ziels",
    namePlaceholder: "z. B. Zelt oder Duschen",
    suggestionsAria: "Namensvorschläge",
    suggestionTent: "Zelt",
    suggestionShowers: "Duschen",
    suggestionWc: "WC",
    suggestionDishes: "Abwaschstelle",
    suggestionPlayground: "Spielplatz",
    suggestionReception: "Rezeption",
    iconLabel: "Symbol",
    iconNames: {
      tent: "Zelt",
      shower: "Duschen",
      wc: "WC",
      water: "Wasser",
      playground: "Spielplatz",
      reception: "Rezeption",
      car: "Auto",
      waste: "Abfall",
      other: "Sonstiges",
    },
    saveButton: "Standort speichern",
    nameMissing: "Gib dem Ziel zuerst einen Namen",
    tooMany: "Zu viele Ziele – lösche zuerst eines",
    savedToast: (name: string) =>
      `«${name}» gespeichert – du findest jetzt hierher zurück`,
    deleteAria: (name: string) => `Ziel «${name}» löschen`,
    deleteConfirm: (name: string) => `Ziel «${name}» wirklich löschen?`,
    deletedToast: (name: string) => `«${name}» gelöscht`,
    renameAria: (name: string) => `Ziel «${name}» umbenennen`,
    renameInputAria: "Neuer Name des Ziels",
    renamedToast: (name: string) => `In «${name}» umbenannt`,
    remembering: "Standort wird ermittelt …",
    rememberFailed: "Standort konnte nicht ermittelt werden",
    noTarget:
      "Kein Ziel gewählt. Tippe oben auf ein Ziel – oder speichere deinen aktuellen Standort unter einem Namen.",
    geoUnsupported: "Dein Gerät unterstützt keine Standortbestimmung.",
    geoDenied:
      "Standortfreigabe verweigert – erlaube den Zugriff in den Browser-Einstellungen.",
    geoFailed: "Standort nicht verfügbar.",
    geoWaiting: "GPS-Position wird gesucht …",
    accuracyInfo: (m: number) => `GPS-Genauigkeit ±${m} m`,
    directionText: (dir: string, dist: string) =>
      `Das Ziel liegt im ${dir}, ${dist} entfernt.`,
    arrowAria: (dir: string, dist: string) =>
      `Richtungspfeil: Ziel im ${dir}, ${dist} entfernt`,
    arrived: "Du bist praktisch da – schau dich um!",
    compassActivate: "Kompass aktivieren",
    compassActivateHint:
      "Damit der Pfeil mitdrehen kann, braucht CampMesser Zugriff auf den Kompass deines Geräts.",
    movementHint:
      "Richtung aus deiner Bewegung übernommen – der Pfeil stimmt nur, solange du dich vorwärts bewegst.",
    noCompassHint:
      "Kein Kompass verfügbar: Der Pfeil kann nicht mitdrehen. Richte dich nach der Himmelsrichtung – oder geh ein paar Schritte, dann übernimmt CampMesser die Richtung aus deiner Bewegung.",
    mapTitle: "Mini-Karte",
    mapAria: "Karte mit deiner Position und deinen gespeicherten Zielen",
    mapHint:
      "Blauer Punkt: deine Position. Tippe auf einen Pin, um das Ziel anzupeilen.",
    mapNoTargets:
      "Blauer Punkt: deine Position. Gespeicherte Ziele erscheinen als Pins.",
    mapOffline:
      "Offline – die Karte kann keine Kacheln laden. Der Kompass funktioniert weiter.",
    mapLoadFailed: "Karte konnte nicht geladen werden.",
    mapRetry: "Erneut versuchen",
  },
  hike: {
    title: "Wanderung aufzeichnen",
    subtitle:
      "Zeichne Wanderungen und Spaziergänge vom Platz aus auf – mit Strecke, Dauer, Tempo und Höhenmetern. Der Track bleibt auf deinem Gerät, bis du ihn speicherst.",
    loginFeature: "gespeicherte Wanderungen",
    recorderTitle: "Aufzeichnung",
    recorderIntro:
      "Beim Start schaltet CampMesser das GPS auf hohe Genauigkeit. Ungenaue Messungen und Sprünge werden weggefiltert, damit Strecke und Höhenmeter stimmen. Die Aufzeichnung läuft weiter, wenn du zu einer anderen Seite wechselst.",
    start: "Aufzeichnung starten",
    pause: "Pause",
    resume: "Fortsetzen",
    stop: "Stoppen",
    discard: "Verwerfen",
    discardConfirm:
      "Aufzeichnung wirklich verwerfen? Die aufgezeichneten Punkte gehen verloren.",
    statusRecording: "Zeichnet auf",
    statusPaused: "Pausiert",
    startedAt: (time: string) => `Start ${time}`,
    pointCount: (n: number) => (n === 1 ? "1 Punkt" : `${n} Punkte`),
    statDistance: "Strecke",
    statDuration: "Dauer",
    statSpeed: "Ø Tempo",
    statElevation: "Höhenmeter",
    statAscent: "Aufstieg",
    statDescent: "Abstieg",
    waitingFix: "Warte auf ein genaues GPS-Signal …",
    accuracy: (m: number) => `Genauigkeit ±${m} m`,
    pausedHint:
      "Pausiert – die Pause zählt weder bei der Dauer noch bei der Strecke mit.",
    geoUnsupported: "Dieses Gerät liefert keine Standortdaten.",
    geoDenied:
      "Standortzugriff verweigert – erlaube ihn in den Einstellungen deines Browsers.",
    geoFailed: "Standort konnte nicht ermittelt werden.",
    keepAwakeLabel: "Display anlassen",
    tooFewPoints:
      "Zu wenige brauchbare Punkte – die Aufzeichnung wurde verworfen.",
    saveTitle: "Wanderung speichern",
    saveDesc: "Gib der Wanderung einen Namen und ordne sie einer Reise zu.",
    saveNeedsLogin:
      "Zum Speichern brauchst du ein Konto – der GPX-Export geht auch ohne.",
    nameLabel: "Name",
    namePlaceholder: "z. B. Runde um den See",
    nameRequired: "Bitte einen Namen eingeben",
    defaultName: (date: string) => `Wanderung vom ${date}`,
    saved: "Wanderung gespeichert",
    tripLabel: "Reise (optional)",
    tripNone: "Ohne Reise",
    tripFallback: "Reise",
    tripBadge: (name: string) => `Reise: ${name}`,
    listTitle: "Meine Wanderungen",
    listEmpty: "Noch keine Wanderung aufgezeichnet",
    listEmptyHint:
      "Starte oben die Aufzeichnung – nach dem Stoppen landet die Wanderung hier.",
    showMap: "Karte zeigen",
    hideMap: "Karte ausblenden",
    mapAria: "Karte der aufgezeichneten Wanderung",
    mapFailed: "Karte konnte nicht geladen werden.",
    mapEmpty: "Zu dieser Wanderung sind keine Punkte gespeichert.",
    gpxExport: "GPX herunterladen",
    gpxDone: "GPX-Datei erstellt",
    gpxFailed: "GPX-Export nicht möglich",
    gpxFallbackName: "Wanderung",
    gpxAria: (name: string) => `${name} als GPX herunterladen`,
    shareAria: (name: string) => `${name} per Link teilen`,
    shareTitle: "Wanderung teilen",
    shareDesc:
      "Wer den Link kennt, sieht Karte, Eckdaten und Höhenprofil dieser Wanderung – ohne Konto. Dein Name steht nicht dabei.",
    shareCopied: "Link kopiert.",
    shareFailed: "Der Link konnte nicht erstellt werden.",
    unshare: "Teilen beenden",
    unshared: "Der Link ist nicht mehr gültig.",
    unshareFailed: "Das Teilen konnte nicht beendet werden.",
    editTitle: "Wanderung bearbeiten",
    editDesc: "Name und Reise-Zuordnung ändern.",
    editAria: (name: string) => `${name} bearbeiten`,
    deleteAria: (name: string) => `${name} löschen`,
    deleteConfirm: "Diese Wanderung wirklich löschen?",
    deleted: "Wanderung gelöscht",
  },
  locationShare: {
    title: "Hier bin ich",
    desc: "Schick Mitreisenden einen Link mit deinem aktuellen Standort. Der Link läuft automatisch ab und lässt sich jederzeit deaktivieren.",
    loginHint: "Zum Teilen deines Standorts brauchst du ein CampMesser-Konto.",
    validityLabel: "Gültig",
    validityAria: "Gültigkeit des Standort-Links",
    validityHours: (h: number) => (h === 1 ? "1 Stunde" : `${h} Stunden`),
    createButton: "Standort teilen",
    locating: "Standort wird ermittelt …",
    created: "Standort-Link erstellt",
    createdCopied: "Standort-Link erstellt und kopiert",
    failed: "Standort-Link konnte nicht erstellt werden",
    refresh: "Standort aktualisieren",
    refreshed: "Standort aktualisiert",
    stop: "Link deaktivieren",
    stopConfirm:
      "Link wirklich deaktivieren? Wer ihn hat, sieht deinen Standort danach nicht mehr.",
    stopped: "Link deaktiviert",
    share: "Teilen",
    shareTitle: "Mein Standort",
    updatedAgo: (ago: string) => `Standort ${ago} aktualisiert`,
    accuracy: (m: number) => `Genauigkeit ±${m} m`,
    expiresAt: (date: string) => `Läuft ab am ${date}`,
    qrTitle: "QR-Code",
    qrText:
      "Direkt vom Bildschirm abscannen lassen – ohne den Link zu verschicken.",
    qrAlt: "QR-Code zum Standort-Link",
  },
  sharedLocation: {
    badge: "Geteilter Standort",
    title: "Standort",
    titleNamed: (name: string) => `Standort von ${name}`,
    capturedAgo: (ago: string) => `Aktualisiert ${ago}`,
    capturedAt: (time: string) => `gemessen um ${time}`,
    accuracy: (m: number) => `Genauigkeit ±${m} m`,
    coordsLabel: "Koordinaten",
    coordsCopied: "Koordinaten kopiert",
    copyAria: "Koordinaten kopieren",
    navigate: "Route dorthin",
    mapAria: "Karte mit dem geteilten Standort",
    mapFailed: "Karte konnte nicht geladen werden.",
    invalidHint:
      "Standort-Links laufen nach kurzer Zeit ab oder werden von Hand deaktiviert. Frag nach einem neuen Link.",
    expiresNote: (date: string) => `Dieser Link ist gültig bis ${date}.`,
    footer: "Geteilt mit CampMesser",
  },
  sharedSpot: {
    invalid: "Dieser Teil-Link ist abgelaufen oder nicht mehr gültig.",
    invalidHint:
      "Er ist abgelaufen oder die Besitzerin bzw. der Besitzer hat das Teilen beendet.",
    badge: "Geteilter Zeltplatz",
    sunTitle: "Sonne heute",
    sunrise: "Aufgang",
    noon: "Höchststand",
    sunset: "Untergang",
    weatherTitle: "Wetter-Vorschau",
    weatherFailed: "Wetter konnte nicht geladen werden.",
    moreAlerts: (n: number) => ` (+${n} weitere)`,
    noAlerts: "Keine Unwetterwarnungen in den nächsten 48 Stunden.",
    contactTitle: "Kontakt & Check-in",
    contactPhone: "Telefon Rezeption",
    contactCheckin: "Check-in",
    contactParcel: "Parzelle",
    footer:
      "Geteilt mit CampMesser – dem Schweizer Taschenmesser fürs Zelt-Camping.",
  },
  trips: {
    title: "Meine Reisen",
    subtitle:
      "Deine Camping-Aufenthalte festhalten: Orte, Nächte und Erinnerungen.",
    loginFeature: "deine Reisen",
    packProgress: (name: string, checked: number, total: number) =>
      `${name}: ${checked} von ${total} gepackt`,
    entrySaved: "Eintrag gespeichert",
    entrySaveFailed: "Eintrag konnte nicht gespeichert werden",
    editEntryTitle: "Reise bearbeiten",
    editEntryAria: (name: string) => `Eintrag ${name} bearbeiten`,
    saveChanges: "Änderungen speichern",
    entryUpdated: "Eintrag aktualisiert",
    entryUpdateFailed: "Eintrag konnte nicht aktualisiert werden",
    unknownPlace: "Unbekannter Ort",
    nightsInYear: (year: number) => `Nächte ${year}`,
    nightsTotal: "Nächte gesamt",
    staysLabel: "Aufenthalte",
    favoriteLabel: "Lieblingsplatz",
    yearReviewTitle: "Jahresrückblick",
    yearReviewYearAria: "Jahr für den Rückblick wählen",
    yearReviewPlaces: "Verschiedene Orte",
    yearReviewTopPlace: "Top-Platz",
    yearReviewLongest: "Längster Aufenthalt",
    yearReviewShare: "Als Bild teilen",
    yearReviewShareAria: (year: number) =>
      `Jahresrückblick ${year} als Bild teilen`,
    yearReviewImageSaved: "Bild heruntergeladen",
    yearReviewShareFailed: "Bild konnte nicht erstellt werden",

    // Foto-Collage pro Reise (#226)
    collageButton: "Foto-Collage",
    collageTitle: "Foto-Collage",
    collageDescription:
      "Wähle Fotos und Anordnung – CampMesser macht daraus ein Bild zum Teilen, mit Reisename und Zeitraum.",
    collageLayoutLabel: "Anordnung",
    collageLayoutNames: {
      grid2: "Raster 2×2",
      grid3: "Raster 3×3",
      hero: "Ein grosses Bild",
    },
    collageSelected: (used: number, capacity: number) =>
      `Fotos: ${used} von ${capacity} Plätzen belegt`,
    collageSelectAria: (name: string) => `Foto von ${name} für die Collage`,
    collageTooMany: (capacity: number) =>
      `In diese Anordnung passen ${capacity} Fotos – die übrigen bleiben weg.`,
    collageNone: "Wähle mindestens ein Foto aus.",
    collageShare: "Teilen",
    collageDownload: "Herunterladen",
    collageBusy: "Bild wird erstellt …",
    collageSaved: "Collage heruntergeladen",
    collageFailed: "Collage konnte nicht erstellt werden",
    newTripButton: "Neue Reise",
    tripFormDialogDesc:
      "Ort, Daten und Erinnerungen deines Aufenthalts festhalten.",
    choosePlaceError: "Bitte einen Zeltplatz wählen oder einen Ort eintragen",
    placeLabel: "Ort",
    freeLocationOption: "Ort frei eintragen …",
    locationNameLabel: "Ortsname",
    locationPlaceholder: "z. B. Camping Aareschlucht",
    packListLabel: "Packliste (optional)",
    noPackList: "Ohne Packliste",
    pitchSectionTitle: "Stellplatz-Details",
    pitchSectionHint:
      "Was nur für diesen Aufenthalt gilt – die Nummer wechselt beim nächsten Mal.",
    pitchNumberLabel: "Platznummer",
    pitchNumberPlaceholder: "z. B. B14",
    wifiNameLabel: "WLAN-Name",
    wifiNamePlaceholder: "z. B. Camping-Gast",
    wifiPasswordLabel: "WLAN-Passwort",
    wifiPasswordPlaceholder: "vom Empfang",
    wifiPasswordShow: "Passwort anzeigen",
    wifiPasswordHide: "Passwort verbergen",
    wifiPasswordCopy: "Passwort kopieren",
    pitchNotesLabel: "Notizen zum Platz",
    pitchNotesPlaceholder:
      "z. B. Stromkasten hinter der Hecke, Wasserhahn 20 Schritte rechts",
    arrivalTimeLabel: "Ankunftszeit (optional)",
    departureTimeLabel: "Abreisezeit (optional)",
    timesLine: (a: string | null, d: string | null) =>
      [a ? `Anreise ${a}` : null, d ? `Abreise ${d}` : null]
        .filter(Boolean)
        .join(" · "),
    yearCompareTitle: "Übernachtungen pro Jahr",
    arrivalLabel: "Anreise",
    departureLabel: "Abreise",
    titleLabel: "Titel (optional)",
    titlePlaceholder: "z. B. Familienferien am See",
    notesLabel: "Notizen (optional)",
    notesPlaceholder:
      "Schönster Stellplatz, bestes Rezept, was beim nächsten Mal anders …",
    submit: "Eintrag speichern",
    plannedTitle: "Geplante Aufenthalte",
    holidaySectionLabel: "Schulferien & Feiertage",
    holidayCantonAria: "Kanton für Ferien- und Feiertags-Hinweise wählen",
    holidayCantonNone: "Kein Kanton – keine Hinweise",
    holidaySchoolBadge: (name: string) => `Liegt in den Schulferien (${name})`,
    holidayPublicBadge: (date: string, name: string) =>
      `Feiertag am ${date}: ${name}`,
    holidaySource: "Ferien- und Feiertagsdaten: OpenHolidays API, ohne Gewähr.",
    countdown: (days: number) =>
      days === 0
        ? "Heute geht's los!"
        : days === 1
          ? "Morgen geht's los!"
          : `Noch ${days} Tage`,
    nightsCount: (n: number) => (n === 1 ? "1 Nacht" : `${n} Nächte`),
    menuPlanButton: "Menüplan",
    roadRulesButton: "Maut & Regeln",
    roadRulesAria: (name: string) =>
      `Maut und Regeln fürs Zielland von ${name}`,
    menuPlanAria: (name: string) => `Menüplan für ${name} öffnen`,
    deletePlannedAria: (name: string) => `Geplanten Aufenthalt ${name} löschen`,
    deleteEntryAria: (name: string) => `Eintrag ${name} löschen`,
    entriesTitle: "Deine Aufenthalte",
    empty:
      "Noch keine Einträge – halte mit «Neue Reise» deinen ersten Camping-Aufenthalt fest.",
    addPhotos: "Fotos hinzufügen",
    addPhotosAria: (name: string) => `Fotos zum Aufenthalt ${name} hinzufügen`,
    photoCountHint: (n: number, max: number) => `${n} von ${max} Fotos`,
    photoUploading: (n: number) =>
      n === 1 ? "1 Foto wird hochgeladen …" : `${n} Fotos werden hochgeladen …`,
    photoUploaded: (n: number) =>
      n === 1 ? "Foto gespeichert" : `${n} Fotos gespeichert`,
    photoLimitReached: (max: number) =>
      `Maximal ${max} Fotos pro Aufenthalt – überzählige wurden übersprungen`,
    photoTooLarge: (name: string) =>
      `${name}: Das Bild ist zu gross (max. 5 MB)`,
    photoUnsupportedType: (name: string) =>
      `${name}: Format nicht unterstützt – erlaubt sind JPEG, PNG und WebP`,
    photoHeic: (name: string) =>
      `${name}: HEIC/HEIF wird nicht unterstützt – bitte das Foto als JPEG exportieren`,
    photoReadFailed: (name: string) =>
      `${name}: Das Bild konnte nicht gelesen werden`,
    photoUploadFailed: (name: string) => `${name}: Upload fehlgeschlagen`,
    photosLoadFailed: "Fotos konnten nicht geladen werden",
    photoDeleteConfirm: "Dieses Foto endgültig löschen?",
    photoDeleted: "Foto gelöscht",
    photoDeleteAria: (n: number) => `Foto ${n} löschen`,
    photoAlt: (n: number, place: string) => `Foto ${n} vom Aufenthalt ${place}`,
    photoOpenAria: (n: number, place: string) =>
      `Foto ${n} von ${place} in Grossansicht öffnen`,
    galleryTitle: (place: string) => `Fotos – ${place}`,
    galleryCounter: (n: number, total: number) => `Foto ${n} von ${total}`,
    galleryPrev: "Vorheriges Foto",
    galleryNext: "Nächstes Foto",
    coverSetButton: "Als Titelbild",
    coverRemoveButton: "Titelbild entfernen",
    coverBadge: "Titelbild",
    coverSet: "Titelbild gesetzt",
    coverRemoved: "Titelbild entfernt",
    coverSaveFailed: "Titelbild konnte nicht gespeichert werden",
    coverAlt: (place: string) => `Titelbild des Aufenthalts ${place}`,
    ratingLabel: "Bewertung (optional)",
    ratingFormAria: "Bewertung in Sternen wählen",
    ratingGroupAria: (name: string) => `Bewertung für ${name}`,
    rateStarAria: (n: number) =>
      n === 1 ? "Mit 1 Stern bewerten" : `Mit ${n} Sternen bewerten`,
    removeRatingAria: "Bewertung entfernen",
    ratingSaveFailed: "Bewertung konnte nicht gespeichert werden",
    avgRatingLabel: "Ø Bewertung",
    bestRatedLabel: "Best bewerteter Platz",
    starsAvg: (value: string) => `Ø ${value} Sterne`,
    packSuggestionsTitle: "Packvorschläge fürs Wetter",
    packSuggestionsBadge: (n: number) =>
      n === 1 ? "1 Vorschlag" : `${n} Vorschläge`,
    packSuggestionsHint:
      "Basierend auf der Open-Meteo-Prognose für deinen Reisezeitraum – noch nicht auf deiner Liste:",
    packSuggestionsAdd: "Hinzufügen",
    packSuggestionsAddAria: (name: string) =>
      `${name} zur Packliste hinzufügen`,
    packSuggestionsAddAll: "Alle hinzufügen",
    packSuggestionsAdded: (name: string) => `«${name}» hinzugefügt`,
    packSuggestionsAddedAll: (n: number) => `${n} Einträge hinzugefügt`,
    packSuggestionsAddFailed: "Eintrag konnte nicht hinzugefügt werden",
    readinessTitle: "Bereitschaft",
    readinessToggleAria: (name: string) =>
      `Bereitschaft für ${name} ein-/ausklappen`,
    readinessLoading: "Wird geprüft …",
    readinessAllDone: "Alles bereit",
    readinessOpenCount: (n: number) =>
      n === 1 ? "1 Punkt offen" : `${n} Punkte offen`,
    readinessStatusOk: "erledigt",
    readinessStatusOpen: "offen",
    readinessOpenLink: "Öffnen",
    readinessOpenAria: (label: string) => `${label} öffnen`,
    readinessEditLink: "Ergänzen",
    readinessEditAria: (name: string) => `Angaben zu ${name} ergänzen`,
    readinessPackListLabel: "Packliste",
    readinessPackListDone: "Alles gepackt",
    readinessPackListOpen: (pct: number) => `erst zu ${pct} % gepackt`,
    readinessPackListMissing: "keine Liste verknüpft",
    readinessMenuLabel: "Menüplan",
    readinessMenuDone: "alle Hauptmahlzeiten geplant",
    readinessMenuOpen: (n: number) =>
      n === 1 ? "1 Mahlzeit ohne Plan" : `${n} Mahlzeiten ohne Plan`,
    readinessShoppingLabel: "Reise-Einkäufe",
    readinessShoppingDone: "nichts mehr offen",
    readinessShoppingOpen: (n: number) =>
      n === 1 ? "1 Eintrag offen" : `${n} Einträge offen`,
    readinessSpotLabel: "Zeltplatz",
    readinessSpotDone: "Platz verknüpft",
    readinessSpotMissing: "kein Platz verknüpft",
    readinessArrivalLabel: "Ankunftszeit",
    readinessArrivalDone: "erfasst",
    readinessArrivalMissing: "noch nicht erfasst",
    weatherTitle: "Wetter während des Aufenthalts",
    weatherSummary: (max: number, min: number) => `${max}° / ${min}°`,
    weatherRainDays: (n: number) => (n === 1 ? "1 Regentag" : `${n} Regentage`),
    weatherLuckTitle: "Wetter-Glück",
    weatherLuckDry: (pct: number) =>
      `${pct} % deiner Campingtage waren trocken`,
    weatherLuckAvgMax: (temp: number) => `Ø Tagesmaximum ${temp}°`,
    weatherLuckWarmest: (place: string, temp: number) =>
      `wärmster Ort: ${place} (${temp}°)`,
    weatherLuckHint: (n: number) =>
      n === 1
        ? "Aus dem Wetterarchiv von 1 Aufenthalt"
        : `Aus dem Wetterarchiv von ${n} Aufenthalten`,
    weatherLuckYear: (pct: number, temp: number) =>
      `Wetter-Glück: ${pct} % trockene Tage · Ø Tagesmaximum ${temp}°`,
    sharedBadge: "Gemeinsam",
    sharedWith: (name: string) => `Reise von ${name}`,
    membersButton: "Mitreisende",
    membersAria: (name: string) => `Mitreisende von ${name} verwalten`,
    membersDialogDesc:
      "Lade andere CampMesser-Konten ein – Mitreisende können die Reise ansehen und bearbeiten (löschen kannst nur du).",
    membersListTitle: "Mitreisende",
    membersOwnerBadge: "Besitzer*in",
    memberRemoveAria: (name: string) => `${name} von der Reise entfernen`,
    memberRemoveConfirm: (name: string) => `${name} von der Reise entfernen?`,
    memberRemoved: "Mitreisende*r entfernt",
    memberRemoveFailed: "Entfernen fehlgeschlagen",
    inviteSectionTitle: "Einladungs-Link",
    inviteHint:
      "Wer den Link öffnet und angemeldet ist, kann der Reise beitreten.",
    inviteCreate: "Einladungs-Link erzeugen",
    inviteCreateFailed: "Link konnte nicht erstellt werden",
    inviteQrAlt: (name: string) => `QR-Code des Einladungs-Links für ${name}`,
    inviteQrHint: "Zum Beitreten einfach scannen.",
    inviteRevoke: "Link widerrufen",
    inviteRevoked: "Einladungs-Link widerrufen",
    inviteRevokeFailed: "Widerrufen fehlgeschlagen",
    leaveTrip: "Reise verlassen",
    leaveTripAria: (name: string) => `Reise ${name} verlassen`,
    leaveConfirm: (name: string) => `Die Reise «${name}» wirklich verlassen?`,
    leftTrip: "Du hast die Reise verlassen",
    leaveFailed: "Verlassen fehlgeschlagen",
    hubShareAria: (name: string) => `Reise-Hub von ${name} teilen`,
    hubDialogTitle: "Reise-Hub teilen",
    hubDialogDesc:
      "Ein öffentlicher Link bündelt Reise-Infos, Platz, Menüplan und Packliste (nur lesend, ohne Fotos). Die Packliste lässt sich über den Link abhaken.",
    hubCreate: "Hub-Link erzeugen",
    hubCreateFailed: "Link konnte nicht erstellt werden",
    hubLinkCreated: "Hub-Link erstellt",
    hubStopShare: "Teilen beenden",
    hubStopped: "Teilen beendet – der Link ist nicht mehr gültig",
    hubStopFailed: "Beenden fehlgeschlagen",
    hubQrAlt: (name: string) => `QR-Code des Reise-Hub-Links für ${name}`,
    hubQrHint: "Zum Öffnen einfach scannen.",
    printEntryAria: (name: string) => `Reisebericht von ${name} drucken`,
    icsButton: "Kalender",
    icsAria: (name: string) =>
      `${name} als Kalender-Eintrag (.ics) herunterladen`,
    icsAllButton: "Alle in den Kalender",
    icsAllAria:
      "Alle kommenden Reisen als eine Kalender-Datei (.ics) herunterladen",
    icsDone: (n: number) =>
      n === 1
        ? "Kalender-Datei erstellt – öffne sie, um die Reise einzutragen"
        : `Kalender-Datei mit ${n} Reisen erstellt – öffne sie, um sie einzutragen`,
    icsFailed: "Kalender-Datei konnte nicht erstellt werden",
    milestonesTitle: "Meilensteine",
    milestonesAchievedOn: (date: string) => `erreicht am ${date}`,
    milestonesNextTitle: "Nächste Ziele",
    milestonesProgress: (current: number, target: number) =>
      `${current} von ${target}`,
    viewToggleAria: "Ansicht der Aufenthalte wählen",
    viewList: "Liste",
    viewCalendar: "Kalender",
    calPrevMonth: "Vorheriger Monat",
    calNextMonth: "Nächster Monat",
    calGridAria: (month: string) => `Kalender ${month}`,
    calTripAria: (name: string) => `Aufenthalt ${name} bearbeiten`,
    calDayTrips: (n: number) => (n === 1 ? "1 Aufenthalt" : `${n} Aufenthalte`),
    calSchoolHolidayTitle: (names: string) => `Schulferien: ${names}`,
    calPublicHolidayTitle: (names: string) => `Feiertag: ${names}`,
    calLegendOwn: "Eigene Reise",
    calLegendShared: "Gemeinsame Reise",
    calLegendSchool: "Schulferien",
    calLegendPublic: "Feiertag",
    duplicateAria: (name: string) => `Reise ${name} duplizieren`,
    duplicateDialogTitle: "Reise duplizieren",
    duplicateDialogDesc:
      "Ort, Zeltplatz, Packliste und Menüplan werden übernommen – Notizen, Bewertung, Fotos und Wetter nicht. Wähle die neuen Reisedaten.",
    duplicateSubmit: "Duplizieren",
    duplicated: "Reise dupliziert – sie steht bei den geplanten Aufenthalten",
    duplicateFailed: "Duplizieren fehlgeschlagen",
    journalTitle: "Reise-Tagebuch",
    journalToggleAria: (name: string) =>
      `Reise-Tagebuch von ${name} auf- oder zuklappen`,
    journalHint:
      "Halte pro Reisetag fest, was los war – nur du und deine Mitreisenden sehen es.",
    journalCount: (n: number) => (n === 1 ? "1 Eintrag" : `${n} Einträge`),
    journalEmptyDay: "Noch nichts festgehalten",
    journalPlaceholder: "Was war heute los?",
    journalEditAria: (day: string) => `Eintrag vom ${day} bearbeiten`,
    journalSave: "Speichern",
    journalSaved: "Tagebuch-Eintrag gespeichert",
    journalDeleted: "Tagebuch-Eintrag gelöscht",
    journalSaveFailed: "Tagebuch-Eintrag konnte nicht gespeichert werden",
    journalBy: (name: string) => `von ${name}`,
  },
  tripBoard: {
    title: "Pinnwand",
    toggleAria: (name: string) => `Pinnwand von ${name} auf- oder zuklappen`,
    hint: "Kurze Zurufe und Aufgaben für alle Mitreisenden – die Pinnwand frischt sich von selbst auf.",
    kindAria: "Art des Zettels wählen",
    textAria: "Text des Zettels",
    messagePlaceholder: "z. B. Treffen um 18 Uhr beim Spielplatz",
    taskPlaceholder: "z. B. Brot holen",
    addButton: "Anpinnen",
    added: "An die Pinnwand geheftet",
    addFailed: "Zettel konnte nicht angeheftet werden",
    textRequired: "Bitte zuerst etwas schreiben.",
    empty: "Noch nichts angepinnt – schreib den ersten Zuruf.",
    openTasks: (n: number) =>
      n === 1 ? "1 offene Aufgabe" : `${n} offene Aufgaben`,
    byLine: (name: string, ago: string) => `von ${name} · ${ago}`,
    doneLine: (name: string, ago: string) => `erledigt von ${name} · ${ago}`,
    doneAria: (text: string) => `Aufgabe «${text}» abhaken`,
    doneFailed: "Aufgabe konnte nicht abgehakt werden",
    unknownPerson: "jemandem",
    removeAria: (text: string) => `Zettel «${text}» entfernen`,
    removeConfirm: "Diesen Zettel wirklich entfernen?",
    removed: "Zettel entfernt",
    removeFailed: "Zettel konnte nicht entfernt werden",
  },
  tripExpenses: {
    fuelTitle: "Fahrtkosten berechnen",
    fuelHint:
      "Kilometer × Verbrauch × Spritpreis. Gerechnet wird mit dem Durchschnittsverbrauch – wer es genauer will, tippt den Betrag von Hand ein.",
    fuelKmLabel: "Strecke (km)",
    fuelConsumptionLabel: "Verbrauch (l/100 km)",
    fuelPriceLabel: "Preis (CHF/l)",
    fuelRoundTrip: "Hin- und Rückfahrt",
    fuelResult: (km: number, liters: string, amount: string) =>
      `${km} km · ${liters} l · ${amount}`,
    fuelApply: "In die Reisekasse übernehmen",
    fuelInvalid: "Bitte Strecke, Verbrauch und Preis eintragen.",
    fuelDescription: (km: number) => `Fahrt ${km} km`,
    csvButton: "Als CSV exportieren",
    csvAria: (trip: string) => `Reisekasse von ${trip} als CSV herunterladen`,
    csvHeaders: ["Datum", "Kategorie", "Beschreibung", "Bezahlt von", "Betrag"],
    budgetTitle: "Budget",
    budgetLabel: "Budget (CHF)",
    budgetSet: "Budget setzen",
    budgetEdit: "Budget ändern",
    budgetRemove: "Budget entfernen",
    budgetSaved: "Budget gespeichert",
    budgetSaveFailed: "Budget konnte nicht gespeichert werden",
    budgetInvalid: "Bitte einen Betrag grösser als null eintragen.",
    budgetBarAria: (percent: number) => `${percent} % des Budgets verbraucht`,
    budgetLeft: (amount: string, percent: number) =>
      `Noch ${amount} übrig (${percent} % verbraucht).`,
    budgetOver: (amount: string, percent: number) =>
      `${amount} über dem Budget (${percent} % verbraucht).`,
    title: "Reisekasse",
    toggleAria: (name: string) => `Reisekasse von ${name} auf- oder zuklappen`,
    hint: "Halte fest, was die Reise kostet – am Schluss siehst du, wer wem was schuldet.",
    currency: "CHF",
    total: "Total",
    empty: "Noch nichts erfasst – trage die erste Ausgabe ein.",
    categoryTitle: "Nach Kategorie",
    categoryShare: (percent: number) => `${percent} %`,
    settleTitle: "Wer schuldet wem",
    settleNone: "Alles ausgeglichen – niemand schuldet etwas.",
    settleHint:
      "Gerechnet mit gleichen Anteilen für alle, die etwas bezahlt haben.",
    settleLine: (from: string, to: string, amount: string) =>
      `${from} zahlt ${to} ${amount}`,
    addButton: "Ausgabe erfassen",
    newTitle: "Neue Ausgabe",
    editTitle: "Ausgabe bearbeiten",
    amountLabel: "Betrag (CHF)",
    amountPlaceholder: "z. B. 24.50",
    amountInvalid: "Bitte einen Betrag in Franken angeben (z. B. 24.50).",
    dayLabel: "Datum",
    categoryLabel: "Kategorie",
    categoryAria: "Kategorie wählen",
    descriptionLabel: "Beschreibung (optional)",
    descriptionPlaceholder: "z. B. Znacht im Dorfladen",
    paidByLabel: "Wer hat bezahlt?",
    paidByPlaceholder: "Name",
    paidByRequired: "Bitte eintragen, wer bezahlt hat.",
    paidBySuggestionsAria: "Bereits erfasste Zahlende",
    meFallback: "Ich",
    save: "Speichern",
    saved: "Ausgabe erfasst",
    updated: "Ausgabe aktualisiert",
    saveFailed: "Ausgabe konnte nicht gespeichert werden",
    deleted: "Ausgabe gelöscht",
    deleteFailed: "Ausgabe konnte nicht gelöscht werden",
    deleteConfirm: (label: string) => `Ausgabe «${label}» wirklich löschen?`,
    editAria: (label: string) => `Ausgabe ${label} bearbeiten`,
    deleteAria: (label: string) => `Ausgabe ${label} löschen`,
    paidByLine: (name: string) => `bezahlt von ${name}`,
    byLine: (name: string) => `erfasst von ${name}`,
    untitled: "Ohne Beschreibung",
  },
  tripInvite: {
    badge: "Reise-Einladung",
    title: "Einladung zu einer Reise",
    invalid: "Diese Einladung ist ungültig",
    invalidHint:
      "Der Link wurde widerrufen oder existiert nicht. Bitte lass dir einen neuen schicken.",
    ownerLine: (name: string) => `${name} lädt dich ein, mitzureisen.`,
    ownerFallback: "Jemand",
    unknownPlace: "Unbekannter Ort",
    editNote:
      "Als Mitreisende*r siehst du die Reise in «Meine Reisen» und kannst Fotos, Menüplan und Packliste mitgestalten.",
    accept: "Einladung annehmen",
    accepting: "Wird angenommen …",
    accepted: "Du bist jetzt Teil der Reise!",
    acceptedOwn: "Das ist deine eigene Reise.",
    acceptFailed: "Einladung konnte nicht angenommen werden",
    loginHint:
      "Melde dich an oder erstelle ein Konto, um die Einladung anzunehmen.",
    loginCta: "Anmelden und beitreten",
  },
  sharedTrip: {
    badge: "Geteilte Reise",
    invalid: "Dieser Teil-Link ist abgelaufen oder nicht mehr gültig.",
    invalidHint:
      "Er ist abgelaufen oder die Besitzerin bzw. der Besitzer hat das Teilen beendet.",
    infoTitle: "Reise-Infos",
    notesTitle: "Notizen",
    ratingAria: (n: number) => `Bewertung: ${n} von 5 Sternen`,
    spotTitle: "Zeltplatz",
    menuTitle: "Menüplan",
    dayHeader: "Tag",
    packListTitle: "Packliste",
    contactPhone: "Telefon Rezeption",
    contactCheckin: "Check-in",
    contactParcel: "Parzelle",
    packListNotShared:
      "Diese Packliste wird momentan nicht separat geteilt – nur Ansicht, Abhaken ist nicht möglich.",
    footer:
      "Geteilt mit CampMesser – dem Schweizer Taschenmesser fürs Zelt-Camping.",
  },
  tripPrint: {
    docTitle: (name: string) => `${name} – Reisebericht zum Ausdrucken`,
    docTitleFallback: "Reisebericht",
    appTitle: "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
    notFound: "Dieser Aufenthalt wurde nicht gefunden.",
    printButton: "Drucken / Als PDF sichern",
    printBrowserHint:
      "In der installierten App öffnet der Knopf die Ansicht im Browser – dort über das Menü drucken oder als PDF sichern.",
    headerKicker: "CampMesser · Reisebericht",
    printedOn: (date: string) => `Stand: ${date}`,
    ratingAria: (n: number) => `Bewertung: ${n} von 5 Sternen`,
    notesTitle: "Notizen",
    menuTitle: "Menüplan",
    dayHeader: "Tag",
    photosTitle: "Fotos",
    photoAlt: (n: number, name: string) => `Foto ${n} vom Aufenthalt ${name}`,
    footer:
      "Schöne Erinnerungen! · CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
  },
  firstAid: {
    title: "Erste-Hilfe-Guide",
    subtitle:
      "Kompakter Ratgeber für typische Outdoor-Verletzungen – vollständig offline verfügbar.",
    offlineNote:
      "Alle Inhalte sind in der App gespeichert und ohne Internetverbindung nutzbar.",
    filterAria: "Nach Schweregrad filtern",
    filterAll: "Alle Themen",
    severity: {
      leicht: "leicht",
      mittel: "mittel",
      ernst: "ernst",
    },
    recognizeTitle: "Erkennen",
    helpTitle: "So hilfst du",
    disclaimer:
      "Hinweis: Dieser Guide ersetzt keine ärztliche Beratung und keinen Erste-Hilfe-Kurs. Im Zweifel immer den Notruf 112 oder die Rega 1414 kontaktieren.",
    tickTitle: "Zeckenstich-Merker",
    tickSubtitle:
      "Halte einen Zeckenstich fest und behalte die Einstichstelle zwei Wochen im Auge.",
    tickGuestHint:
      "Melde dich an, um Zeckenstiche festzuhalten und an die Beobachtung erinnert zu werden.",
    tickMedicalNote:
      "Wichtig: Zeigt sich rund um die Einstichstelle eine sich ausbreitende Rötung, oder kommen Fieber, Kopf- oder Gliederschmerzen dazu, lass das ärztlich abklären. Das gilt auch noch Wochen nach dem Stich.",
    tickDateLabel: "Datum des Stichs",
    tickBodyPartLabel: "Körperstelle (optional)",
    tickBodyPartPlaceholder: "z. B. Kniekehle links",
    tickNoteLabel: "Notiz (optional)",
    tickNotePlaceholder: "z. B. Zecke vollständig entfernt",
    tickAddButton: "Stich erfassen",
    tickAdded: "Zeckenstich erfasst",
    tickAddFailed: "Zeckenstich konnte nicht erfasst werden",
    tickOpenTitle: "In Beobachtung",
    tickOpenEmpty: "Zurzeit ist kein Zeckenstich in Beobachtung.",
    tickDaysLeft: (n: number) =>
      n === 1 ? "noch 1 Tag beobachten" : `noch ${n} Tage beobachten`,
    tickBitAt: (date: string) => `Stich am ${date}`,
    tickResolveButton: "erledigt",
    tickResolveAria: (date: string) =>
      `Beobachtung des Stichs vom ${date} abschliessen`,
    tickResolved: "Beobachtung abgeschlossen",
    tickResolveFailed: "Beobachtung konnte nicht abgeschlossen werden",
    tickReopenAria: (date: string) =>
      `Stich vom ${date} wieder in Beobachtung nehmen`,
    tickDeleteAria: (date: string) => `Stich vom ${date} löschen`,
    tickDeleteConfirm: "Diesen Zeckenstich-Eintrag wirklich löschen?",
    tickDeleted: "Eintrag gelöscht",
    tickDoneTitle: (n: number) => `Erledigt (${n})`,
    tickDoneToggleAria: "Erledigte Zeckenstiche auf- oder zuklappen",
  },
  knots: {
    title: "Knoten-Bibliothek",
    subtitle:
      "Die wichtigsten Outdoor-Knoten mit Schritt-für-Schritt-Anleitungen – offline verfügbar.",
    offlineNote:
      "Alle Anleitungen sind in der App gespeichert und ohne Internetverbindung nutzbar.",
    quizTitle: "Knoten-Quiz",
    quizStartAria: "Knoten-Quiz starten",
    quizTeaser: "8 Situationen, 4 Antworten – welcher Knoten ist der richtige?",
    quizDescription:
      "Welcher Knoten passt zur Situation? Übe, bis die Griffe sitzen.",
    quizProgressAria: "Quiz-Fortschritt",
    questionOf: (current: number, total: number) =>
      `Frage ${current} von ${total}`,
    points: (n: number) => `${n} Punkte`,
    answerAria: (option: string) => `Antwort: ${option}`,
    resultLine: (score: number, total: number) =>
      `${score} von ${total} richtig!`,
    resultPerfect:
      "Knoten-Profi! Jetzt fehlt nur noch die Übung mit echtem Seil.",
    resultGood:
      "Solide! Schau dir die verpassten Knoten in der Bibliothek nochmal an.",
    resultTryAgain:
      "Kein Problem – die Bibliothek unten erklärt jeden Knoten Schritt für Schritt.",
    newRound: "Neue Runde",
    finish: "Fertig",
    showResult: "Ergebnis anzeigen",
    nextQuestion: "Nächste Frage",
    filterAria: "Nach Kategorie filtern",
    filterAll: "Alle",
    difficultyAria: (level: number) => `Schwierigkeit ${level} von 3`,
    openAria: (name: string) => `Anleitung für ${name} öffnen`,
    cardImageAlt: (name: string) => `Schritt-für-Schritt-Anleitung: ${name}`,
    detailImageAlt: (name: string) =>
      `Schritt-für-Schritt-Bild: ${name} binden`,
    alsoKnownAs: (name: string) => `auch: ${name}`,
    campingTitle: "Beim Camping",
    stepsTitle: "Schritt für Schritt",
    proTipTitle: "Profi-Tipp",
    masterySecure: "Sicher",
    masteryPractice: "Üben",
    openAriaLevel: (name: string, level: string) =>
      `Anleitung für ${name} öffnen – Lernstand: ${level}`,
    practiceFilter: "Nur zu übende",
    practiceFilterAria: "Nur Knoten mit Übungsbedarf anzeigen",
    practiceEmpty:
      "Kein Knoten mit Übungsbedarf in dieser Auswahl – starte das Quiz, um deinen Lernstand aufzubauen.",
    reviewTitle: "Diese Knoten brauchst du noch:",
    reviewAllSecure:
      "Alle abgefragten Knoten sitzen – weiter so mit echtem Seil!",
  },
  phrasebook: {
    title: "Sprachhilfe",
    subtitle:
      "Die wichtigsten Camping-Sätze in Deutsch, Französisch, Italienisch und Englisch – offline verfügbar.",
    offlineNote:
      "Alle Sätze sind in der App gespeichert und funktionieren ohne Internetverbindung.",
    targetLabel: "Zielsprache",
    targetAria: "Zielsprache wählen",
    sameLanguageHint:
      "Zielsprache und App-Sprache sind gleich – wähl oben eine andere Sprache, damit du die Übersetzung siehst.",
    searchPlaceholder: "Satz suchen …",
    searchAria: "Sprachhilfe durchsuchen",
    searchEmpty: "Kein Satz gefunden – versuch ein anderes Stichwort.",
    copyAria: (text: string) => `«${text}» kopieren`,
    copied: "Satz kopiert.",
    copyFailed: "Kopieren hat nicht geklappt.",
    speakAria: (text: string) => `«${text}» vorlesen`,
    stopAria: "Vorlesen stoppen",
    countLine: (n: number) => `${n} Sätze`,
  },
  clouds: {
    title: "Wolken-Lexikon",
    subtitle:
      "Wolkenart erkennen und wissen, welches Wetter folgt – offline verfügbar.",
    offlineNote:
      "Alle Wolken sind in der App gespeichert und funktionieren ohne Internetverbindung.",
    howToTitle: "So liest du den Himmel",
    howToText:
      "Zuerst schauen, in welchem Stockwerk die Wolke hängt: hoch und fedrig, mittelhoch mit Schattenseiten oder tief und grau. Dann das Aussehen vergleichen – und zuletzt lesen, was daraus folgt.",
    filterAria: "Nach Stockwerk filtern",
    filterAll: "Alle",
    urgencyGood: "Gutes Zeichen",
    urgencyWatch: "Beobachten",
    urgencyWarning: "Warnung",
    appearanceTitle: "Woran du sie erkennst",
    meaningTitle: "Was daraus folgt",
    campTipTitle: "Am Platz",
    leadNone: "Kündigt nichts an",
    leadNow: (to: number) => `Jetzt bis in ${to} Std.`,
    leadRange: (from: number, to: number) => `In ${from}–${to} Std.`,
    leadDisclaimer:
      "Die Zeitangabe ist eine Faustregel für mitteleuropäische Fronten, kein Countdown. Bei Gewittergefahr gilt immer die aktuelle Warnung im Wetter-Modul.",
    openAria: (name: string) => `Wolke ${name} öffnen`,
    countLine: (n: number) => `${n} Wolkenarten im Lexikon`,
  },
  care: {
    offlineNote:
      "Alle Anleitungen sind in der App gespeichert und funktionieren ohne Internetverbindung.",
    openAria: (name: string) => `Anleitung «${name}» öffnen`,
    whenTitle: "Wann es fällig ist",
    materialsTitle: "Das brauchst du",
    stepsTitle: "Schritt für Schritt",
    mistakeTitle: "Häufigster Fehler",
    minutes: (n: number) => `${n} Min. Arbeit`,
    intervalMonths: (n: number) =>
      n === 12
        ? "jährlich"
        : n % 12 === 0
          ? `alle ${n / 12} Jahre`
          : `alle ${n} Monate`,
    intervalNone: "bei Bedarf",
    reminderHint:
      "Wiederkehrende Arbeiten kannst du dir im Inventar als Pflege-Erinnerung eintragen – dann meldet sich die App, bevor es zu spät ist.",
  },
  thunder: {
    title: "Gewitter-Entfernung",
    subtitle:
      "Blitz antippen, Donner antippen – die App rechnet die Distanz und sagt, ob das Gewitter näher zieht.",
    tapLightning: "Blitz gesehen",
    tapThunder: "Donner gehört",
    tapLightningAria: "Zählung beim Blitz starten",
    tapThunderAria: "Zählung beim Donner stoppen",
    tapLightningHint: "Antippen, sobald du den Blitz siehst.",
    tapThunderHint: "Antippen, sobald du den Donner hörst.",
    lastStrike: "Letzter Blitz",
    distanceKm: (km: string) => `${km} km entfernt`,
    secondsCounted: (seconds: string) => `${seconds} Sekunden gezählt`,
    trendCloser: "Das Gewitter kommt näher.",
    trendFurther: "Das Gewitter zieht ab.",
    trendSame: "Die Entfernung bleibt etwa gleich.",
    advice: {
      gefahr:
        "Direkt über dir. Sofort ins Auto oder in ein festes Gebäude – ein Zelt schützt nicht vor Blitz.",
      warnung:
        "Nah genug: Jetzt Schutz aufsuchen, nicht erst beim nächsten Blitz. Weg von einzelnen Bäumen, Masten und Wasser.",
      beobachten:
        "Noch weit weg, aber im Auge behalten – zieh das Sonnensegel ein und sichere loses Zeug.",
    },
    allClearIn: (minutes: number) =>
      `Entwarnung in ${minutes} Min., falls kein weiterer Donner kommt.`,
    allClearReached: (minutes: number) =>
      `Seit ${minutes} Minuten kein Donner mehr – du kannst wieder raus.`,
    historyTitle: "Gezählte Blitze",
    reset: "Zurücksetzen",
    ruleTitle: "Die 30-30-Regel",
    ruleText:
      "Sind es zwischen Blitz und Donner weniger als 30 Sekunden (rund 10 km), such Schutz auf. Und geh erst 30 Minuten nach dem letzten Donner wieder raus – die letzten Blitze eines Gewitters treffen oft schon bei blauem Himmel.",
    methodNote: (max: number) =>
      `Gerechnet wird mit der Schallgeschwindigkeit, rund drei Sekunden pro Kilometer. Über ${max} Sekunden wird nichts mehr gezählt – so weit weg hört man den Donner ohnehin nicht mehr.`,
  },
  chores: {
    title: "Ämtli-Plan",
    subtitle:
      "Aufgaben reihum verteilen, abhaken und Punkte sammeln – ohne Streit, wer schon wieder abwäscht.",
    loginFeature: "den Ämtli-Plan",
    noChildren:
      "Noch keine Kinder angelegt. Im Familien-Modus trägst du sie ein – dann kann verteilt werden.",
    dayLabel: "Tag",
    distribute: "Reihum verteilen",
    dayPlanTitle: "Ämtli des Tages",
    progressLine: (done: number, total: number) =>
      `${done} von ${total} erledigt`,
    progressAria: "Fortschritt des Tages",
    toggleAria: (title: string) => `${title} abhaken`,
    assignAria: (title: string) => `${title} zuteilen`,
    unassigned: "Noch offen",
    pointsLine: (points: number) =>
      points === 1 ? "1 Punkt" : `${points} Punkte`,
    scoreTitle: "Punktestand",
    scoreLine: (points: number, done: number) => `${points} P. · ${done}×`,
    scoreHint:
      "Punkte gibt es erst beim Abhaken – eine zugeteilte Aufgabe ist noch kein Verdienst.",
    choresTitle: "Ämtli",
    newChore: "Neues Ämtli",
    newChorePlaceholder: "z. B. Abwaschen",
    pointsLabel: "Punkte",
    addChore: "Hinzufügen",
    removeAria: (title: string) => `${title} löschen`,
    rotationHint:
      "Verteilt wird reihum und nicht zufällig: Wer heute abwäscht, holt morgen Holz. Der Tag verschiebt die Reihenfolge um eins – so kann jedes Kind nachrechnen, dass es fair zugeht.",
  },
  songbook: {
    title: "Lagerfeuer-Liederbuch",
    subtitle:
      "Texte mit Akkorden – transponierbar, mit Rotlicht fürs Dunkel und ohne Netz nutzbar.",
    offlineNote:
      "Alle Lieder sind in der App gespeichert und funktionieren ohne Internetverbindung.",
    redLight: "Rotlicht",
    transposeAria: "Tonart verschieben",
    transposeLabel: (value: string) => `Kapo ${value}`,
    transposeUpAria: "Einen Halbton höher",
    transposeDownAria: "Einen Halbton tiefer",
    copyrightNote:
      "Hier stehen nur gemeinfreie Lieder – Volkslieder und Stücke, deren Urheber seit über 70 Jahren verstorben sind. Bei jedem Lied steht die Herkunft dabei. Moderne Lagerfeuer-Klassiker fehlen deshalb, sie dürften nicht abgedruckt werden.",
  },
  storyDice: {
    title: "Erzählwürfel",
    subtitle:
      "Symbole würfeln und daraus gemeinsam eine Geschichte erfinden – ohne Netz, ohne Vorbereitung.",
    howToTitle: "So geht's",
    howToText:
      "Würfeln, dann erzählt der Erste einen Satz, in dem ein Symbol vorkommt. Reihum weiter, bis alle Symbole verbraucht sind – wer will, hängt am Schluss ein Ende dran.",
    countLabel: "Würfel:",
    countAria: "Anzahl Würfel wählen",
    rollButton: "Würfeln",
    rerollAria: (word: string) => `${word} neu würfeln`,
    rerollHint:
      "Passt ein Symbol partout nicht? Tipp drauf – dann wird nur dieser Würfel neu geworfen.",
    starterTitle: "Anfangssatz",
  },
  treasure: {
    title: "GPS-Schatzsuche",
    subtitle:
      "Verstecke am Platz anlegen – die Kinder suchen mit «warm und kalt» und einem Pfeil.",
    loginFeature: "die GPS-Schatzsuche",
    openSection: "Schatzsuche öffnen",
    openSectionHint:
      "Standort und Kompass laufen erst, wenn du die Schatzsuche öffnest – sonst brauchen sie hier unnötig Strom.",
    defaultName: "Schatzsuche",
    newHunt: "Neue Suche",
    removeHunt: "Diese Suche löschen",
    empty:
      "Noch keine Schatzsuche. Leg eine an, dann kannst du an Ort und Stelle Verstecke setzen.",
    modeAria: "Modus wählen",
    modeHide: "Verstecken",
    modeSeek: "Suchen",
    hideAria: "Verstecke anlegen",
    seekAria: "Suche läuft",
    progressLine: (found: number, total: number) =>
      `${found} von ${total} gefunden`,
    progressAria: "Fortschritt der Schatzsuche",
    addPointHere: "Versteck hier anlegen",
    addPointTitle: "Versteck anlegen",
    addPointDescription:
      "Der Punkt wird an deinem aktuellen Standort gespeichert. Versteck den Gegenstand zuerst und speichere dann.",
    pointName: "Name der Station",
    pointNamePlaceholder: "z. B. Station 1",
    pointHint: "Hinweis (freiwillig)",
    pointHintPlaceholder: "z. B. «Wo das Wasser plätschert»",
    savePoint: "Versteck speichern",
    accuracyLine: (meters: number) => `Ortungsgenauigkeit: ±${meters} m`,
    maxPoints: (max: number) =>
      `Mehr als ${max} Verstecke pro Suche sind nicht vorgesehen.`,
    hideTip:
      "Verstecke gut sichtbar am Boden oder in Astgabeln – nicht vergraben. Das Handy zeigt den Ort auf 10 bis 15 Meter genau, den Rest machen die Augen.",
    noPoints: "Diese Suche hat noch keine Verstecke.",
    waitingForFix: "Standort wird gesucht …",
    geoError:
      "Kein Standort verfügbar. Ohne Ortung lässt sich weder verstecken noch suchen – bitte den Zugriff erlauben.",
    weakSignal:
      "Das Signal ist gerade schwach – die Entfernung kann um einige Meter danebenliegen.",
    stationLine: (index: number, total: number) =>
      `Station ${index} von ${total}`,
    arrowAria: "Pfeil zum nächsten Versteck",
    markFound: "Gefunden!",
    tooFarAway: "Noch zu weit weg",
    hiddenName: "Nächstes Versteck",
    allFound: "Alle Verstecke gefunden!",
    reset: "Nochmals spielen",
    hideAgainAria: (name: string) => `${name} wieder verstecken`,
    removePointAria: (name: string) => `${name} löschen`,
  },
  gearRepair: {
    title: "Reparatur-Ratgeber",
    subtitle:
      "Sieben Reparaturen, die eine Reise retten – von der Isomatte bis zur Rucksack-Schnalle.",
  },
  tentCare: {
    title: "Zeltpflege",
    subtitle:
      "Sieben Arbeiten, die ein Zelt über Jahre dicht halten – von der Imprägnierung bis zum Schimmel.",
  },
  nature: {
    title: "Natur-Entdecker",
    subtitle:
      "Tierspuren, Sternbilder, Bäume, Pilze und Wildbeeren – kindgerecht erklärt und offline verfügbar.",
    offlineNote:
      "Das ganze Lexikon ist in der App gespeichert und ohne Internetverbindung nutzbar.",
    moonSectionAria: "Mondphasen-Kalender",
    moonTitle: "Mond heute Nacht",
    illuminated: (pct: number) => `Zu ${pct} % beleuchtet`,
    stargazing: (label: string) => `Sterne schauen: ${label}`,
    quality: {
      hervorragend: "hervorragend",
      gut: "gut",
      mittel: "mittel",
      schlecht: "schlecht",
    },
    fullMoonsTitle: "🌕 Nächste Vollmonde",
    fullMoonsNote: "Ideal für Nachtwanderungen – der Mond leuchtet den Weg.",
    newMoonsTitle: "🌑 Nächste Neumonde",
    newMoonsNote:
      "Dunkelster Himmel – beste Nächte für Sternbilder und Milchstrasse.",
    moonCalcNote:
      "Berechnung erfolgt direkt auf dem Gerät (±1 Tag genau) – funktioniert auch offline.",
    moonMonthToggleShow: "Monatsansicht öffnen",
    moonMonthToggleHide: "Monatsansicht schliessen",
    moonMonthTableAria: (month: string) => `Mondkalender ${month}`,
    moonMonthPrev: "Vorheriger Monat",
    moonMonthNext: "Nächster Monat",
    moonMonthToday: "Zurück zu heute",
    moonMonthNewShort: "Neu",
    moonMonthFullShort: "Voll",
    moonMonthDayAria: (date: string, phase: string) => `${date}: ${phase}`,
    moonMonthMeteorAria: (names: string) => `Sternschnuppen: ${names}`,
    moonMonthTodayAria: "heute",
    moonMonthLegendNew: "Neumond – dunkelster Himmel",
    moonMonthLegendFull: "Vollmond – helle Nacht",
    moonMonthLegendMeteor: (days: number) =>
      `Sternschnuppen-Nacht (Maximum ±${days} Tage)`,
    moonMonthLegendToday: "Heute",
    moonMonthNote:
      "Die Symbole zeigen den beleuchteten Anteil um die Mittagszeit – auf ±1 Tag genau.",
    meteorSectionAria: "Sternschnuppen-Kalender",
    meteorTitle: "Nächste Sternschnuppen-Nächte",
    activeNow: "Jetzt aktiv",
    peakToday: "Maximum heute Nacht!",
    peakTomorrow: "Maximum morgen",
    peakInDays: (n: number) => `Maximum in ${n} Tagen`,
    meteorRate: (n: number) => `bis ${n} Meteore/h`,
    radiantDirection: (r: string) => `Blickrichtung ${r}`,
    moonInterferes: (pct: number) =>
      `Mond stört: am Maximum zu ${pct} % beleuchtet – helle Meteore sind trotzdem sichtbar.`,
    moonOk: (pct: number) => `Guter Mondstand: nur ${pct} % beleuchtet.`,
    meteorFootnote:
      "Raten gelten für dunklen Himmel ohne Lichtverschmutzung. Termine jährlich ungefähr gleich, Berechnung offline auf dem Gerät.",
    redLightSectionAria: "Rotlicht-Modus für die Sternbeobachtung",
    redLightTitle: "Rotlicht-Modus",
    redLightHint:
      "Rotes, gedimmtes Licht erhält die Dunkeladaption deiner Augen: Nach dem Blick aufs Handy siehst du schwache Sterne viel schneller wieder. Der Filter legt sich über die ganze App, bedienen kannst du sie weiterhin – beim Neuladen ist er automatisch aus.",
    redLightOn: "Rotlicht einschalten",
    redLightOff: "Rotlicht aus",
    redLightOffAria: "Rotlicht-Modus beenden",
    categoryAria: "Kategorie wählen",
    imageAlt: (name: string) => `Illustration: ${name}`,
    featuresTitle: "Erkennungsmerkmale",
    funFactTitle: "Wusstest du?",
    kidsTitle: "Für Kinder:",
    seasonLine: (from: string, to: string) => `Saison: ${from}–${to}`,
    nowFilter: "Jetzt zu sehen",
    nowFilterAria: "Nur Einträge zeigen, die jetzt Saison haben",
    nowFilterEmpty:
      "In dieser Kategorie hat gerade nichts Saison – schalte den Filter aus, um alle Einträge zu sehen.",
    safetyTitle: "Erst bestimmen, dann essen",
    rulesTitle: "Sammeln ist kantonal geregelt",
    habitatTitle: "Wo du es findest:",
    useTitle: "Verwendung:",
    lookalikeTitle: "Verwechslungsgefahr",
    lookalikeIntro:
      "Diese Arten sehen ähnlich aus – lies sie, bevor du etwas mitnimmst.",
    lookalikeCheck:
      "Im Zweifel: nicht essen, sondern den ganzen Fund der amtlichen Pilzkontrollstelle zeigen. Vergiftungsverdacht: Tox Info Suisse 145.",
    collection: {
      title: "Arten-Sammelalbum",
      progress: (seen: number, total: number) =>
        `${seen} von ${total} Arten beobachtet`,
      progressAria: "Sammel-Fortschritt",
      notSeen: "noch offen",
      seenAria: (name: string, date: string) =>
        `${name} – erstmals beobachtet am ${date}. Lexikon-Eintrag öffnen.`,
      openAria: (name: string) =>
        `${name} – noch nicht beobachtet. Lexikon-Eintrag öffnen.`,
      hint: "Verknüpfe eine Beobachtung mit einer Art aus dem Lexikon, damit sie hier farbig wird.",
    },
    sightings: {
      title: "Meine Beobachtungen",
      sectionAria: "Meine Natur-Beobachtungen",
      intro:
        "Halte fest, was du draussen entdeckt hast – mit Datum, Standort, Notiz und Foto. Beobachtungen mit Standort erscheinen zusätzlich als Pins auf der Karte.",
      loginFeature: "dein Beobachtungs-Tagebuch",
      loadFailed: "Beobachtungen konnten nicht geladen werden.",
      empty:
        "Noch keine Beobachtungen – erfasse deine erste Sichtung, zum Beispiel ein Reh am Waldrand.",
      count: (n: number) => (n === 1 ? "1 Beobachtung" : `${n} Beobachtungen`),
      addButton: "Beobachtung erfassen",
      addAria: "Neue Beobachtung erfassen",
      dialogTitleNew: "Neue Beobachtung",
      dialogTitleEdit: "Beobachtung bearbeiten",
      dialogDescription:
        "Wähle einen Eintrag aus dem Lexikon als Vorschlag oder gib einen eigenen Titel ein.",
      entryLabel: "Art aus dem Lexikon (optional)",
      entryNone: "Kein Lexikon-Eintrag",
      titleLabel: "Titel",
      titlePlaceholder: "z. B. Reh am Waldrand",
      titleRequired:
        "Bitte gib einen Titel ein oder wähle einen Lexikon-Eintrag.",
      dateLabel: "Datum",
      locationLegend: "Standort (optional)",
      useLocation: "Aktuellen Standort übernehmen",
      locating: "Standort wird ermittelt …",
      locationSet: (lat: string, lon: string) => `Standort: ${lat}, ${lon}`,
      removeLocation: "Standort entfernen",
      locationFailed:
        "Standort konnte nicht ermittelt werden – bitte Berechtigung prüfen.",
      locationUnsupported: "Dieses Gerät stellt keinen Standort bereit.",
      onMapHint: "Erscheint als Pin auf der Karte.",
      noteLabel: "Notiz (optional)",
      notePlaceholder: "z. B. Spuren im Schlamm, zwei Jungtiere",
      photoLabel: "Foto (optional)",
      photoChoose: "Foto auswählen",
      photoChange: "Foto ändern",
      photoRemove: "Foto entfernen",
      photoPreviewAlt: "Vorschau des Beobachtungs-Fotos",
      photoHint:
        "JPEG, PNG oder WebP – wird vor dem Hochladen automatisch verkleinert.",
      photoUploading: "Foto wird hochgeladen …",
      photoUploadFailed:
        "Gespeichert, aber das Foto konnte nicht hochgeladen werden.",
      photoTooLarge: "Das Foto ist zu gross (max. 5 MB).",
      photoHeic:
        "HEIC/HEIF kann der Browser nicht lesen – bitte als JPEG exportieren.",
      photoReadFailed: "Das Bild konnte nicht gelesen werden.",
      photoRemoveFailed: "Das Foto konnte nicht entfernt werden.",
      photoAlt: (title: string) => `Foto der Beobachtung ${title}`,
      created: "Beobachtung gespeichert",
      updated: "Änderungen gespeichert",
      deleted: "Beobachtung gelöscht",
      editAria: (title: string) => `Beobachtung «${title}» bearbeiten`,
      deleteAria: (title: string) => `Beobachtung «${title}» löschen`,
      deleteConfirm: (title: string) =>
        `Beobachtung «${title}» wirklich löschen?`,
    },
  },
  /** Fangbuch fürs Angeln (#236). */
  fishing: {
    title: "Fangbuch",
    sectionAria: "Fangbuch – meine Fänge",
    intro:
      "Halte jeden Fang fest: Art, Länge, Gewicht, Gewässer, Köder und Foto. Daraus rechnet die App deine Rekorde und die Fänge pro Jahr.",
    loginFeature: "dein Fangbuch",
    loadFailed: "Fänge konnten nicht geladen werden.",
    empty:
      "Noch keine Fänge – trag deinen ersten ein, zum Beispiel eine Bachforelle aus der Sihl.",
    count: (n: number) => (n === 1 ? "1 Fang" : `${n} Fänge`),
    addButton: "Fang erfassen",
    addAria: "Neuen Fang erfassen",
    legalTitle: "Der Kanton hat das letzte Wort",
    legalText:
      "Die Fischerei ist in der Schweiz kantonal geregelt: Schonzeiten, Fangmindestmasse und Fanglimiten unterscheiden sich je Kanton und sogar je Gewässer. Hier stehen die Mindestvorgaben des Bundes – dein Kanton darf strenger sein und ist es fast immer. Massgebend sind die kantonale Fischereiverordnung und dein Patent.",
    legalSource: (version: string, date: string) =>
      `Grundlage: Verordnung zum Bundesgesetz über die Fischerei (${version}). Stand des Datensatzes: ${date}.`,
    filterSpeciesLabel: "Art",
    filterWaterLabel: "Gewässer",
    filterAll: "Alle",
    filterEmpty: "Zu dieser Auswahl gibt es keine Fänge.",
    released: "zurückgesetzt",
    kept: "entnommen",
    lengthShort: (value: string) => `${value} cm`,
    weightShort: (value: string) => `${value} kg`,
    photoAlt: (name: string) => `Foto des Fangs: ${name}`,
    editAria: (name: string) => `Fang «${name}» bearbeiten`,
    deleteAria: (name: string) => `Fang «${name}» löschen`,
    deleteConfirm: (name: string) => `Fang «${name}» wirklich löschen?`,
    statsTitle: "Statistik",
    statsSummary: (total: number, released: number, kept: number) =>
      `${total} Fänge · ${released} zurückgesetzt · ${kept} entnommen`,
    recordsTitle: "Grösster Fang je Art",
    recordNoLength: "noch nie gemessen",
    recordCount: (n: number) => (n === 1 ? "1 Fang" : `${n} Fänge`),
    yearsTitle: "Fänge pro Jahr",
    yearLine: (total: number, released: number) =>
      `${total} Fänge, davon ${released} zurückgesetzt`,
    dialogTitleNew: "Neuer Fang",
    dialogTitleEdit: "Fang bearbeiten",
    dialogDescription:
      "Wähl eine Art aus dem Datensatz – dann prüft die App gleich Schonzeit und Mindestmass des Bundes.",
    speciesLabel: "Fischart",
    speciesOwn: "Eigene Art eintragen",
    nameLabel: "Art-Name",
    namePlaceholder: "z. B. Bachforelle",
    nameRequired: "Bitte gib einen Art-Namen ein oder wähle eine Art.",
    dateLabel: "Datum",
    timeLabel: "Uhrzeit",
    lengthLabel: "Länge (cm)",
    weightLabel: "Gewicht (kg)",
    waterLabel: "Gewässer",
    waterPlaceholder: "z. B. Zürichsee oder Sihl bei Langnau",
    waterRequired: "Bitte gib das Gewässer an.",
    methodLabel: "Köder / Methode",
    methodPlaceholder: "z. B. Nymphe, Gummifisch 10 cm",
    releasedLabel: "Schonend zurückgesetzt",
    noteLabel: "Notiz (optional)",
    notePlaceholder: "z. B. früher Morgen, leichter Regen",
    photoLabel: "Foto (optional)",
    photoChoose: "Foto auswählen",
    photoChange: "Foto ändern",
    photoRemove: "Foto entfernen",
    photoPreviewAlt: "Vorschau des Fang-Fotos",
    photoHint:
      "JPEG, PNG oder WebP – wird vor dem Hochladen automatisch verkleinert.",
    photoUploading: "Foto wird hochgeladen …",
    photoUploadFailed:
      "Gespeichert, aber das Foto konnte nicht hochgeladen werden.",
    photoTooLarge: "Das Foto ist zu gross (max. 5 MB).",
    photoHeic:
      "HEIC/HEIF kann der Browser nicht lesen – bitte als JPEG exportieren.",
    photoReadFailed: "Das Bild konnte nicht gelesen werden.",
    photoRemoveFailed: "Das Foto konnte nicht entfernt werden.",
    created: "Fang gespeichert",
    updated: "Änderungen gespeichert",
    deleted: "Fang gelöscht",
    hints: {
      ban: "Fangverbot des Bundes: Diese Art ist vom Aussterben bedroht und darf nicht gefangen werden. Löse den Haken im Wasser und setz den Fisch sofort zurück.",
      report:
        "Meldepflicht: Melde diesen Fisch unverzüglich der kantonalen Fischereifachstelle.",
      closedSeason:
        "An diesem Datum gilt die Richtwert-Schonzeit dieser Art – in den meisten Kantonen darfst du sie jetzt nicht entnehmen. Schau in deiner kantonalen Fischereiverordnung nach.",
      underMinLength: (cm: number) =>
        `Unter dem Fangmindestmass des Bundes von ${cm} cm – zurücksetzen. Der Kanton verlangt oft noch mehr.`,
      nearMinLength: (cm: number) =>
        `Knapp über dem Bundesmass von ${cm} cm: Viele Kantone verlangen deutlich mehr – kurz nachschauen, bevor du entnimmst.`,
      cantonal:
        "Massgebend sind die kantonale Fischereiverordnung und dein Patent.",
    },
    speciesTitle: "Arten, Schonzeiten & Mindestmasse",
    speciesIntro:
      "Die wichtigsten Arten der Schweizer Angelfischerei mit den Mindestvorgaben des Bundes und dem, was Kantone in der Praxis strenger regeln.",
    federalMin: (cm: number) => `Bund: mindestens ${cm} cm`,
    federalMinNone: "Bund: kein Fangmindestmass",
    federalWeeks: (weeks: number) => `Schonzeit mindestens ${weeks} Wochen`,
    federalWeeksNone: "keine Schonzeit vom Bund vorgeschrieben",
    guideSeason: (from: string, to: string) =>
      `Richtwert-Schonzeit: ${from} bis ${to}`,
    guideSeasonNone: "Keine verbreitete Schonzeit hinterlegt",
    guideSeasonHint:
      "Richtwert, nicht verbindlich: Der Bund gibt nur die Dauer in Wochen vor, Beginn und Ende legt der Kanton fest.",
    cantonTitle: "Im Kanton oft strenger:",
    habitatTitle: "Wo sie steht:",
    methodTitle: "Köder & Methode:",
    bannedBadge: "Fangverbot",
    waters: {
      fliessend: "Fliessgewässer",
      stehend: "Stehende Gewässer",
      beide: "Fliessend und stehend",
    },
    measureHint:
      "Gemessen wird von der Kopfspitze bis zu den Spitzen der natürlich ausgebreiteten Schwanzflosse (VBGF Art. 2 Abs. 2).",
  },
  /** Zecken-Risiko nach Region (#224). */
  tickRisk: {
    sectionAria: "Zecken-Risiko an diesem Ort",
    title: "Zeckenrisiko",
    activity: {
      none: "kaum aktiv",
      low: "wenig aktiv",
      moderate: "mässig aktiv",
      high: "sehr aktiv",
    },
    activityLine: (month: string) => `So aktiv sind Zecken im ${month}.`,
    aboveTickLine: (limitM: number) =>
      `Der Platz liegt über ${limitM} m – so hoch kommen Zecken kaum noch vor.`,
    inRiskArea:
      "Dieser Ort liegt in einem Gebiet, das das BAG als FSME-Risikogebiet führt. Wer viel draussen ist, bespricht die Impfung am besten mit der Hausärztin oder dem Hausarzt.",
    outsideRiskArea: (region: string) =>
      `Der Kanton ${region} zählt nicht zu den FSME-Risikogebieten des BAG. Zecken gibt es hier trotzdem – auch Borreliose überträgt sich unabhängig davon.`,
    outsideSwitzerland:
      "Ausserhalb der Schweiz führt CampMesser keine FSME-Einstufung. Erkundige dich für dein Reiseland vor der Abreise.",
    switzerlandGeneral:
      "In der Schweiz gilt das ganze Land als FSME-Risikogebiet – ausser den Kantonen Genf und Tessin.",
    tipsTitle: "So beugst du vor",
    tips: [
      "Auf den Wegen bleiben und hohes Gras, Unterholz und Waldränder meiden.",
      "Lange Hosen, geschlossene Schuhe, Socken über die Hosenbeine – helle Kleidung, dann siehst du die Zecke früher.",
      "Zeckenmittel auf Haut und Kleidung auftragen und nach ein paar Stunden auffrischen.",
      "Abends den ganzen Körper absuchen, bei Kindern besonders Haaransatz, Ohren, Achseln, Leisten und Kniekehlen.",
      "Eine Zecke möglichst rasch entfernen und die Stelle im Zeckenstich-Merker festhalten.",
    ],
    sourceNote:
      "Einstufung: BAG, Stand Februar 2019. Aktivität grob nach Monat und Höhenlage – eine Orientierungshilfe, kein medizinischer Rat.",
  },

  /** Badestellen-Info im Platz-Dossier (#223). */
  bathingWater: {
    title: "Wasser & Baden",
    stationLine: (waterBody: string, station: string, distance: string) =>
      `${waterBody} · Messstelle ${station}, ${distance} entfernt`,
    marineLine: "Meerwasser-Temperatur an deinem Platz",
    noTemperature:
      "Diese Messstelle misst keine Wassertemperatur – es gibt nur Pegel und Abfluss.",
    comfort: {
      cold: "kalt",
      brisk: "frisch",
      pleasant: "angenehm",
      warm: "warm",
    },
    trend: {
      rising: "steigend",
      steady: "gleichbleibend",
      falling: "fallend",
    },
    flowLabel: "Abfluss",
    flowValue: (value: string) => `${value} m³/s`,
    levelLabel: "Pegel",
    levelValue: (value: string) => `${value} m ü. M.`,
    measuredAt: (when: string) => `Gemessen am ${when}`,
    sourceStation: "Quelle: offene Hydrodaten des BAFU über api.existenz.ch",
    sourceMarine: "Quelle: Open-Meteo Marine",
    safetyNote:
      "Die Werte sind Messwerte der nächstgelegenen Stelle, nicht deiner Badestelle. Zu Strömung, Wasserqualität und Baderegeln sagen sie nichts – schau vor Ort auf die Beschilderung.",
  },

  /** ISS-Überflüge im Astro-Bereich (#222). */
  iss: {
    sectionAria: "Sichtbare Überflüge der Raumstation ISS",
    title: "ISS-Überflüge",
    subtitle:
      "Die nächsten sichtbaren Überflüge der Raumstation an deinem Standort.",
    subtitleAtPlace: (place: string) =>
      `Die nächsten sichtbaren Überflüge der Raumstation bei ${place}.`,
    loading: "Überflüge werden berechnet …",
    noLocation:
      "Für die Überflüge braucht CampMesser deinen Standort – gib die Ortung frei oder speichere einen Zeltplatz.",
    loadFailed:
      "Die Überflüge konnten gerade nicht geladen werden. Versuch es später nochmals.",
    noneVisible:
      "In den nächsten vier Tagen ist von hier aus kein Überflug zu sehen. Das wechselt alle paar Wochen – schau später wieder vorbei.",
    duration: (minutes: number) =>
      minutes === 1 ? "1 Minute" : `${minutes} Minuten`,
    path: (path: string) => `Weg über den Himmel: ${path}`,
    maxElevation: (degrees: number) => `bis ${degrees}° über dem Horizont`,
    brightness: (magnitude: string) => `Helligkeit ca. ${magnitude} mag`,
    footnote:
      "Sichtbar ist die ISS nur in der Dämmerung und in der ersten Nachthälfte: unten muss es dunkel sein, oben muss die Sonne die Station noch treffen. Sie zieht als ruhiger heller Punkt über den Himmel – ohne Blinken. Zeiten und Helligkeit sind Näherungswerte, sei ein paar Minuten früher draussen.",
  },

  /** Sternbild-Finder: Handy an den Himmel halten (#225). */
  skyFinder: {
    sectionAria: "Sternbild-Finder mit Kompass und Neigung",
    title: "Sternbild-Finder",
    subtitle:
      "Halt das Handy an den Himmel – CampMesser sagt dir, was in dieser Richtung steht.",
    subtitleAtPlace: (place: string) =>
      `Halt das Handy an den Himmel – so steht der Himmel gerade bei ${place}.`,
    locating: "Standort wird bestimmt …",
    noLocation:
      "Für den Sternbild-Finder braucht CampMesser deinen Standort – gib die Ortung frei oder speichere einen Zeltplatz.",
    viewTitle: "In Blickrichtung",
    viewDirection: (direction: string, degrees: number) =>
      `${direction}, ${degrees}° über dem Horizont`,
    viewNothing:
      "In dieser Richtung steht gerade nichts aus dem Bestand. Schwenk das Handy langsam weiter.",
    viewGround:
      "Du zeigst unter den Horizont – heb das Handy weiter an den Himmel.",
    separation: (degrees: number) => `rund ${degrees}° neben der Mitte`,
    lexiconLink: "Im Lexikon nachlesen",
    compassStart: "Kompass starten",
    compassHint:
      "Für die Blickrichtung braucht CampMesser den Kompass deines Geräts – tipp auf «Kompass starten» und erlaube den Zugriff.",
    compassDenied:
      "Ohne Kompass-Zugriff lässt sich die Blickrichtung nicht bestimmen. Du kannst es nochmals versuchen – die Liste unten stimmt auch so.",
    noCompass:
      "Dein Gerät hat keinen Kompass. Die Liste unten sagt dir trotzdem, wo heute Nacht was steht – mit Himmelsrichtung und Höhe über dem Horizont.",
    daylightHint:
      "Gerade ist es noch zu hell für Sterne. Die Liste zeigt, wie der Himmel in der kommenden Nacht steht.",
    tonightTitle: (time: string) => `Heute Nacht sichtbar (um ${time})`,
    tonightEmpty:
      "Um diese Zeit steht nichts aus dem Bestand hoch genug am Himmel.",
    position: (direction: string, degrees: number) =>
      `${direction} · ${degrees}° hoch`,
    footnote:
      "Gerechnet wird offline aus Ort und Zeit; die Angaben gelten für einen freien Horizont. Handy-Kompasse sind auf 10 bis 15 Grad genau – halte das Gerät flach in der Hand, weg von Metall und Magneten.",
  },

  /** Wanderwege in der Nähe (#238). */
  nearbyHikes: {
    sectionAria: "Markierte Wanderwege in der Umgebung",
    title: "Wandern in der Umgebung",
    subtitle: "Markierte Wanderwege rund um deinen Standort.",
    subtitleAtPlace: (place: string) =>
      `Markierte Wanderwege rund um ${place}.`,
    radiusLabel: "Umkreis",
    radiusGroupAria: "Suchradius wählen",
    radiusOption: (km: number) => `${km} km`,
    searchButton: "Wege suchen",
    searchAgain: "Nochmals suchen",
    locating: "Standort wird bestimmt …",
    loading: "Wanderwege werden gesucht …",
    noLocation:
      "Für die Suche braucht CampMesser deinen Standort – gib die Ortung frei oder öffne den Abschnitt im Dossier eines gespeicherten Platzes.",
    loadFailed:
      "Die Wanderwege konnten gerade nicht geladen werden. Overpass ist ein freier Dienst und bremst bei zu vielen Anfragen – versuch es in ein paar Minuten nochmals.",
    empty: (km: number) =>
      `Im Umkreis von ${km} km ist in OpenStreetMap keine markierte Wanderroute eingetragen. Versuch es mit einem grösseren Umkreis.`,
    resultCount: (n: number) =>
      n === 1 ? "1 Wanderweg gefunden" : `${n} Wanderwege gefunden`,
    unnamed: "Route ohne Namen",
    routeWithRef: (ref: string) => `Route ${ref}`,
    distanceLabel: "Luftlinie",
    lengthLabel: "Länge",
    durationLabel: "Gehzeit",
    ascentLabel: "Aufstieg",
    unknown: "–",
    network: {
      iwn: "Internationaler Weitwanderweg",
      nwn: "Nationale Route",
      rwn: "Regionale Route",
      lwn: "Lokale Route",
    },
    showMap: "Auf der Karte zeigen",
    hideMap: "Karte schliessen",
    mapAria: (name: string) => `Karte des Wegs ${name}`,
    mapFailed: "Die Karte konnte nicht geladen werden.",
    sectionLength: (value: string, km: number) =>
      `Im Umkreis von ${km} km verläuft der Weg ${value} weit – die Karte zeigt nur dieses Stück.`,
    navButton: "Zum Einstieg navigieren",
    navAria: (name: string) => `Navigation zum nächsten Punkt des Wegs ${name}`,
    websiteLink: "Website der Route",
    durationFlatOnly:
      "Ohne Höhendaten in OpenStreetMap – die Gehzeit gilt für flaches Gelände.",
    durationNote:
      "Gehzeit nach der SAC-Faustregel: 4 km/h in der Ebene, dazu 400 Höhenmeter pro Stunde aufwärts und 800 abwärts; gezählt wird der grössere Anteil plus die Hälfte des kleineren. Pausen sind nicht enthalten.",
    footnote:
      "Daten aus OpenStreetMap über die Overpass-API – abgefragt nur auf deinen Klick. Länge, Höhenmeter und Schwierigkeit stehen nur dort, wo sie in OSM gepflegt sind, sonst «–». Markierung im Gelände und Wegzustand können abweichen: nimm Karte und Wetterbericht mit.",
  },

  /** Feuer- und Grillstellen aus OpenStreetMap (#247). */
  tentWind: {
    sectionAria: "Zelt oder Tarp nach dem Wind ausrichten",
    title: "Ausrichtung nach dem Wind",
    subtitle:
      "Wie du Zelt oder Tarp hinstellst, damit der Wind nicht dagegen drückt.",
    refreshAria: "Windwerte neu laden",
    shapeGroupAria: "Bauart wählen",
    shape: {
      tunnel: "Tunnel- oder Firstzelt",
      dome: "Kuppelzelt",
      tarp: "Tarp",
    },
    shapeHint: {
      tunnel:
        "Das schmale Ende zeigt in den Wind – so streicht er über die lange Seite ab.",
      dome: "Der Eingang liegt windabgewandt, sonst bläht sich das Zelt beim Öffnen auf.",
      tarp: "Die tiefe Kante zeigt in den Wind, die offene Seite weg davon.",
    },
    loading: "Windwerte werden geladen …",
    loadFailed:
      "Die Windwerte waren gerade nicht abrufbar. Versuch es gleich nochmals.",
    roseAria: (from: string, point: string) =>
      `Wind aus ${from}, Zeltspitze nach ${point} ausrichten`,
    windFromLabel: "Wind aus",
    speedLabel: "Stärke",
    speedValue: (speed: number, gust: number) =>
      `${speed} km/h, Böen ${gust} km/h`,
    pointLabel: "Spitze nach",
    levelHint: {
      calm: "Wenig Wind – die Ausrichtung ist Feinschliff.",
      breezy:
        "Spürbarer Wind: Abspannleinen straff ziehen, Heringe tief setzen.",
      windy:
        "Kräftige Böen: alle Abspannungen setzen, lose Sachen sichern, Vorzelt lieber einpacken.",
      storm:
        "Sturmböen: Wenn möglich einen geschützten Platz suchen. Ein Zelt hält solche Böen selten aus.",
    },
    startCompass: "Kompass starten",
    noCompass:
      "Ohne Kompass zeigt dieses Gerät nur die Himmelsrichtung – die Empfehlung gilt trotzdem.",
    compassDenied:
      "Der Zugriff auf den Kompass ist gesperrt. Die Empfehlung als Himmelsrichtung gilt weiterhin.",
    alignedNow: "Passt – so steht das Zelt richtig zum Wind.",
    turnLeft: (deg: number) => `Noch ${deg}° nach links drehen.`,
    turnRight: (deg: number) => `Noch ${deg}° nach rechts drehen.`,
    source: "Windwerte von Open-Meteo, Faustregeln fürs Aufstellen.",
  },
  briefing: {
    title: "Morgen-Briefing",
    sectionAria: "Morgen-Briefing zum laufenden Aufenthalt",
    astroLine: (phase: string, percent: number) =>
      `${phase} – der Mond ist zu ${percent} % beleuchtet.`,
    moreTasks: (count: number) =>
      count === 1 ? "und 1 weitere Aufgabe" : `und ${count} weitere Aufgaben`,
  },
  guestbook: {
    title: "Gästebuch",
    toggleAria: (trip: string) => `Gästebuch von ${trip} öffnen`,
    hint: "Grüsse und Erinnerungen zur Reise – von Mitreisenden und von allen, die den Teil-Link haben.",
    empty: "Noch kein Eintrag. Schreib den ersten Gruss.",
    count: (total: number) => (total === 1 ? "1 Eintrag" : `${total} Einträge`),
    messagePlaceholder: "Dein Gruss …",
    messageAria: "Gästebuch-Eintrag",
    messageRequired: "Ohne Text kein Eintrag.",
    addButton: "Eintragen",
    added: "Eintrag gespeichert",
    addFailed: "Eintrag konnte nicht gespeichert werden",
    removed: "Eintrag gelöscht",
    removeFailed: "Eintrag konnte nicht gelöscht werden",
    removeAria: (author: string) => `Eintrag von ${author} löschen`,
    guestFallback: "Gast",
    viaLink: "über den Teil-Link",
    noPhoto: "Ohne Bild",
    photoOption: (index: number) => `Foto ${index}`,
    photoSelectAria: "Foto aus der Reise-Galerie anhängen",
    photoAlt: (author: string) => `Foto zum Eintrag von ${author}`,
    photoGone: "Das angehängte Foto wurde gelöscht.",
    nameLabel: "Dein Name",
    namePlaceholder: "z. B. Oma Vreni",
    guestHint:
      "Du bist nicht angemeldet – dein Eintrag erscheint als Gast. Ein Bild kannst du hier nicht anhängen.",
    guestAdded: "Danke für deinen Gruss!",
  },
  datePoll: {
    title: "Termin-Finder",
    toggleAria: (trip: string) => `Termin-Finder für ${trip} öffnen`,
    hint: "Schlag Zeiträume vor und antwortet je Vorschlag mit Ja, Vielleicht oder Nein. Ein Termin ohne Absage gewinnt – auch mit weniger Ja.",
    empty:
      "Noch kein Vorschlag. Trag einen Zeitraum ein, dann können alle antworten.",
    startLabel: "Anreise",
    endLabel: "Abreise",
    notePlaceholder: "Notiz, z. B. «Brückentag»",
    noteAria: "Notiz zum Vorschlag",
    addButton: "Vorschlagen",
    added: "Vorschlag hinzugefügt",
    addFailed: "Vorschlag konnte nicht gespeichert werden",
    rangeInvalid: "Die Abreise muss nach der Anreise liegen.",
    removed: "Vorschlag gelöscht",
    removeFailed: "Vorschlag konnte nicht gelöscht werden",
    removeAria: (range: string) => `Vorschlag ${range} löschen`,
    voteFailed: "Antwort konnte nicht gespeichert werden",
    voteGroupAria: "Deine Antwort zu diesem Zeitraum",
    voteLabel: { yes: "Ja", maybe: "Vielleicht", no: "Nein" },
    nights: (count: number) => (count === 1 ? "1 Nacht" : `${count} Nächte`),
    unanimous: "Alle dafür",
    leadingAria: "Führt zurzeit",
    missing: (names: string) => `Fehlt noch: ${names}`,
    progress: (answered: number, expected: number) =>
      `${answered} von ${expected} Antworten`,
    decided: (range: string) =>
      `Alle haben geantwortet – ${range} liegt vorn und wäre der Termin.`,
    applyButton: "Als Reisedatum übernehmen",
    applied: "Reisedatum übernommen",
    applyFailed: "Reisedatum konnte nicht übernommen werden",
    currentDate: "Aktuelles Reisedatum",
    maxReached: (max: number) =>
      `Mehr als ${max} Vorschläge beantwortet niemand mehr – lösch einen, um Platz zu machen.`,
  },
  boxes: {
    saveImageButton: "Als Bild sichern",
    saveImageDone: "Etikett als Bild gespeichert",
    saveImageFailed: "Bild konnte nicht erzeugt werden",
    printFallbackHint:
      "Auf dem iPhone druckt eine installierte App nicht direkt – dort «Als Bild sichern» wählen und aus der Fotos-App drucken oder teilen.",
    title: "Kisten",
    subtitle:
      "Welche Ausrüstung liegt in welcher Box – mit Etikett und QR-Code zum Ausdrucken.",
    loginFeature: "die Kisten-Verwaltung",
    addBox: "Neue Kiste",
    editBox: "Kiste bearbeiten",
    dialogHint:
      "Die Kennung steht gross auf dem Etikett und im QR-Code. Kurz halten – «K3» liest sich aus zwei Metern.",
    codeLabel: "Kennung",
    nameLabel: "Name",
    namePlaceholder: "z. B. Küche",
    locationLabel: "Standort zuhause",
    locationPlaceholder: "z. B. Keller, Regal links",
    notesLabel: "Notizen",
    saved: "Kiste gespeichert",
    removed: "Kiste gelöscht – die Ausrüstung bleibt erhalten",
    removeConfirm: (name: string) =>
      `Kiste «${name}» wirklich löschen? Die Ausrüstung darin bleibt bestehen und ist danach keiner Kiste zugeordnet.`,
    empty:
      "Noch keine Kiste angelegt. Leg eine an, druck das Etikett auf und kleb es auf die Box.",
    boxEmpty: "Diese Kiste ist noch leer.",
    summary: (count: number, weight: string) =>
      count === 1 ? `1 Stück · ${weight}` : `${count} Stück · ${weight}`,
    removeFromBox: "Ausräumen",
    looseTitle: "Noch in keiner Kiste",
    looseHint: "Ausrüstung aus deinem Inventar, die keiner Box zugeordnet ist.",
    assignPlaceholder: "In Kiste legen …",
    assignAria: (name: string) => `${name} einer Kiste zuordnen`,
    labelButton: "Etikett",
    labelTitle: "Etikett drucken",
    labelHint:
      "Vier gleiche Etiketten pro Blatt – aufkleben, und ein Kamera-Scan zeigt später den Inhalt.",
    printButton: "Drucken",
    qrAlt: (code: string) => `QR-Code für Kiste ${code}`,
    unknownCode: (code: string) =>
      `Zur Kennung «${code}» gibt es keine Kiste. Vielleicht wurde sie gelöscht oder gehört zu einem anderen Konto.`,
  },
  picnicStops: {
    sectionAria: "Rastmöglichkeiten entlang der Anfahrt",
    title: "Rast unterwegs",
    subtitle: "Picknickplätze und Tische auf dem Weg zum Platz.",
    subtitleAtPlace: (place: string) =>
      `Picknickplätze und Tische auf dem Weg nach ${place}.`,
    startLabel: "Start",
    startGroupAria: "Startpunkt der Fahrt wählen",
    startHome: "Heim-Standort",
    startCurrent: "Aktueller Standort",
    radiusLabel: "Korridor",
    radiusGroupAria: "Breite des Korridors wählen",
    radiusOption: (km: number) => `${km} km`,
    searchButton: "Rast suchen",
    lineHint:
      "Gesucht wird entlang der Luftlinie, nicht entlang der Strasse – im Gebirge kann die Fahrt weiter ausholen.",
    locating: "Standort wird bestimmt …",
    loading: "Raststellen werden gesucht …",
    noHome:
      "Für den Start brauchst du einen Heim-Standort im Profil – oder du wählst «Aktueller Standort».",
    noPosition:
      "Dein Standort war nicht zu ermitteln. Erlaube den Zugriff oder wähle den Heim-Standort als Start.",
    loadFailed:
      "Die Raststellen konnten gerade nicht geladen werden. Overpass ist ein freier Dienst und bremst bei zu vielen Anfragen – versuch es in ein paar Minuten nochmals.",
    empty: (km: number) =>
      `Im Korridor von ${km} km entlang der Strecke ist in OpenStreetMap keine Raststelle eingetragen. Versuch es mit einem breiteren Korridor.`,
    resultCount: (n: number, km: number) =>
      n === 1 ? `1 Raststelle auf ${km} km` : `${n} Raststellen auf ${km} km`,
    kmMark: (along: number, total: number) => `km ${along} von ${total}`,
    offsetHint: (value: string) => `${value} neben der Strecke`,
    kind: {
      site: "Picknickplatz",
      table: "Picknicktisch",
    },
    kindHint: {
      site: "eingerichteter Rastplatz",
      table: "einzelner Tisch am Wegrand",
    },
    covered: "gedeckt",
    fireplace: "Feuerstelle",
    drinkingWater: "Trinkwasser",
    navButton: "Hinnavigieren",
    navAria: (name: string) => `Navigation zu ${name}`,
    source: "Daten aus OpenStreetMap, gepflegt von Freiwilligen.",
  },
  firepits: {
    sectionAria: "Offizielle Feuer- und Grillstellen in der Nähe",
    title: "Feuerstellen in der Nähe",
    subtitle: "Offizielle Feuer- und Grillstellen rund um deinen Standort.",
    subtitleAtPlace: (place: string) =>
      `Offizielle Feuer- und Grillstellen rund um ${place}.`,
    radiusLabel: "Umkreis",
    radiusGroupAria: "Suchradius wählen",
    radiusOption: (km: number) => `${km} km`,
    loading: "Feuerstellen werden gesucht …",
    loadFailed:
      "Die Feuerstellen konnten gerade nicht geladen werden. Overpass ist ein freier Dienst und bremst bei zu vielen Anfragen – versuch es in ein paar Minuten nochmals.",
    empty: (km: number) =>
      `Im Umkreis von ${km} km ist in OpenStreetMap keine Feuer- oder Grillstelle eingetragen. Versuch es mit einem grösseren Umkreis.`,
    resultCount: (n: number) =>
      n === 1 ? "1 Stelle gefunden" : `${n} Stellen gefunden`,
    kind: {
      firepit: "Feuerstelle",
      bbq: "Grillstelle",
    },
    kindHint: {
      firepit: "offene Feuerstelle",
      bbq: "fest installierter Grill",
    },
    covered: "gedeckt",
    firewood: "Brennholz vor Ort",
    drinkingWater: "Trinkwasser",
    distanceAway: (value: string) => `${value} entfernt`,
    navButton: "Hinnavigieren",
    navAria: (name: string) => `Navigation zu ${name}`,
    fireDangerLink: "Waldbrandgefahr und Feuerverbote ansehen",
    fireDangerShort: "Waldbrandgefahr prüfen",
    source:
      "Daten aus OpenStreetMap über die Overpass-API – abgefragt nur auf deinen Klick. Eigenschaften stehen nur dort, wo sie in OSM gepflegt sind.",
  },

  /** Spiel- und Badeplätze aus OpenStreetMap (#248). */
  routeWeather: {
    sectionAria: "Unwetter auf der Fahrtstrecke",
    title: "Wetter auf der Fahrt",
    subtitle: "Was dich unterwegs erwartet – nicht nur am Ziel.",
    subtitleAtPlace: (place: string) =>
      `Was dich auf dem Weg nach ${place} erwartet – nicht nur am Ziel.`,
    startGroupAria: "Startpunkt wählen",
    startHome: "Ab Heimatort",
    startCurrent: "Ab Standort",
    departureLabel: "Abfahrt",
    loading: "Wetter entlang der Strecke wird geholt …",
    loadFailed:
      "Das Wetter entlang der Strecke konnte nicht geladen werden – bitte später nochmals versuchen.",
    noStart:
      "Kein Startpunkt: Hinterlege im Profil einen Heimatort oder erlaube den Standort.",
    tooShort: (km: number) =>
      `Unter ${km} km lohnt die Streckenprüfung nicht – da genügt die Warnung am Ziel.`,
    summary: (distance: string, minutes: number) =>
      `${distance} Luftlinie, geschätzt ${Math.floor(minutes / 60)} Std. ${minutes % 60} Min. Fahrt.`,
    allClear:
      "Auf der ganzen Strecke ist zur geschätzten Zeit nichts Auffälliges.",
    worstLine: {
      info: "Kleinigkeiten unterwegs – nichts, was die Fahrt betrifft.",
      warnung:
        "Unterwegs ist mit ungemütlichem Wetter zu rechnen. Zeitpunkt verschieben oder Pause einplanen.",
      gefahr:
        "Auf der Strecke droht Unwetter. Wenn möglich später losfahren – im Gewitter mit Anhänger oder Wohnwagen hat niemand etwas gewonnen.",
    },
    risk: {
      gewitter: "Gewitter",
      sturm: "Sturmböen",
      regen: "Starkregen",
      schnee: "Schnee",
    },
    riskNone: "Ruhig",
    kmMark: (km: number) => `km ${km}`,
    gusts: (kmh: number) => `${kmh} km/h`,
    methodNote: (speed: number) =>
      `Geprüft werden bis zu acht Punkte entlang der Luftlinie, jeweils für die geschätzte Ankunftszeit. Gerechnet wird mit ${speed} km/h über die Luftlinie – das ist eine grobe Schätzung und kein Routenplaner.`,
    source: "Daten: Open-Meteo",
  },
  packHistory: {
    sectionAria: "Packvorschlag aus vergangenen Reisen",
    title: "Letztes Mal dabei gehabt",
    subtitle: (trips: number) =>
      trips === 1
        ? "Aus deiner letzten Reise an diesem Platz – noch nicht auf dieser Liste."
        : `Aus deinen letzten ${trips} Reisen an diesem Platz – noch nicht auf dieser Liste.`,
    everyTime: "jedes Mal",
    tripCount: (n: number, of: number) => `${n} von ${of}`,
    addAria: (name: string) => `${name} zur Liste hinzufügen`,
    addAll: (n: number) => `Alle ${n} übernehmen`,
    note: "Vorgeschlagen wird nur, was auf früheren Listen dieses Platzes wirklich stand – keine Standardliste, sondern deine eigene Erfahrung.",
  },
  spotRating: {
    sectionAria: "Eigene Bewertung dieses Platzes",
    title: "Deine Bewertung",
    subtitle:
      "Vier Kriterien einzeln – so weisst du beim nächsten Mal, warum dir der Platz gefallen hat.",
    overall: (value: string, rated: number, total: number) =>
      `Ø ${value} (${rated} von ${total} bewertet)`,
    notRated: "Noch nicht bewertet – nochmals antippen nimmt es zurück.",
    starAria: (stars: number, criterion: string) =>
      `${criterion}: ${stars} von 5 Sternen`,
    saveFailed: "Die Bewertung konnte nicht gespeichert werden.",
    note: "Ein Kriterium darf leer bleiben. Wer im Regen nie draussen sass, kann den Schatten nicht beurteilen – eine erfundene Drei ist schlechter als eine ehrliche Lücke.",
    compareTitle: "Nach Kriterium vergleichen",
    compareAll: "Gesamt",
    compareEmpty: "Noch kein Platz bewertet.",
    unrated: "–",
  },
  sharedTrack: {
    loading: "Wanderung wird geladen …",
    notFoundTitle: "Wanderung nicht gefunden",
    invalidLink:
      "Dieser Link ist ungültig oder abgelaufen. Frag die Person, die ihn geschickt hat, nach einem neuen.",
    backHome: "Zur Startseite",
    distance: "Strecke",
    duration: "Dauer",
    ascent: "Aufstieg",
    descent: "Abstieg",
    download: "Als GPX herunterladen",
    note: "Geteilte Ansicht – Karte und Profil stammen aus der Aufzeichnung. Für die Übersicht wurde die Punktreihe ausgedünnt.",
  },
  parking: {
    title: "Auto",
    targetName: "Auto",
    empty: "Noch kein Standort gemerkt. Ein Tipp beim Aussteigen genügt.",
    park: "Auto hier parkiert",
    reparked: "Neu hier parkiert",
    parkedToast: "Auto-Standort gemerkt.",
    parkedSince: (time: string, duration: string) =>
      `Seit ${time} hier – ${duration}.`,
    durationHours: (h: number, m: number) => `${h} h ${m} min`,
    durationMinutes: (m: number) => `${m} min`,
    limit: "Parkzeit:",
    limitNone: "ohne",
    limitLabel: (minutes: number) =>
      minutes < 60 ? `${minutes} min` : `${minutes / 60} h`,
    remaining: (duration: string) => `Noch ${duration} Parkzeit.`,
    expired: "Parkzeit abgelaufen.",
    noteLabel: "Notiz zum Standort",
    notePlaceholder: "z. B. Ebene 3, Reihe C",
    navigate: "Zurück zum Auto",
    forgetAria: "Auto-Standort löschen",
    forgotten: "Auto-Standort gelöscht.",
  },
  tripTemplates: {
    button: "Aus Vorlage",
    title: "Reise aus Vorlage",
    description:
      "Dauer, Packliste und Menüplan in einem Schritt. Danach ist alles ganz normal änderbar.",
    nights: (n: number) => (n === 1 ? "1 Nacht" : `${n} Nächte`),
    startLabel: "Anreise",
    endLine: (end: string) => `Abreise: ${end}`,
    spotLabel: "Zeltplatz",
    spotFree: "Ort frei eintragen",
    locationLabel: "Ort",
    locationPlaceholder: "z. B. Camping Waldheim",
    placeMissing: "Bitte einen Zeltplatz wählen oder einen Ort eintragen.",
    withPackList: "Packliste anlegen",
    withMenu: "Menüplan vorfüllen",
    menuNote:
      "Vorgefüllt werden Abendessen für jede Nacht und Frühstück ab dem zweiten Tag. Mittagessen bleiben frei – unterwegs isst man mittags, was der Tag hergibt.",
    create: "Reise anlegen",
    created: (end: string, meals: number, list: boolean) =>
      `Reise bis ${end} angelegt${list ? ", Packliste erstellt" : ""}${
        meals > 0 ? `, ${meals} Mahlzeiten eingetragen` : ""
      }.`,
    createFailed: "Die Reise konnte nicht angelegt werden.",
  },
  departure: {
    title: "Beste Abfahrtszeit",
    intro:
      "Wann losfahren, um zur Check-in-Zeit da zu sein – Pausen eingerechnet.",
    openButton: "Abfahrt berechnen",
    loginNote: "Dafür musst du angemeldet sein.",
    noHome: "Für die Rechnung fehlt dein Heim-Standort.",
    noHomeLink: "Im Profil setzen",
    arrivalLabel: "Ankunft / Check-in",
    profileLabel: "Wer fährt mit?",
    profiles: {
      keine: "Ohne Pausen",
      erwachsene: "Erwachsene (alle 3 h)",
      kinder: "Mit Kindern (alle 2 h)",
      kleinkinder: "Mit Kleinkindern (alle 1,5 h)",
    },
    departureLabel: "Losfahren",
    departureDayBefore: (days: number) =>
      days === 1 ? "Losfahren – am Vortag" : `Losfahren – ${days} Tage vorher`,
    driveLine: (distance: string) => `Fahrt (${distance} Luftlinie)`,
    breaksLine: (count: number, each: number) =>
      count === 0
        ? "Keine Pause nötig"
        : count === 1
          ? `1 Pause à ${each} min`
          : `${count} Pausen à ${each} min`,
    bufferLine: "Puffer für Schranke und Anmeldung",
    totalLine: "Gesamt unterwegs",
    stopsLine: (times: string) => `Pausen etwa um ${times}.`,
    note: "Geschätzt über die Luftlinie mit 70 km/h Schnitt – kein Routenplaner. Stau, Baustellen und Grenzwartezeiten kommen dazu.",
  },
  routePlan: {
    sectionAria: "Route vorher zeichnen",
    title: "Route zeichnen",
    intro:
      "Tippe auf die Karte, um Wegpunkte zu setzen. Länge, Höhenmeter und Gehzeit rechnet die App daraus.",
    mapAria: "Karte zum Setzen von Wegpunkten",
    mapFailed: "Die Karte konnte nicht geladen werden.",
    hint: "Setze mindestens zwei Wegpunkte.",
    undo: "Letzten Punkt zurück",
    clear: "Alles löschen",
    loadElevation: "Höhen holen",
    elevationFailed: "Die Höhen konnten nicht geholt werden.",
    noElevationYet:
      "Ohne Höhen rechnet die Gehzeit nur mit der Strecke – hol die Höhen, sonst ist die Zahl zu optimistisch.",
    length: "Länge",
    elevation: "Höhenmeter",
    walkingTime: "Gehzeit",
    pace: "Tempo:",
    paceLabels: { slow: "Gemütlich", normal: "Normal", fast: "Zügig" },
    note: "Geschätzt nach dem üblichen Wanderzeit-Verfahren (4 km/h, 300 Hm Aufstieg, 500 Hm Abstieg pro Stunde), ohne Pausen. Gerechnet wird der Luftlinien-Verlauf zwischen deinen Punkten, nicht der Weg.",
    nameLabel: "Name",
    namePlaceholder: "z. B. Runde um den See",
    tripLabel: "Zu einer Reise",
    tripNone: "Ohne Reise",
    save: "Route speichern",
    update: "Route aktualisieren",
    saved: "Route gespeichert.",
    saveFailed: "Die Route konnte nicht gespeichert werden.",
    nameMissing: "Gib der Route einen Namen.",
    removeFailed: "Die Route konnte nicht gelöscht werden.",
    savedTitle: "Gespeicherte Routen",
    summary: (distance: string, ascent: number, time: string) =>
      `${distance} · ↑${ascent} m · ${time}`,
    removeAria: (name: string) => `Route ${name} löschen`,
  },
  trackProfile: {
    sectionAria: "Höhenprofil und Zwischenzeiten",
    title: "Höhenprofil",
    rangeLine: (min: number, max: number) => `${min}–${max} m ü. M.`,
    chartAria: "Höhenverlauf über die Strecke",
    noElevation:
      "Dieses Gerät hat zur Aufzeichnung keine Höhen geliefert – das Diagramm fehlt deshalb.",
    tooltipElevation: "Höhe",
    tooltipDistance: (km: string) => `bei ${km} km`,
    splitsTitle: "Zwischenzeiten",
    kmLabel: (km: number) => `km ${km}`,
    kmPartial: "Rest",
    climbLine: (up: number, down: number) => `↑${up} m ↓${down} m`,
    note: "Die Höhe steht über der Strecke und nicht über der Zeit – sonst sähe jede Pause wie eine Ebene aus. Der letzte, angebrochene Kilometer ist als «Rest» gekennzeichnet.",
  },
  reservation: {
    title: "Reservation",
    empty: "Noch keine Buchungsbestätigung hinterlegt.",
    add: "Bestätigung hinzufügen",
    replace: "Ersetzen",
    openImage: "Bestätigung ansehen",
    openPdf: "PDF öffnen",
    removeAria: "Buchungsbestätigung löschen",
    uploaded: "Bestätigung gespeichert.",
    uploadFailed: "Die Bestätigung konnte nicht gespeichert werden.",
    removeFailed: "Die Bestätigung konnte nicht gelöscht werden.",
    tooLarge: "Die Datei ist zu gross (max. 10 MB).",
    offlineNote:
      "Foto oder PDF. Einmal geöffnet, bleibt die Bestätigung auch ohne Empfang abrufbar – praktisch an der Schranke um 22 Uhr.",
  },
  shops: {
    sectionAria: "Einkaufen in der Nähe",
    title: "Einkaufen in der Nähe",
    subtitle: "Supermarkt, Bäckerei und Hofladen rund um deinen Standort.",
    subtitleAtPlace: (place: string) =>
      `Supermarkt, Bäckerei und Hofladen rund um ${place}.`,
    radiusLabel: "Umkreis",
    radiusGroupAria: "Suchradius wählen",
    radiusOption: (km: number) => `${km} km`,
    loading: "Läden werden gesucht …",
    loadFailed:
      "Die Läden konnten gerade nicht geladen werden – bitte später nochmals versuchen.",
    empty: (km: number) =>
      `Im Umkreis von ${km} km ist in OpenStreetMap kein Laden erfasst.`,
    resultCount: (n: number) =>
      n === 1 ? "1 Laden gefunden" : `${n} Läden gefunden`,
    distanceAway: (distance: string) => `${distance} Luftlinie`,
    kind: {
      supermarket: "Supermarkt",
      convenience: "Quartierladen",
      bakery: "Bäckerei",
      farm: "Hofladen",
      butcher: "Metzgerei",
    },
    openNow: "Jetzt offen",
    closedNow: "Jetzt geschlossen",
    checkHours: "Zeiten prüfen",
    todayHours: (hours: string) => `Heute ${hours}`,
    noHours: "Öffnungszeiten nicht erfasst",
    navButton: "Route",
    navAria: (name: string) => `Route zu ${name}`,
    website: "Website",
    hoursNote:
      "Die Öffnungszeiten kommen aus OpenStreetMap und können veraltet sein. Wo die Angabe zu verschachtelt ist (Feiertage, Saison, Mittagspause mit Kommentar), steht «Zeiten prüfen» statt einer Vermutung – dann gilt die Rohangabe daneben.",
    source: "Daten: OpenStreetMap-Mitwirkende (ODbL)",
  },
  familyPlaces: {
    sectionAria: "Spielplätze und Badeplätze in der Nähe",
    title: "Für Familien in der Nähe",
    subtitle: "Spielplätze und Badeplätze rund um deinen Standort.",
    subtitleAtPlace: (place: string) =>
      `Spielplätze und Badeplätze rund um ${place}.`,
    radiusLabel: "Umkreis",
    radiusGroupAria: "Suchradius wählen",
    radiusOption: (km: number) => `${km} km`,
    loading: "Spiel- und Badeplätze werden gesucht …",
    loadFailed:
      "Die Spiel- und Badeplätze konnten gerade nicht geladen werden. Overpass ist ein freier Dienst und bremst bei zu vielen Anfragen – versuch es in ein paar Minuten nochmals.",
    empty: (km: number) =>
      `Im Umkreis von ${km} km ist in OpenStreetMap kein Spiel- oder Badeplatz eingetragen. Versuch es mit einem grösseren Umkreis.`,
    resultCount: (n: number) =>
      n === 1 ? "1 Ort gefunden" : `${n} Orte gefunden`,
    kind: {
      playground: "Spielplatz",
      bathing: "Badeplatz",
    },
    minAge: (years: number) => `ab ${years} Jahren`,
    maxAge: (years: number) => `bis ${years} Jahre`,
    ageRange: (min: number, max: number) => `${min}–${max} Jahre`,
    fenced: "eingezäunt",
    covered: "gedeckt",
    supervised: "Aufsicht",
    feePaid: "kostenpflichtig",
    feeFree: "gratis",
    distanceAway: (value: string) => `${value} entfernt`,
    navButton: "Hinnavigieren",
    navAria: (name: string) => `Navigation zu ${name}`,
    bathingNote: (section: string) =>
      `Die Wassertemperatur an deinem Platz steht im Abschnitt «${section}». Baden bleibt Eigenverantwortung – schau dir die Stelle vor dem Sprung an.`,
    bathingNoteShort: "Baden auf eigene Verantwortung",
    source:
      "Daten aus OpenStreetMap über die Overpass-API – abgefragt nur auf deinen Klick. Angaben zu Alter, Zaun, Aufsicht und Eintritt stehen nur dort, wo sie in OSM gepflegt sind.",
  },

  /** Dunkelheitskarte pro Platz (#239). */
  darkSky: {
    sectionAria: "Geschätzte Dunkelheit des Himmels an diesem Ort",
    title: "Dunkler Himmel",
    badge: (bortle: number) => `Bortle ${bortle}`,
    subtitle: "Wie dunkel ist der Himmel an deinem Standort?",
    subtitleAtPlace: (place: string) =>
      `Wie dunkel ist der Himmel bei ${place}?`,
    outsideCoverage:
      "Für diesen Ort liegen keine Lichtquellen-Daten vor – der Datensatz deckt die Schweiz und das grenznahe Ausland ab. Eine Einstufung wäre hier geraten, deshalb zeigt CampMesser lieber keine.",
    scaleAria: (bortle: number) =>
      `Bortle-Skala von 1 (sehr dunkel) bis 9 (Innenstadt), geschätzte Stufe ${bortle}`,
    scaleDark: "dunkel",
    scaleBright: "hell",
    classLine: (bortle: number, label: string) => `Bortle ${bortle} · ${label}`,
    locating: "Standort wird bestimmt …",
    noLocation:
      "Für die Einstufung braucht CampMesser deinen Standort – gib die Ortung frei oder speichere einen Zeltplatz.",
    tonightTitle: "Heute Nacht",
    tonightLoading: "Bewölkung wird geladen …",
    tonightWorthIt:
      "Heute Nacht lohnt es sich besonders: dunkler Himmel, klare Nacht und wenig Mondlicht kommen zusammen. Nimm dir 20 Minuten fürs Dunkelwerden der Augen.",
    tonightClouds: (percent: number) =>
      `Für heute Nacht sind rund ${percent} % Bewölkung gemeldet – warte lieber auf eine klarere Nacht.`,
    tonightMoon: (percent: number) =>
      `Der Mond ist zu ${percent} % beleuchtet und überstrahlt die schwachen Sterne. Für die Milchstrasse sind die Nächte um Neumond die besseren.`,
    tonightBrightSky:
      "Die Nacht ist klar und der Mond stört kaum – nur ist der Himmel hier zu hell für schwache Sterne. Mond, Planeten und ISS-Überflüge lohnen sich trotzdem.",
    tonightUnknown:
      "Für heute Nacht liegt gerade keine Bewölkungs-Prognose vor.",
    cloudLine: (percent: number) => `Bewölkung ab 21 Uhr: rund ${percent} %`,
    moonLine: (percent: number) => `Mond: ${percent} % beleuchtet`,
    astroLink: "Zum Sternenhimmel im Natur-Modul",
    nearestTitle: "Nächste Lichtquellen:",
    nearestItem: (name: string, distance: string) => `${name} ${distance}`,
    estimateNote:
      "Schätzung, keine Messung: Eine frei abrufbare Messung der Himmelshelligkeit gibt es nicht. CampMesser rechnet die Einstufung aus der Distanz zu den grössten Städten und Agglomerationen. Berge, die eine Lichtglocke abschirmen, Flutlicht gleich nebenan oder feuchte Luft kennt die Formel nicht – vor Ort kann es dunkler oder heller sein.",
  },

  /**
   * Ausflugfinder-Anbindung (#271): Beschriftungen rund um die Ausflugsziele
   * aus der eigenen Ausflugfinder-App. Die Inhalte der Ziele selbst (Name,
   * Beschreibung, Kategorien) sind Nutzerdaten und bleiben Deutsch.
   */
  excursions: {
    sectionAria: "Ausflugsziele in der Nähe dieses Platzes",
    title: "Ausflüge in der Nähe",
    subtitle: "Was kannst du in der Umgebung unternehmen?",
    subtitleAtPlace: (place: string) =>
      `Was kannst du rund um ${place} unternehmen?`,
    toggleOpen: "Ausflüge anzeigen",
    toggleClose: "Ausflüge ausblenden",
    loading: "Ausflüge werden geladen …",
    loadFailed:
      "Die Ausflüge konnten gerade nicht geladen werden. Versuch es später nochmals.",
    empty:
      "In deiner Ausflugfinder-App ist noch kein Ziel mit Koordinaten erfasst.",
    resultCount: (n: number) =>
      n === 1 ? "1 Ziel in der Nähe" : `${n} Ziele in der Nähe`,
    kind: "Ausflugsziel",
    distanceAway: (value: string) => `${value} Luftlinie`,
    costFree: "gratis",
    costLabel: "Kosten",
    costAria: (level: number) => `Kostenstufe ${level} von 4`,
    detailsShow: "Details",
    detailsHide: "Details schliessen",
    navButton: "Navigation",
    navAria: (name: string) => `Navigation zu ${name}`,
    websiteLink: "Website",
    mapLink: "Auf der Karte zeigen",
    photoAlt: (name: string) => `Bild von ${name}`,
    addressLabel: "Adresse",
    niceToKnowLabel: "Gut zu wissen",
    openingHoursLabel: "Öffnungszeiten",
    parkingLabel: "Parkplatz",
    parkingFree: "gratis",
    parkingPaid: "kostenpflichtig",
    ageLabel: "Empfohlen",
    babiesOk: "Mit Baby machbar",
    lengthLabel: "Länge",
    lengthKm: (km: string) => `${km} km`,
    tourLoop: "Rundtour",
    tourAToB: "Von A nach B",
    seasonsLabel: "Saison",
    season: {
      spring: "Frühling",
      summer: "Sommer",
      autumn: "Herbst",
      winter: "Winter",
    },
    source: "Aus deiner Ausflugfinder-App",
  },

  recipes: {
    title: "Campfire-Rezeptbuch",
    subtitle:
      "Einfache Rezepte für Gaskocher und offenes Feuer – filterbar nach Zutaten und Zeit.",
    offlineNote:
      "Alle Rezepte sind in der App gespeichert und ohne Internetverbindung nutzbar.",
    searchPlaceholder: "Nach Rezept oder Zutat suchen (z. B. «Bohnen») …",
    searchAria: "Nach Rezept oder Zutat suchen",
    methodFilterAria: "Nach Kochmethode filtern",
    timeFilterAria: "Nach Zubereitungszeit filtern",
    filterAll: "Alle",
    timeAny: "Beliebig",
    timeMax: (n: number) => `≤ ${n} Min.`,
    minutes: (n: number) => `${n} Min.`,
    servings: (n: number) => `${n} Portionen`,
    createOwn: "Eigenes Rezept erstellen",
    openRecipeAria: (name: string) => `Rezept ${name} öffnen`,
    photoAlt: (name: string) => `Foto: ${name}`,
    ownBadge: "Eigenes",
    onePotBadge: "One-Pot",
    kidsBadge: "Kinder",
    emptyState:
      "Keine Rezepte gefunden – versuche andere Filter oder Suchbegriffe.",
    ingredientsTitle: "Zutaten",
    stepsTitle: "Zubereitung",
    tipTitle: "Tipp",
    deleteConfirm: (name: string) => `Rezept «${name}» wirklich löschen?`,
    favoritesFilter: "Favoriten",
    favoriteAria: (name: string) => `${name} als Favorit speichern`,
    unfavoriteAria: (name: string) => `${name} aus den Favoriten entfernen`,
    favoriteSave: "Als Favorit speichern",
    favoriteSaved: "Favorit",
    favoritesEmpty:
      "Noch keine Favoriten – tippe auf das Herz eines Rezepts, um es hier zu sammeln.",
    randomButton: "Würfeln",
    randomAria: "Zufälliges Rezept aus der gefilterten Auswahl öffnen",
    randomAgain: "Nochmals würfeln",
    cookingMode: "Kochmodus",
    cookingModeAria: (name: string) => `Kochmodus für ${name} starten`,
    cookingStepProgress: (current: number, total: number) =>
      `Schritt ${current} von ${total}`,
    cookingPrev: "Zurück",
    cookingNext: "Weiter",
    cookingDone: "Fertig",
    cookingIngredientsShow: "Zutaten anzeigen",
    cookingIngredientsHide: "Zutaten ausblenden",
    shareButton: "Teilen",
    shareAria: (name: string) => `Rezept ${name} per Link teilen`,
    shareTitle: "Rezept teilen",
    shareDescription:
      "Wer den Link kennt, sieht das Rezept und kann es übernehmen. Dein Rezept-Foto bleibt privat.",
    shareCopied: "Teil-Link kopiert",
    shareFailed: "Teil-Link konnte nicht erzeugt werden",
    shareQrTitle: "QR-Code",
    shareQrText: "Am Lagerfeuer abscannen lassen – schneller als tippen.",
    shareQrAlt: (name: string) => `QR-Code zum geteilten Rezept ${name}`,
    unshareButton: "Teilen beenden",
    unshared: "Teil-Link zurückgezogen",
    unshareFailed: "Teil-Link konnte nicht zurückgezogen werden",
    destockButton: "Zutaten aus der Kühlbox austragen",
    destockAria: (name: string) =>
      `Zutaten von ${name} aus der Kühlbox austragen`,
    destockTitle: "Aus der Kühlbox austragen",
    destockDescription:
      "Diese Vorräte passen zu den Zutaten des Rezepts. Wähle aus, was du aufgebraucht hast.",
    destockMatchedBy: (ingredient: string) => `passt zu «${ingredient}»`,
    destockNoMatches:
      "Keine passenden Einträge in deiner Kühlbox – hier gibt es nichts auszutragen.",
    destockConfirm: (n: number) =>
      n === 1 ? "1 Eintrag austragen" : `${n} Einträge austragen`,
    destockDone: (n: number) =>
      n === 1
        ? "1 Eintrag aus der Kühlbox entfernt"
        : `${n} Einträge aus der Kühlbox entfernt`,
    destockFailed: "Einträge konnten nicht entfernt werden",
    editor: {
      titleEdit: "Rezept bearbeiten",
      titleNew: "Eigenes Rezept erstellen",
      description:
        "Dein Rezept erscheint im Rezeptbuch und wird bei den Kühlbox-Vorschlägen berücksichtigt.",
      nameLabel: "Name",
      namePlaceholder: "z. B. Grosis Älplermagronen",
      methodLabel: "Zubereitung",
      difficultyLabel: "Schwierigkeit",
      timeLabel: "Zeit (Minuten)",
      servingsLabel: "Portionen",
      onePot: "One-Pot",
      kidFriendly: "Kinderfreundlich",
      ingredientsLabel: "Zutaten (eine pro Zeile)",
      ingredientsPlaceholder: "400 g Magronen\n200 g Bergkäse\n2 Zwiebeln",
      stepsLabel: "Zubereitung (ein Schritt pro Zeile)",
      stepsPlaceholder:
        "Wasser aufkochen und Magronen garen.\nZwiebeln rösten.\nAlles schichten und Käse schmelzen lassen.",
      tipLabel: "Tipp (optional)",
      tipPlaceholder: "z. B. Mit Apfelmus servieren",
      saved: "Rezept gespeichert",
      updated: "Rezept aktualisiert",
      photoLabel: "Foto (optional)",
      photoChoose: "Foto auswählen",
      photoChange: "Foto ändern",
      photoRemove: "Foto entfernen",
      photoPreviewAlt: "Vorschau des Rezept-Fotos",
      photoHint:
        "JPEG, PNG oder WebP – wird vor dem Hochladen automatisch verkleinert.",
      photoUploading: "Foto wird hochgeladen …",
      photoUploadFailed:
        "Rezept gespeichert, aber das Foto konnte nicht hochgeladen werden.",
      photoTooLarge: "Das Foto ist zu gross (max. 5 MB).",
      photoHeic:
        "HEIC/HEIF kann der Browser nicht lesen – bitte als JPEG exportieren.",
      photoReadFailed: "Das Bild konnte nicht gelesen werden.",
      photoRemoveFailed: "Das Foto konnte nicht entfernt werden.",
    },
  },
  cookTimer: {
    title: "Küchen-Timer",
    hint: "Der Timer läuft weiter, wenn du die Seite wechselst – die Restzeit siehst du unten in der App.",
    quickAria: "Timer-Dauer wählen",
    quickMinutes: (n: number) => `${n} Min.`,
    customLabel: "Eigene Dauer in Minuten",
    customPlaceholder: "Minuten",
    startButton: "Starten",
    invalidMinutes: (max: number) => `Bitte 1 bis ${max} Minuten angeben.`,
    tooMany: (max: number) =>
      `Es laufen bereits ${max} Timer – brich zuerst einen ab.`,
    started: (minutes: number) => `Timer über ${minutes} Min. gestartet`,
    stepTimerAria: (label: string) => `Timer über ${label} starten`,
    runningLabel: "läuft",
    pausedLabel: "pausiert",
    expired: "Fertig – die Zeit ist um!",
    dismiss: "Erledigt",
    dismissAria: (name: string) => `Timer ${name} quittieren`,
    pauseAria: (name: string) => `Timer ${name} pausieren`,
    resumeAria: (name: string) => `Timer ${name} fortsetzen`,
    cancelAria: (name: string) => `Timer ${name} abbrechen`,
    expiredShort: "Fertig",
    pausedShort: "Pause",
    moreCount: (n: number) => `+${n}`,
    barOpenAria: (name: string, time: string) =>
      `Timer ${name}: noch ${time} – zurück zum Rezept`,
    barExpiredAria: (name: string) =>
      `Timer ${name} ist abgelaufen – zurück zum Rezept`,
  },
  servings: {
    question: "Für wie viele Personen?",
    personCount: (n: number) => (n === 1 ? "1 Person" : `${n} Personen`),
    decreaseAria: "Eine Person weniger",
    increaseAria: "Eine Person mehr",
    baseHint: (n: number) =>
      `Grundrezept für ${n === 1 ? "1 Person" : `${n} Personen`}`,
    scaledNote:
      "Die Mengen sind umgerechnet. Zeilen ohne Menge («Salz nach Geschmack») bleiben stehen, wie sie sind.",
    reset: "Zurücksetzen",
    resetAria: "Zurück zur Portionenzahl des Rezepts",
    menuTitle: "Mengen umrechnen",
    menuToggleAria: "Mengen des Menüplans auf eine Personenzahl umrechnen",
    menuOff: "wie im Rezept",
    menuHint:
      "Gilt für die Zutaten-Vorschau und für die Übernahme auf die Einkaufsliste.",
    menuScaledTo: (n: number) =>
      `umgerechnet auf ${n === 1 ? "1 Person" : `${n} Personen`}`,
  },
  converter: {
    openButton: "Umrechner",
    openAria: "Mass- und Temperatur-Umrechner öffnen",
    title: "Mass & Temperatur",
    description:
      "Umrechnen fürs Kochen am Platz: Tassen, Löffel, Gramm und Grad.",
    amountLabel: "Menge",
    unitLabel: "Mass",
    volumeTitle: "Tassen & Löffel",
    weightTitle: "Gramm ↔ Milliliter",
    ingredientLabel: "Zutat",
    directionAria: "Richtung der Umrechnung wählen",
    gramsToMl: "g → ml",
    mlToGrams: "ml → g",
    weightHint:
      "Mit hinterlegter Dichte gerechnet – Küchenwerte für gehäufte Zutaten, keine Laborwaage. 1 Tasse = 2 dl, 1 EL = 15 ml, 1 TL = 5 ml.",
    tempTitle: "Temperatur",
    tempLabel: "Temperatur",
    tempUnitAria: "Einheit der eingegebenen Temperatur wählen",
    gasMark: (n: number) => `Stufe ${n}`,
    noGasMark: "keine Backofen-Stufe",
    ovenTitle: "Backofen & Gasstufe",
    ovenHint:
      "Gilt für Ober-/Unterhitze. Bei Umluft rund 20 °C weniger einstellen.",
  },
  food: {
    title: "Kühlbox & Trockenvorrat",
    subtitleLoggedOut:
      "Was ist noch da? Erfasse deine Vorräte und erhalte passende Rezeptvorschläge.",
    subtitleCooled:
      "Was ist noch da? Erfasse deine gekühlten Vorräte und erhalte passende One-Pot-Rezeptvorschläge.",
    subtitleDry:
      "Konserven, Teigwaren, Kaffee, Gewürze: alles Ungekühlte im zweiten Lager – nach Kategorien geordnet.",
    loginFeature: "deine Vorräte",
    storageAria: "Lager wählen",
    noUnit: "ohne Einheit",
    unitAria: "Einheit zur Menge (optional)",
    noCategory: "Ohne Kategorie",
    categoryAria: "Kategorie im Trockenvorrat (optional)",
    addPlaceholderCooled: "z. B. Tomaten, Käse, Bohnen …",
    addPlaceholderDry: "z. B. Ravioli-Dose, Spaghetti, Kaffee …",
    addNameAria: "Lebensmittel hinzufügen",
    expiryAria: "Mindesthaltbarkeitsdatum (optional)",
    submitAria: "Lebensmittel speichern",
    addFailed: "Eintrag konnte nicht gespeichert werden",
    dateHint:
      "Datum = Mindesthaltbarkeit (optional). Bald ablaufende Vorräte rutschen nach vorne und werden markiert.",
    dateHintDry:
      "Datum = Mindesthaltbarkeit (optional). Auch im Trockenvorrat rutschen bald ablaufende Sachen nach vorne und werden markiert.",
    urgentOne: "Ein Vorrat sollte bald verbraucht werden",
    urgentMany: (n: number) => `${n} Vorräte sollten bald verbraucht werden`,
    urgentSuffix: " – die Rezeptvorschläge unten helfen dabei.",
    removeAria: (name: string) => `${name} entfernen`,
    addToShoppingAria: (name: string) => `${name} auf die Einkaufsliste setzen`,
    addedToShopping: (name: string) => `${name} auf die Einkaufsliste gesetzt`,
    alreadyOnShopping: (name: string) =>
      `${name} steht schon auf der Einkaufsliste`,
    addToShoppingFailed: "Konnte nicht auf die Einkaufsliste gesetzt werden",
    deleteOnly: "Nur löschen",
    deleteAndShop: "Löschen und auf die Einkaufsliste",
    emptyTitle: "Kühlbox noch leer",
    emptyText:
      "Trage ein, was du dabei hast – wir schlagen dir passende Rezepte vor.",
    emptyTitleDry: "Trockenvorrat noch leer",
    emptyTextDry:
      "Konserven, Teigwaren, Reis, Kaffee, Gewürze: trage ein, was ungekühlt im Schrank steht.",
    suggestionsTitle: "Resteverwertung",
    suggestionsSubtitle:
      "Was du aus dem kochen kannst, was noch da ist – aus Kühlbox und Trockenvorrat, Rezepte mit bald ablaufenden Vorräten zuerst.",
    haveCount: (have: number, total: number) =>
      `${have} von ${total} Zutaten hast du`,
    urgentInRecipe: (n: number) =>
      n === 1 ? "1 Vorrat läuft bald ab" : `${n} Vorräte laufen bald ab`,
    havePrefix: "Du hast:",
    missingPrefix: "Es fehlt:",
    missingNone: "Alles da – du kannst sofort loslegen.",
    addMissing: "Fehlendes auf die Einkaufsliste",
    addMissingAria: (name: string) =>
      `Fehlende Zutaten von ${name} auf die Einkaufsliste setzen`,
    openRecipe: "Rezept öffnen",
    minutes: (n: number) => `${n} Min.`,
    servings: (n: number) => `${n} Portionen`,
    onePotSuffix: " · One-Pot",
    bookPrefix: "Alle Anleitungen findest du im ",
    bookLink: "Campfire-Rezeptbuch",
    bookSuffix: ".",
    templateSaveButton: "Als Vorlage speichern",
    templateLoadButton: "Vorlage laden",
    templateSaveTitle: "Aktuelle Füllung als Vorlage speichern",
    templateSaveDesc: (n: number) =>
      `${n === 1 ? "1 Eintrag wird" : `${n} Einträge werden`} gespeichert – bei Vorräten mit MHD merken wir uns die Restlaufzeit in Tagen.`,
    templateNameLabel: "Name der Vorlage",
    templateNamePlaceholder: "z. B. Wochenend-Standardfüllung",
    templateSaveConfirm: "Vorlage speichern",
    templateSaved: "Vorlage gespeichert – über «Vorlage laden» abrufbar",
    templateSaveFailed: "Vorlage konnte nicht gespeichert werden",
    templateLoadTitle: "Vorlage laden",
    templateLoadDesc:
      "Die Einträge werden in die Kühlbox eingefügt. Gespeicherte Restlaufzeiten werden ab heute in ein MHD umgerechnet; bereits vorhandene gleichnamige Einträge werden übersprungen.",
    templateEmpty: "Noch keine Vorlagen gespeichert.",
    templateItemCount: (n: number) => (n === 1 ? "1 Eintrag" : `${n} Einträge`),
    templateApply: "Laden",
    templateApplied: (added: number, skipped: number) =>
      `${added === 1 ? "1 Eintrag" : `${added} Einträge`} eingefügt${
        skipped > 0 ? `, ${skipped} schon vorhanden – übersprungen` : ""
      }`,
    templateApplyFailed: "Vorlage konnte nicht geladen werden",
    templateDeleted: "Vorlage gelöscht",
    templateDeleteFailed: "Vorlage konnte nicht gelöscht werden",
    templateDeleteAria: (name: string) => `Vorlage ${name} löschen`,
    templateDeleteConfirm: (name: string) =>
      `Vorlage «${name}» wirklich löschen?`,
    quantityPlaceholder: "Menge",
    addQuantityAria: "Menge für den neuen Eintrag (optional)",
    editAria: (name: string) =>
      `${name} bearbeiten – Menge, Lager und MHD anpassen`,
    editDesc:
      "Menge, Einheit, Lager, Kategorie und Mindesthaltbarkeitsdatum anpassen – leere Felder entfernen den Wert.",
    editQuantityLabel: "Menge",
    editQuantityPlaceholder: "z. B. 2× oder 500 g",
    editUnitLabel: "Einheit",
    editStorageLabel: "Lager",
    editCategoryLabel: "Kategorie",
    editExpiryLabel: "Mindesthaltbarkeitsdatum",
    editSave: "Speichern",
    editFailed: "Änderung konnte nicht gespeichert werden",
    sortAria: "Vorräte sortieren",
    sortByExpiry: "Nach Ablauf",
    sortByName: "Nach Name",
  },
  shopping: {
    fromRecipe: (name: string) => `aus: ${name}`,
    title: "Einkaufsliste",
    subtitle:
      "Alles fürs Camp einkaufen: Einträge abhaken, Zutaten direkt aus dem Rezeptbuch übernehmen.",
    subtitleLoggedOut:
      "Deine Einkaufsliste fürs Camp – manuell oder direkt aus dem Rezeptbuch gefüllt.",
    loginFeature: "deine Einkaufsliste",
    addPlaceholder: "z. B. Spaghetti …",
    addNameAria: "Eintrag zur Einkaufsliste hinzufügen",
    addButton: "Hinzufügen",
    addFailed: "Eintrag konnte nicht gespeichert werden",
    quantityPlaceholder: "Menge",
    addQuantityAria: "Menge für den neuen Eintrag (optional)",
    alreadyOnList: (name: string) =>
      `${name} steht schon auf der Liste – Menge und Notiz dort am Eintrag anpassen`,
    detailsAria: (name: string) => `Menge und Notiz von ${name} bearbeiten`,
    detailsTitle: "Menge & Notiz",
    detailsQuantityLabel: "Menge",
    detailsQuantityPlaceholder: "z. B. 2× oder 500 g",
    detailsNoteLabel: "Notiz",
    detailsNotePlaceholder: "z. B. Aktion, laktosefrei …",
    detailsPriceLabel: "Preis (CHF)",
    detailsPricePlaceholder: "z. B. 3.50",
    detailsPriceHint:
      "Leer lassen, wenn du keinen Preis erfassen willst. Die Summe steht oben auf der Liste.",
    detailsPriceBooked:
      "Schon in die Reisekasse übernommen – der Preis bleibt, wie er verbucht wurde.",
    totalLabel: "Summe:",
    totalBreakdown: (open: string, checked: string) =>
      `offen ${open} · abgehakt ${checked}`,
    totalBooked: (booked: string) => `verbucht ${booked}`,
    bookedBadge: "verbucht",
    bookButton: (sum: string) => `In die Reisekasse (${sum})`,
    bookTitle: "In die Reisekasse übernehmen",
    bookDesc:
      "Die abgehakten Einkäufe mit Preis werden als eine Ausgabe in der Reisekasse verbucht. Verbuchte Einträge zählen später nicht noch einmal mit.",
    bookNothing:
      "Nichts zu übernehmen: Es ist kein abgehakter Eintrag mit Preis offen.",
    bookItemAria: (name: string) => `${name} mitverbuchen`,
    bookSumLabel: (n: number) =>
      n === 1 ? "1 Eintrag – Summe" : `${n} Einträge – Summe`,
    bookTripLabel: "Reise",
    bookTripFallback: "Aufenthalt",
    bookNoTrips:
      "Du hast noch keine Reise im Tagebuch – leg zuerst eine an, dann gibt es auch eine Reisekasse.",
    bookCategoryLabel: "Kategorie",
    bookDayLabel: "Datum",
    bookDescriptionLabel: "Beschreibung",
    bookDescriptionPlaceholder: "z. B. Grosseinkauf Migros",
    bookPaidByLabel: "Bezahlt von",
    bookPaidByPlaceholder: "Name",
    bookConfirm: (sum: string) => `${sum} verbuchen`,
    bookDone: (n: number, sum: string) =>
      `${n === 1 ? "1 Eintrag" : `${n} Einträge`} als ${sum} in der Reisekasse verbucht`,
    bookFailed: "Die Übernahme in die Reisekasse hat nicht geklappt",
    detailsFailed: "Menge/Notiz konnte nicht gespeichert werden",
    openTitle: "Noch zu kaufen",
    doneTitle: "Erledigt",
    itemCheckAria: (name: string) => `${name} abhaken`,
    itemUncheckAria: (name: string) => `${name} wieder öffnen`,
    removeAria: (name: string) => `${name} von der Liste entfernen`,
    removeChecked: "Erledigte entfernen",
    clearAll: "Liste leeren",
    clearConfirm: "Wirklich die ganze Einkaufsliste löschen?",
    emptyTitle: "Einkaufsliste ist leer",
    emptyText:
      "Füge oben Einträge hinzu – oder übernimm Zutaten direkt aus einem Rezept im Rezeptbuch.",
    openCount: (n: number) =>
      n === 1 ? "1 offener Eintrag" : `${n} offene Einträge`,
    addedFromRecipe: (n: number) =>
      n === 1
        ? "1 Zutat auf die Einkaufsliste gesetzt"
        : `${n} Zutaten auf die Einkaufsliste gesetzt`,
    openList: "Zur Einkaufsliste",
    addIngredients: "Zutaten auf die Einkaufsliste",
    noCategory: "Ohne Kategorie",
    addCategoryAria: "Kategorie für den neuen Eintrag wählen",
    itemCategoryAria: (name: string) => `Kategorie von ${name} ändern`,
    categoryChangeFailed: "Kategorie konnte nicht gespeichert werden",
    newCategoryOption: "Neue Kategorie …",
    newCategoryPlaceholder: "Neue Kategorie",
    newCategoryAria: "Name der neuen Kategorie",
    newCategorySave: "Kategorie speichern",
    reorderAria: (name: string) => `${name} verschieben`,
    reorderFailed: "Neue Reihenfolge konnte nicht gespeichert werden",
    printButton: "Drucken",
    shareButton: "Teilen",
    shareAria: "Einkaufsliste per Link teilen",
    shareTitle: "Einkaufsliste teilen",
    shareDescription:
      "Alle mit diesem Link sehen deine Einkaufsliste und können ohne Anmeldung mit abhaken.",
    shareCopied: "Teil-Link kopiert – einfach an die Mitreisenden schicken",
    shareFailed: "Teil-Link konnte nicht erstellt werden",
    unshareButton: "Teilen beenden",
    unshared: "Teilen beendet – der Link ist nicht mehr gültig",
    unshareFailed: "Teilen konnte nicht beendet werden",
    shareQrAlt: "QR-Code zum Teil-Link der Einkaufsliste",
    shareQrTitle: "QR-Code abscannen",
    shareQrText:
      "Mitreisende scannen den Code mit der Handykamera und sind direkt auf der Liste.",
    suggestionsAria: "Vorschläge aus Verlauf und Liste",
    putAwayButton: "Einkäufe einräumen",
    putAwayTitle: "Einkäufe einräumen",
    putAwayDesc:
      "Wähle das Lager und die abgehakten Einkäufe aus und gib optional ein Mindesthaltbarkeitsdatum an. Übernommene Einträge wandern in deinen Vorrat und werden von der Einkaufsliste entfernt.",
    putAwayStorageLabel: "Lager",
    putAwayItemAria: (name: string) => `${name} in den Vorrat übernehmen`,
    putAwayExpiryAria: (name: string) =>
      `Mindesthaltbarkeitsdatum für ${name} (optional)`,
    putAwayAlreadyInFood: "schon im Vorrat",
    putAwayConfirm: (n: number) =>
      n === 1 ? "1 Eintrag einräumen" : `${n} Einträge einräumen`,
    putAwayDone: (n: number) =>
      n === 1
        ? "1 Einkauf in den Vorrat gelegt"
        : `${n} Einkäufe in den Vorrat gelegt`,
    putAwayOpenFood: "Zu den Vorräten",
    putAwayFailed:
      "Einräumen fehlgeschlagen – noch nicht übernommene Einträge bleiben auf der Liste",
    listsAria: "Einkaufsliste wählen",
    listCounts: (open: number, done: number) =>
      `${open} offen · ${done} erledigt`,
    manageListsButton: "Listen",
    manageListsAria: "Einkaufslisten verwalten",
    manageListsTitle: "Einkaufslisten verwalten",
    manageListsDescription:
      "Lege weitere Listen an (z. B. «Wocheneinkauf» und «Camping»), benenne sie um, sortiere sie – oder lösche eine Liste samt ihren Einträgen.",
    newListPlaceholder: "Name der neuen Liste",
    newListButton: "Anlegen",
    listCreated: (name: string) => `Liste «${name}» angelegt`,
    listCreateFailed: "Liste konnte nicht angelegt werden",
    listNameAria: (name: string) => `Name von ${name}`,
    listSaveNameAria: (name: string) => `Neuen Namen von ${name} speichern`,
    listRenamed: "Liste umbenannt",
    listRenameFailed: "Liste konnte nicht umbenannt werden",
    listDeleteAria: (name: string) => `Liste ${name} löschen`,
    listDeleteConfirm: (name: string) =>
      `Liste «${name}» mit allen Einträgen löschen?`,
    listDeleted: "Liste gelöscht",
    listDeleteFailed: "Liste konnte nicht gelöscht werden",
    listDeleteLastHint: "Die letzte Liste bleibt bestehen.",
    listMoveUpAria: (name: string) => `${name} nach oben schieben`,
    listMoveDownAria: (name: string) => `${name} nach unten schieben`,
    listOrderFailed: "Reihenfolge der Listen konnte nicht gespeichert werden",
    targetListLabel: "Ziel-Liste",
    targetListAria: "Ziel-Liste für die Übernahme wählen",
    addedToNamedList: (name: string, list: string) =>
      `${name} auf «${list}» gesetzt`,
    addedFromRecipeToList: (n: number, list: string) =>
      n === 1
        ? `1 Zutat auf «${list}» gesetzt`
        : `${n} Zutaten auf «${list}» gesetzt`,
  },
  sharedShopping: {
    loading: "Geteilte Einkaufsliste wird geladen …",
    notFoundTitle: "Link abgelaufen oder ungültig",
    backHome: "Startseite",
    invalidLink:
      "Dieser Teil-Link ist abgelaufen, ungültig oder wurde von der Besitzerin bzw. dem Besitzer zurückgezogen.",
    subtitle: (open: number, total: number) =>
      `Geteilte Einkaufsliste · ${open} von ${total} Einträgen offen`,
    sharedInfo:
      "Gemeinsames Einkaufen: Alle mit diesem Link sehen den gleichen Stand – die Anzeige aktualisiert sich automatisch.",
    emptyList: "Diese Einkaufsliste ist noch leer.",
    allDone: "Alles eingekauft – keine offenen Einträge.",
    checkAria: (name: string) => `${name} abhaken`,
    uncheckAria: (name: string) => `${name} wieder öffnen`,
    toggleFailed: "Abhaken fehlgeschlagen",
  },
  shoppingPrint: {
    docTitle: "Einkaufsliste zum Ausdrucken",
    appTitle: "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
    printButton: "Drucken / Als PDF sichern",
    printBrowserHint:
      "In der installierten App öffnet der Knopf die Ansicht im Browser – dort über das Menü drucken oder als PDF sichern.",
    headerKicker: "CampMesser · Einkaufsliste",
    title: "Einkaufsliste",
    meta: (items: number, categories: number) =>
      `${items} ${items === 1 ? "offener Eintrag" : "offene Einträge"} · ${categories} ${categories === 1 ? "Kategorie" : "Kategorien"}`,
    printedOn: (date: string) => `Stand: ${date}`,
    emptyList: "Keine offenen Einträge – alles eingekauft.",
    footer:
      "Guten Einkauf! · CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
  },
  menuPlan: {
    title: "Menüplan",
    subtitle:
      "Plane für jeden Tag deines Aufenthalts, was auf den Campingtisch kommt.",
    loginFeature: "deinen Menüplan",
    notFoundTitle: "Aufenthalt nicht gefunden",
    notFoundText:
      "Dieser Aufenthalt existiert nicht oder gehört nicht zu deinem Konto.",
    backToTrips: "Zu «Meine Reisen»",
    daysCount: (n: number) => (n === 1 ? "1 Tag" : `${n} Tage`),
    slotEmpty: "Noch nichts geplant",
    planSlotAria: (meal: string, day: string) => `${meal} am ${day} planen`,
    clearSlotAria: (meal: string, day: string) => `${meal} am ${day} leeren`,
    dialogTitle: (meal: string) => `${meal} planen`,
    dialogDescription:
      "Wähle ein Rezept aus dem Rezeptbuch oder trage einen Freitext ein.",
    searchPlaceholder: "Rezept suchen …",
    searchAria: "Rezept suchen",
    chooseRecipeAria: (name: string) => `Rezept ${name} wählen`,
    minutes: (n: number) => `${n} Min.`,
    ownBadge: "Eigenes",
    noRecipesFound: "Keine Rezepte gefunden – nutze den Freitext unten.",
    freeTextLabel: "Oder Freitext",
    freeTextPlaceholder: "z. B. Reste vom Vortag, Pizzeria im Dorf …",
    freeTextSave: "Freitext übernehmen",
    saved: "Menüplan aktualisiert",
    addIngredients: "Zutaten der geplanten Rezepte auf die Einkaufsliste",
    noPlannedRecipes:
      "Noch keine Rezepte zugewiesen – wähle zuerst Rezepte in den Mahlzeiten-Slots.",
    printButton: "Drucken",
    autofillButton: "Automatisch füllen",
    autofillNothing: "Keine leeren Mahlzeiten-Slots zum Füllen gefunden.",
    autofillDone: (n: number) =>
      n === 1
        ? "1 Mahlzeit automatisch geplant"
        : `${n} Mahlzeiten automatisch geplant`,
    autofillUndo: "Rückgängig",
    autofillUndone: "Automatische Planung wieder entfernt",
    autofillFailed: "Automatisches Füllen fehlgeschlagen",
    editedBy: (name: string) => `von ${name}`,
    editedByTitle: (name: string, date: string) =>
      `Zuletzt geändert von ${name} am ${date}`,
    dayNoteAria: (day: string) => `Tages-Notiz für ${day} bearbeiten`,
    dayNoteTitle: "Tages-Notiz",
    dayNoteDescription:
      "Eine kurze Notiz zum Tag – alle Mitreisenden sehen sie im Menüplan.",
    dayNoteLabel: "Notiz",
    dayNotePlaceholder: "z. B. Pizzeria-Abend",
    dayNoteRemove: "Notiz entfernen",
    dayNoteSaved: "Notiz gespeichert",
    dayNoteRemoved: "Notiz entfernt",
    previewAria: (name: string) => `Rezept ${name} ansehen`,
    previewServings: (n: number) => `${n} Portionen`,
    previewIngredients: "Zutaten",
    previewSteps: "Zubereitung",
    previewTip: "Tipp",
    previewOpenInBook: "Im Rezeptbuch öffnen",
  },
  tripShopping: {
    title: "Reise-Einkaufsliste",
    subtitle:
      "Die gemeinsame Einkaufsliste dieser Reise – alle Mitreisenden sehen und bearbeiten denselben Stand.",
    loginFeature: "die Reise-Einkaufsliste",
    openButton: "Reise-Einkaufsliste",
    openAria: (name: string) => `Reise-Einkaufsliste für ${name} öffnen`,
    backToMenuPlan: "Zum Menüplan",
    emptyTitle: "Noch keine Einträge",
    emptyText:
      "Füge oben Einträge hinzu – oder übernimm die Zutaten der geplanten Rezepte aus dem Menüplan.",
    byUser: (name: string) => `von ${name}`,
    chooseTitle: "Auf welche Einkaufsliste?",
    chooseDescription:
      "Diese Reise ist geteilt: Die Zutaten können auf die gemeinsame Reise-Liste oder auf deine persönliche Einkaufsliste.",
    chooseTripList: "Reise-Liste",
    chooseTripListHint: "Gemeinsam mit allen Mitreisenden",
    choosePersonalList: "Persönliche Liste",
    choosePersonalListHint: "Nur für dich sichtbar",
    addedFromMenu: (n: number) =>
      n === 1
        ? "1 Zutat auf die Reise-Einkaufsliste gesetzt"
        : `${n} Zutaten auf die Reise-Einkaufsliste gesetzt`,
    openList: "Zur Reise-Liste",
  },
  menuPlanPrint: {
    docTitle: (name: string) => `${name} – Menüplan zum Ausdrucken`,
    docTitleFallback: "Menüplan",
    appTitle: "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
    notFound: "Dieser Aufenthalt wurde nicht gefunden.",
    printButton: "Drucken / Als PDF sichern",
    printBrowserHint:
      "In der installierten App öffnet der Knopf die Ansicht im Browser – dort über das Menü drucken oder als PDF sichern.",
    headerKicker: "CampMesser · Menüplan",
    printedOn: (date: string) => `Stand: ${date}`,
    dayHeader: "Tag",
    footer:
      "En Guete! · CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
  },
  family: {
    title: "Familien-Modus",
    subtitle:
      "Kindersichere Packlisten, Beschäftigung beim Zeltaufbau und spielerisches Naturwissen.",
    offlineNote:
      "Schnitzeljagden und Quizze funktionieren komplett offline – ideal für abgelegene Zeltplätze.",
    huntsTitle: "Schnitzeljagden",
    huntsSubtitle:
      "Beschäftigung für die Kinder, während das Zelt steht – der Fortschritt wird auf dem Gerät gespeichert.",
    startHuntAria: (title: string) => `Schnitzeljagd ${title} starten`,
    durationShort: (n: number) => `ca. ${n} Min.`,
    durationLong: (n: number) => `ca. ${n} Minuten`,
    stationsCount: (n: number) => `${n} ${n === 1 ? "Station" : "Stationen"}`,
    playOnPhone: "Auf dem Handy spielen",
    printPdf: "Zum Ausdrucken (PDF)",
    ownHuntsTitle: "Eigene Schnitzeljagden",
    ownHuntsSubtitle:
      "Erfinde eigene Abenteuer – perfekt zugeschnitten auf euren Zeltplatz und das Alter deiner Kinder.",
    play: "Spielen",
    print: "Drucken",
    deleteConfirm: (title: string) =>
      `Schnitzeljagd «${title}» wirklich löschen?`,
    newHunt: "Neue Jagd erstellen",
    newHuntAria: "Neue Schnitzeljagd erstellen",
    quizzesTitle: "Natur-Quizze",
    quizzesSubtitlePrefix: "Spielerisch lernen – passend zum ",
    quizzesSubtitleLink: "Natur-Entdecker-Lexikon",
    quizzesSubtitleSuffix: ".",
    lexiconQuizTitle: "Natur-Quiz",
    lexiconQuizAgeHint: "ab ca. 7 Jahren",
    lexiconQuizBadge: "aus dem Lexikon",
    lexiconQuizHint:
      "Wird bei jedem Start neu aus dem Natur-Lexikon zusammengestellt – auch im Duell spielbar.",
    startQuizAria: (title: string) => `Quiz ${title} starten`,
    questionCount: (n: number) => `${n} Fragen`,
    progressAria: (done: number, total: number) =>
      `${done} von ${total} Stationen geschafft`,
    collectedLetters: "Gesammelte Buchstaben:",
    stationDoneAria: (title: string) => `Station geschafft: ${title}`,
    letterBadge: (letter: string) => `Buchstabe: ${letter}`,
    showHint: "Hinweis anzeigen",
    readAloudAria: (title: string) => `Station ${title} vorlesen`,
    readAloudStopAria: (title: string) =>
      `Vorlesen von Station ${title} stoppen`,
    secretStations: (n: number) =>
      n === 1
        ? "Noch 1 geheime Station – hake die aktuelle Station ab, um weiterzukommen!"
        : `Noch ${n} geheime Stationen – hake die aktuelle Station ab, um weiterzukommen!`,
    solutionWordLine: (word: string) => `Lösungswort: ${word}`,
    allDone: "Alle Stationen geschafft!",
    resetAria: "Fortschritt zurücksetzen",
    restart: "Neu starten",
    done: "Fertig",
    scoreLine: (score: number, total: number) =>
      `${score} von ${total} richtig!`,
    verdictPerfect: "Perfekt – du bist bereit für die Wildnis!",
    verdictGood: "Stark! Beim nächsten Mal schaffst du alle.",
    verdictTryAgain: "Übung macht den Meister – probier es gleich nochmal!",
    again: "Nochmal",
    questionProgress: (current: number, total: number) =>
      `Frage ${current} von ${total}`,
    points: (n: number) => `${n} ${n === 1 ? "Punkt" : "Punkte"}`,
    quizProgressAria: "Quiz-Fortschritt",
    answerAria: (option: string) => `Antwort: ${option}`,
    showResult: "Ergebnis anzeigen",
    nextQuestion: "Nächste Frage",
    ownBadge: "Eigenes",
    newQuiz: "Neues Quiz erstellen",
    newQuizAria: "Neues Quiz erstellen",
    quizDeleteConfirm: (title: string) => `Quiz «${title}» wirklich löschen?`,
    quizShareButton: "Teilen",
    quizShareAria: (title: string) => `Quiz ${title} per Link teilen`,
    quizShareTitle: "Quiz teilen",
    quizShareDescription:
      "Wer den Link hat, kann das Quiz ansehen und mit einem Konto als eigenes Quiz übernehmen.",
    quizShareCopied: "Teil-Link kopiert – schick ihn weiter!",
    quizShareFailed: "Teilen fehlgeschlagen",
    quizSharedBadge: "geteilt",
    quizUnshare: "Teilen beenden",
    quizUnshared: "Teilen beendet – der Link ist nicht mehr gültig",
    quizUnshareFailed: "Teilen konnte nicht beendet werden",
    quizQrAlt: (title: string) => `QR-Code zum Teil-Link des Quiz ${title}`,
    quizQrTitle: "Direkt weitergeben",
    quizQrText:
      "Lass andere den Code mit der Handy-Kamera scannen – das Quiz öffnet sich sofort.",
    stopwatchAria: "Verstrichene Zeit der Stoppuhr",
    bestTimeBadge: (time: string) => `Bestzeit: ${time}`,
    newBestTimeLine: (time: string) => `${time} – Neue Bestzeit!`,
    finishTimeLine: (time: string, best: string) =>
      `Deine Zeit: ${time} · Bestzeit: ${best}`,
    childrenTitle: "Kinder & Abzeichen",
    childrenSubtitle:
      "Lege deine Kinder an – bei Schnitzeljagden und Quizzen sammeln sie Abzeichen.",
    childrenEmpty:
      "Noch keine Kinder angelegt – füge unten einen Namen hinzu, damit Abzeichen gesammelt werden können.",
    childNamePlaceholder: "Name des Kindes",
    addChild: "Kind hinzufügen",
    renameChildAria: (name: string) => `${name} umbenennen`,
    renameSaveAria: (name: string) => `Neuen Namen für ${name} speichern`,
    deleteChildConfirm: (name: string) =>
      `${name} samt allen gesammelten Abzeichen wirklich löschen?`,
    deleteChildAria: (name: string) => `${name} löschen`,
    badgeCount: (n: number, total: number) => `${n} von ${total} Abzeichen`,
    badgeEarnedOn: (date: string) => `Verdient am ${date}`,
    badgeEarnedToast: (child: string, badge: string) =>
      `${child} hat ein neues Abzeichen: ${badge}`,
    whoPlaysTitle: "Wer spielt?",
    whoPlaysDescription:
      "Wähle, wer spielt – das Kind sammelt Abzeichen für abgeschlossene Jagden und Quizze.",
    whoPlaysNobody: "Ohne Abzeichen spielen",
    duelMode: "Duell: zwei Kinder gegeneinander",
    duelSetupTitle: "Quiz-Duell",
    duelSetupDescription:
      "Zwei Kinder beantworten abwechselnd dieselben Fragen – reicht das Gerät nach jedem Zug weiter.",
    duelPickFirst: "Wer beginnt?",
    duelPickSecond: "Wer spielt dagegen?",
    duelFirstChosen: (name: string) => `${name} beginnt.`,
    duelVs: (a: string, b: string) => `${a} gegen ${b}`,
    duelNowPlaying: (name: string) => `Jetzt spielt: ${name}`,
    duelHandoverHint: (name: string) => `Gib das Gerät an ${name} weiter.`,
    duelGo: "Los geht's!",
    duelPassTo: (name: string) => `Weiter – ${name} ist dran`,
    duelScore: (name: string, points: number) => `${name}: ${points}`,
    duelTie: "Unentschieden!",
    duelWinner: (name: string) => `${name} gewinnt!`,
    quizEditor: {
      titleEdit: "Quiz bearbeiten",
      titleNew: "Eigenes Quiz erstellen",
      description:
        "Eigene Fragen mit Antwortmöglichkeiten und Erklärung – gespeichert in deinem Konto, spielbar wie die eingebauten Quizze.",
      updated: "Quiz aktualisiert",
      created: "Quiz erstellt",
      titleLabel: "Titel",
      titlePlaceholder: "z. B. Unser Zeltplatz-Quiz",
      questionsTitle: (n: number) => `Fragen (${n})`,
      questionPlaceholder: "Frage, z. B. «Welcher Vogel ruft nachts?»",
      questionAria: (n: number) => `Frage ${n}`,
      removeQuestionAria: (n: number) => `Frage ${n} entfernen`,
      correctHint: "Markiere die richtige Antwort mit dem Punkt links.",
      optionPlaceholder: (n: number) => `Antwort ${n}`,
      optionAria: (q: number, o: number) => `Antwort ${o} der Frage ${q}`,
      correctAria: (q: number, o: number) =>
        `Antwort ${o} der Frage ${q} als richtig markieren`,
      explanationPlaceholder: "Erklärung nach dem Antworten (optional)",
      explanationAria: (n: number) => `Erklärung der Frage ${n}`,
      addQuestion: "Frage hinzufügen",
    },
    editor: {
      titleEdit: "Schnitzeljagd bearbeiten",
      titleNew: "Eigene Schnitzeljagd erstellen",
      description:
        "Geschichte, Stationen und Schatz-Finale – gespeichert in deinem Konto, spielbar und druckbar wie die eingebauten Jagden.",
      updated: "Schnitzeljagd aktualisiert",
      created: "Schnitzeljagd erstellt",
      titleLabel: "Titel",
      titlePlaceholder: "z. B. Das Geheimnis des Seeufers",
      ageLabel: "Alter (optional)",
      agePlaceholder: "z. B. ab 6 Jahren",
      durationLabel: "Dauer (Minuten)",
      introLabel: "Die Mission (Rahmengeschichte)",
      introPlaceholder:
        "Wer braucht Hilfe? Was ist passiert? Was ist das Ziel?",
      prepLabel: "Für die Erwachsenen (optional)",
      prepPlaceholder: "Was muss vorher versteckt oder vorbereitet werden?",
      stationsTitle: (n: number) => `Stationen (${n})`,
      defaultStationTitle: (n: number) => `Station ${n}`,
      stationTitleAria: (n: number) => `Titel der Station ${n}`,
      removeStationAria: (n: number) => `Station ${n} entfernen`,
      storyPlaceholder:
        "Erzähltext (optional): Wie geht die Geschichte hier weiter?",
      storyAria: (n: number) => `Geschichte der Station ${n}`,
      taskPlaceholder:
        "Aufgabe oder Rätsel, z. B. «Findet drei verschiedene Blätter»",
      taskAria: (n: number) => `Aufgabe der Station ${n}`,
      hintPlaceholder: "Hinweis, falls die Kinder feststecken (optional)",
      hintAria: (n: number) => `Hinweis der Station ${n}`,
      letterPlaceholder: "Bst.",
      letterAria: (n: number) => `Buchstabe der Station ${n} fürs Lösungswort`,
      addStation: "Station hinzufügen",
      solutionPreviewLabel: "Lösungswort aus den Buchstaben:",
      finaleLabel: "Das Finale (Schatz/Belohnung)",
      finalePlaceholder: "Was passiert, wenn alle Stationen geschafft sind?",
    },
  },
  travelBingo: {
    title: "Reise-Bingo",
    subtitle:
      "Was entdeckt ihr unterwegs? Antippen, was vorbeikommt – eine volle Reihe, Spalte oder Diagonale ist Bingo.",
    empty:
      "Noch keine Karte – leg unten eine an. Zwei Kinder bekommen zwei verschiedene Karten.",
    howTo:
      "Jede Karte wird frisch gemischt, darum sieht keine aus wie die andere. Der Fortschritt bleibt auf dem Gerät – auch ohne Empfang.",
    namePlaceholder: "Name",
    nameAria: (name: string) => `Name der Karte von ${name}`,
    newNameAria: "Name für die neue Karte",
    sizeBadge: (size: number) => `${size} × ${size} Felder`,
    sizeOption: (size: number) => `${size} × ${size}`,
    switchSize: (size: number) => `Auf ${size} × ${size}`,
    switchSizeAria: (name: string, size: number) =>
      `Karte von ${name} auf ${size} × ${size} umstellen`,
    cardFallbackName: (n: number) => `Karte ${n}`,
    cellAria: (label: string) => `${label} – als gefunden markieren`,
    cellFoundAria: (label: string) =>
      `${label} – gefunden, antippen zum Zurücknehmen`,
    progressAria: (name: string) => `Bingo-Fortschritt von ${name}`,
    foundCount: (done: number, total: number) =>
      `${done} von ${total} gefunden`,
    bingoBanner: (lines: number) =>
      lines === 1
        ? "Bingo! Eine Linie ist voll."
        : `Bingo! Schon ${lines} volle Linien.`,
    fullCardBanner: "Ganze Karte voll – ihr habt alles entdeckt!",
    bingoToast: (name: string) => `Bingo für ${name}!`,
    fullCardToast: (name: string) => `${name} hat die ganze Karte voll!`,
    newCard: "Neue Karte",
    newCardAria: (name: string) => `Neue Karte für ${name} mischen`,
    reset: "Zurücksetzen",
    resetAria: (name: string) => `Fortschritt von ${name} zurücksetzen`,
    removeConfirm: (name: string) => `Karte von ${name} wirklich entfernen?`,
    removeAria: (name: string) => `Karte von ${name} entfernen`,
    addCard: "Karte hinzufügen",
    maxCardsReached: (n: number) =>
      `Mehr als ${n} Karten gleichzeitig gehen nicht – entferne zuerst eine.`,
  },
  bedtimeStories: {
    title: "Gute-Nacht-Geschichten",
    subtitle:
      "Kurze Vorlesegeschichten aus Wald, Berg und Zeltplatz – drei bis fünf Minuten, dann ist Ruhe.",
    empty:
      "Zu dieser Auswahl gibt es keine Geschichte – nimm eine andere Jahreszeit oder ein anderes Alter.",
    seasonFilterLabel: "Jahreszeit:",
    seasonAll: "Alle",
    seasonAllYear: "das ganze Jahr",
    season: {
      spring: "Frühling",
      summer: "Sommer",
      autumn: "Herbst",
      winter: "Winter",
    },
    ageFilterLabel: "Alter:",
    ageAll: "Alle",
    ageOption: (age: number) => `${age} Jahre`,
    ageBadge: (age: number) => `ab ${age} Jahren`,
    minutesBadge: (minutes: number) => `${minutes} Min. vorlesen`,
    readBadge: "schon vorgelesen",
    openAria: (title: string) => `Geschichte ${title} öffnen`,
    readAloud: "Vorlesen lassen",
    readAloudStop: "Vorlesen stoppen",
    readAloudAria: (title: string) => `Geschichte ${title} vorlesen`,
    readAloudStopAria: (title: string) => `Vorlesen von ${title} stoppen`,
    markRead: "Als vorgelesen merken",
    markUnread: "Merker entfernen",
  },
  arrival: {
    title: "Wie weit noch?",
    subtitle:
      "Der Fortschrittsbalken für den Rücksitz: Wie viel der Strecke zum Zeltplatz habt ihr schon geschafft?",
    loginHint:
      "Melde dich an, damit CampMesser deine gespeicherten Plätze als Ziel anbieten kann.",
    noSpots:
      "Noch keine Plätze gespeichert – leg zuerst einen Zeltplatz an, dann kannst du ihn als Ziel wählen.",
    suggestedFromTrip:
      "Vorgeschlagen ist der Platz deiner laufenden bzw. nächsten Reise – du kannst auch einen anderen wählen.",
    suggestedWithoutTrip: "Wähle den Zeltplatz, zu dem ihr unterwegs seid.",
    targetSelectAria: "Ziel der Fahrt wählen",
    targetPlaceholder: "Ziel wählen",
    start: "Losfahren",
    startNote:
      "Beim Tippen wird dein aktueller Standort als Startpunkt gesetzt. Danach misst CampMesser einmal pro Minute grob nach – das schont den Akku.",
    locationFailed:
      "Standort konnte nicht ermittelt werden – ohne Startpunkt geht es leider nicht.",
    straightLineBadge: "Luftlinie",
    straightLineNote:
      "Gerechnet wird die Luftlinie. Die Strasse ist länger – über einen Pass deutlich länger.",
    stop: "Fahrt beenden",
    progressAria: (name: string) => `Fortschritt der Fahrt nach ${name}`,
    startLabel: "Start",
    targetLabel: "Ziel",
    percent: (value: number) => `${value} %`,
    remaining: (distance: string) => `noch ${distance} Luftlinie`,
    ofTotal: (distance: string) => `von ${distance} insgesamt`,
    arrived: (name: string) => `Angekommen – willkommen in ${name}!`,
    encouragement: (next: number) =>
      next >= 100
        ? "Das letzte Stück – gleich seid ihr da!"
        : `Weiter so – bis zur ${next}-Prozent-Marke ist es nicht mehr weit.`,
    milestoneToast: (percent: number) => `${percent} % geschafft!`,
    refresh: "Jetzt nachmessen",
    lastFix: (time: string) => `zuletzt um ${time}`,
    noFixYet: "noch keine Messung",
    geoDenied:
      "Der Standort ist gesperrt – erlaube ihn in den Browser-Einstellungen, sonst steht der Balken still.",
    geoUnsupported: "Dieser Browser kennt keine Standortbestimmung.",
    geoFailed:
      "Der Standort war gerade nicht zu ermitteln – CampMesser versucht es in einer Minute wieder.",
  },
  huntPrint: {
    docTitle: (title: string) => `${title} – Schnitzeljagd zum Ausdrucken`,
    docTitleFallback: "Schnitzeljagd",
    appTitle: "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
    notFound: "Diese Schnitzeljagd wurde nicht gefunden.",
    printButton: "Drucken / Als PDF sichern",
    printBrowserHint:
      "In der installierten App öffnet der Knopf die Ansicht im Browser – dort über das Menü drucken oder als PDF sichern.",
    headerKicker: "CampMesser · Schnitzeljagd",
    meta: (age: string, minutes: number, stations: number) =>
      `${age} · ca. ${minutes} Minuten · ${stations} ${stations === 1 ? "Station" : "Stationen"}`,
    missionTitle: "Die Mission",
    adultsTitle: "Für die Erwachsenen (vorher lesen)",
    taskLabel: "Aufgabe:",
    hintLabel: "Hinweis (nur wenn ihr feststeckt):",
    doneLabel: "Geschafft? Abhaken:",
    letterLabel: "Euer Buchstabe:",
    solutionTitle: "Das Lösungswort",
    solutionText: (n: number) =>
      `Tragt die gesammelten Buchstaben der Reihe nach ein (${n} Buchstaben):`,
    finaleTitle: "Das Finale",
    footer:
      "Viel Spass beim Entdecken! · CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
  },
  badgeCertificate: {
    docTitle: (name: string) => `Urkunde für ${name}`,
    docTitleFallback: "Urkunde",
    appTitle: "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
    loginFeature: "die Abzeichen-Urkunde",
    notFound: "Dieses Kind wurde nicht gefunden.",
    galleryLink: "Urkunde drucken",
    printButton: "Urkunde drucken",
    printBrowserHint:
      "In der installierten App öffnet der Knopf die Ansicht im Browser – dort über das Menü drucken oder als PDF sichern.",
    kicker: "CampMesser · Familien-Modus",
    heading: "Urkunde",
    awardedTo: "verliehen an",
    badgesIntro: (n: number) =>
      n === 1
        ? "für dieses verdiente Abzeichen"
        : `für diese ${n} verdienten Abzeichen`,
    earnedOn: (date: string) => `verdient am ${date}`,
    noBadges:
      "Noch kein Abzeichen verdient – spiele eine Schnitzeljagd oder ein Quiz, dann füllt sich die Urkunde.",
    issuedOn: (date: string) => `Ausgestellt am ${date}`,
    footer: "CampMesser – Das Schweizer Taschenmesser fürs Zelt-Camping",
  },
  notFound: {
    heading: "Seite nicht gefunden",
    text1: "Diese Seite gibt es leider nicht.",
    text2: "Vielleicht wurde sie verschoben oder gelöscht.",
    goHome: "Zur Startseite",
  },
  loginPrompt: {
    required: "Anmeldung erforderlich",
    body: (feature: string) =>
      `Melde dich an, um ${feature} zu speichern und auf allen Geräten zu synchronisieren.`,
    cta: "Jetzt anmelden",
  },
  pageHeader: {
    overview: "Übersicht",
    backAria: (label: string) => `Zurück zur ${label}`,
  },
  quickActions: {
    fabAria: "Schnellaktionen öffnen",
    title: "Schnellaktionen",
    subtitle: "Direkt loslegen – ohne Umweg über die Startseite.",
    searchPlaceholder: "Aktion suchen …",
    noResults: "Keine Aktion gefunden.",
    newTrip: "Neuer Reise-Eintrag",
    newPackList: "Neue Packliste",
    recipeSearch: "Rezept suchen",
    sos: "SOS & Notfall",
    shoppingAdd: "Eintrag auf die Einkaufsliste",
    shoppingPlaceholder: "z. B. Milch …",
    shoppingSubmit: "Hinzufügen",
    shoppingAdded: (name: string) => `${name} auf die Einkaufsliste gesetzt`,
    shoppingExists: (name: string) =>
      `${name} steht schon auf der Einkaufsliste`,
    shoppingFailed: "Eintrag konnte nicht gespeichert werden",
    backToActions: "Zurück zu den Aktionen",
  },
  install: {
    title: "CampMesser installieren",
    description:
      "Als App auf deinem Gerät – startet schneller und funktioniert offline.",
    installButton: "Installieren",
    iosStep1: "Tippe auf das Teilen-Symbol",
    iosStep2: "und wähle «Zum Home-Bildschirm», um die App zu installieren.",
    shareIcon: "Teilen-Symbol",
    dismiss: "Installations-Hinweis schliessen",
  },
  update: {
    title: "Neue Version verfügbar",
    description:
      "Eine aktualisierte Version von CampMesser ist bereit. Beim Aktualisieren lädt die Seite einmal neu.",
    reloadButton: "Aktualisieren",
    dismiss: "Update-Hinweis schliessen",
  },
  whatsNew: {
    title: "Was ist neu",
    startIntro: "Das hat sich seit deinem letzten Besuch getan:",
    allIntro: "Alle bisherigen Neuerungen im Überblick:",
    confirm: "Verstanden",
  },
  shareTarget: {
    title: "Geteilte Fotos",
    subtitle:
      "Fotos aus der Teilen-Funktion deines Geräts direkt in eine Reise übernehmen.",
    loginFeature: "das Übernehmen geteilter Fotos",
    emptyTitle: "Keine geteilten Fotos gefunden",
    emptyText:
      "Öffne diese Seite über die Teilen-Funktion deines Geräts: Foto wählen → Teilen → CampMesser. Der Eintrag im Teilen-Menü erscheint, nachdem die App (neu) installiert oder aktualisiert wurde.",
    photosCount: (n: number) =>
      n === 1 ? "1 Foto bereit" : `${n} Fotos bereit`,
    photoAlt: (n: number) => `Geteiltes Foto ${n}`,
    removePhotoAria: (n: number) => `Geteiltes Foto ${n} entfernen`,
    readFailed: "Ein geteiltes Bild konnte nicht gelesen werden.",
    tripLabel: "Zu welcher Reise?",
    tripAria: "Reise wählen",
    tripFallback: "Reise",
    noTrips:
      "Noch keine Reise vorhanden – lege zuerst in «Meine Reisen» einen Eintrag an.",
    toTrips: "Zu «Meine Reisen»",
    upload: "Fotos zur Reise hochladen",
    uploading: (done: number, total: number) =>
      `Foto ${done} von ${total} wird hochgeladen …`,
    uploadFailed: (n: number) =>
      n === 1
        ? "1 Foto konnte nicht hochgeladen werden."
        : `${n} Fotos konnten nicht hochgeladen werden.`,
    limitReached:
      "Foto-Limit der Reise erreicht – nicht alle Fotos wurden gespeichert.",
    successTitle: "Fotos gespeichert",
    successText: (n: number) =>
      n === 1
        ? "1 Foto wurde zur Reise hinzugefügt."
        : `${n} Fotos wurden zur Reise hinzugefügt.`,
    toTrip: "Zur Reise",
  },

  /** Statistik-Dashboard: bündelt vorhandene Auswertungen an einem Ort. */
  notes: {
    title: "Notizen",
    subtitle:
      "Freie Notizen mit Stichwörtern – für alles, was in kein anderes Modul passt.",
    loginFeature: "deine Notizen",
    addButton: "Neue Notiz",
    searchPlaceholder: "Notizen durchsuchen …",
    searchAria: "Notizen nach Titel, Text und Stichwörtern durchsuchen",
    tagFilterAria: "Nach Stichwörtern filtern",
    tagFilterClear: "Filter aufheben",
    emptyTitle: "Noch keine Notiz",
    emptyBody:
      "Halte fest, was dir sonst nirgends unterkommt – die Nummer des Platzwarts, der Trick mit dem Heringszieher, eine Idee für nächsten Sommer.",
    noMatches: "Keine Notiz passt zu deiner Suche.",
    untitled: "Ohne Titel",
    updatedAt: (date: string) => `zuletzt geändert am ${date}`,
    newTitle: "Neue Notiz",
    editTitle: "Notiz bearbeiten",
    dialogDesc:
      "Der Titel ist freiwillig. Stichwörter hilfst du dir selbst beim Wiederfinden – sie tauchen als Filter über der Liste auf.",
    titleLabel: "Titel (optional)",
    titlePlaceholder: "z. B. Ideen fürs Tessin",
    textLabel: "Notiz",
    textPlaceholder: "Schreib einfach drauflos …",
    tagsLabel: "Stichwörter",
    tagsPlaceholder: "z. B. Tessin, Sommer, Zelt",
    tagsHint: (max: number) =>
      `Mit Komma trennen, höchstens ${max} Stichwörter. Gross- und Kleinschreibung ist egal.`,
    textRequired: "Bitte zuerst etwas schreiben.",
    save: "Speichern",
    saved: "Notiz gespeichert",
    updated: "Notiz aktualisiert",
    saveFailed: "Notiz konnte nicht gespeichert werden",
    deleted: "Notiz gelöscht",
    deleteFailed: "Notiz konnte nicht gelöscht werden",
    deleteConfirm: "Diese Notiz wirklich löschen?",
    editAria: (title: string) => `Notiz ${title} bearbeiten`,
    deleteAria: (title: string) => `Notiz ${title} löschen`,
  },
  stats: {
    expensesTitle: "Ausgaben über alle Reisen",
    expensesLink: "Zu den Reisen",
    expensesTotal: "Gesamt",
    expensesPerNight: "Ø pro Nacht",
    expensesTopCategory: "Teuerste Kategorie",
    expensesYearDetail: (trips: number, nights: number, perNight: string) =>
      `${trips === 1 ? "1 Reise" : `${trips} Reisen`} · ${nights === 1 ? "1 Nacht" : `${nights} Nächte`} · ${perNight}/Nacht`,
    expensesHint:
      "Gezählt wird, was in den Reisekassen deiner eigenen Reisen steht. Eine Ausgabe zählt zum Jahr der Reise – eine Silvester-Reise steht komplett im Jahr ihrer Anreise.",
    title: "Statistik",
    subtitle:
      "Alle Auswertungen auf einen Blick – Reisen, Wetter-Glück, Meilensteine, Knoten, Arten und Familie.",
    loginFeature: "die Statistik",
    tripsTitle: "Reise-Statistik",
    tripsLink: "Meine Reisen",
    tripsEmpty: "Noch keine Aufenthalte erfasst.",
    nightsInYear: (year: number) => `Nächte ${year}`,
    nightsTotal: "Nächte gesamt",
    staysLabel: "Aufenthalte",
    favoriteLabel: "Lieblingsplatz",
    avgRatingLabel: "Ø Bewertung",
    weatherLuckTitle: "Wetter-Glück",
    weatherLuckDry: (pct: number) =>
      `${pct} % deiner Campingtage waren trocken`,
    weatherLuckAvgMax: (temp: number) => `Ø Tagesmaximum ${temp}°`,
    weatherLuckWarmest: (place: string, temp: number) =>
      `wärmster Ort: ${place} (${temp}°)`,
    weatherLuckHint: (n: number) =>
      n === 1
        ? "Aus dem Wetterarchiv von 1 Aufenthalt"
        : `Aus dem Wetterarchiv von ${n} Aufenthalten`,
    spotCostsTitle: "Platz-Vergleich: Preis pro Nacht",
    spotCostsLink: "Zeltplätze",
    spotCostsPerNight: (amount: string) => `${amount} / Nacht`,
    spotCostsEstimate: (nights: number, amount: string) =>
      `≈ ${amount} für ${nights === 1 ? "1 Nacht" : `${nights} Nächte`}`,
    spotCostsTotal: (amount: string) =>
      `Alle deine Nächte an diesen Plätzen zusammen: rund ${amount}.`,
    spotCostsHint:
      "Preis pro Nacht inklusive Kurtaxe und Nebenkosten, günstigster Platz zuoberst. Die Gesamtbeträge sind Nächte × Preis und damit nur eine Schätzung – was du wirklich bezahlt hast, steht in der Reisekasse der jeweiligen Reise.",
    yearCompareTitle: "Übernachtungen pro Jahr",
    nightsCount: (n: number) => (n === 1 ? "1 Nacht" : `${n} Nächte`),
    milestonesTitle: "Meilensteine",
    milestonesAchieved: (achieved: number, total: number) =>
      `${achieved} von ${total} Meilensteinen erreicht`,
    milestonesNextTitle: "Nächste Ziele",
    milestonesProgress: (current: number, target: number) =>
      `${current} von ${target}`,
    knotsTitle: "Knoten-Lernfortschritt",
    knotsLink: "Knoten üben",
    knotsSummary: (secure: number, total: number) =>
      `${secure} von ${total} Knoten sitzen sicher`,
    knotsProgressAria: "Anteil sicher beherrschter Knoten",
    knotsSecure: "sicher",
    knotsPractice: "üben",
    knotsFresh: "neu",
    natureTitle: "Natur-Sammelalbum",
    natureLink: "Natur öffnen",
    natureCollection: (seen: number, total: number) =>
      `${seen} von ${total} Arten beobachtet`,
    natureSightings: (n: number) =>
      n === 1 ? "1 Beobachtung" : `${n} Beobachtungen`,
    natureProgressAria: "Sammel-Fortschritt des Arten-Albums",
    familyTitle: "Abzeichen der Kinder",
    familyLink: "Familien-Modus",
    familyBadges: (earned: number, total: number) =>
      `${earned} von ${total} Abzeichen`,
    familyEmpty: "Noch keine Kinder-Profile angelegt.",
    footnote:
      "Alle Zahlen entstehen aus deinen eigenen Einträgen – diese Seite zeigt sie nur an, ändern kannst du sie im jeweiligen Modul.",
  },

  /** ÖV ab Platz: Haltestellen und Abfahrten aus transport.opendata.ch (#249). */
  transit: {
    sectionAria: "Öffentlicher Verkehr ab dem Platz",
    title: "ÖV ab Platz",
    subtitle: "Haltestellen in der Nähe und ihre nächsten Abfahrten.",
    subtitleAtPlace: (place: string) =>
      `Haltestellen rund um ${place} und ihre nächsten Abfahrten.`,
    loadingStations: "Haltestellen werden gesucht …",
    loadingBoard: "Abfahrten werden geladen …",
    loadFailed:
      "Der Fahrplan konnte gerade nicht geladen werden. Versuch es in einem Moment nochmals.",
    emptyStations:
      "Hier findet der Schweizer Fahrplan keine Haltestelle. Er deckt die Schweiz und den Grenzverkehr ab – für einen Platz weiter im Ausland weiss CampMesser an dieser Stelle nichts.",
    emptyBoard:
      "Für die nächste Zeit ist ab dieser Haltestelle keine Abfahrt eingetragen.",
    kind: {
      train: "Bahn",
      bus: "Bus",
      tram: "Tram",
      ship: "Schiff",
      cableway: "Seilbahn",
      other: "Haltestelle",
    },
    stationAria: (name: string) => `Abfahrten ab ${name} anzeigen`,
    distanceAway: (value: string) => `${value} entfernt`,
    delay: (minutes: number) => `+${minutes} min`,
    platform: (value: string) => `Kante ${value}`,
    refresh: "Aktualisieren",
    refreshStations: "Haltestellen neu suchen",
    source:
      "Fahrplandaten von transport.opendata.ch – abgefragt nur auf deinen Klick. Angezeigt werden nur kommende Abfahrten; Verspätungen stehen dort, wo der Fahrplan sie meldet.",
  },

  /** Gemeinsame Texte rund ums Teilen per Link (alle Teilen-Dialoge). */
  sharing: {
    validityLabel: "Gültig",
    validityUnlimited: "unbegrenzt",
    validityDays: (n: number) => `${n} Tage`,
    validityAria: "Gültigkeit des Teil-Links",
    expiresOn: (date: string) => `Läuft ab am ${date}`,
    expiredOrInvalid: "Link abgelaufen oder ungültig",
  },
};

export type Translation = typeof de;
